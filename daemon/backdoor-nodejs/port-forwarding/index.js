import net from 'net';
import fs from 'fs';
import path from 'path';
import { Client } from 'ssh2';
import { Logger } from '@jobscale/logger';

const {
  LOG_LEVEL, HOST, PORT, USER, FPEM, LISTEN_PORT,
} = process.env;

const logger = new Logger({
  logLevel: LOG_LEVEL,
  timestamp: true,
  noPathName: true,
});

const sshConfig = {
  host: HOST || '2603.jsx.jp',
  port: PORT || 22,
  username: USER || 'jobscale',
  privateKey: fs.readFileSync('openssh-ed25519.pem', 'utf-8'),
};
const listen = {
  addr: '0.0.0.0',
  port: LISTEN_PORT || 2025,
};
const bind = {
  addr: '127.0.0.1',
  port: 22,
};

const portForwarding = () => {
  const conn = new Client();
  conn.on('ready', () => {
    logger.info('SSH connection established.');
    // リモートポートフォワーディングの設定
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
}

portForwarding();
