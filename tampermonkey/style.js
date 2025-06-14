// ==UserScript==
// @name         Custom Style
// @namespace    http://tampermonkey.net/
// @version      2025-05-17
// @description  try to take over the world!
// @author       jobscale
// @exclude      *://127.0.0.1:*/*
// @exclude      *://172.16.6.22:*/*
// @exclude      *://172.16.6.1/*
// @exclude      *://jsx.jp/*
// @exclude      *://*.jsx.jp/*
// @exclude      *://navy.quest/*
// @exclude      *://chatgpt.com/*
// @exclude      *://gemini.google.com/*
// @exclude      *://dashboard.render.com/*
// @exclude      *://teams.microsoft.com/*
// @exclude      *://outlook.office.com/*
// @exclude      *://teams.live.com/*
// @exclude      *://outlook.live.com/*
// @exclude      *://www.amazon.co.jp/gp/video/*
// @exclude      *://*.amazonaws.com/*
// @exclude      *://*.console.aws.amazon.com/*
// @exclude      *://tver.jp/*
// @exclude      *://remotedesktop.google.com/*
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=playcode.io
// @grant        none
// ==/UserScript==

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

  style: `div.b-area {
  position: fixed;
  right: 2em;
  bottom: 5em;
  z-index: 1000001;
}`,

  add(css, no) {
    const elm = document.querySelector(`.btn-custom-css-${no}`);
    const style = document.createElement('style');
    style.innerHTML = css;
    style.id = `custom-css-${no}`;
    document.head.append(style);
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    customCss.push(no);
    localStorage.setItem('custom-css', JSON.stringify(customCss));
    elm.textContent = `*${elm.textContent}*`;
  },

  toggle(css, no) {
    const elm = document.querySelector(`.btn-custom-css-${no}`);
    const exist = document.querySelector(`#custom-css-${no}`);
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    if (customCss.includes(no)) {
      if (exist) exist.remove();
      localStorage.setItem('custom-css', JSON.stringify(customCss.filter(v => v !== no)));
      elm.textContent = `_type ${no}_`;
    } else if (!exist) {
      this.add(css, no);
    }
  },

  update(no, force) {
    const css = this[`css${no}`];
    if (force) {
      this.add(css, no);
      return;
    }
    this.toggle(css, no);
  },

  btnSetting() {
    const style = document.createElement('style');
    style.innerText = this.style;
    document.head.append(style);

    const div = document.createElement('div');
    div.classList.add('b-area');

    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = 'hide';
    el.addEventListener('click', event => {
      event.preventDefault();
      div.remove();
    });
    div.append(el);

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
    createButton(1);
    createButton(2);
    createButton(3);

    const elVideo = document.createElement('button');
    elVideo.type = 'button';
    elVideo.textContent = 'video';
    elVideo.addEventListener('click', event => {
      event.preventDefault();
      const video = document.querySelector('.player-block')
        || document.querySelector('#video-player-bg');
      if (!video) return;
      const custom = [
        'background: #000',
        'left: 0',
        'right: 0',
        'top: 0',
        'bottom: 0',
        'position: fixed',
      ];
      custom.forEach(elm => {
        const [key, value] = elm.split(': ');
        video.style[key] = value;
      });
      const headers = [
        document.body,
        document.querySelector('.main-header'),
      ];
      headers.forEach(elm => {
        if (!elm) return;
        elm.style['margin-top'] = '100vh';
      });
    });
    div.append(elVideo);

    document.body.append(div);
  },

  mounted() {
    const ts = Date.now();
    const conf = JSON.parse(localStorage.getItem('custom-css-conf') ?? '{}');
    localStorage.setItem('custom-css-conf', JSON.stringify({ expired: ts + 1000 }));
    if (conf.expired && conf.expired > ts) return;
    this.btnSetting();
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    if (customCss.includes(1)) this.update(1, true);
    if (customCss.includes(2)) this.update(2, true);
    if (customCss.includes(3)) this.update(3, true);
  },

  main() {
    this.mounted();
  },
};

setTimeout(() => app.main(), 0);
