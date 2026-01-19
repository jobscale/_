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
    el.addEventListener('click', event => {
      event.preventDefault();
      const list = this.fetchData();
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

  fetchData() {
    return JSON.parse(localStorage.getItem('a-list') || '[]');
  }

  appendData(data) {
    const list = this.fetchData();
    list.unshift(data);
    const active = list.filter(item => {
      const ts = new Date();
      ts.setDate(ts.getDate() - 360);
      return new Date(item.ts) > ts;
    });
    localStorage.setItem('a-list', JSON.stringify(active));
  }

  setEvent(content, wrap) {
    const el = document.createElement('div');
    el.classList.add('btn-close');
    el.textContent = '🍺';
    el.addEventListener('click', event => {
      event.preventDefault();
      const data = {
        href: content.href,
        ts: new Date().toISOString(),
      };
      this.appendData(data);
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

window.addEventListener('load', () => {
  setTimeout(() => new Tver().main(), 2200);
});
