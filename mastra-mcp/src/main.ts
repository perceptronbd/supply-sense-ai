import { createServer } from 'node:http';
import { createRuntimeContext } from '@supplysense/utils/server';
import { mastra } from './mastra/index.js';

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
        const { message, sessionId, userId, dbConnectionId } = JSON.parse(body);
        const agent = mastra.getAgent('chatAgent');

        console.log('Received request:', { message, sessionId, userId, dbConnectionId });

        const runtimeContext = createRuntimeContext({ dbConnectionId });

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
            onFinish: (result) => {
              console.log('Result:', result);
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
        res.end();
      } catch (error) {
        console.error('Error processing request:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
      }
    });
  } else {
    res.statusCode = 404;
    res.end();
  }
});

server.listen(port, () => {
  console.log(`Mastra MCP Backend Server running on port ${port}`);
});
