const sharedStorage = {
  enc: new TextEncoder(),
  dec: new TextDecoder(),
  PASSWORD: '<user-account-secret>',

  async deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw', sharedStorage.enc.encode(password), 'PBKDF2', false, ['deriveKey'],
    );

    return crypto.subtle.deriveKey({
      name: 'PBKDF2', salt, iterations: 10_000, hash: 'SHA-256',
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },

  async encrypt(buffer) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await sharedStorage.deriveKey(sharedStorage.PASSWORD, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, buffer,
    );
    return {
      salt: Array.from(salt),
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    };
  },

  async decrypt(obj) {
    const salt = new Uint8Array(obj.salt);
    const iv = new Uint8Array(obj.iv);
    const data = new Uint8Array(obj.data);
    const key = await sharedStorage.deriveKey(sharedStorage.PASSWORD, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data,
    );
    return decrypted;
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

  async setItem(key, value) {
    if (typeof value === 'string') {
      value = { 'Content-Type: text/plain': value };
    }
    value = JSON.stringify(value);
    const compressed = await sharedStorage.gzip(sharedStorage.enc.encode(value));
    const encrypted = await sharedStorage.encrypt(compressed);
    GM_setValue(key, encrypted);
  },

  async getItem(key) {
    const encrypted = GM_getValue(key);
    if (!encrypted) return undefined;
    const decrypted = await sharedStorage.decrypt(encrypted).catch(() => undefined);
    if (!decrypted) return undefined;
    const textBuffer = await sharedStorage.gunzip(decrypted).catch(() => undefined);
    if (!textBuffer) return undefined;
    const text = sharedStorage.dec.decode(textBuffer);
    const parsed = JSON.parse(text);
    if (parsed?.['Content-Type: text/plain']) {
      return parsed['Content-Type: text/plain'];
    }
    return parsed;
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
