import net from 'net';
import fs from 'fs';
import { spawn } from 'child_process';
import { Duplex } from 'stream';
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

const createProxySocket = (host, port, proxyCmd) => {
  const command = proxyCmd
  .replace(/%h/g, host)
  .replace(/%p/g, port.toString());
  logger.info(`Executing proxy command: ${command}`);
  const [cmd, ...args] = command.split(/\s+/);
  const proxy = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe']
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
    read(size) {
    },
    write(chunk, encoding, callback) {
      if (!proxy.stdin.write(chunk, encoding)) {
        proxy.stdin.once('drain', callback);
      } else {
        callback();
      }
    }
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

const proxyCommand = [
  , 'ncat --proxy-type http --proxy proxy.jsx.jp:3128 %h %p',
][0];

const hostConfig = {
  host: HOST || '2603.jsx.jp',
  port: PORT || 22,
  username: USER || 'jobscale',
  privateKey: fs.readFileSync(FPEM || 'openssh-ed25519.pem', 'utf-8'),
};
const sshConfig = {
  ...hostConfig,
  sock: proxyCommand && createProxySocket(hostConfig.host, hostConfig.port, proxyCommand),
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
