import { webcrypto as crypto } from 'crypto';

const base64 = {
  fromArrayBuffer(buf) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  },
  toArrayBuffer(b64) {
    const bin = atob(b64);
    const buf = new ArrayBuffer(bin.length);
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return buf;
  },
};

const store = {};
const serverBefore = async () => {
  store.serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey'],
  );
  const serverPublicKey = await crypto.subtle.exportKey('spki', store.serverKeyPair.publicKey);
  store.serverPublic = Buffer.from(serverPublicKey).toString('base64');
};

const client = async (serverPublicKey, data) => {
  const clientKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey'],
  );
  const serverPub = await crypto.subtle.importKey(
    'spki', base64.toArrayBuffer(serverPublicKey),
    { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  );
  const clientAesKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: serverPub }, clientKeyPair.privateKey,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt'],
  );
  const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, clientAesKey, dataBuffer,
  );
  const clientPublicKey = await crypto.subtle.exportKey('spki', clientKeyPair.publicKey);
  return [
    base64.fromArrayBuffer(iv),
    base64.fromArrayBuffer(clientPublicKey),
    base64.fromArrayBuffer(encrypted),
  ].join('.');
};

const server = async received => {
  const [ivB64, pubB64, encB64] = received.split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const clientPublicKey = Buffer.from(pubB64, 'base64');
  const encrypted = Buffer.from(encB64, 'base64');
  const clientPub = await crypto.subtle.importKey(
    'spki', clientPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  );
  const serverAesKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: clientPub }, store.serverKeyPair.privateKey,
    { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  );
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    serverAesKey, Buffer.from(encrypted, 'base64'),
  );
  return new Uint8Array(decryptedBuffer);
};

const logger = new Proxy(console, {
  get(target, property) {
    return (...args) => target[property](`[${property.toUpperCase()}]`.padEnd(8, ' '), ...args);
  },
});

const it = async data => {
  // encrypt from client
  const encrypted = await client(store.serverPublic, data);
  // decrypt for server
  return server(encrypted);
};

// generate store.serverPublic
await serverBefore();
// parallel test
const list = await Promise.all([
  it('こんにちは暗号'),
  it([0, 3, 2, 1, 'a'.charCodeAt(0)]),
  it([0, 3, 2, 1, 'a'.charCodeAt(0)]),
  it([0, 3, 2, 1, 'a'.charCodeAt(0)]),
  it([0, 3, 2, 1, 'a'.charCodeAt(0)]),
  it('宇宙は膨張している、光よりも速い速度で広がっている'),
  it('世界は愛で溢れている'),
  it('世界はアイデア触れている'),
]);
// results logging
list.forEach(decrypted => {
  if (decrypted[0] < 0x20) {
    logger.info(decrypted);
  } else {
    logger.info(new TextDecoder().decode(decrypted));
  }
});
