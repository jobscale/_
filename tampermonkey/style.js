// ==UserScript==
// @name         Custom Style
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       jobscale
// @exclude      *://127.0.0.1:*/*
// @exclude      *://172.16.6.22:*/*
// @exclude      *://172.16.6.1/*
// @exclude      *://jsx.jp/*
// @exclude      *://*.jsx.jp/*
// @exclude      *://tver.jp/*
// @exclude      *://chatgpt.com/*
// @exclude      *://gemini.google.com/*
// @exclude      *://dashboard.render.com/*
// @exclude      *://www.amazon.co.jp/gp/video/*
// @exclude      *://*.amazonaws.com/*
// @exclude      *://*.console.aws.amazon.com/*
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
    const style = document.createElement('style');
    style.innerHTML = css;
    style.id = `custom-css-${no}`;
    document.head.append(style);
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    customCss.push(no);
    localStorage.setItem('custom-css', JSON.stringify(customCss));
  },

  toggle(css, no) {
    const exist = document.querySelector(`#custom-css-${no}`);
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    if (customCss.includes(no)) {
      if (exist) exist.remove();
      localStorage.setItem('custom-css', JSON.stringify(customCss.filter(v => v !== no)));
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

  setting() {
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

    const el1 = document.createElement('button');
    el1.type = 'button';
    el1.textContent = 'type 1';
    el1.addEventListener('click', event => {
      event.preventDefault();
      this.update(1);
    });
    div.append(el1);

    const el2 = document.createElement('button');
    el2.type = 'button';
    el2.textContent = 'type 2';
    el2.addEventListener('click', event => {
      event.preventDefault();
      this.update(2);
    });
    div.append(el2);

    const el3 = document.createElement('button');
    el3.type = 'button';
    el3.textContent = 'type 3';
    el3.addEventListener('click', event => {
      event.preventDefault();
      this.update(3);
    });
    div.append(el3);

    document.body.append(div);
  },

  mounted() {
    const ts = Date.now();
    const conf = JSON.parse(localStorage.getItem('custom-css-conf') ?? '{}');
    localStorage.setItem('custom-css-conf', JSON.stringify({ expired: ts + 1000 }));
    if (conf.expired && conf.expired > ts) return;
    const customCss = JSON.parse(localStorage.getItem('custom-css') ?? '[]');
    if (customCss.includes(1)) this.update(1, true);
    if (customCss.includes(2)) this.update(2, true);
    if (customCss.includes(3)) this.update(3, true);
    this.setting();
  },

  main() {
    this.mounted();
  },
};

setTimeout(() => app.main(), 0);
