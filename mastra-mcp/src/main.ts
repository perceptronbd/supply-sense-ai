import { createServer } from 'node:http';
import type { IChatFormattedResult } from '@supplysense/types';
import { mastra } from './mastra/index.js';

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

        const workflow = mastra.getWorkflow('queryPostgreSQLdbWorkflow');

        if (!workflow) {
          throw new Error('Workflow not found');
        }

        const run = await workflow.createRunAsync();

        const workflowStream = await run.stream({
          inputData: {
            dbConnectionId,
            userQuery: message,
          },
        });

        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked',
        });

        for await (const chunk of workflowStream.fullStream) {
          res.write(JSON.stringify(chunk));
          // console.log('CHUNK:', JSON.parse(JSON.stringify(chunk, null, 2)));
          if (chunk.type === 'workflow-step-result') {
            await saveMessage({
              result: chunk.payload.output as IChatFormattedResult,
              sessionId,
              authorizationToken,
              companyId,
              userMessage: message,
              usage: chunk.payload.output.usage as unknown as RecordTokenUsageDto['usage'],
            });
          }
        }

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
  result: IChatFormattedResult;
  sessionId: string;
  authorizationToken: string;
  userMessage: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
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

  // //@ts-expect-error
  // const workflowResult = extractWorkflowResult(result);
  const workflowResult = result;

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
