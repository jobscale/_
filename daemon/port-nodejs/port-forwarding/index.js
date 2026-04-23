import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Duplex } from 'stream';
import { Client } from 'ssh2';
import { Logger } from '@jobscale/logger';

const { LOG_LEVEL, HOME } = process.env;

const logger = new Logger({
  logLevel: LOG_LEVEL,
  timestamp: true,
  noPathName: true,
});

const execDir = dirname(fileURLToPath(import.meta.url));

const createProxySocket = (host, port, proxyCmd) => {
  const command = proxyCmd.replace(/%h/g, host).replace(/%p/g, port.toString());
  logger.info(`Executing proxy command: ${command}`);
  const [cmd, ...args] = command.split(/\s+/);
  const proxy = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  proxy.on('error', e => {
    logger.error('Proxy command error:', e.message);
  });
  proxy.on('exit', (code, signal) => {
    if (code !== null) {
      logger.info(`Proxy process exited with code ${code}`);
    } else {
      logger.info(`Proxy process killed with signal ${signal}`);
    }
  });
  proxy.stderr.on('data', data => {
    logger.error(`Proxy stderr: ${data.toString().trim()}`);
  });
  const duplexStream = new Duplex({
    read() {},
    write(chunk, encoding, callback) {
      if (!proxy.stdin.write(chunk, encoding)) {
        proxy.stdin.once('drain', callback);
      } else {
        callback();
      }
    },
  });
  proxy.stdout.on('data', chunk => {
    if (!duplexStream.push(chunk)) {
      proxy.stdout.pause();
    }
  });
  duplexStream.on('drain', () => {
    proxy.stdout.resume();
  });
  proxy.stdout.on('end', () => {
    duplexStream.push(null);
  });
  duplexStream.on('end', () => {
    proxy.stdin.end();
  });
  return duplexStream;
};

const files = {
  config: path.resolve(execDir, 'config.json'),
  proxyCommand: path.resolve(execDir, 'proxy-command.txt'),
};
const { listen, bind, hostConfig } = JSON.parse(fs.readFileSync(files.config, 'utf-8'));
const proxyCommand = fs.existsSync(files.proxyCommand) && fs.readFileSync(files.proxyCommand, 'utf-8').trim();
const sshConfig = {
  ...hostConfig,
  privateKey: fs.readFileSync(hostConfig.privateKey.replace('~', HOME)),
  sock: proxyCommand && createProxySocket(hostConfig.host, hostConfig.port, proxyCommand),
};

const portForwarding = () => {
  const conn = new Client();
  conn.on('ready', () => {
    logger.info('SSH connection established.');
    conn.forwardIn(listen.addr, listen.port, e => {
      if (e) {
        logger.error('Error setting up port forwarding:', e.message);
        conn.end();
        return;
      }
      logger.info(`Port forwarding setup: ${listen.addr}:${listen.port} -> ${bind.addr}:${bind.port}`);
    });
  });
  conn.on('tcp connection', (info, accept, reject) => {
    logger.info(`TCP connection from ${info.srcIP}:${info.srcPort}`);
    const stream = accept();
    const target = net.connect(bind.port, bind.addr);
    stream.on('error', e => {
      logger.error('Stream error:', e.message);
      target.end();
      reject();
    });
    target.on('error', e => {
      logger.error('Local target error:', e.message);
      stream.end();
      reject();
    });
    stream.pipe(target);
    target.pipe(stream);
    stream.on('close', () => target.end());
    target.on('close', () => stream.end());
  });
  conn.connect(sshConfig);
};

portForwarding();
