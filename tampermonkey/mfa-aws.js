// ==UserScript==
// @name         MFA AWS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.signin.aws.amazon.com/oauth?client_id=arn%3Aaws%3Asignin*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @grant        none
// ==/UserScript==

(() => {
  const simpleOTP = {
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
      if (dataBufferBitLength >= 5) throw new Error('Invalid base32 string');
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
      return this.decodeBase32(who);
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

  const action = async () => {
    const auth = document.querySelector('#mfacode');
    if (!auth) {
      setTimeout(action, 1000);
      return;
    }

    const mfaCode = await simpleOTP.totp({
      secret: 'boToXyxAbc'.toUpperCase(),
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000) + 30,
    });

    auth.value = `${mfaCode} `;
  };

  action();
})();
