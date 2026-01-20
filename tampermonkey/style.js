// ==UserScript==
// @name         Custom Style
// @namespace    http://tampermonkey.net/
// @version      2026-01-19
// @description  try to take over the world!
// @author       jobscale
// @match        *://*/*
// @exclude      https://navy.quest/*
// @exclude      https://www.amazon.co.jp/*
// @exclude      https://*.amazonaws.com/*
// @exclude      https://mail.google.com/mail/*
// @exclude      https://outlook.office.com/mail/*
// @exclude      https://jsx.jp/*
// @exclude      https://*.jsx.jp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yumyumcolor.com
// @grant        none
// ==/UserScript==

const logger = console;

const customStorage = {
  enc: new TextEncoder(),
  dec: new TextDecoder(),
  DATABASE: 'SecureDB',
  TABLE: 'SecureStore',
  PASSWORD: location.hostname,

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
    const db = await customStorage.init();
    if (typeof value === 'string') {
      value = { 'Content-Type: text/plain': value };
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
        if ('Content-Type: text/plain' in parsed) {
          resolve(parsed['Content-Type: text/plain']);
          return;
        }
        resolve(parsed);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async removeItem(key) {
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
    style.innerHTML = this[`css${no}`];
    style.id = `custom-css-${no}`;
    document.head.append(style);
    const customCss = JSON.parse(await customStorage.getItem('custom-css') ?? '[]');
    customCss.push(no);
    await customStorage.setItem('custom-css', JSON.stringify(customCss));
    elm.textContent = `*${elm.textContent}*`;
  },

  async toggle(no) {
    const elm = document.querySelector(`.btn-custom-css-${no}`);
    const exist = document.querySelector(`#custom-css-${no}`);
    const customCss = JSON.parse(await customStorage.getItem('custom-css') ?? '[]');
    if (customCss.includes(no)) {
      if (exist) exist.remove();
      await customStorage.setItem('custom-css', JSON.stringify(customCss.filter(v => v !== no)));
      elm.textContent = `_type ${no}_`;
    } else if (!exist) {
      await this.add(no);
    }
  },

  async update(no, force) {
    if (force) {
      await this.add(no);
      return;
    }
    await this.toggle(no);
  },

  btnSetting() {
    const style = document.createElement('style');
    style.innerText = this.style;
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
        this.update(no, undefined);
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

  getEffectiveBackgroundColor(el) {
    while (el) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
      el = el.parentElement;
    }
    return undefined;
  },

  async mounted() {
    const ts = Date.now();
    const conf = JSON.parse(await customStorage.getItem('custom-css-conf') ?? '{}');
    await customStorage.setItem('custom-css-conf', JSON.stringify({ expired: ts + 1000 }));
    if (conf.expired && conf.expired > ts) return;

    const div = this.btnSetting();
    const customCss = JSON.parse(await customStorage.getItem('custom-css') ?? '[]');
    for (const no of [1, 2, 3]) {
      if (customCss.includes(no)) await this.update(no, true);
    }

    this.btnScheme(div);
    this.btnHide(div);
    this.btnVideo(div);
  },

  getBackgroundColorBrightness(selector) {
    const el = document.querySelector(selector);
    if (!el) return undefined;

    const bg = this.getEffectiveBackgroundColor(el);
    if (!bg) return undefined;

    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return undefined;

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);

    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    const isBright = brightness > 100;

    return {
      r, g, b, brightness, isBright, isDark: !isBright,
    };
  },

  textColor() {
    const textColor = getComputedStyle(document.body).color;
    logger.info(`text color: ${textColor}`);
    const match = textColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return undefined;
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);

    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    return brightness > 100;
  },

  main() {
    if (this.init) return;
    this.init = true;
    document.documentElement.style.backgroundColor = '';

    const video = document.querySelector('video');

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    logger.info(`desktop prefers-color-scheme: ${prefersDark ? 'dark' : 'light'}`);

    if (!video) {
      const scheme = getComputedStyle(document.documentElement).colorScheme;
      if (scheme.match(/dark/i)) {
        logger.info(`color-scheme: ${scheme} supported`);
        return;
      }
      if (document.querySelector('meta[name="color-scheme"]')) {
        logger.info('meta color-scheme supported');
        return;
      }
      const result = this.getBackgroundColorBrightness('div')
        || this.getBackgroundColorBrightness('div:nth-child(2)')
        || this.getBackgroundColorBrightness('body')
        || this.getBackgroundColorBrightness('html');
      if (result?.isDark) {
        logger.info('This is Dark by background color');
        return;
      }
      if (this.textColor()) {
        logger.info('This is Dark by text color');
        return;
      }
    }

    setTimeout(() => this.mounted(), 0);
  },
};

window.addEventListener('load', () => {
  document.documentElement.style.backgroundColor = 'black';
  setTimeout(() => app.main(), 200);
});
