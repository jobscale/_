// ==UserScript==
// @name         Custom Style
// @namespace    http://tampermonkey.net/
// @version      2025-07-22
// @description  try to take over the world!
// @author       jobscale
// @match        *://*/*
// @exclude      https://navy.quest/*
// @exclude      https://www.amazon.co.jp/*
// @exclude      https://*.amazonaws.com/*
// @exclude      https://mail.google.com/mail/*
// @exclude      https://*.jsx.jp/*
// @exclude      http://*.*.*.*:*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yumyumcolor.com
// @grant        none
// ==/UserScript==

const logger = console;

const app = {
  css1: `/* Custom Scheme */
@media (prefers-color-scheme: dark) {
  :root { color-scheme: dark; }
}
@media (prefers-color-scheme: light) {
  :root { color-scheme: light; }
}
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

  add(no) {
    const elm = document.querySelector(`.btn-custom-css-${no}`);
    const style = document.createElement('style');
    style.innerHTML = this[`css${no}`];
    style.id = `custom-css-${no}`;
    document.head.append(style);
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    customCss.push(no);
    localStorage.setItem('custom-css', JSON.stringify(customCss));
    elm.textContent = `*${elm.textContent}*`;
  },

  toggle(no) {
    const elm = document.querySelector(`.btn-custom-css-${no}`);
    const exist = document.querySelector(`#custom-css-${no}`);
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    if (customCss.includes(no)) {
      if (exist) exist.remove();
      localStorage.setItem('custom-css', JSON.stringify(customCss.filter(v => v !== no)));
      elm.textContent = `_type ${no}_`;
    } else if (!exist) {
      this.add(no);
    }
  },

  update(no, force) {
    if (force) {
      this.add(no);
      return;
    }
    this.toggle(no);
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
      meta.content = 'dark light';
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

  mounted() {
    const ts = Date.now();
    const conf = JSON.parse(localStorage.getItem('custom-css-conf') ?? '{}');
    localStorage.setItem('custom-css-conf', JSON.stringify({ expired: ts + 1000 }));
    if (conf.expired && conf.expired > ts) return;

    const div = this.btnSetting();
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    [1, 2, 3].forEach(no => {
      if (customCss.includes(no)) this.update(no, true);
    });

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

  main() {
    if (this.init) return;
    this.init = true;

    const video = document.querySelector('video');

    const result = this.getBackgroundColorBrightness('div')
      || this.getBackgroundColorBrightness('div:nth-child(2)')
      || this.getBackgroundColorBrightness('body')
      || this.getBackgroundColorBrightness('html');

    if (!video) {
      if (document.querySelector('meta[name="color-scheme"]')) {
        logger.info('color-scheme supported');
        return;
      }
      if (result?.isDark) {
        logger.info('This is Dark');
        return;
      }
    }

    setTimeout(() => this.mounted(), 0);
  },
};

window.addEventListener('load', () => {
  setTimeout(() => app.main(), 0);
});

setTimeout(() => app.main(), 1000);
