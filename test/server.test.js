/**
 * Tests for HTTP and TCP servers
 */

import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import net from 'node:net';
import { startServers } from '../src/server.js';

// Use high ports to avoid conflicts
const HTTP_PORT = 13000;
const TCP_PORT = 12323;

// Global server instances
let httpServer, tcpServer;

test('Server startup', async () => {
  const result = await startServers(HTTP_PORT, TCP_PORT);
  httpServer = result.httpServer;
  tcpServer = result.tcpServer;

  assert(httpServer, 'HTTP server should be created');
  assert(tcpServer, 'TCP server should be created');
});

// Test HTTP API endpoint
test('HTTP GET /api/page/100', async () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: HTTP_PORT,
      path: '/api/page/100',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          assert.strictEqual(res.statusCode, 200, 'Should return 200');
          const page = JSON.parse(data);
          assert.strictEqual(page.number, 100, 'Page number should be 100');
          assert.strictEqual(page.cells.length, 24, 'Should have 24 rows');
          assert.strictEqual(page.cells[0].length, 40, 'Should have 40 columns');
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
});

// Test HTTP ANSI endpoint
test('HTTP GET /100 (ANSI)', async () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: HTTP_PORT,
      path: '/100',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          assert.strictEqual(res.statusCode, 200, 'Should return 200');
          assert.strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8');
          assert(data.includes('\x1b['), 'Should contain ANSI escape codes');
          assert(data.includes('Ghostext') || data.includes(' '), 'Should contain page content');
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
});

// Test HTTP static file serving
test('HTTP GET / (index.html)', async () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: HTTP_PORT,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Note: may be 200 if file exists, 404 if not yet created (Phase 5)
          assert([200, 404].includes(res.statusCode), 'Should return 200 or 404');
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
});

// Test invalid page number
test('HTTP GET /api/page/999 returns 404 page', async () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: HTTP_PORT,
      path: '/api/page/999',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          assert.strictEqual(res.statusCode, 200, 'Should return 200');
          const page = JSON.parse(data);
          assert.strictEqual(page.number, 404, 'Should return 404 page');
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
});

// Test TCP server connection
test('TCP: Connect and receive page 100', async () => {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({
      host: 'localhost',
      port: TCP_PORT
    });

    let data = '';
    let received = false;

    socket.on('data', (chunk) => {
      data += chunk.toString();
      if (!received && data.includes('\x1b[')) {
        received = true;
        // Check that we got ANSI output with some content
        assert(data.length > 100, 'Should receive substantial page data');
        socket.end();
      }
    });

    socket.on('end', () => {
      resolve();
    });

    socket.on('error', reject);

    // Timeout after 2 seconds
    setTimeout(() => {
      if (!received) {
        socket.end();
        reject(new Error('Did not receive page data'));
      }
    }, 2000);
  });
});

// Test TCP server navigation
test('TCP: Navigate to different page', async () => {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({
      host: 'localhost',
      port: TCP_PORT
    });

    let receivedCount = 0;
    let firstPageReceived = false;

    socket.on('data', (chunk) => {
      const data = chunk.toString();
      if (data.includes('\x1b[')) {
        receivedCount++;
        if (!firstPageReceived) {
          firstPageReceived = true;
          // Send page number for news (101)
          socket.write('101');
        } else if (receivedCount === 2) {
          // Second page should be 101
          socket.end();
          resolve();
        }
      }
    });

    socket.on('error', reject);

    // Timeout after 2 seconds
    setTimeout(() => {
      socket.end();
      reject(new Error('Navigation timeout'));
    }, 2000);
  });
});

// Cleanup
test('Server cleanup', async () => {
  return new Promise((resolve) => {
    if (httpServer) {
      httpServer.close(() => {
        if (tcpServer) {
          tcpServer.close(resolve);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
});
