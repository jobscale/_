#!/usr/bin/env node

import { exec } from 'child_process';
import { finished } from 'stream';

const logger = console;

const play = () => {
  exec('which ffplay', (e, stdout) => {
    if (!e && stdout.trim()) {
      const soundPath = `${process.env.HOME}/_/quest/sand.mp3`;
      exec(`ffplay -nodisp -autoexit -ss 0 -t 2 "${soundPath}" > /dev/null 2>&1`);
    }
  });
};

const enter = (endTime, step) => new Promise(async resolve => {
  const start = Date.now();
  const tick = 1000 / step;
  while (true) {
    const left = endTime - Date.now();
    if (left <= 0) break;
    const remaining = left / 1000;
    if (step === 1) process.stdout.write(`\r${remaining.toFixed(0).padStart(5, ' ')} `);
    else process.stdout.write(`\r${remaining.toFixed(2).padStart(8, ' ')} `);
    const nextTick = Math.ceil((left % 1000) % tick) || tick;
    await new Promise(res => { setTimeout(res, nextTick); });
  }
  process.stdout.write(`\r    0   (${(Date.now() - start) / 1000})\n`);
  resolve();
});

const loop = async (seconds, step, mode = '') => {
  const endTime = Date.now() + (seconds * 1000);
  await enter(endTime, step);
  if (mode !== 'silent') play();
}

const [,, secondsArg, mode, stepArg] = process.argv;
const step = Math.min(20, Number.parseInt(stepArg, 10) || 1);
const seconds = Number.parseInt(secondsArg, 10);
if (!seconds) {
  logger.error('Usage: loop.js <seconds> [silent]');
  process.exit(1);
}
loop(seconds, step, mode);
