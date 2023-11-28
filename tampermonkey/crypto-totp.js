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
    if (typeof Uint8Array === 'undefined') {
      return Buffer.from(chunks.map(chunk => parseInt(chunk, 2)));
    }
    return new Uint8Array(chunks.map(chunk => parseInt(chunk, 2)));
  }

  convertToBuffer(who, encoding) {
    if (encoding === 'base32') return this.decodeBase32(who);
    return ArrayBuffer.from(who, encoding);
  }

  async createHmacKey(secret, buf, algorithm = 'HMAC') {
    const key = await window.crypto.subtle.importKey(
      'raw',
      secret,
      { name: algorithm, hash: { name: 'SHA-1' } },
      false,
      ['sign', 'verify'],
    );
    return window.crypto.subtle.sign(algorithm, key, buf);
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

window.TOTP = TOTP;
