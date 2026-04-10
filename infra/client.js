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
const ws = new WebSocket(`${forward}/ssh/${token}/${salt}/${host}/${port}`, {
  perMessageDeflate: false,
});

ws.binaryType = 'nodebuffer';

const queue = [];
let isOpen = false;

process.stdin.on('data', chunk => {
  // Ensure chunk is a Buffer
  const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'binary');
  if (isOpen && ws.readyState === ws.OPEN) {
    ws.send(buffer, { binary: true });
  } else if (!isOpen) {
    queue.push(buffer);
  }
});

process.stdin.on('end', () => {
  logger.error('stdin ended');
  ws.close();
});

ws.on('open', () => {
  isOpen = true;
  process.stdin.resume();
  while (queue.length > 0) {
    const chunk = queue.shift();
    if (ws.readyState === ws.OPEN) {
      ws.send(chunk, { binary: true });
    }
  }
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
