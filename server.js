import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8080;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// SSE clients connected to /events
const clients = new Set();

// Shared state
const state = { muted: false, volume: 0.8, clock: false };

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) client.write(msg);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // SSE stream — TV and remote both listen here
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    // Send current state immediately on connect
    res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  // Remote sends commands here
  if (req.url === '/command' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { cmd } = JSON.parse(body);

        // Update shared state for stateful commands
        if (cmd === 'mute')     state.muted  = !state.muted;
        if (cmd === 'clock')    state.clock  = !state.clock;
        if (cmd === 'vol-up')   state.volume = Math.min(1, +(state.volume + 0.1).toFixed(1));
        if (cmd === 'vol-down') state.volume = Math.max(0, +(state.volume - 0.1).toFixed(1));

        // Broadcast command to all clients (TV executes it, remote reflects state)
        broadcast('cmd', { cmd });
        broadcast('state', state);

        res.writeHead(200);
        res.end('ok');
      } catch {
        res.writeHead(400);
        res.end('bad request');
      }
    });
    return;
  }

  // Static file serving
  let filePath = path.join(__dirname, req.url === '/' ? '/index.html' : req.url);
  // Strip query strings
  filePath = filePath.split('?')[0];

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FlipOff running at http://localhost:${PORT}`);
  console.log(`Phone remote:      http://localhost:${PORT}/remote.html`);
});
