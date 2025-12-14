import { createServer } from 'node:http';
import type { IChatFormattedResult } from '@supplysense/types';
import { createRuntimeContext } from '@supplysense/utils/server';
import { mastra } from './mastra/index.js';
import { extractWorkflowResult } from './utils/chat-utils.js';

enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  ERROR = 'error',
}

interface RecordTokenUsageDto {
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  companyId: string;
  message: string;
  result: IChatFormattedResult;
}

const port = Number.parseInt(process.env.MCP_SERVER_PORT || '8080', 10);
const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { message, sessionId, userId, dbConnectionId, authorizationToken, companyId } =
          JSON.parse(body);
        const agent = mastra.getAgent('chatAgent');

        const runtimeContext = createRuntimeContext({ dbConnectionId });

        let finishedPromiseResolve: (value: void | PromiseLike<void>) => void;
        const finishedPromise = new Promise<void>((resolve) => {
          finishedPromiseResolve = resolve;
        });

        // Stream the response
        const result = await agent.stream(
          [
            {
              role: 'user',
              content: message,
            },
          ],
          {
            runId: sessionId,
            threadId: sessionId,
            resourceId: userId,
            runtimeContext,
            onFinish: async (result) => {
              try {
                // Pass message for title generation
                await saveMessage({
                  result,
                  sessionId,
                  authorizationToken,
                  companyId,
                  userMessage: message,
                  usage: result.usage as unknown as RecordTokenUsageDto['usage'],
                });
              } catch (e) {
                console.error('Error in onFinish:', e);
              } finally {
                finishedPromiseResolve();
              }
            },
          }
        );

        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked',
        });

        for await (const chunk of result.textStream) {
          res.write(chunk);
        }

        // Wait for saveMessage to complete before ending response
        await finishedPromise;

        res.end();
      } catch (error) {
        console.error('Error processing request:', error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
        } else {
          res.end();
        }
      }
    });
  } else {
    res.statusCode = 404;
    res.end();
  }
});

interface ISaveMessage {
  result: unknown;
  sessionId: string;
  authorizationToken: string;
  userMessage: string;
  usage: { outputTokens: number; inputTokens: number; totalTokens: number };
  companyId: string;
}

async function saveMessage({
  authorizationToken,
  result,
  sessionId,
  userMessage,
  usage,
  companyId,
}: ISaveMessage) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: authorizationToken,
  };

  //@ts-expect-error
  const workflowResult = extractWorkflowResult(result);
  console.log('Workflow Result:', workflowResult);

  // Record token usage
  await recordTokenUsage(
    {
      usage,
      companyId: companyId,
      message: userMessage,
      result: workflowResult,
    },
    headers
  );

  // 1. Save assistant message
  try {
    // Correct Backend URL: Port 3004, Prefix 'api'
    const backendUrl = process.env.BACKEND_URL;

    const messagePayload = {
      content: workflowResult.summary,
      type: MessageType.ASSISTANT,
      structuredData: workflowResult,
    };

    const messageResponse = await fetch(`${backendUrl}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(messagePayload),
    });

    if (!messageResponse.ok) {
      console.error(
        'Failed to save assistant message:',
        messageResponse.status,
        messageResponse.statusText
      );
      try {
        const text = await messageResponse.text();
        console.error('Response details:', text);
      } catch (e) {
        // ignore
      }
    } else {
      console.log('Assistant message saved successfully');
    }
  } catch (error) {
    console.error('Error saving assistant message:', error);
  }

  // 2. Update session title
  await updateSessionTitle(sessionId, headers, userMessage, workflowResult.summary);
}

/**
 * Updates the title of a chat session
 * @param sessionId - The ID of the session to update
 * @param headers - Request headers including authorization
 * @param userMessage - The user's message
 * @param summary - The summary to include in the title update
 */
async function updateSessionTitle(
  sessionId: string,
  headers: Record<string, string>,
  userMessage: string,
  summary: string
): Promise<void> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    const titleResponse = await fetch(`${backendUrl}/chat/sessions/${sessionId}/title`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: userMessage,
        summary,
      }),
    });

    if (!titleResponse.ok) {
      console.error(
        'Failed to update session title:',
        titleResponse.status,
        titleResponse.statusText
      );
    } else {
      console.log('Session title updated successfully');
    }
  } catch (error) {
    console.error('Error updating session title:', error);
  }
}

/**
 * Records token usage for a chat interaction
 */
async function recordTokenUsage(
  data: Omit<RecordTokenUsageDto, 'authorizationToken'>,
  headers: Record<string, string>
): Promise<void> {
  const backendUrl = process.env.BACKEND_URL;

  try {
    const response = await fetch(`${backendUrl}/chat/record-token-usage`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to record token usage: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error('Failed to record token usage:', error);
    // Don't throw to avoid breaking the main flow
  }
}

server.listen(port, () => {
  console.log(`Mastra MCP Backend Server running on port ${port}`);
});
