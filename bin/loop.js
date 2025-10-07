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

const now = () => Math.floor(performance.now());

const enter = (endTime, step) => new Promise(async resolve => {
  const start = performance.now();
  const tick = 1000 / step;
  while (true) {
    const left = endTime - now();
    if (left <= 0) break;
    const remaining = left / 1000;
    if (step === 1) process.stdout.write(`\r${remaining.toFixed(0).padStart(5, ' ')} `);
    else process.stdout.write(`\r${remaining.toFixed(2).padStart(8, ' ')} `);
    const nextTick = Math.ceil((left % 1000) % tick) || tick;
    await new Promise(res => { setTimeout(res, nextTick); });
  }
  const benchmark = (performance.now() - start) / 1000;
  process.stdout.write(`\r    0   (${benchmark.toFixed(3)})\n`);
  resolve();
});

const loop = async (seconds, step, useSound) => {
  const endTime = now() + (seconds * 1000);
  await enter(endTime, step);
  if (useSound) play();
}

const main = argv => {
  const timer = argv.filter(arg => arg !== '--silent');
  const [secondsArg, stepArg] = timer;
  const step = Math.min(20, Number.parseInt(stepArg, 10) || 1);
  const seconds = Number.parseInt(secondsArg, 10);
  if (!seconds) {
    logger.error('Usage: loop.js <seconds> [silent]');
    process.exit(1);
  }
  const useSound = argv.length === timer.length;
  loop(seconds, step, useSound);
};

main(process.argv.splice(2));
