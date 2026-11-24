// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      2026-10-09
// @description  try to take over the world!
// @author       jobscale
// @match        https://tver.jp
// @match        https://tver.jp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tver.jp
// @grant        none
// ==/UserScript==

(async () => {
  const { logger } = await import('https://esm.sh/@jobscale/create-logger');
  const { indexStore } = await import('https://esm.sh/@jobscale/web-storage');
  const loadingModule = import('https://esm.sh/@jobscale/loading');

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
  cursor: pointer;
  border-radius: 1em;
  margin: auto auto auto 1em;
  color: rgba(200, 200, 200, 0.5);
}
[class^="Footer_copyright"] {
  position: fixed;
  left: 8px;
  bottom: 8px;
  cursor: pointer;
  color: rgba(52,128,128,0.5);
}
body:has(.custom-wide-video) {
  margin-top: 100vh;
}
body:has(.custom-wide-video) [class^="AppLayout_app"] header {
  visibility: hidden;
}
.custom-wide-video {
  position: fixed;
  width: 100vw;
  height: auto;
  left: 0;
  top: 0;
  z-index: 99;
}
`,

    changeStyle() {
      const style = document.createElement('style');
      style.innerHTML = app.css;
      document.head.append(style);
      document.querySelector('[class^="Episode_companionAd"]')?.remove();
    },

    setMenu1(areaMenu, classList) {
      const el = Object.assign(document.createElement('button'), {
        textContent: 'キャプションを非表示',
      });
      classList.forEach(className => { el.classList.add(className); });
      const action = async () => {
        [...document.querySelectorAll('div[class^="Caption_caption"]')]
        .forEach(content => {
          const parent = content.parentElement;
          [...content.childNodes].reverse().forEach(child => child.remove());
          const { childElementCount } = parent.querySelector('section > ul');
          if (!childElementCount) parent.remove();
        });
      };
      el.addEventListener('click', async event => {
        event.preventDefault();
        const { loading } = await loadingModule;
        loading(action());
      });
      areaMenu.append(el);
    },

    setMenu2(areaMenu, classList) {
      const el = Object.assign(document.createElement('button'), {
        textContent: '再放送を非表示',
      });
      classList.forEach(className => { el.classList.add(className); });
      const action = async () => {
        [...document.querySelectorAll('li:has([href^="/episodes/"])')]
        .filter(wrapper => {
          if (wrapper.textContent.match(/年放送/)) return true;
          return false;
        })
        .forEach(content => content.remove());
      };
      el.addEventListener('click', async event => {
        event.preventDefault();
        el.disabled = true;
        app.startObserve(action);
      });
      areaMenu.append(el);
    },

    setMenu3(areaMenu, classList) {
      const el = Object.assign(document.createElement('button'), {
        textContent: '既読を非表示',
      });
      classList.forEach(className => { el.classList.add(className); });
      const action = async () => {
        const start = Date.now();
        const list = await app.fetchData();
        const rendering = Date.now();
        [...document.querySelectorAll('li:has([href^="/episodes/"])')]
        .filter(wrapper => {
          const exist = list.find(data => data.href === wrapper.querySelector('a').href);
          if (exist) return true;
          const anchor = wrapper.querySelector('a');
          const content = wrapper.querySelector('a[class^="ContentCard_root"]');
          app.setEvent(anchor, content, wrapper);
          return false;
        })
        .forEach(content => content.remove());
        logger.info({
          count: list.length,
          size: `${JSON.stringify(list).length / 1000} KB`,
          rendering: `${Date.now() - rendering} ms`,
          benchmark: `${Date.now() - start} ms`,
        });
      };
      el.addEventListener('click', async event => {
        event.preventDefault();
        el.disabled = true;
        app.startObserve(action);
      });
      areaMenu.append(el);
    },

    listHandler: [],
    async handler() {
      const delayHandler = async () => {
        for (const action of app.listHandler) {
          await action();
        }
        if (app.skipScroll) {
          delete app.skipScroll;
          return;
        }
        setTimeout(() => {
          const listTop = document.documentElement;
          listTop.scrollTo({ top: listTop.scrollHeight, behavior: 'smooth' });
        }, 0);
      };
      clearTimeout(app.id);
      app.id = setTimeout(delayHandler, 200);
    },

    startObserve(action) {
      if (!app.listHandler.find(a => a === action)) {
        app.listHandler.push(action);
      }
      if (!app.observer) {
        const listTop = document.querySelector('ul[class^="ContentList"]');
        if (listTop) {
          app.observer = new MutationObserver(app.handler);
          app.observer.observe(listTop, { childList: true, subtree: true });
        }
      }
      app.handler();
    },

    setContentEvent() {
      const areaList = document.querySelector('[class^="Tabs_list_"]');
      const areaMenu = areaList.querySelector('[class^="Tabs_track_"]') ?? areaList;
      if (!areaMenu) return;
      const classList = ['btn-button'];
      const defButton = areaMenu.querySelector('button');
      defButton.classList.forEach(className => { classList.push(className); });
      app.setMenu1(areaMenu, classList);
      app.setMenu2(areaMenu, classList);
      app.setMenu3(areaMenu, classList);
    },

    setFooterEvent() {
      let idClick;
      const who = document.querySelector('[class^="Footer_copyright"]');
      if (!who) {
        logger.info('Footer_copyright not found');
        idClick = setTimeout(() => app.setFooterEvent(), 500);
        return;
      }
      clearTimeout(idClick);
      document.body.append(who);
      who.addEventListener('click', event => {
        event.preventDefault();
        document.querySelector('[class^="PlayerLayout"]:has(video)')
        ?.classList.toggle('custom-wide-video');
      });
    },

    async fetchData() {
      return JSON.parse(await indexStore.getItem('a-list') || '[]');
    },

    async appendData(data) {
      const list = await app.fetchData();
      list.unshift(data);
      const active = list.filter(item => {
        const ts = new Date();
        ts.setDate(ts.getDate() - 360);
        return new Date(item.ts) > ts;
      });
      indexStore.setItem('a-list', JSON.stringify(active));
    },

    setEvent(anchor, content, wrapper) {
      if (content.querySelector('.btn-close')) return;
      const el = Object.assign(document.createElement('div'), {
        classList: ['btn-close'],
        textContent: '🍺',
      });
      el.addEventListener('click', async event => {
        event.preventDefault();
        const data = {
          href: anchor.href,
          ts: new Date().toISOString(),
        };
        await app.appendData(data);
        app.skipScroll = true;
        wrapper.remove();
      });
      content.append(el);
    },

    async main() {
      setTimeout(() => app.changeStyle(), 400);
      setTimeout(() => app.setContentEvent(), 500);
      setTimeout(() => app.setFooterEvent(), 600);
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
      clearTimeout(provider.id);
      provider.id = setTimeout(provider.action, 1500);
    },

    async start() {
      provider.id = setTimeout(provider.handler, 500);
      provider.observer = new MutationObserver(provider.handler);
      provider.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    },
  };

  setTimeout(() => provider.start(), 0);
  const { loading } = await loadingModule;
  loading(new Promise(resolve => { setTimeout(resolve, 3000); }));
})();
