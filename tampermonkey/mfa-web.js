// ==UserScript==
// @name         MFA AWS Azure GitHub
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       jobscale
// @match        https://*.signin.aws.amazon.com/oauth?client_id=arn%3Aaws%3Asignin*
// @match        https://login.microsoftonline.com/*/login
// @match        https://github.com/*
// @match        https://jsx.jp/auth/
// @match        https://*.jsx.jp/auth/
// @match        https://www.npmjs.com/login/otp?next=*
// @match        https://www.npmjs.com/escalate/otp?next=*
// @match        https://bitflyer.com/*/ex/twofactorauth
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @grant        none
// ==/UserScript==

(() => {
  const mfaList = () => [
    { name: 'refresh', token: 'AAZ' },
    { name: 'refresh', token: 'BAZ' },
    { name: 'refresh', token: 'CAZ' },
  ];

  const authInput = () => document.querySelector('#mfacode') // AWS
  || document.querySelector('input[name="otc"]') // MS
  || document.querySelector('#app_totp') // GitHub
  || document.querySelector('#login_otp') // npm
  || document.querySelector('form[class="auth-area"]') // jsxjp
  || document.querySelector('#otpCode'); // bitflyer

  const TOTP = {
    decodeBase32(encoded) {
      const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const base32AlphabetValuesMap = new Map(
        Array.from(base32Alphabet, (encoding, value) => [encoding, value])
      );
      const stringTrimmed = encoded.replace(/=*$/, '');
      const result = new Uint8Array(Math.ceil((stringTrimmed.length * 5) / 8));
      let dataBuffer = 0;
      let dataBufferBitLength = 0;
      let byteOffset = 0;
      for (const encoding of stringTrimmed) {
        const value = base32AlphabetValuesMap.get(encoding);
        if (typeof value === 'undefined') throw new Error('Invalid base32 string');
        dataBuffer <<= 5;
        dataBuffer |= value;
        dataBufferBitLength += 5;
        while (dataBufferBitLength >= 8) {
          dataBufferBitLength -= 8;
          result[byteOffset++] = (dataBuffer >> dataBufferBitLength) & 0xff;
        }
      }
      if (dataBufferBitLength) {
        let mask = 0;
        for (let i = dataBufferBitLength; i; i--) {
          mask >>= 1;
          mask += 128;
        }
        result[byteOffset] = (dataBuffer << (3 - dataBufferBitLength)) & mask;
      }
      return result;
    },

    convertToBuffer(who, encoding) {
      if (encoding !== 'base32') {
        return ArrayBuffer.from(who, encoding);
      }
      return this.decodeBase32(who.toUpperCase());
    },

    async createHmacKey(secret, buf, algorithm) {
      const key = await window.crypto.subtle.importKey(
        "raw",
        secret, { name: "HMAC", hash: { name: "SHA-1" } },
        false,
        ["sign", "verify"],
      );
      return window.crypto.subtle.sign("HMAC", key, buf);
    },

    async digest(options) {
      var secret = options.secret;
      var counter = options.counter;
      var encoding = options.encoding || 'base32';
      var algorithm = 'sha1';

      secret = this.convertToBuffer(secret, encoding);

      var buf = new Uint8Array(8);
      var tmp = counter;
      for (let i = 0; i < 8; i++) {
        buf[7 - i] = tmp & 0xff;
        tmp = tmp >> 8;
      }

      var signature = await this.createHmacKey(secret, buf, algorithm);
      return new Uint8Array(signature);
    },

    async hotp(options) {
      var digits = (options.digits != null ? options.digits : options.length) || 6;
      var digest = options.digest || await this.digest(options);
      var offset = digest[digest.length - 1] & 0xf;
      var code = (digest[offset] & 0x7f) << 24 |
        (digest[offset + 1] & 0xff) << 16 |
        (digest[offset + 2] & 0xff) << 8 |
        (digest[offset + 3] & 0xff);

      code = new Array(digits + 1).join('0') + code.toString(10);
      return code.substr(-digits);
    },

    async totp(options) {
      options = Object.create(options);
      if (options.counter == null) {
        var step = options.step || 30;
        var time = options.time != null ? (options.time * 1000) : Date.now();
        var epoch = (options.epoch != null ? (options.epoch * 1000) : (options.initial_time * 1000)) || 0;
        options.counter = Math.floor((time - epoch) / step / 1000);
      }
      return this.hotp(options);
    },
  };

  const totp = token => TOTP.totp({
    secret: token,
    encoding: 'base32',
    time: Math.floor(Date.now() / 1000) + 30,
  });

  const render = async () => {
    const old = document.querySelector('.g-base');
    if (old) old.remove();
    const area = document.createElement('div');
    area.classList.add('g-area');
    const exist = localStorage.getItem('g-data');
    const data = exist ? JSON.parse(exist) : { list: [] };
    const items = data.list.length ? data.list : mfaList();
    const ts = document.createElement('div');
    setInterval(() => {
      ts.textContent = 30 - (Math.floor(Date.now() / 1000) % 30);
    }, 1000)
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
