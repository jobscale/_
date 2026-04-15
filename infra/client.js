#!/usr/bin/env node

import net from 'net';
import tls from 'tls';
import WebSocket from 'ws';

const logger = new Proxy(console, {
  get(target, prop) {
    if (prop in target) {
      return (...args) => {
        const timestamp = new Date().toISOString();
        target[prop](`[${timestamp}] [NET CLIENT]`, ...args);
      };
    }
    return target[prop];
  },
});

const [forward, host, port] = process.argv.slice(2);

const proxyWebSocket = () => {
  const dimension = BigInt(Math.floor(Math.random() * 0x100000000000));
  const token = (BigInt(Date.now()) ^ dimension).toString(36);
  const salt = dimension.toString(36);
  const ws = new WebSocket(`${forward}/${token}/${salt}/${host}/${port}`, {
    perMessageDeflate: false,
  });

  ws.binaryType = 'nodebuffer';
  const queue = { stack: [] };

  process.stdin.on('data', chunk => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'binary');
    if (queue.stack) { queue.stack.push(buffer); return; }
    if (ws.readyState !== ws.OPEN) return;
    ws.send(buffer, { binary: true });
  });

  process.stdin.on('end', () => {
    logger.error('stdin ended');
    ws.close();
  });

  ws.on('open', () => {
    process.stdin.resume();
    if (ws.readyState !== ws.OPEN) return;
    while (queue.stack?.length) {
      ws.send(queue.stack.shift(), { binary: true });
    }
    delete queue.stack;
  });

  ws.on('message', data => {
    process.stdout.write(data);
  });

  ws.on('close', () => {
    process.exit(0);
  });

  ws.on('error', e => {
    logger.error('WebSocket error:', e);
    process.exit(1);
  });
};

const proxyHttpConnect = url => {
  const isTLS = url.protocol === 'https:';
  const proxyPort = url.port || (isTLS ? 443 : 80);
  const socket = (isTLS ? tls : net).connect(proxyPort, url.hostname);
  socket.on('connect', () => {
    const req = [
      `CONNECT ${host}:${port} HTTP/1.1`,
      `Host: ${host}:${port}`,
      'Proxy-Connection: Keep-Alive',
      'Connection: Keep-Alive',
      '\r\n',
    ].join('\r\n');
    socket.write(req);
  });

  const queue = { stack: Buffer.alloc(0) };

  socket.on('data', chunk => {
    if (queue.stack === undefined) {
      process.stdout.write(chunk);
      return;
    }
    queue.stack = Buffer.concat([queue.stack, chunk]);
    const headerEnd = queue.stack.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;
    const header = queue.stack.slice(0, headerEnd).toString();
    if (!header.includes('200')) {
      logger.error('Proxy CONNECT failed:', header);
      process.exit(1);
    }
    const rest = queue.stack.slice(headerEnd + 4);
    delete queue.stack;
    if (rest.length > 0) process.stdout.write(rest);
    process.stdin.on('data', data => {
      socket.write(data);
    });
    process.stdin.on('end', () => {
      socket.end();
    });
  });

  socket.on('close', () => {
    process.exit(0);
  });

  socket.on('error', e => {
    logger.error('HTTP CONNECT error:', e);
    process.exit(1);
  });
};

const url = new URL(forward);
if (url.protocol === 'ws:' || url.protocol === 'wss:') {
  proxyWebSocket();
} else if (url.protocol === 'http:' || url.protocol === 'https:') {
  proxyHttpConnect(url);
} else {
  logger.error('Unsupported protocol:', url.protocol);
  process.exit(1);
}
