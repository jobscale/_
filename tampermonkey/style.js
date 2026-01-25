// ==UserScript==
// @name         Custom Style
// @namespace    http://tampermonkey.net/
// @version      2026-01-26
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
        return undefined;
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
    css1: `/* Custom Scheme */
:root { color-scheme: light dark; }
`,

    css2: `/* Custom Scheme */
:root { filter: invert(1); }
html { height: 100vh; background-color: #ddd }
`,

    css3: `/* Custom Scheme */
video, img { filter: invert(1); }
`,

    style: `/* Button Area */
div.b-area {
  position: fixed;
  right: 2em;
  bottom: 5em;
  z-index: 1000001;
}`,

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
        elm.textContent = `_type ${no}_`;
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
      div.classList.add('b-area');

      const createButton = no => {
        const elm = document.createElement('button');
        elm.type = 'button';
        elm.textContent = `type ${no}`;
        elm.classList.add(`btn-custom-css-${no}`);
        elm.addEventListener('click', event => {
          event.preventDefault();
          app.update(no, undefined);
        });
        div.append(elm);
      };
      [1, 2, 3].forEach(no => createButton(no));

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
      el.textContent = 'scheme';
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
        const video = document.querySelector('.player-block')
          || document.querySelector('#video-player-bg');
        if (!video) return;
        const custom = [
          'position: fixed', 'top: 0', 'right: 0', 'bottom: 0', 'left: 0',
        ];
        custom.forEach(elm => {
          const [key, value] = elm.split(': ');
          video.style[key] = value;
        });
        const headers = [
          document.body,
          ...document.querySelectorAll('.main-header'),
        ];
        headers.forEach(elm => {
          if (!elm) return;
          elm.style['margin-top'] = '100vh';
        });
      });
      div.append(el);
    },

    async mounted() {
      const ts = Date.now();
      const storeConf = await customStorage.getItem('custom-css-conf');
      const conf = storeConf ?? {};
      await customStorage.setItem('custom-css-conf', { expired: ts + 1000 });
      if (conf.expired && conf.expired > ts) return;

      const div = app.btnSetting();
      const list = await customStorage.getItem('custom-css');
      const customCss = list ?? [];
      for (const no of [1, 2, 3]) {
        if (customCss.includes(no)) await app.update(no, true);
      }

      app.btnScheme(div);
      app.btnHide(div);
      app.btnVideo(div);
    },

    computedColor(el) {
      const bgColor = getComputedStyle(el).backgroundColor;
      const bgMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const textColor = getComputedStyle(el).color;
      const textMatch = textColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!bgMatch || !textMatch) return [];
      return {
        bg: [
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
      const scheme = getComputedStyle(document.documentElement).colorScheme;
      if (scheme.match(/dark/i)) {
        logger.info(`color-scheme: ${scheme} supported`);
        return true;
      }
      if (document.querySelector('meta[name="color-scheme"]')) {
        logger.info('meta color-scheme supported');
        return true;
      }
      const checkList = [
        'body', 'body > div', 'form', 'table', 'header', 'footer',
        'section', 'main', 'article', 'nav', 'aside',
      ].flatMap(
        query => [...document.querySelectorAll(query)]
        .map(el => app.computedColor(el)),
      );
      const average = arr => {
        if (arr.length === 0) return 0;
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      };
      const dark = checkList.filter(v => average(v.bg) < 128).length;
      const light = checkList.filter(v => average(v.bg) >= 128).length;
      logger.info(`Background Color - dark: ${dark}, light: ${light}`);
      if (!light) {
        logger.info('This is Dark by majority background color');
        return true;
      }
      const textDark = checkList.filter(v => average(v.text) > 128).length;
      const textLight = checkList.filter(v => average(v.text) <= 128).length;
      logger.info(`Text Color - dark: ${textDark}, light: ${textLight}`);
      if (!textLight) {
        logger.info('This is Dark by majority text color');
        return true;
      }
      return false;
    },

    main() {
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
