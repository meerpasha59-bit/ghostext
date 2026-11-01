/**
 * HTTP and TCP servers
 */

import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPage } from './pages/index.js';
import { renderJSON, renderANSI, renderHTML } from './render/index.js';
import { Cache } from './sources/cache.js';
import { fetchWithTimeout } from './sources/fetch.js';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

// Shared cache and fetch context
const cache = new Cache();
const fetchFn = (url) => fetchWithTimeout(url, 5000);
const ctx = { cache, fetch: fetchFn };

/**
 * Get MIME type for a file
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * HTTP Server
 */
const httpServer = http.createServer(async (req, res) => {
  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // API endpoint: /api/page/:n
    if (pathname.startsWith('/api/page/')) {
      const numStr = pathname.slice('/api/page/'.length);
      const num = parseInt(numStr, 10);

      if (isNaN(num)) {
        // Invalid format, return error
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid page number format' }));
        return;
      }

      // Page numbers outside range 100-899 return 404 page
      const page = await getPage(num, ctx);
      const json = renderJSON(page);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(json);
      return;
    }

    // ANSI endpoint: /:n (for curl with Accept: text/plain)
    const match = pathname.match(/^\/(\d{3})$/);
    if (match) {
      const num = parseInt(match[1], 10);

      // Page numbers outside range 100-899 return 404 page
      const page = await getPage(num, ctx);
      const ansi = renderANSI(page);

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(ansi);
      return;
    }

    // Static file serving
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(publicDir, filePath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden\n');
      return;
    }

    // Check if file exists
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const content = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);

      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found\n');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error\n');
      }
    }
  } catch (err) {
    console.error('HTTP error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error' }));
  }
});

/**
 * TCP Server (telnet-style)
 */
const tcpServer = net.createServer(async (socket) => {
  try {
    // Send initial page (100) in ANSI
    let currentPage = 100;
    const page = await getPage(currentPage, ctx);
    const ansi = renderANSI(page);
    socket.write(ansi);

    let buffer = '';

    socket.on('data', async (data) => {
      // Accumulate data
      buffer += data.toString();

      // Check if we have a 3-digit number
      const match = buffer.match(/(\d{3})/);
      if (match) {
        const num = parseInt(match[1], 10);

        // Valid page range
        if (num >= 100 && num <= 899) {
          currentPage = num;
          const page = await getPage(num, ctx);
          const ansi = renderANSI(page);
          socket.write(ansi);
        }

        buffer = '';
      }
    });

    socket.on('end', () => {
      // Client disconnected
    });

    socket.on('error', (err) => {
      console.error('TCP socket error:', err);
    });
  } catch (err) {
    console.error('TCP error:', err);
    socket.end();
  }
});

/**
 * Start servers
 */
export async function startServers(httpPort = 3000, tcpPort = 2323) {
  return new Promise((resolve) => {
    const httpReady = () => {
      console.log(`HTTP server listening on port ${httpPort}`);

      tcpServer.listen(tcpPort, () => {
        console.log(`TCP server listening on port ${tcpPort}`);
        resolve({ httpServer, tcpServer });
      });
    };

    httpServer.listen(httpPort, httpReady);
  });
}

// Start servers if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const httpPort = parseInt(process.env.PORT || '3000', 10);
  const tcpPort = parseInt(process.env.TCP_PORT || '2323', 10);
  startServers(httpPort, tcpPort).catch(console.error);
}
