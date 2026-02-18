// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      2026-02-18
// @description  try to take over the world!
// @author       jobscale
// @match        https://tver.jp/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tver.jp
// @grant        none
// ==/UserScript==

(() => {
  const logger = console;

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
      const data = customStorage.enc.encode(JSON.stringify(value));
      const compressed = new Uint8Array(await customStorage.gzip(data));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      if (customStorage.PASSWORD === '<secret>') await customStorage.secretProvider();
      const key = await customStorage.deriveKey(customStorage.PASSWORD, salt);
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, compressed,
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
      return Promise.resolve().then(async () => {
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
      })
      .catch(() => undefined);
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

  const app = {
    css: `
div[class^="FavoriteList"] > div {
  padding: 0 1em;
  margin: 0 1em;
}
.btn-close {
  position: absolute;
  top: -1em;
  right: -0.5em;
  width: 1.2em;
  height: 1.2em;
  cursor: cell;
}
.btn-button {
  width: 15em;
  cursor: pointer;
  border-radius: 1em;
  margin: auto;
  color: #777;
}
`,

    changeStyle() {
      const style = document.createElement('style');
      style.innerHTML = app.css;
      document.head.append(style);
      const el1 = document.querySelector('[class^="mypage-page-main_tabList"]');
      if (el1) el1.style.visibility = 'hidden';
      const el2 = document.querySelector('div[class^="companion-ad-slot"]');
      if (el2) el2.style.visibility = 'hidden';
      const episodeAd = document.querySelector('[class^="Episode_companionAd"]');
      if (episodeAd) episodeAd.remove();
    },

    setMenu1(areaMenu) {
      const el = document.createElement('button');
      el.classList.add('btn-button');
      el.textContent = 'キャプションを非表示';
      el.addEventListener('click', event => {
        event.preventDefault();
        [...document.querySelectorAll('div[class^="Caption_caption"]')]
        .forEach(content => {
          const parent = content.parentElement;
          [...content.childNodes].reverse().forEach(child => child.remove());
          const { childElementCount } = parent.querySelector('section > ul');
          if (!childElementCount) parent.remove();
        });
      });
      areaMenu.append(el);
    },

    setMenu2(areaMenu) {
      const el = document.createElement('button');
      el.classList.add('btn-button');
      el.textContent = '既読を非表示';
      el.addEventListener('click', async event => {
        event.preventDefault();
        const list = await app.fetchData();
        [...document.querySelectorAll('li:has([href^="/episodes/"])')]
        .filter(wrapper => {
          if (wrapper.textContent.match(/年放送/)) return true;
          const exist = list.find(data => data.href === wrapper.querySelector('a').href);
          if (exist) return true;
          const anchor = wrapper.querySelector('a');
          const content = wrapper.querySelector('a > div');
          app.setEvent(anchor, content, wrapper);
          return false;
        })
        .forEach(content => content.remove());
      });
      areaMenu.append(el);
    },

    setContentEvent() {
      const areaMenu = document.querySelector('[class^="Tabs_list_"]');
      if (!areaMenu) return;
      app.setMenu1(areaMenu);
      app.setMenu2(areaMenu);
    },

    setVideo () {
      let idVideo;
      const who = document.querySelector('video');
      if (!who) {
        idVideo = setTimeout(() => app.setVideo(), 1000);
        return;
      }
      clearTimeout(idVideo);
      document.body.style = 'margin-top: 100vh';
      document.querySelector('div[class^="Episode_companionAd"] div')?.remove();
      const player = document.querySelector('div[class^="player_aspectRatioWrapper"]')
      || document.querySelector('div[class^="PlayerLayout_jail"]');
      player.style = 'position: fixed; width: 100vw; height: auto; left: 0; top: 0; z-index: 99999;';
    },

    setClick() {
      let idClick;
      const who = document.querySelector('[class^="Footer_copyright"]');
      if (!who) {
        logger.info('Footer_copyright not found');
        idClick = setTimeout(() => app.setClick(), 500);
        return;
      }
      clearTimeout(idClick);
      document.body.append(who);
      who.style = 'position:fixed;left:0;bottom:0;cursor:pointer;';
      who.onclick = () => setTimeout(() => app.setVideo(), 500);
    },

    async fetchData() {
      return JSON.parse(await customStorage.getItem('a-list') || '[]');
    },

    async appendData(data) {
      const list = await app.fetchData();
      list.unshift(data);
      const active = list.filter(item => {
        const ts = new Date();
        ts.setDate(ts.getDate() - 360);
        return new Date(item.ts) > ts;
      });
      customStorage.setItem('a-list', JSON.stringify(active));
    },

    setEvent(anchor, content, wrapper) {
      const el = document.createElement('div');
      el.classList.add('btn-close');
      el.textContent = '🍺';
      el.addEventListener('click', async event => {
        event.preventDefault();
        const data = {
          href: anchor.href,
          ts: new Date().toISOString(),
        };
        await app.appendData(data);
        wrapper.remove();
      });
      content.append(el);
    },

    main() {
      setTimeout(() => app.setClick(), 500);
      setTimeout(() => app.setContentEvent(), 1000);
      setTimeout(() => app.changeStyle(), 1500);
    },
  };

  const provider = {
    action() {
      if (provider.once) return;
      provider.once = true;
      provider.observer.disconnect();
      app.main();
    },

    handler() {
      if (provider.expired < Date.now()) return;
      requestAnimationFrame(() => {
        clearTimeout(provider.id);
        provider.id = setTimeout(provider.action, 2_200);
      });
    },

    start() {
      provider.expired = Date.now() + 7_000;
      provider.id = setTimeout(provider.action, 3_200);
      provider.observer = new MutationObserver(provider.handler);
      provider.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    },
  };

  provider.start();
})();
