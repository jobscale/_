// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      2026-01-20
// @description  try to take over the world!
// @author       jobscale
// @match        https://tver.jp/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tver.jp
// @grant        none
// ==/UserScript==

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

const css = `
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
`;

class Tver {
  changeStyle() {
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.append(style);
    const el1 = document.querySelector('[class^="mypage-page-main_tabList"]');
    if (el1) el1.style.visibility = 'hidden';
    const el2 = document.querySelector('div[class^="companion-ad-slot"]');
    if (el2) el2.style.visibility = 'hidden';
    const episodeAd = document.querySelector('[class^="Episode_companionAd"]');
    if (episodeAd) episodeAd.remove();
  }

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
  }

  setMenu2(areaMenu) {
    const el = document.createElement('button');
    el.classList.add('btn-button');
    el.textContent = '既読を非表示';
    el.addEventListener('click', async event => {
      event.preventDefault();
      const list = await this.fetchData();
      [...document.querySelectorAll('[class*="FavoriteListCarousel_item"]')]
      .filter(content => {
        if (content.textContent.match(/年放送/)) return true;
        const exist = list.find(data => data.href === content.querySelector('a').href);
        if (exist) return true;
        this.setEvent(content.querySelector('a'), content);
        return false;
      })
      .forEach(content => content.remove());
      [...document.querySelectorAll('[class^="FavoriteList_container"] > a')]
      .filter(content => {
        if (content.textContent.match(/年放送/)) return true;
        const exist = list.find(data => data.href === content.href);
        if (exist) return true;
        this.setEvent(content);
        return false;
      })
      .forEach(content => content.remove());
    });
    areaMenu.append(el);
  }

  setContentEvent() {
    const areaMenu = document.querySelector('[class*="MyPage_list"]');
    if (!areaMenu) return;
    this.setMenu1(areaMenu);
    this.setMenu2(areaMenu);
  }

  setVideo () {
    let idVideo;
    const who = document.querySelector('video');
    if (!who) {
      idVideo = setTimeout(() => this.setVideo(), 1000);
      return;
    }
    clearTimeout(idVideo);
    document.body.style = 'margin-top: 100vh';
    document.querySelector('div[class^="Episode_companionAd"] div')?.remove();
    const player = document.querySelector('div[class^="player_aspectRatioWrapper"]')
    || document.querySelector('div[class^="PlayerLayout_jail"]');
    player.style = 'position: fixed; width: 100vw; height: auto; left: 0; top: 0; z-index: 99999;';
  }

  setClick() {
    let idClick;
    const who = document.querySelector('[class^="Footer_copyright"]');
    if (!who) {
      logger.info('Footer_copyright not found');
      idClick = setTimeout(() => this.setClick(), 500);
      return;
    }
    clearTimeout(idClick);
    document.body.append(who);
    who.style = 'position:fixed;left:0;bottom:0;cursor:pointer;';
    who.onclick = () => setTimeout(() => this.setVideo(), 500);
  }

  async fetchData() {
    return JSON.parse(await customStorage.getItem('a-list') || '[]');
  }

  async appendData(data) {
    const list = await this.fetchData();
    list.unshift(data);
    const active = list.filter(item => {
      const ts = new Date();
      ts.setDate(ts.getDate() - 360);
      return new Date(item.ts) > ts;
    });
    customStorage.setItem('a-list', JSON.stringify(active));
  }

  setEvent(content, wrap) {
    const el = document.createElement('div');
    el.classList.add('btn-close');
    el.textContent = '🍺';
    el.addEventListener('click', async event => {
      event.preventDefault();
      const data = {
        href: content.href,
        ts: new Date().toISOString(),
      };
      await this.appendData(data);
      (wrap || content).remove();
    });
    content.append(el);
  }

  main() {
    setTimeout(() => this.changeStyle(), 500);
    setTimeout(() => this.setClick(), 1000);
    setTimeout(() => this.changeStyle(), 1500);
    setTimeout(() => this.setContentEvent(), 2000);
  }
}

setTimeout(() => new Tver().main(), 2200);
