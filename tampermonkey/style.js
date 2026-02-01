// ==UserScript==
// @name         Custom Style
// @namespace    http://tampermonkey.net/
// @version      2026-01-29
// @description  try to take over the world!
// @author       jobscale
// @match        *://*/*
// @exclude      https://navy.quest/*
// @exclude      https://www.amazon.co.jp/*
// @exclude      https://*.amazonaws.com/*
// @exclude      https://mail.google.com/mail/*
// @exclude      https://outlook.office.com/mail/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yumyumcolor.com
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
    cssList: [
      'Dark', 'Invert', 'Image', 'Deep', 'Simple',
    ],

    cssDark: `/* Custom Scheme */
:root { color-scheme: light dark !important; }
`,

    cssInvert: `/* Custom Scheme */
:root { filter: invert(1); }
html { height: 100vh; background-color: #ddd; }
`,

    cssImage: `/* Custom Scheme */
video, img { filter: invert(1); }
`,

    cssDeep: `/* Custom Scheme */
:root {
  color-scheme: light dark !important;
  background-color: black !important;
}
html, body {
  margin: 0; height: 100vh; background-color: black !important;
}
* {
  background-image: initial !important;
  background-color: black !important;
  color: #888;
}
`,

    cssSimple: `/* Custom Scheme */
:root {
  color-scheme: light dark !important;
  background-color: black !important;
}
html, body {
  margin: 0; height: 100vh; background-color: black !important;
}
* {
  background-image: initial !important;
}
body > *, main, main > * {
  background-color: black !important;
  color: #888;
}
`,

    style: `/* Button Area */
.custom-style-area {
  position: fixed;
  display: flex;
  padding: 2px;
  right: 1em;
  bottom: 1em;
  border-radius: 0.5em;
  z-index: 1000001;

  button {
    border-radius: 10em;
    cursor: pointer;
    border: none;
    margin: 2px;
    padding: 2px 4px;

    background: radial-gradient(
        circle at 30% 30%,
        rgba(255, 255, 255, 0.45),
        rgba(255, 255, 255, 0.15) 40%,
        rgba(255, 255, 255, 0.05) 70%,
        rgba(255, 255, 255, 0.0) 100%
      ),
      rgba(255, 255, 255, 0.12);

    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);

    box-shadow:
      0 12px 25px rgba(0, 0, 0, 0.35),
      0 -2px 6px rgba(255, 255, 255, 0.35) inset,
      0 4px 10px rgba(0, 0, 0, 0.35) inset;

    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.03em;

    transition:
      transform 0.15s ease,
      box-shadow 0.25s ease,
      background 0.25s ease;
  }

  button:hover {
    background: radial-gradient(
        circle at 30% 30%,
        rgba(255, 255, 255, 0.55),
        rgba(255, 255, 255, 0.2) 40%,
        rgba(255, 255, 255, 0.08) 70%,
        rgba(255, 255, 255, 0.0) 100%
      ),
      rgba(255, 255, 255, 0.22);

    box-shadow:
      0 16px 30px rgba(0, 0, 0, 0.45),
      0 -3px 7px rgba(255, 255, 255, 0.45) inset,
      0 5px 12px rgba(0, 0, 0, 0.45) inset;

    transform: translateY(-1px);
  }

  button:active {
    transform: translateY(1px) scale(0.97);

    box-shadow:
      0 8px 18px rgba(0, 0, 0, 0.4),
      0 -1px 4px rgba(255, 255, 255, 0.3) inset,
      0 3px 8px rgba(0, 0, 0, 0.4) inset;
  }
}
`,

    async add(no) {
      const elm = document.querySelector(`.btn-custom-css-${no}`);
      const style = document.createElement('style');
      style.textContent = app[`css${no}`];
      style.id = `custom-css-${no}`;
      document.head.append(style);
      const list = await customStorage.getItem('custom-css');
      const customCss = list ?? [];
      customCss.push(no);
      await customStorage.setItem('custom-css', customCss);
      elm.textContent = `*${elm.textContent}*`;
    },

    async toggle(no) {
      const elm = document.querySelector(`.btn-custom-css-${no}`);
      const exist = document.querySelector(`#custom-css-${no}`);
      const list = await customStorage.getItem('custom-css');
      const customCss = list ?? [];
      if (customCss.includes(no)) {
        if (exist) exist.remove();
        await customStorage.setItem('custom-css', customCss.filter(v => v !== no));
        elm.textContent = no;
      } else if (!exist) {
        await app.add(no);
      }
    },

    async update(no, force) {
      if (force) {
        await app.add(no);
        return;
      }
      await app.toggle(no);
    },

    btnSetting() {
      const style = document.createElement('style');
      style.textContent = app.style;
      document.head.append(style);

      const div = document.createElement('div');
      div.classList.add('custom-style-area');

      const createButton = no => {
        const elm = document.createElement('button');
        elm.type = 'button';
        elm.textContent = `${no}`;
        elm.classList.add(`btn-custom-css-${no}`);
        elm.addEventListener('click', event => {
          event.preventDefault();
          app.update(no, undefined);
        });
        div.append(elm);
      };
      app.cssList.forEach(no => createButton(no));

      document.body.append(div);

      return div;
    },

    btnHide(div) {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = 'hide';
      el.addEventListener('click', event => {
        event.preventDefault();
        div.remove();
      });
      div.prepend(el);
    },

    btnScheme(div) {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = 'meta';
      el.addEventListener('click', event => {
        event.preventDefault();
        const id = 'custom-scheme';
        const scheme = document.querySelector(`#${id}`);
        if (scheme) {
          scheme.remove();
          return;
        }
        const meta = document.createElement('meta');
        meta.id = id;
        meta.name = 'color-scheme';
        meta.content = 'light dark';
        document.head.prepend(meta);
      });
      div.prepend(el);
    },

    btnVideo(div) {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = 'video';
      el.addEventListener('click', event => {
        event.preventDefault();
        const video = document.querySelector('#video-player-bg')
          || document.querySelector('div:has(> video-js)')
          || document.querySelector('div:has(> * > video)')
          || document.querySelector('video').closest('div');
        if (!video) return;
        const custom = [
          'top: 0', 'right: 0', 'bottom: 0', 'left: 0',
          'width: 100vw', 'max-width: 100vw', 'height: 100vh', 'max-height: 100vh',
        ];
        ['position: fixed', ...custom].forEach(elm => {
          const [key, value] = elm.split(': ');
          video.style[key] = value;
        });
        const headers = [
          document.body,
          ...document.querySelectorAll('.main-header'),
        ];
        headers.forEach(elm => {
          if (!elm) return;
          elm.style.marginTop = '100vh';
        });
      });
      div.append(el);
    },

    async mounted() {
      const div = app.btnSetting();
      const list = await customStorage.getItem('custom-css');
      const customCss = list ?? [];
      for (const no of app.cssList) {
        if (customCss.includes(no)) await app.update(no, true);
      }

      app.btnScheme(div);
      app.btnHide(div);
      app.btnVideo(div);
    },

    computedColor(el) {
      const { backgroundColor, color } = getComputedStyle(el);
      const bgMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const textMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!bgMatch || !textMatch) return {};
      return {
        bg: ['rgba(0, 0, 0, 0)', 'transparent'].includes(backgroundColor)
        ? undefined : [
          parseInt(bgMatch[1], 10),
          parseInt(bgMatch[2], 10),
          parseInt(bgMatch[3], 10),
        ], text: [
          parseInt(textMatch[1], 10),
          parseInt(textMatch[2], 10),
          parseInt(textMatch[3], 10),
        ],
      };
    },

    judgeDarkMode() {
      const { colorScheme } = getComputedStyle(document.documentElement);
      if (colorScheme.match(/dark/i)) {
        logger.info(`color-scheme: ${colorScheme} supported`);
        return true;
      }
      if (document.querySelector('meta[name="color-scheme"]')) {
        logger.info('meta color-scheme supported');
        return true;
      }
      const checkList = [
        'body', 'body > div', 'form', 'table', 'header', 'footer',
        'section', 'main', 'article', 'nav', 'aside',
        'select', 'input', 'textarea', 'button',
      ].flatMap(
        query => [...document.querySelectorAll(query)]
        .map(el => app.computedColor(el)),
      );
      const average = arr => {
        if (arr.length === 0) return 0;
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      };
      const bgList = checkList.filter(v => v.bg).map(v => v.bg);
      const dark = bgList.filter(v => average(v) < 64).length;
      const light = bgList.filter(v => average(v) >= 64).length;
      logger.info(`Background Color - dark: ${dark}, light: ${light}`);
      if (!light) {
        logger.info('This is Dark by majority background color');
        return true;
      }
      const textList = checkList.filter(v => v.text).map(v => v.text);
      const textDark = textList.filter(v => average(v) > 64).length;
      const textLight = textList.filter(v => average(v) <= 64).length;
      logger.info(`Text Color - dark: ${textDark}, light: ${textLight}`);
      if (!textLight) {
        logger.info('This is Dark by majority text color');
        return true;
      }
      return false;
    },

    main() {
      app.main = () => {
        logger.info({ 'Already running': new Error().stack.split('\n') });
      };
      document.documentElement.style.backgroundColor = '';
      const video = document.querySelector('video');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      logger.info(`desktop prefers-color-scheme: ${prefersDark ? 'dark' : 'light'}`);

      if (!video && app.judgeDarkMode()) {
        return;
      }

      setTimeout(() => app.mounted(), 0);
    },

    init() {
      document.documentElement.style.backgroundColor = '#111';
    },
  };

  const provider = {
    action() {
      provider.observer.disconnect();
      app.main();
    },

    handler() {
      requestAnimationFrame(() => {
        clearTimeout(provider.id);
        provider.id = setTimeout(provider.action, 200);
      });
    },

    start() {
      provider.id = setTimeout(provider.action, 200);
      provider.observer = new MutationObserver(provider.handler);
      provider.observer.observe(document.body, { childList: true, subtree: true });
    },
  };

  provider.start();
  app.init();
})();
