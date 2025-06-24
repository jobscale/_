// ==UserScript==
// @name         MFA AWS Azure GitHub
// @namespace    http://tampermonkey.net/
// @version      2025-06-24
// @description  try to take over the world!
// @author       jobscale
// @match        https://*.signin.aws.amazon.com/oauth?*
// @match        https://login.microsoftonline.com/*
// @match        https://github.com/*
// @match        https://jsx.jp/auth/
// @match        https://*.jsx.jp/auth/
// @match        https://www.npmjs.com/login/otp?next=*
// @match        https://www.npmjs.com/escalate/otp?next=*
// @match        https://bitflyer.com/*/ex/twofactorauth
// @match        https://accounts.google.com/v3/signin/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @grant        none
// ==/UserScript==

(() => {
  const mfaList = () => [
    { name: 'refresh', token: 'AAZ' },
    { name: 'refresh', token: 'BAZ' },
    { name: 'refresh', token: 'CAZ' },
  ];

  const authInput = () => document.querySelector('#mfacode, #mfaCode') // AWS
  || document.querySelector('input[name="otc"]') // MS
  || document.querySelector('#app_totp') // GitHub
  || document.querySelector('#login_otp') // npm
  || document.querySelector('form[class="auth-area"]') // jsxjp
  || document.querySelector('#otpCode'); // bitflyer

  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  class TOTP {
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
    }

    convertToBuffer(who, encoding) {
      if (encoding === 'base32') return this.decodeBase32(who);
      return ArrayBuffer.from(who, encoding);
    }

    async createHmacKey(secret, buf, algorithm = 'HMAC') {
      const loader = typeof require !== 'undefined' ? require : undefined;
      if (loader) {
        const crypto = loader('crypto');
        const hmac = crypto.createHmac('sha1', secret);
        hmac.update(buf);
        return Buffer.from(hmac.digest(), 'hex');
      }
      const key = await crypto.subtle.importKey(
        'raw',
        secret,
        { name: algorithm, hash: { name: 'SHA-1' } },
        false,
        ['sign', 'verify'],
      );
      return crypto.subtle.sign(algorithm, key, buf);
    }

    async digest(options) {
      const { secret } = options;
      const { counter } = options;
      const encoding = options.encoding || 'base32';
      const blob = this.convertToBuffer(secret, encoding);
      const buf = new Uint8Array(8);
      let tmp = counter;
      for (let i = 0; i < 8; i++) {
        buf[7 - i] = tmp & 0xff;
        tmp >>= 8;
      }
      const signature = await this.createHmacKey(blob, buf);
      return new Uint8Array(signature);
    }

    async hotp(options) {
      const digits = (options.digits ? options.digits : options.length) || 6;
      const digest = options.digest || await this.digest(options);
      const offset = digest[digest.length - 1] & 0xf;
      const code = (digest[offset] & 0x7f) << 24
        | (digest[offset + 1] & 0xff) << 16
        | (digest[offset + 2] & 0xff) << 8
        | (digest[offset + 3] & 0xff);
      const strCode = new Array(digits + 1).join('0') + code.toString(10);
      return strCode.slice(-digits);
    }

    async totp(options) {
      options = Object.create(options);
      if (!options.counter) {
        const step = options.step || 30;
        const time = options.time ? (options.time * 1000) : Date.now();
        const epoch = options.epoch ? options.epoch * 1000 : 0;
        options.counter = Math.floor((time - epoch) / step / 1000);
      }
      return this.hotp(options);
    }
  }

  const app = new TOTP();
  const totp = token => app.totp({
    secret: token,
    encoding: 'base32',
    time: Math.floor(Date.now() / 1000) + 30,
  });

  const render = async () => {
    const old = document.querySelector('.g-base');
    if (old) old.remove();
    const area = document.createElement('div');
    area.classList.add('g-area');
    const getItem = () => {
      const exist = localStorage.getItem('g-data');
      const data = exist ? JSON.parse(exist) : { list: [] };
      return data.list.length ? data.list : mfaList();
    };
    const items = getItem();
    const ts = document.createElement('div');
    setInterval(() => {
      ts.textContent = 30 - (Math.floor(Date.now() / 1000) % 30);
    }, 1000);
    area.append(ts);
    const div = document.createElement('div');
    area.append(div);
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
        const mfaCode = await totp(item.token);
        span.textContent = mfaCode;
      };
      btn.addEventListener('click', update);
      await update();
    }
    const ctl = document.createElement('div');
    ctl.classList.add('g-ctl');
    const gName = document.createElement('input');
    gName.placeholder = 'secret name';
    ctl.append(gName);
    const gToken = document.createElement('input');
    gToken.placeholder = 'secret code';
    gToken.type = 'password';
    ctl.append(gToken);
    const gBtn = document.createElement('button');
    gBtn.textContent = 'add new';
    ctl.append(gBtn);
    area.append(ctl);
    const addToken = () => {
      if (!gName.value || !gToken.value) return;
      const exist = localStorage.getItem('g-data');
      const data = exist ? JSON.parse(exist) : { list: [] };
      data.list.push({
        name: gName.value,
        token: gToken.value,
      });
      localStorage.setItem('g-data', JSON.stringify(data));
      render();
    };
    gBtn.addEventListener('click', addToken);

    document.body.append(area);
  };

  const action = async () => {
    if (!authInput()) {
      setTimeout(action, 1000);
      return;
    }

    const style = document.createElement('style');
    style.textContent = `
.g-area {
  position: absolute;
  color: #ddd;
  text-align: center;
  font-size: 2vmin;
  right: 1em;
  top: 3em;
  padding: 1em;
  display: grid;
  gap: 0.4em;
  width: 18em;
  background: rgba(20,20,20,.6);
  backdrop-filter: blur(4px);
  z-index: 1;
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
.g-ctl {
  padding: 0.3em 0;
  background: #333;
  border-radius: 1em;
  border: 1px solid #66a;
  box-shadow: 0 0 1.5em -0.25em rgba(35, 37, 146, 0.75);
}
input {
  background: transparent;
}
`;
    document.head.append(style);
    render();
  };

  action();
})();
