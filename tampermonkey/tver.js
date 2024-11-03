// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      0.1
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
    const who = document.querySelector('[class^="player_"] [class^="player_"] video');
    if (!who) {
      idVideo = setTimeout(setVideo, 1000);
      return;
    }
    clearTimeout(idVideo);
    const ad = document.querySelector('[class^="companion-ad-slot_host"]');
    if (ad) ad.remove();
    who.style = 'position:fixed;left:0;top:0;width:100%;height:auto;display:flex;';
    const container = document.querySelector('[class^="cross-column-layout_container"]');
    if (container) container.style = 'margin-top:95vh;';
    const main = document.querySelector('.cross-column-layout_main__w0npD');
    if (main) main.style = 'z-index: 10;';
  };

  let idClick;
  const setClick = () => {
    const who = document.querySelector('[class^="footer_copyright"]');
    if (!who) {
      logger.info('footer_copyright not found');
      idClick = setTimeout(setClick, 500);
      return;
    }
    clearTimeout(idClick);
    document.body.append(who);
    who.style = 'position:fixed;left:0;bottom:0;cursor:pointer;';
    who.onclick = () => setTimeout(setVideo, 500);
    document.querySelector('footer')?.remove();
  };

  setTimeout(setClick, 1000);

  const fetchData = () => JSON.parse(localStorage.getItem('a-list') || '[]');

  const appendData = data => {
    const list = fetchData();
    list.unshift(data);
    const active = list.filter(item => {
      const ts = new Date();
      ts.setDate(ts.getDate() - 180);
      return new Date(item.ts) > ts;
    });
    localStorage.setItem('a-list', JSON.stringify(active));
  };

  const changeStyle = () => {
    const css = `
  .btn-close {
    position: absolute;
    top: -1em;
    right: -0.5em;
    width: 1.2em;
    height: 1.2em;
    cursor: cell;
    filter: invert(1);
  }
  .btn-button {
    width: 15em;
    cursor: pointer;
    border-radius: 1em;
    margin: auto;
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

  const setEvent = content => {
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
      content.remove();
    });
    content.append(el);
  };

  const setMenu1 = areaMenu => {
    const el = document.createElement('button');
    el.classList.add('btn-button');
    el.textContent = 'ダイジェストを非表示';
    el.addEventListener('click', event => {
      event.preventDefault();
      Array.from(document.querySelectorAll('[class^="mypage-content-item_container"]'))
      .filter(content => {
        if (content.textContent.match(/ダイジェスト/)) return true;
        if (content.textContent.match(/振り返り/)) return true;
        if (content.textContent.match(/解説放送/)) return true;
        if (content.textContent.match(/分でわかる/)) return true;
        if (content.textContent.match(/【予告】/)) return true;
        if (content.textContent.match(/【PR】/)) return true;
        if (content.textContent.match(/放送直前/)) return true;
        if (content.textContent.match(/制作発表/)) return true;
        if (content.textContent.match(/完成披露/)) return true;
        if (content.textContent.match(/見どころ/)) return true;
        const n = Number.parseInt(content.querySelector('a > div:nth-child(2)').textContent, 10);
        if (n < 10) return true;
        return false;
      })
      .forEach(content => content.remove());
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
      Array.from(document.querySelectorAll('[class^="mypage-content-item_container"]'))
      .filter(content => {
        if (content.textContent.match(/年放送/)) return true;
        const exist = list.find(data => data.href === content.href);
        if (exist) return true;
        setEvent(content);
        return content.querySelector('div[class^="progress-bar_progressBar"]');
      })
      .forEach(content => content.remove());
    });
    areaMenu.append(el);
  };

  const setContentEvent = () => {
    document.querySelectorAll('[class^="episode-pattern-c_container"]')
    .forEach(content => setEvent(content));
    const areaMenu = document.querySelector('[class^="mypage-sub-header_standard"]');
    setMenu1(areaMenu);
    setMenu2(areaMenu);
  };

  changeStyle();
  setTimeout(() => changeStyle(), 2900);
  setTimeout(() => setContentEvent(), 4000);
}, 1500);
