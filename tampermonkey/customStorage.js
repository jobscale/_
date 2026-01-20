const customStorage = {
  enc: new TextEncoder(),
  dec: new TextDecoder(),
  DATABASE: 'SecureDB',
  TABLE: 'SecureStore',
  PASSWORD: `2026:${location.hostname.split('.').reverse().join('.')}:custom-storage`,

  async init() {
    if (customStorage.db) return customStorage.db;
    customStorage.db = await new Promise((resolve, reject) => {
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

  async deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw', customStorage.enc.encode(password), 'PBKDF2', false, ['deriveKey'],
    );

    return crypto.subtle.deriveKey({
      name: 'PBKDF2', salt, iterations: 10_000, hash: 'SHA-256',
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },

  async encrypt(text) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await customStorage.deriveKey(customStorage.PASSWORD, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, customStorage.enc.encode(text),
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
    const key = await customStorage.deriveKey(customStorage.PASSWORD, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data,
    );
    return customStorage.dec.decode(decrypted);
  },

  async setItem(key, value) {
    if (location.protocol.endsWith('http:')) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }
    const db = await customStorage.init();
    if (typeof value !== 'object') {
      value = { 'string|number|boolean|other': value };
    }
    value = JSON.stringify(value);
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
    const db = await customStorage.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(customStorage.TABLE, 'readonly');
      const store = tx.objectStore(customStorage.TABLE);
      const req = store.get(key);
      req.onsuccess = async () => {
        if (!req.result) { resolve(undefined); return; }
        const decrypted = await customStorage.decrypt(req.result).catch(() => undefined);
        if (decrypted === undefined) { resolve(undefined); return; }
        const parsed = JSON.parse(decrypted);
        if ('string|number|boolean|other' in parsed) {
          resolve(parsed['string|number|boolean|other']);
          return;
        }
        resolve(parsed);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async removeItem(key) {
    if (location.protocol.endsWith('http:')) {
      localStorage.removeItem(key);
      return;
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
      return;
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
