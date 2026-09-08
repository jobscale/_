// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      2026-09-08
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

    loadingModule: import('https://esm.sh/@jobscale/loading'),

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
        const { loading } = await app.loadingModule;
        loading(action());
      });
      areaMenu.append(el);
    },

    setMenu2(areaMenu) {
      const el = document.createElement('button');
      el.classList.add('btn-button');
      el.textContent = '再放送を非表示';
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
        const { loading } = await app.loadingModule;
        loading(action());
      });
      areaMenu.append(el);
    },

    setMenu3(areaMenu) {
      const el = document.createElement('button');
      el.classList.add('btn-button');
      el.textContent = '既読を非表示';
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
        const { loading } = await app.loadingModule;
        loading(action());
      });
      areaMenu.append(el);
    },

    setContentEvent() {
      const areaMenu = document.querySelector('[class^="Tabs_list_"]');
      if (!areaMenu) return;
      app.loadImage = 'https://dev-front.jsx.jp/v1/img/loading.svg';
      areaMenu.querySelector('div').style.backgroundImage = `url(${app.loadImage})`;
      app.setMenu1(areaMenu);
      app.setMenu2(areaMenu);
      app.setMenu3(areaMenu);
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
      requestAnimationFrame(() => {
        clearTimeout(provider.id);
        provider.id = setTimeout(provider.action, 500);
      });
    },

    async start() {
      logger.info('provider start');
      await new Promise(resolve => { setTimeout(resolve, 500); });
      provider.id = setTimeout(provider.handler, 500);
      provider.observer = new MutationObserver(provider.handler);
      provider.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    },
  };

  setTimeout(() => provider.start(), 500);
})();
