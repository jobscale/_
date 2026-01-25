// ==UserScript==
// @name         Navy Quest
// @namespace    http://tampermonkey.net/
// @version      2025-08-25
// @description  try to take over the world!
// @author       You
// @match        https://navy.quest/*
// @match        http://127.0.0.1:3000/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=navy.quest
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

  const formatTimestamp = (ts = new Date()) => new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris', // CET/CEST
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(ts);

  const opts = {
    setup: [{}, {
      fn: ctx => {
        ctx.strokeStyle = 'black';
        ctx.setLineDash([]);
      },
    }, {}, {
      fn: ctx => {
        ctx.strokeStyle = 'white';
        ctx.setLineDash([]);
      },
    }],
    current: 0,
  };

  const app = {
    createTime() {
      const style = document.createElement('style');
      style.innerText = `
  .time {
    position: fixed;
    right: 1em;
    bottom: 1em;
    padding: 0.3em;
    z-index: 1000001;
    font-family: Tahoma;
    font-size: 2.2rem;
    pointer-events: none;
  }
  .outlined-text {
    color: white;
    font-weight: bold;
    -webkit-text-stroke: 1px black;
    text-shadow:
      0 0 2px black,
      1px 1px 2px black,
    -1px 1px 2px black,
      1px -1px 2px black,
    -1px -1px 2px black;
  }
  #custom-canvas {
    position: fixed;
    top: 0;
    left: 0;
    background-color: transparent;
    pointer-events: none;
    z-index: 1000000;
  }
  `;
      document.head.append(style);
      const div = document.createElement('div');
      div.classList.add('time');
      div.classList.add('outlined-text');
      document.body.append(div);

      const loop = () => {
        [, div.textContent] = formatTimestamp().split(' ');
        setTimeout(loop, 1000 - Date.now() % 1000);
      };
      loop();
    },

    resizeCanvas(canvas) {
      if (app.timeout) clearTimeout(app.timeout);
      app.timeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        app.drawCanvas(canvas);
      }, 1000);
    },

    drawCanvas(canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { fn } = opts.setup[opts.current];
      if (!fn) return;

      const radius = 70;
      const gridRadius = { x: 80, y: 85 };
      const spacing = gridRadius.x - radius;

      // drawHexagon
      const verticalStep = gridRadius.y * 1.5; // step Y
      const horizontalStep = gridRadius.x * Math.sqrt(3) - spacing; // step X

      const drawHexagon = ({ cx, cy, row, col }) => {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.shadowColor = 'transparent';
        fn(ctx);
        if (row % 7 === 4 && col % 2 || col % 14 === 1) {
          ctx.shadowColor = 'red';
          ctx.shadowBlur = 5;
        }
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i; // flat-topped
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle) * 0.8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      };

      const hexQueue = [];

      const begin = { x: -28, y: 12 };
      for (let row = 0; row < canvas.height / verticalStep + 2; row++) {
        for (let col = 0; col < canvas.width / horizontalStep + 2; col++) {
          const offsetY = col % 2 === 0 ? 0 : verticalStep / 2;
          const cx = col * horizontalStep + begin.x;
          const cy = row * verticalStep + offsetY + begin.y;
          hexQueue.push({ cx, cy, row, col });
        }
      }

      const drawNext = () => {
        for (let i = 10; i; i--) {
          if (!hexQueue.length) return;
          drawHexagon(hexQueue.shift());
        }
        requestAnimationFrame(drawNext);
      };

      requestAnimationFrame(drawNext);
    },

    createCanvas() {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.id = 'custom-canvas';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.append(canvas);

      window.addEventListener('resize', () => app.resizeCanvas(canvas));
      document.addEventListener('keydown', event => app.keydown(event));
    },

    postSlack(body, opt = { amount: 2 }) {
      const url = 'https://www.jsx.jp/api/slack';
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      };
      return fetch(url, options).catch(e => {
        logger.warn(e.cause, e.message);
        if (!opt.amount) throw e;
        opt.amount--;
        return new Promise(resolve => { setTimeout(resolve, 16000); })
        .then(() => app.postSlack(body, opt));
      });
    },

    async onlineUsers(interval = 10) {
      const area = document.querySelector('table.allyprofil');
      if (!area) return;
      const table = {
        name: [...area.querySelectorAll('td:nth-child(2)')],
        mail: [...area.querySelectorAll('td:nth-child(1)')],
        point: [...area.querySelectorAll('td:nth-child(3)')],
        online: [...area.querySelectorAll('td:nth-child(6)')],
      };

      const data = table.name.map((_, i) => {
        const item = {
          name: table.name[i].textContent.trim(),
          mail: table.mail[i].querySelector('a'),
          point: Math.floor(Number.parseInt(table.point[i].textContent.trim().replace(/[.]/g, ''), 10) / 10000),
          online: table.online[i].textContent.trim(),
        };
        return item;
      }).slice(1).filter(item => item.mail);

      const users = data.filter(item => {
        if (item.point < 2) return false;
        if (item.online === 'On') return true;
        if (item.online.match('h')) return false;
        const num = Number.parseInt(item.online.match(/>(\d+)min/)?.[1], 10);
        if (num < interval) return true;
        return false;
      });
      const names = users.map(item => item.name).join(' ');
      const saveNames = await customStorage.getItem('names');
      if (saveNames !== names) {
        await customStorage.setItem('names', names);
      }
      const before = saveNames?.split(' ').length ?? 0;
      const after = names.split(' ').length;
      if (before < after) {
        const online = users.map(item => {
          const text = `${item.name.padStart(15)} ${item.point.toString().padStart(8)} ${item.online.padStart(8)}`;
          return text;
        });
        const block = {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: ['```', ...online, '```'].join('\n') },
          ],
        };
        const text = users.map(item => `${item.name} (${item.point})`).join(' \n');
        app.postSlack({
          channel: '#quest',
          icon_emoji: ':video_game:',
          username: 'Navy Quest',
          text,
          blocks: [block],
        }).catch(e => logger.warn(e.message));
      }
    },

    async battleReport() {
      if (location.protocol !== 'https:') {
        logger.warn('Insecure protocol, skip battle report');
        return false;
      }
      const name = 'BLACKD';
      const url = new RegExp(`https://navy.quest/gold\\?b=3&o3=[0-9a-f]+${name}`);
      if (!location.href.match(url)) return false;
      const report = [...document.querySelectorAll('table table tr:nth-child(1) td')].map(el => el.textContent).join('\n');
      if (!report) return false;
      const known = await customStorage.getItem('report');
      if (known !== report) {
        await customStorage.setItem('report', report);
        app.postSlack({
          channel: '#push',
          icon_emoji: ':video_game:',
          username: 'Navy Quest',
          text: ['```', report, '```'].join('\n'),
        }).catch(e => logger.warn(e.message));
      }
      return true;
    },

    async refactor() {
      const ally = document.querySelector('table td:nth-child(2) table');
      if (!ally) return;
      const cells = [...ally.querySelectorAll('tr td')];
      const begin = cells.findIndex(v => v.textContent.includes('Co-Leader'));
      if (begin < 0) return;
      cells.splice(0, begin + 1);
      const end = cells.findIndex(v => v.textContent === '');
      if (end < 0) return;
      cells.splice(end);
      const coLeaders = cells.filter(v => v.textContent !== 'On' && !v.textContent.includes('>'));
      const names = coLeaders.map(v => v.textContent);
      const member = document.querySelector('table table');
      const user = [...member.querySelectorAll('tr td')];
      let match = 0;
      user.forEach(v => {
        if (names.includes(v.textContent)) match = 6;
        if (!match) return;
        match--;
        v.style.backgroundColor = '#500';
      });
    },

    async watchOnline() {
      if (location.protocol !== 'https:') {
        logger.warn('Insecure protocol, skip battle report');
        return;
      }
      if (!location.href.includes('ally')) return;
      app.refactor();
      const url = 'https://navy.quest/ally.php?b=39';
      if (location.href !== url) return;
      const NEXT_TICK = 6; // interval 6 minutes
      app.refreshTime = new Date();
      app.refreshTime.setMinutes(app.refreshTime.getMinutes() + NEXT_TICK);
      logger.info(formatTimestamp(), JSON.stringify({
        refreshTime: formatTimestamp(app.refreshTime),
      }, null, 2));
      await app.onlineUsers(NEXT_TICK);
      setInterval(() => {
        if (app.refreshTime < new Date()) {
          location.reload();
        }
        logger.info(formatTimestamp(), JSON.stringify({
          refreshTime: formatTimestamp(app.refreshTime),
          left: `${Math.round((app.refreshTime.getTime() - Date.now()) / 600) / 100}m`,
        }, null, 2));
      }, 60_000);
    },

    isTypingContext(target) {
      const { tagName, type, isContentEditable } = target;
      const tag = tagName.toLowerCase();
      return isContentEditable || tag === 'textarea'
      || tag === 'input' && !['button', 'submit'].includes(type);
    },

    keydown(event) {
      if (app.isTypingContext(event.target)) return;
      const key = event.key?.toLowerCase();
      if (!['u', 'i', 'o'].includes(key)) return;

      if (opts.busy) return;
      opts.busy = true;
      setTimeout(() => { delete opts.busy; }, 500);

      if (key === 'i') opts.current = opts.current === 1 ? 0 : 1;
      if (key === 'u') opts.current = opts.current === 3 ? 0 : 3;
      if (key === 'o') opts.current = (opts.current + 1) % opts.setup.length;

      const canvas = document.querySelector('#custom-canvas');
      if (canvas) app.drawCanvas(canvas);
    },

    main() {
      setTimeout(() => app.createTime(), 1300);
      setTimeout(() => app.createCanvas(), 2200);
      setTimeout(() => app.watchOnline(), 3400);
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
      provider.id = setTimeout(provider.action, 3_200);
      provider.observer = new MutationObserver(provider.handler);
      provider.observer.observe(document.body, { childList: true, subtree: true });
    },
  };

  provider.start();
})();
