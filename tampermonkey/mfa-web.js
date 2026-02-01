// ==UserScript==
// @name         MFA AWS Azure GitHub
// @namespace    http://tampermonkey.net/
// @version      2026-01-26
// @description  try to take over the world!
// @author       jobscale
// @match        http://127.0.0.1:3000/*
// @match        https://*.signin.aws.amazon.com/oauth?*
// @match        https://signin.aws.amazon.com/signin?*
// @match        https://login.microsoftonline.com/*
// @match        https://github.com/*
// @match        https://jsx.jp/auth/
// @match        https://*.jsx.jp/auth/
// @match        https://www.npmjs.com/login/otp?next=*
// @match        https://www.npmjs.com/escalate/otp?next=*
// @match        https://bitflyer.com/*/ex/twofactorauth
// @match        https://accounts.google.com/v3/signin/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=docs.github.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

(async () => {
  const sharedStorage = {
    enc: new TextEncoder(),
    dec: new TextDecoder(),
    PASSWORD: '<secret>',

    async secretProvider(generate = true) {
      let secret = GM_getValue('.multi-domain.machine.id');
      if (!secret && generate) {
        secret = crypto.getRandomValues(new Uint8Array(16)).join('');
        GM_setValue('.multi-domain.machine.id', secret);
      }
      if (secret) sharedStorage.PASSWORD = secret.split('').reverse().join('');
    },

    async gzip(data) {
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(data);
      writer.close();
      return new Response(cs.readable).arrayBuffer();
    },

    async gunzip(data) {
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(data);
      writer.close();
      return new Response(ds.readable).arrayBuffer();
    },

    async bufferToString(uint8) {
      const buf = uint8 instanceof Blob ? new Uint8Array(await uint8.arrayBuffer()) : uint8;
      const CHUNK_SIZE = 0x4000;
      const s = [];
      for (let i = 0; i < buf.length; i += CHUNK_SIZE) {
        s.push(String.fromCharCode(...buf.subarray(i, i + CHUNK_SIZE)));
      }
      return btoa(s.join(''));
    },

    async bufferFrom(base64) {
      const s = atob(base64);
      const arr = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) {
        arr[i] = s.charCodeAt(i);
      }
      return new Blob([arr]);
    },

    async deriveKey(password, salt) {
      const keyMaterial = await crypto.subtle.importKey(
        'raw', sharedStorage.enc.encode(password), 'PBKDF2', false, ['deriveKey'],
      );
      return crypto.subtle.deriveKey({
        name: 'PBKDF2', salt, iterations: 10_000, hash: 'SHA-256',
      }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    },

    async encrypt(value) {
      value = new Uint8Array(await sharedStorage.gzip(JSON.stringify(value)));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      if (sharedStorage.PASSWORD === '<secret>') await sharedStorage.secretProvider();
      const key = await sharedStorage.deriveKey(sharedStorage.PASSWORD, salt);
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, value,
      );
      const obfuscatedSalt = salt.map((v, i) => v ^ (i + 0xb) % 0xdb);
      return new Blob([obfuscatedSalt, iv, encrypted]);
    },

    async decrypt(blob) {
      const combined = new Uint8Array(await blob.arrayBuffer());
      const obfuscatedSalt = combined.subarray(0, 16);
      const iv = combined.subarray(16, 16 + 12);
      const data = combined.subarray(16 + 12);
      const salt = new Uint8Array(obfuscatedSalt.map((v, i) => v ^ (i + 0xb) % 0xdb));
      if (sharedStorage.PASSWORD === '<secret>') await sharedStorage.secretProvider(false);
      const key = await sharedStorage.deriveKey(sharedStorage.PASSWORD, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv }, key, data,
      );
      const value = await sharedStorage.gunzip(new Uint8Array(decrypted));
      return JSON.parse(sharedStorage.dec.decode(value));
    },

    async setItem(key, value) {
      const encrypted = await sharedStorage.encrypt(value);
      const bufferStr = await sharedStorage.bufferToString(encrypted);
      GM_setValue(key, bufferStr);
    },

    async getItem(key) {
      return Promise.resolve(async () => {
        const encrypted = GM_getValue(key);
        if (!encrypted) return undefined;
        const buffer = await sharedStorage.bufferFrom(encrypted);
        return sharedStorage.decrypt(buffer).catch(() => undefined);
      })
      .catch(() => undefined);
    },

    async removeItem(key) {
      GM_deleteValue(key);
    },

    async clear() {
      const keys = GM_listValues();
      for (const key of keys) {
        await sharedStorage.removeItem(key);
      }
    },
  };

  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const onetime = {
    decodeBase32(encoded) {
      const base32Lookup = {};
      for (let i = 0; i < base32Chars.length; i++) {
        base32Lookup[base32Chars[i]] = i;
      }
      const base32String = encoded.replace(/=+$/, '').toUpperCase();
      const bitsPerChar = 5;
      let binaryString = '';
      for (let i = 0; i < base32String.length; i++) {
        const char = base32String[i];
        if (base32Lookup[char] === undefined) {
          throw new Error(`Invalid character in Base32 string: ${char}`);
        }
        const binaryValue = base32Lookup[char].toString(2).padStart(bitsPerChar, '0');
        binaryString += binaryValue;
      }
      const chunks = binaryString.match(/.{1,8}/g).filter(v => v.length === 8);
      return new Uint8Array(chunks.map(chunk => parseInt(chunk, 2)));
    },

    convertToBuffer(who, encoding) {
      if (encoding === 'base32') return onetime.decodeBase32(who);
      return ArrayBuffer.from(who, encoding);
    },

    async createHmacKey(secret, buf, algorithm = 'HMAC') {
      const nodejs = typeof window === 'undefined';
      if (nodejs) {
        const crypto = await import('crypto');
        const hmac = crypto.createHmac('sha1', secret);
        hmac.update(buf);
        return Buffer.from(hmac.digest(), 'hex');
      }
      const key = await crypto.subtle.importKey(
        'raw', secret, { name: algorithm, hash: { name: 'SHA-1' } },
        false, ['sign', 'verify'],
      );
      return crypto.subtle.sign(algorithm, key, buf);
    },

    async digest(options) {
      const { secret } = options;
      const { counter } = options;
      const encoding = options.encoding || 'base32';
      const blob = onetime.convertToBuffer(secret, encoding);
      const buf = new Uint8Array(8);
      let tmp = counter;
      for (let i = 0; i < 8; i++) {
        buf[7 - i] = tmp & 0xff;
        tmp >>= 8;
      }
      const signature = await onetime.createHmacKey(blob, buf);
      return new Uint8Array(signature);
    },

    async hotp(options) {
      const digits = (options.digits ? options.digits : options.length) || 6;
      const digest = options.digest || await onetime.digest(options);
      const offset = digest[digest.length - 1] & 0xf;
      const code = (digest[offset] & 0x7f) << 24
        | (digest[offset + 1] & 0xff) << 16
        | (digest[offset + 2] & 0xff) << 8
        | digest[offset + 3] & 0xff;
      const strCode = new Array(digits + 1).join('0') + code.toString(10);
      return strCode.slice(-digits);
    },

    async totp(options) {
      options = Object.create(options);
      if (!options.counter) {
        const step = options.step || 30;
        const time = options.time ? options.time * 1000 : Date.now();
        const epoch = options.epoch ? options.epoch * 1000 : 0;
        options.counter = Math.floor((time - epoch) / step / 1000);
      }
      return onetime.hotp(options);
    },
  };

  const store = {};
  const app = {
    async mfaList() {
      const list = await sharedStorage.getItem('mfaList');
      return list ?? [
        { name: 'refresh A', token: 'AAzzZz' },
        { name: 'refresh B', token: 'BAzzZz' },
        { name: 'refresh C', token: 'CAzzZz' },
      ];
    },

    authInput() {
      return document.querySelector('#mfacode, #mfaCode, input[name="mfaCode"]') // AWS
      || document.querySelector('input[name="otc"]') // MS
      || document.querySelector('#app_totp') // GitHub
      || document.querySelector('#login_otp') // npm
      || document.querySelector('form[class="auth-area"]') // jsxjp
      || document.querySelector('#otpCode'); // bitflyer
    },

    css: `
.g-area {
  position: absolute;
  color: #ddd;
  text-align: center;
  font-size: 2vmin;
  right: 1em;
  top: 5em;
  padding: 1em;
  display: grid;
  gap: 0.4em;
  width: 18em;
  background: rgba(20,20,20,.6);
  backdrop-filter: blur(4px);
  z-index: 1;
  transition: all 1s ease;
}
.g-area.collapsed {
  width: 2em;
  height: 2em;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
}
.g-area.collapsed .g-content {
  display: none;
}
.g-hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
.g-hamburger span {
  display: block;
  width: 1em;
  height: 0.1em;
  background: #ddd;
  margin: 0.2em 0;
  transition: all 0.3s ease;
}
.g-area .g-hamburger span:nth-child(1) {
  transform: rotate(45deg) translate(0.3em, 0.4em);
}
.g-area .g-hamburger span:nth-child(2) {
  opacity: 0;
}
.g-area .g-hamburger span:nth-child(3) {
  transform: rotate(-45deg) translate(0.3em, -0.4em);
}
.g-area.collapsed .g-hamburger span:nth-child(1) {
  transform: initial;
}
.g-area.collapsed .g-hamburger span:nth-child(2) {
  opacity: 1;
}
.g-area.collapsed .g-hamburger span:nth-child(3) {
  transform: initial;
}
.g-content {
  display: grid;
  gap: 0.4em;
}
.g-area button {
  cursor: pointer;
}
.g-area button, .g-area input {
  background: #333;
  color: #ddd;
  text-align: center;
  font-size: 1em;
  border-radius: 0.5em;
  border: 1px solid #66a;
  padding: 3px 0.5em;
  margin: 3px;
}
.g-box {
  background: rgba(10,10,10,.6);
  backdrop-filter: blur(4px);
  border-radius: 1em;
  box-shadow: 0 0 1.5em -0.25em rgba(226, 219, 219, 0.75);
  padding: 0.3em;
  margin: 0.4em 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.g-box span {
  width: 6em;
}
.g-box button {
  border: 1px solid #6a6;
  margin: 0.3em 0.6em;
  padding: 0.3em 0.7em;
  font-size: 0.8em;
  width: 10em;
}
input {
  background: transparent;
}
`,

    async render() {
      const old = document.querySelector('.g-area');
      if (old) old.remove();
      const area = document.createElement('div');
      area.classList.add('g-area');
      const hamburger = document.createElement('div');
      hamburger.classList.add('g-hamburger');
      hamburger.innerHTML = '<span></span><span></span><span></span>';
      area.append(hamburger);
      const content = document.createElement('div');
      content.classList.add('g-content');
      area.append(content);
      const items = await app.mfaList();
      const ts = document.createElement('div');
      if (store.intervalId) clearInterval(store.intervalId);
      store.intervalId = setInterval(() => {
        ts.textContent = 30 - Math.floor(Date.now() / 1000) % 30;
      }, 1000);
      content.append(ts);
      const div = document.createElement('div');
      content.append(div);
      for (const item of items) {
        const el = document.createElement('div');
        el.classList.add('g-box');
        const span = document.createElement('span');
        el.append(span);
        const btn = document.createElement('button');
        btn.textContent = item.name;
        el.append(btn);
        div.append(el);
        const update = async () => {
          const mfaCode = await onetime.totp({
            secret: item.token,
            encoding: 'base32',
            time: Math.floor(Date.now() / 1000) + 30,
          });
          span.textContent = mfaCode;
        };
        btn.addEventListener('click', update);
        await update();
      }
      hamburger.addEventListener('click', () => {
        area.classList.toggle('collapsed');
      });
      document.body.append(area);
    },

    async action() {
      const exists = app.authInput();
      if (!exists) return;
      store.observer.disconnect();

      const style = document.createElement('style');
      style.textContent = app.css;
      document.head.append(style);
      app.render();
    },

    handler() {
      requestAnimationFrame(() => {
        clearTimeout(store.id);
        store.id = setTimeout(app.action, 200);
      });
    },

    start() {
      store.observer = new MutationObserver(app.handler);
      store.observer.observe(document.body, { childList: true, subtree: true });
    },
  };

  window.addEventListener('pageshow', app.start);
})();
