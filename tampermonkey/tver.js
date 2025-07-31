// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      2025-07-31
// @description  try to take over the world!
// @author       jobscale
// @match        https://tver.jp/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tver.jp
// @grant        none
// ==/UserScript==

setTimeout(() => {
  const logger = console;
  let idVideo;
  const setVideo = () => {
    const who = document.querySelector('video');
    if (!who) {
      idVideo = setTimeout(setVideo, 1000);
      return;
    }
    clearTimeout(idVideo);
    document.body.style = 'margin-top: 100vh';
    document.querySelector('div[class^="Episode_companionAd"] div')?.remove();
    const player = document.querySelector('div[class^="player_aspectRatioWrapper"]')
    || document.querySelector('div[class^="PlayerLayout_jail"]');
    player.style = 'position: fixed; width: 100vw; height: auto; left: 0; top: 0; z-index: 99999;';
  };

  let idClick;
  const setClick = () => {
    const who = document.querySelector('[class^="Footer_copyright"]');
    if (!who) {
      logger.info('Footer_copyright not found');
      idClick = setTimeout(setClick, 500);
      return;
    }
    clearTimeout(idClick);
    document.body.append(who);
    who.style = 'position:fixed;left:0;bottom:0;cursor:pointer;';
    who.onclick = () => setTimeout(setVideo, 500);
  };

  setTimeout(setClick, 1000);

  const fetchData = () => JSON.parse(localStorage.getItem('a-list') || '[]');

  const appendData = data => {
    const list = fetchData();
    list.unshift(data);
    const active = list.filter(item => {
      const ts = new Date();
      ts.setDate(ts.getDate() - 360);
      return new Date(item.ts) > ts;
    });
    localStorage.setItem('a-list', JSON.stringify(active));
  };

  const changeStyle = () => {
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
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.append(style);
    const el1 = document.querySelector('[class^="mypage-page-main_tabList"]');
    if (el1) el1.style.visibility = 'hidden';
    const el2 = document.querySelector('div[class^="companion-ad-slot"]');
    if (el2) el2.style.visibility = 'hidden';
  };

  const setEvent = (content, wrap) => {
    const el = document.createElement('div');
    el.classList.add('btn-close');
    el.textContent = '🍺';
    el.addEventListener('click', event => {
      event.preventDefault();
      const data = {
        href: content.href,
        ts: new Date().toISOString(),
      };
      appendData(data);
      (wrap || content).remove();
    });
    content.append(el);
  };

  const setMenu1 = areaMenu => {
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
  };

  const setMenu2 = areaMenu => {
    const el = document.createElement('button');
    el.classList.add('btn-button');
    el.textContent = '既読を非表示';
    el.addEventListener('click', event => {
      event.preventDefault();
      const list = fetchData();
      [...document.querySelectorAll('[class*="FavoriteListCarousel_item"]')]
      .filter(content => {
        if (content.textContent.match(/年放送/)) return true;
        const exist = list.find(data => data.href === content.querySelector('a').href);
        if (exist) return true;
        setEvent(content.querySelector('a'), content);
        return false;
      })
      .forEach(content => content.remove());
      [...document.querySelectorAll('[class^="FavoriteList_container"] > a')]
      .filter(content => {
        if (content.textContent.match(/年放送/)) return true;
        const exist = list.find(data => data.href === content.href);
        if (exist) return true;
        setEvent(content);
        return false;
      })
      .forEach(content => content.remove());
    });
    areaMenu.append(el);
  };

  const setContentEvent = () => {
    const areaMenu = document.querySelector('[class*="MyPage_list"]');
    if (!areaMenu) return;
    setMenu1(areaMenu);
    setMenu2(areaMenu);
  };

  changeStyle();
  setTimeout(() => changeStyle(), 2000);
  setTimeout(() => setContentEvent(), 2500);
}, 1500);
