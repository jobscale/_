// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://tver.jp/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tver.jp
// @grant        none
// ==/UserScript==

let idVideo;
const setVideo = () => {
  const who = document.querySelector('[class^="player_"] video');
  if (!who) {
    idVideo = setTimeout(setVideo, 1000);
    return;
  }
  clearTimeout(idVideo);
  document.querySelector('[class^="companion-ad-slot_host"]').remove();
  document.body.style.backgroundColor = 'black';
  who.style = 'position:fixed;left:0;top:0;width:100%;height:auto;display:flex;';
  document.querySelector('[class^="cross-column-layout_container"]')
  .style = 'margin-top:95vh;'
  document.querySelector('.cross-column-layout_main__w0npD').style = 'z-index: 10;'
};

let idClick;
const setClick = () => {
  const who = document.querySelector('[class^="footer_copyright"]');
  if (!who) {
    console.info('footer_copyright not found');
    idClick = setTimeout(setClick, 500);
    return;
  }
  clearTimeout(idClick);
  who.style = 'position:fixed;left:0;bottom:0;cursor:pointer;'
  who.onclick = () => setTimeout(setVideo, 500);
};

setTimeout(setClick, 1000);

const changeStyle = () => {
  const css = `
body {
  background-color: #222;
  color: #888;
  height: auto;
}
.btn-close {
  position: absolute;
  top: -1em;
  right: -0.5em;
  width: 1.2em;
  height: 1.2em;
  cursor: not-allowed;
}
.btn-button {
  width: 15em;
  background-color: #111;
  color: #58f;
  cursor: pointer;
  border-radius: 1em;
  margin: auto;
}
`;
  const el1 = document.querySelector('[class^="mypage-page-main_tabList"]');
  if (el1) el1.style.visibility = 'hidden';
  const uni = document.querySelectorAll('div[class^="episode-pattern-c_seriesTitle"]');
  if (uni) uni.forEach(el => { el.style.color = '#aaa'; });
  const list = document.querySelectorAll('a div, a span, div ul');
  if(list) list.forEach(el => { el.style.color = '#aaa'; });
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.append(style);
  const el2 = document.querySelector('div[class^="companion-ad-slot"]');
  if (el2) el2.style.visibility = 'hidden';
  const el3 = document.querySelector('div[class^="series-info_container"]');
  if (el3) el3.style['background-color'] = '#111'
};

const setEvent = content => {
  const el = document.createElement('div');
  el.classList.add('btn-close');
  el.textContent = '🍺';
  el.addEventListener('click', event => {
    event.preventDefault();
    const { target } = event;
    const parent = target.parentNode;
    parent.remove();
  });
  content.append(el);
};

const setMenu1 = areaMenu => {
  const el = document.createElement('button');
  el.classList.add('btn-button');
  el.textContent = 'ダイジェストを非表示';
  el.addEventListener('click', event => {
    event.preventDefault();
    Array.from(document.querySelectorAll('[class^="episode-pattern-c_container"]'))
    .filter(content => {
      if (content.textContent.match(/ダイジェスト/)) return true;
      if (content.textContent.match(/振り返り/)) return true;
      if (content.textContent.match(/解説放送/)) return true;
      if (content.textContent.match(/【予告】/)) return true;
      if (content.textContent.match(/【PR】/)) return true;
      if (content.textContent.match(/放送直前/)) return true;
      if (content.textContent.match(/制作発表/)) return true;
      if (content.textContent.match(/完成披露/)) return true;
      if (content.textContent.match(/見どころ/)) return true;
      return false;
    })
    .forEach(content => content.remove())
  });
  areaMenu.append(el);
};

const setMenu2 = areaMenu => {
  const el = document.createElement('button');
  el.classList.add('btn-button');
  el.textContent = '既読を非表示';
  el.addEventListener('click', event => {
    event.preventDefault();
    Array.from(document.querySelectorAll('[class^="episode-pattern-c_container"]'))
    .filter(content => {
      return content.querySelector('div[class^="progress-bar_progressBar"]');
    })
    .forEach(content => content.remove())
  });
  areaMenu.append(el);
};

const setContentEvent = () => {
  document.querySelectorAll('[class^="episode-pattern-c_container"]')
  .forEach(content => setEvent(content));
  const areaMenu = document.querySelector('[class^="favorite-filter-menu_viewedRemove"]');
  setMenu1(areaMenu);
  setMenu2(areaMenu);
};

setTimeout(() => {
  changeStyle();
  setTimeout(() => changeStyle(), 3000);
  setTimeout(() => setContentEvent(), 4000);
}, 1500);
