#!/usr/bin/env node

import WebSocket from 'ws';

const logger = new Proxy(console, {
  get(target, prop) {
    if (prop in target) {
      return (...args) => {
        const timestamp = new Date().toISOString();
        target[prop](`[${timestamp}] [WS CLIENT]`, ...args);
      };
    }
    return target[prop];
  },
});

const [forward, host, port] = process.argv.slice(2);
const dimension = BigInt(Math.floor(Math.random() * 0x100000000000));
const token = (BigInt(Date.now()) ^ dimension).toString(36);
const salt = dimension.toString(36);
const ws = new WebSocket(`${forward}/${token}/${salt}/${host}/${port}`, {
  perMessageDeflate: false,
});

ws.binaryType = 'nodebuffer';
const queue = { stack: [] };

process.stdin.on('data', chunk => {
  // Ensure chunk is a Buffer
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
    const chunk = queue.stack.shift();
    ws.send(chunk, { binary: true });
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
