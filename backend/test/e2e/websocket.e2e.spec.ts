import WebSocket from 'ws';

describe('WebSocket E2E Tests', () => {
  let wsHost: string;
  let wsPort: number;
  let wsPath: string;

  beforeAll(async () => {
    // Connect to the existing backend service
    wsHost = process.env.BACKEND_HOST || 'localhost';
    wsPort = parseInt(process.env.WS_PORT || '37002');
    wsPath = process.env.WS_PATH || '/ws';
    
    // Give the backend service time to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Clear any pending timeouts
    jest.clearAllTimers();
    
    // Give extra time for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  describe('WebSocket Connection and Messages', () => {
    it('should connect to /ws endpoint', (done) => {
      const ws = new WebSocket(`ws://${wsHost}:${wsPort}${wsPath}`);
      let timeoutId: NodeJS.Timeout;

      ws.on('open', () => {
        clearTimeout(timeoutId);
        expect(true).toBe(true); // Connection successful
        ws.close();
        done();
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        done(new Error(`WebSocket connection failed: ${error.message}`));
      });

      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        ws.close();
        done(new Error('WebSocket connection timeout'));
      }, 10000);
    }, 15000);

    it('should respond to ping with pong', (done) => {
      const ws = new WebSocket(`ws://${wsHost}:${wsPort}${wsPath}`);
      let timeoutId: NodeJS.Timeout;

      ws.on('open', () => {
        // Wait a bit for welcome message, then send ping
        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'ping' }));
        }, 100);
      });

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Skip welcome message
          if (message.type === 'welcome') {
            return;
          }
          
          // Validate pong response as required
          if (message.type === 'pong') {
            clearTimeout(timeoutId);
            expect(message).toHaveProperty('type', 'pong');
            ws.close();
            done();
            return;
          }
          
          // Unexpected message type
          clearTimeout(timeoutId);
          done(new Error(`Unexpected message type: ${message.type}`));
        } catch (error) {
          clearTimeout(timeoutId);
          ws.close();
          const err = error as Error;
          done(new Error(`Invalid pong response: ${err.message}`));
        }
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        done(new Error(`WebSocket error: ${error.message}`));
      });

      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        ws.close();
        done(new Error('No pong response received'));
      }, 10000);
    }, 15000);

    it('should respond to request_initial_data with stats_update', (done) => {
      const ws = new WebSocket(`ws://${wsHost}:${wsPort}${wsPath}`);
      let timeoutId: NodeJS.Timeout;

      ws.on('open', () => {
        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'request_initial_data' }));
        }, 100);
      });

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Skip welcome message
          if (message.type === 'welcome') {
            return;
          }
          
          if (message.type === 'stats_update') {
            clearTimeout(timeoutId);
            expect(message).toHaveProperty('type', 'stats_update');
            expect(message).toHaveProperty('payload');
            
            // Validate expected payload structure
            if (message.payload) {
              expect(message.payload).toHaveProperty('deviceStats');
              expect(message.payload).toHaveProperty('regionStats');
              expect(message.payload).toHaveProperty('browserStats');
              
              // Validate data types
              expect(Array.isArray(message.payload.deviceStats)).toBe(true);
              expect(Array.isArray(message.payload.regionStats)).toBe(true);
              expect(Array.isArray(message.payload.browserStats)).toBe(true);
            }

            ws.close();
            done();
            return;
          }
          
          // Unexpected message type
          clearTimeout(timeoutId);
          done(new Error(`Unexpected message type: ${message.type}`));
        } catch (error) {
          clearTimeout(timeoutId);
          ws.close();
          const err = error as Error;
          done(new Error(`Invalid response format: ${err.message}`));
        }
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        done(new Error(`WebSocket error: ${error.message}`));
      });

      // Timeout after 15 seconds
      timeoutId = setTimeout(() => {
        ws.close();
        done(new Error('No response received to request_initial_data'));
      }, 15000);
    }, 20000);

    it('should receive periodic stats_update broadcasts', (done) => {
      const ws = new WebSocket(`ws://${wsHost}:${wsPort}${wsPath}`);
      let receivedBroadcast = false;
      let timeoutId: NodeJS.Timeout;

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'stats_update' && !receivedBroadcast) {
            receivedBroadcast = true;
            
            // Clear timeout since we received the broadcast
            clearTimeout(timeoutId);
            
            // Validate broadcast structure as required
            expect(message).toHaveProperty('type', 'stats_update');
            expect(message).toHaveProperty('payload');
            
            if (message.payload) {
              expect(message.payload).toHaveProperty('deviceStats');
              expect(message.payload).toHaveProperty('regionStats');
              expect(message.payload).toHaveProperty('browserStats');
            }
            
            ws.close();
            done();
          }
        } catch (error) {
          clearTimeout(timeoutId);
          ws.close();
          const err = error as Error;
          done(new Error(`Invalid broadcast format: ${err.message}`));
        }
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        done(new Error(`WebSocket error: ${error.message}`));
      });

      // Wait up to 35 seconds for a broadcast (broadcasts happen every 30 seconds)
      timeoutId = setTimeout(() => {
        ws.close();
        if (!receivedBroadcast) {
          done(new Error('No stats_update broadcast received within timeout period'));
        } else {
          done();
        }
      }, 35000);
    }, 40000);

    it('should handle multiple concurrent connections', (done) => {
      const connections: WebSocket[] = [];
      const connectionCount = 2;
      let connectedCount = 0;
      let responsesReceived = 0;
      let timeoutId: NodeJS.Timeout;

      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket(`ws://${wsHost}:${wsPort}${wsPath}`);
        connections.push(ws);

        ws.on('open', () => {
          connectedCount++;
          if (connectedCount === connectionCount) {
            // All connections established, wait a bit then send ping to all
            setTimeout(() => {
              connections.forEach(connection => {
                connection.send(JSON.stringify({ type: 'ping' }));
              });
            }, 200);
          }
        });

        ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'welcome') {
              return;
            }
            
            if (message.type === 'pong') {
              responsesReceived++;
              if (responsesReceived === connectionCount) {
                // All connections received pong
                clearTimeout(timeoutId);
                connections.forEach(connection => connection.close());
                done();
              }
            }
          } catch (error) {
            clearTimeout(timeoutId);
            connections.forEach(connection => connection.close());
            const err = error as Error;
            done(new Error(`Invalid response: ${err.message}`));
          }
        });

        ws.on('error', (error: Error) => {
          clearTimeout(timeoutId);
          connections.forEach(connection => connection.close());
          done(new Error(`WebSocket error: ${error.message}`));
        });
      }

      // Timeout after 15 seconds
      timeoutId = setTimeout(() => {
        connections.forEach(connection => connection.close());
        done(new Error(`Expected ${connectionCount} pong responses, got ${responsesReceived}`));
      }, 15000);
    }, 20000);
  });
});
