const { Client } = require('ssh2');
const net = require('net');
const fs = require('fs');

const logger = console;

// SSH 接続設定
const sshConfig = {
  host: 'vpn.jsx.jp',                      // 接続先ホスト
  port: 22,                                // SSH デフォルトポート
  username: 'jobscale',                    // SSH ユーザー名
  privateKey: fs.readFileSync('openssh-ed25519.pem') // 秘密鍵
};

// 転送設定
const listen = {
  addr: '0.0.0.0',  // リモート側が待ち受けるアドレス
  port: 2025        // リモート側が待ち受けるポート
};
const bind = {
  addr: '127.0.0.1', // ローカル側の接続先アドレス
  port: 22           // ローカル側の接続先ポート
};

const setupSshForwarding = () => {
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
  }).on('tcp connection', (info, accept, reject) => {
    logger.info(`TCP connection from ${info.srcIP}:${info.srcPort} -> ${info.destIP}:${info.destPort}`);
    // ローカル側のポートに接続
    const stream = accept();
    const target = net.connect(bind.port, bind.addr, () => {
      stream.pipe(target).pipe(stream);
    });
    target.on('error', e => {
      logger.error('Error connecting to local target:', e.message);
      reject();
      stream.end();
    });
  }).on('error', e => {
    logger.error('SSH connection error:', e.message);
  }).on('close', () => {
    logger.info('SSH connection closed.');
  });

  // SSH 接続開始
  conn.connect(sshConfig);
}

// 実行
setupSshForwarding();
