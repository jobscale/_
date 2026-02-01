const customStorage = {
  enc: new TextEncoder(),
  dec: new TextDecoder(),
  DATABASE: 'SecureDB',
  TABLE: 'SecureStore',
  PASSWORD: '<secret>',

  async secretProvider() {
    customStorage.PASSWORD = `2026:${location.hostname.split('.').reverse().join('.')}:custom-storage`;
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

  async deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw', customStorage.enc.encode(password), 'PBKDF2', false, ['deriveKey'],
    );
    return crypto.subtle.deriveKey({
      name: 'PBKDF2', salt, iterations: 10_000, hash: 'SHA-256',
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },

  async encrypt(value) {
    value = new Uint8Array(await customStorage.gzip(JSON.stringify(value)));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    if (customStorage.PASSWORD === '<secret>') await customStorage.secretProvider();
    const key = await customStorage.deriveKey(customStorage.PASSWORD, salt);
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
    if (customStorage.PASSWORD === '<secret>') await customStorage.secretProvider(false);
    const key = await customStorage.deriveKey(customStorage.PASSWORD, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data,
    );
    const value = await customStorage.gunzip(new Uint8Array(decrypted));
    return JSON.parse(customStorage.dec.decode(value));
  },

  async init() {
    if (customStorage.db) return customStorage.db;
    customStorage.db = new Promise((resolve, reject) => {
      const req = indexedDB.open(customStorage.DATABASE, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(customStorage.TABLE)) {
          db.createObjectStore(customStorage.TABLE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return customStorage.db;
  },

  async setItem(key, value) {
    if (location.protocol.endsWith('http:')) {
      localStorage.setItem(key, JSON.stringify(value));
      return undefined;
    }
    const db = await customStorage.init();
    const encrypted = await customStorage.encrypt(value);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(customStorage.TABLE, 'readwrite');
      const store = tx.objectStore(customStorage.TABLE);
      const req = store.put(encrypted, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  async getItem(key) {
    if (location.protocol.endsWith('http:')) {
      const raw = localStorage.getItem(key);
      if (raw === null) return undefined;
      return JSON.parse(raw);
    }
    const decode = encrypted => {
      if (!encrypted) return undefined;
      return customStorage.decrypt(encrypted).catch(() => undefined);
    };
    const db = await customStorage.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(customStorage.TABLE, 'readonly');
      const store = tx.objectStore(customStorage.TABLE);
      const req = store.get(key);
      req.onsuccess = () => resolve(decode(req.result));
      req.onerror = () => reject(req.error);
    });
  },

  async removeItem(key) {
    if (location.protocol.endsWith('http:')) {
      localStorage.removeItem(key);
      return undefined;
    }
    const db = await customStorage.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(customStorage.TABLE, 'readwrite');
      const store = tx.objectStore(customStorage.TABLE);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  async clear() {
    if (location.protocol.endsWith('http:')) {
      localStorage.clear();
      return undefined;
    }
    const db = await customStorage.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(customStorage.TABLE, 'readwrite');
      const store = tx.objectStore(customStorage.TABLE);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },
};
