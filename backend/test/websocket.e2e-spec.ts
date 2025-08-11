import { Socket, io } from 'socket.io-client';

import { MyConfiguration } from '../src/MyConfiguration';

describe('WebSocket E2E Tests', () => {
  let clientSocket: Socket;
  const wsPort = MyConfiguration.WS_PORT(); // Use the actual WebSocket port from configuration

  beforeAll(async () => {
    console.log(`Testing WebSocket on port: ${wsPort}`);
    // Wait a bit to ensure any previous connections are cleaned up
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
  afterAll(async () => {
    // Clean up any remaining connections
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  beforeEach(() => {
    // Clean up any existing connections before each test
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  afterEach((done) => {
    // Ensure cleanup after each test
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
      clientSocket.removeAllListeners();
    }
    // Wait a bit for cleanup
    setTimeout(done, 100);
  });

  describe('WebSocket Connection Management', () => {
    it('should accept WebSocket connections on the configured port', (done) => {
      console.log(wsPort);
      const socketUrl = `http://localhost:${wsPort}`;

      clientSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        autoConnect: true,
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        expect(clientSocket.id).toBeDefined();
        done();
      });

      clientSocket.on('connect_error', (error: any) => {
        done(new Error(`Connection failed: ${error.message}`));
      });
    });

    it('should handle client disconnection gracefully', (done) => {
      const socketUrl = `http://localhost:${wsPort}`;

      clientSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', (reason: any) => {
        expect(clientSocket.connected).toBe(false);
        expect(reason).toBeDefined();
        done();
      });
    });

    it('should handle multiple concurrent client connections', (done) => {
      const socketUrl = `http://localhost:${wsPort}`;
      const clients: Socket[] = [];
      let connectCount = 0;
      const expectedConnections = 3;

      const onConnect = () => {
        connectCount++;
        if (connectCount === expectedConnections) {
          // Verify all clients are connected
          clients.forEach((client) => {
            expect(client.connected).toBe(true);
          });

          // Clean up all clients
          clients.forEach((client) => client.disconnect());
          done();
        }
      };

      // Create multiple client connections
      for (let i = 0; i < expectedConnections; i++) {
        const client = io(socketUrl, {
          transports: ['websocket', 'polling'],
          forceNew: true,
        });
        clients.push(client);
        client.on('connect', onConnect);
      }
    });
  });

  describe('WebSocket Message Handling - Ping/Pong Heartbeat', () => {
    beforeEach((done) => {
      const socketUrl = `http://localhost:${wsPort}`;

      clientSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      clientSocket.on('connect', () => {
        done();
      });

      clientSocket.on('connect_error', (error: any) => {
        done(new Error(`Connection failed: ${error.message}`));
      });
    });

    it('should respond to ping with pong message', (done) => {
      const eventName = MyConfiguration.WS_EVENT_NAME();

      // Send ping message
      clientSocket.emit(eventName, { type: 'ping' });

      // Listen for pong response on the same event name
      clientSocket.on(eventName, (response: any) => {
        expect(response).toBeDefined();
        expect(response.type).toBe('pong');
        done();
      });

      // Timeout fallback
      setTimeout(() => {
        done(new Error('Did not receive pong response within timeout'));
      }, 5000);
    });

    it('should handle multiple ping requests correctly', (done) => {
      const eventName = MyConfiguration.WS_EVENT_NAME();
      let pongCount = 0;
      const expectedPongs = 3;

      clientSocket.on(eventName, (response: any) => {
        if (response.type === 'pong') {
          pongCount++;
          if (pongCount === expectedPongs) {
            done();
          }
        }
      });

      // Send multiple ping messages
      for (let i = 0; i < expectedPongs; i++) {
        setTimeout(() => {
          clientSocket.emit(eventName, { type: 'ping' });
        }, i * 100);
      }

      // Timeout fallback
      setTimeout(() => {
        if (pongCount < expectedPongs) {
          done(new Error(`Expected ${expectedPongs} pong responses, got ${pongCount}`));
        }
      }, 10000);
    });
  });

  describe('WebSocket Message Handling - Initial Data Request', () => {
    beforeEach((done) => {
      const socketUrl = `http://localhost:${wsPort}`;

      clientSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    it('should respond to request_initial_data with stats_update', (done) => {
      const eventName = MyConfiguration.WS_EVENT_NAME();

      // Request initial data
      clientSocket.emit(eventName, { type: 'request_initial_data' });

      clientSocket.on(eventName, (response: any) => {
        expect(response).toBeDefined();
        expect(response.type).toBe('stats_update');
        expect(response.payload).toBeDefined();

        // Validate payload structure
        const payload = response.payload;
        expect(payload).toHaveProperty('sessionStats');
        expect(payload).toHaveProperty('deviceStats');
        expect(payload).toHaveProperty('regionDeviceStats');

        done();
      });

      // Timeout fallback
      setTimeout(() => {
        done(new Error('Did not receive stats_update response within timeout'));
      }, 5000);
    });

    it('should return properly structured stats data', (done) => {
      const eventName = MyConfiguration.WS_EVENT_NAME();

      clientSocket.emit(eventName, { type: 'request_initial_data' });

      clientSocket.on(eventName, (response: any) => {
        expect(response.type).toBe('stats_update');
        const stats = response.payload;

        // Validate session stats structure
        if (stats.sessionStats) {
          expect(stats.sessionStats).toHaveProperty('totalSessions');
          expect(stats.sessionStats).toHaveProperty('averageDuration');
          expect(typeof stats.sessionStats.totalSessions).toBe('number');
          expect(typeof stats.sessionStats.averageDuration).toBe('number');
        }

        // Validate device stats structure
        if (stats.deviceStats && Array.isArray(stats.deviceStats)) {
          stats.deviceStats.forEach((device: any) => {
            expect(device).toHaveProperty('device_type');
            expect(device).toHaveProperty('count');
            expect(typeof device.count).toBe('number');
          });
        }

        // Validate region stats structure
        if (stats.regionDeviceStats && Array.isArray(stats.regionDeviceStats)) {
          stats.regionDeviceStats.forEach((region: any) => {
            expect(region).toHaveProperty('region');
            expect(region).toHaveProperty('count');
            expect(typeof region.count).toBe('number');
          });
        }

        done();
      });
    });
  });

  describe('WebSocket Broadcasting - Periodic Stats Updates', () => {
    // let secondClient: Socket;
    beforeEach((done) => {
      const socketUrl = `http://localhost:${wsPort}`;
      clientSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        forceNew: true,
      });
      clientSocket.on('connect', () => {
        done();
      });
    });
    afterEach((done) => {
      /* if (secondClient && secondClient.connected) {
        secondClient.disconnect();
      } */
      setTimeout(done, 100);
    });

    it('should receive periodic stats_update broadcasts', (done) => {
      const eventName = MyConfiguration.WS_EVENT_NAME();
      let broadcastReceived = false;

      clientSocket.on(eventName, (response: any) => {
        if (response.type === 'stats_update' && !broadcastReceived) {
          broadcastReceived = true;
          expect(response.payload).toBeDefined();
          done();
        }
      });

      // Wait for the periodic broadcast (configured interval + buffer time)
      const broadcastInterval = MyConfiguration.STATS_BROADCAST_INTERVAL_SECONDS() * 1000;
      const timeout = Math.max(broadcastInterval + 5000, 15000); // At least 15 seconds

      setTimeout(() => {
        if (!broadcastReceived) {
          done(new Error(`Did not receive periodic broadcast within ${timeout}ms`));
        }
      }, timeout);
    }, 30000); // Extended timeout for this test

    // TODO: has to be fixed
    /* it('should broadcast to multiple connected clients', (done) => {
      const eventName = MyConfiguration.WS_EVENT_NAME();
      const socketUrl = `http://localhost:${wsPort}`;
      let client1Received = false;
      let client2Received = false;

      // Add error listeners for debugging
      clientSocket.on('connect_error', (err) => console.error('clientSocket connect_error', err));
      clientSocket.on('disconnect', (reason) => console.warn('clientSocket disconnect', reason));

      clientSocket.on('connect', () => {
        console.log('clientSocket connected');
        // Only create second client after first is connected
        secondClient = io(socketUrl, {
          transports: ['websocket', 'polling'],
          forceNew: true,
        });

        secondClient.on('connect_error', (err) => console.error('secondClient connect_error', err));
        secondClient.on('disconnect', (reason) => console.warn('secondClient disconnect', reason));

        secondClient.on('connect', () => {
          console.log('secondClient connected');
          setupListeners();
        });
      });

      function setupListeners() {
        clientSocket.on(eventName, (response: any) => {
          if (response.type === 'stats_update') {
            client1Received = true;
            checkDone();
          }
        });
        secondClient.on(eventName, (response: any) => {
          if (response.type === 'stats_update') {
            client2Received = true;
            checkDone();
          }
        });
      }

      function checkDone() {
        if (client1Received && client2Received) {
          done();
        }
      }

      setTimeout(() => {
        done(new Error('Did not receive broadcasts on both clients within timeout'));
      }, 20000);
    }); */
  });

  describe('WebSocket Error Handling', () => {
    beforeEach((done) => {
      const socketUrl = `http://localhost:${wsPort}`;

      clientSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    it('should handle unknown message types gracefully', (done) => {
      const eventName = MyConfiguration.WS_EVENT_NAME();

      // Send unknown message type
      clientSocket.emit(eventName, { type: 'unknown_message_type' });

      let errorReceived = false;
      clientSocket.on(eventName, (response: any) => {
        if (response.type === 'error') {
          errorReceived = true;
          expect(response.message).toBeDefined();
        }
      });

      // Connection should remain stable even with unknown messages
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        // If no error response, that's also acceptable behavior
        if (errorReceived) {
          console.log('Received expected error response for unknown message type');
        }
        done();
      }, 2000);
    });

    it('should handle malformed messages gracefully', (done) => {
      const eventName = MyConfiguration.WS_EVENT_NAME();

      // Send malformed message (missing type)
      clientSocket.emit(eventName, { data: 'invalid' });

      // Connection should remain stable
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 2000);
    });

    it('should disconnect clients using unknown events', (done) => {
      // Send message on unknown event name (not the configured WS_EVENT_NAME)
      clientSocket.emit('unknown_event', { type: 'ping' });

      clientSocket.on('disconnect', (reason: any) => {
        expect(reason).toBeDefined();
        done();
      });

      // Timeout fallback - if client is not disconnected, that's also a failure
      setTimeout(() => {
        if (clientSocket.connected) {
          done(new Error('Client should have been disconnected for using unknown event'));
        }
      }, 3000);
    });
  });

  describe('WebSocket Event Name Configuration', () => {
    it('should use the configured event name for message handling', (done) => {
      const socketUrl = `http://localhost:${wsPort}`;

      clientSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      clientSocket.on('connect', () => {
        const configuredEventName = MyConfiguration.WS_EVENT_NAME();
        expect(configuredEventName).toBeDefined();
        expect(typeof configuredEventName).toBe('string');

        // Test that the configured event name works
        clientSocket.emit(configuredEventName, { type: 'ping' });

        clientSocket.on(configuredEventName, (response: any) => {
          expect(response.type).toBe('pong');
          done();
        });
      });
    });
  });
});
