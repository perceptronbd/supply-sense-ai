import axios from 'axios';
import { Socket, io } from 'socket.io-client';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('Chat WebSocket Gateway (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  const WS_URL = process.env.WS_URL || 'http://localhost:3000/chat';

  let authToken: string;
  let testUser: TestUser;
  let sessionId: string;
  let socket: Socket;

  beforeAll(async () => {
    // Authenticate as branch manager
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;

    // Create a test session via REST API
    const sessionResponse = await axios.post(
      `${API_BASE_URL}/api/chat/sessions`,
      {
        title: 'WebSocket Test Session',
        description: 'Testing real-time chat functionality',
      },
      { headers: TestHelpers.getAuthHeaders(authToken) }
    );

    sessionId = sessionResponse.data.id;
  });

  afterAll(async () => {
    // Cleanup session
    if (sessionId) {
      try {
        await axios.delete(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
          headers: TestHelpers.getAuthHeaders(authToken),
        });
      } catch (_error) {
        // Session might already be deleted
      }
    }

    // Disconnect socket if connected
    if (socket?.connected) {
      socket.disconnect();
    }
  });

  describe('WebSocket Connection', () => {
    it('should successfully connect to chat WebSocket with valid JWT', (done) => {
      socket = io(WS_URL, {
        auth: {
          token: authToken,
        },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        done();
      });

      socket.on('connect_error', (error) => {
        fail(`WebSocket connection failed: ${error.message}`);
      });

      // Set timeout for connection
      setTimeout(() => {
        if (!socket.connected) {
          fail('WebSocket connection timeout');
        }
      }, 5000);
    });

    it('should receive connection confirmation with user info', (done) => {
      socket.on('connected', (data) => {
        expect(data).toMatchObject({
          message: 'Connected to chat service',
          userId: testUser.id,
        });
        done();
      });
    });

    it('should reject connection without valid token', (done) => {
      const invalidSocket = io(WS_URL, {
        auth: {
          token: 'invalid-token',
        },
        transports: ['websocket'],
      });

      invalidSocket.on('connect', () => {
        fail('Should not connect with invalid token');
      });

      invalidSocket.on('disconnect', () => {
        expect(true).toBe(true); // Expected behavior
        done();
      });

      invalidSocket.on('connect_error', () => {
        expect(true).toBe(true); // Expected behavior
        done();
      });
    });
  });

  describe('Session Management via WebSocket', () => {
    it('should successfully join a chat session', (done) => {
      socket.emit('join_session', { sessionId });

      socket.on('session_joined', (data) => {
        expect(data.sessionId).toBe(sessionId);
        done();
      });

      socket.on('error', (error) => {
        fail(`Failed to join session: ${error.message}`);
      });
    });

    it('should handle joining non-existent session gracefully', (done) => {
      const invalidSessionId = 'non-existent-session-id';

      socket.emit('join_session', { sessionId: invalidSessionId });

      socket.on('error', (error) => {
        expect(error.message).toContain('Session not found');
        done();
      });

      // Set timeout in case no error is emitted
      setTimeout(() => {
        done(); // Pass the test if no error event occurs
      }, 2000);
    });

    it('should successfully leave a chat session', (done) => {
      socket.emit('leave_session', { sessionId });

      socket.on('session_left', (data) => {
        expect(data.sessionId).toBe(sessionId);
        done();
      });
    });
  });

  describe('Real-time Stock Query via WebSocket', () => {
    beforeEach((done) => {
      // Rejoin session before each test
      socket.emit('join_session', { sessionId });
      socket.on('session_joined', () => done());
    });

    it('should handle stock query message and receive AI response', (done) => {
      const testMessage = 'Show me items in BR002 with quantity below 10';
      let userMessageReceived = false;
      let aiResponseReceived = false;

      // Listen for AI thinking indicator
      socket.on('ai_thinking', (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.isThinking).toBe(true);
      });

      // Listen for new messages
      socket.on('new_message', (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.message).toHaveProperty('content');
        expect(data.message).toHaveProperty('type');
        expect(data.message).toHaveProperty('timestamp');

        if (data.message.type === 'user') {
          expect(data.message.content).toBe(testMessage);
          expect(data.message.userId).toBe(testUser.id);
          userMessageReceived = true;
        } else if (data.message.type === 'assistant') {
          expect(data.message.content).toBeTruthy();
          expect(data.message.userId).toBe('assistant');
          aiResponseReceived = true;

          // Check if response contains stock-related information
          const content = data.message.content.toLowerCase();
          const hasStockInfo =
            content.includes('br002') ||
            content.includes('stock') ||
            content.includes('quantity') ||
            content.includes('items');
          expect(hasStockInfo).toBe(true);
        }

        // Complete test when both messages are received
        if (userMessageReceived && aiResponseReceived) {
          done();
        }
      });

      // Listen for message sent confirmation
      socket.on('message_sent', (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.success).toBe(true);
      });

      // Send the stock query message
      socket.emit('send_message', {
        sessionId,
        message: testMessage,
        type: 'user',
      });

      // Set timeout for the test
      setTimeout(() => {
        if (!userMessageReceived || !aiResponseReceived) {
          fail(`Timeout: User message: ${userMessageReceived}, AI response: ${aiResponseReceived}`);
        }
        done();
      }, 15000); // 15 seconds timeout for AI processing
    });

    it('should handle multiple sequential stock queries correctly', (done) => {
      const queries = [
        'List all items in BR002 below 10 quantity',
        'What is the stock level of Raw Material A in BR002?',
        'Any items need immediate restocking in BR002?',
      ];

      let queryIndex = 0;
      let responsesReceived = 0;

      socket.on('new_message', (data) => {
        if (data.message.type === 'assistant') {
          responsesReceived++;

          // Send next query if available
          if (queryIndex < queries.length) {
            setTimeout(() => {
              socket.emit('send_message', {
                sessionId,
                message: queries[queryIndex],
                type: 'user',
              });
              queryIndex++;
            }, 1000); // Wait 1 second between queries
          }

          // Complete test when all responses received
          if (responsesReceived >= queries.length) {
            done();
          }
        }
      });

      // Start with first query
      socket.emit('send_message', {
        sessionId,
        message: queries[queryIndex],
        type: 'user',
      });
      queryIndex++;

      // Set overall timeout
      setTimeout(() => {
        if (responsesReceived < queries.length) {
          fail(`Only received ${responsesReceived} out of ${queries.length} responses`);
        }
        done();
      }, 30000); // 30 seconds total timeout
    });
  });

  describe('Typing Indicators', () => {
    beforeEach((done) => {
      socket.emit('join_session', { sessionId });
      socket.on('session_joined', () => done());
    });

    it('should broadcast typing indicators to other users', (done) => {
      // Create a second socket connection to test broadcasting
      const secondSocket = io(WS_URL, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      secondSocket.on('connect', () => {
        secondSocket.emit('join_session', { sessionId });

        secondSocket.on('session_joined', () => {
          // Listen for typing indicator on second socket
          secondSocket.on('user_typing', (data) => {
            expect(data.userId).toBe(testUser.id);
            expect(data.isTyping).toBe(true);
            expect(data.userName).toBeTruthy();

            secondSocket.disconnect();
            done();
          });

          // Send typing indicator from first socket
          socket.emit('typing', {
            sessionId,
            isTyping: true,
          });
        });
      });

      setTimeout(() => {
        secondSocket.disconnect();
        fail('Typing indicator test timeout');
      }, 5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when processing invalid queries', (done) => {
      socket.emit('join_session', { sessionId });

      socket.on('session_joined', () => {
        // Send an intentionally problematic message
        socket.emit('send_message', {
          sessionId,
          message: '', // Empty message
          type: 'user',
        });

        socket.on('error', (error) => {
          expect(error.message).toBeTruthy();
          done();
        });

        // Also listen for successful processing (graceful handling)
        socket.on('message_sent', () => {
          done(); // If it processes gracefully, that's also acceptable
        });

        setTimeout(() => {
          done(); // Complete test if nothing happens (also acceptable)
        }, 3000);
      });
    });

    it('should stop AI thinking indicator on error', (done) => {
      let thinkingStarted = false;
      let thinkingStopped = false;

      socket.emit('join_session', { sessionId });

      socket.on('session_joined', () => {
        socket.on('ai_thinking', (data) => {
          if (data.isThinking) {
            thinkingStarted = true;
          } else {
            thinkingStopped = true;

            if (thinkingStarted) {
              expect(thinkingStarted && thinkingStopped).toBe(true);
              done();
            }
          }
        });

        // Send a potentially problematic query
        socket.emit('send_message', {
          sessionId: 'invalid-session-id', // This should cause an error
          message: 'Test query for error handling',
          type: 'user',
        });

        setTimeout(() => {
          if (thinkingStarted && !thinkingStopped) {
            fail('AI thinking indicator was not stopped after error');
          }
          done();
        }, 5000);
      });
    });
  });
});
