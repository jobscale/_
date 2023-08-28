// ==UserScript==
// @name         NTV Live
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://news.ntv.co.jp/live
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ntv.co.jp
// @grant        none
// ==/UserScript==

let idVideo;
const setVideo = () => {
  document.querySelector('#live > video').style = 'position: fixed; top: 0; left: 0; width: 100%; height: auto;';
  document.querySelector('.mainContents').style = 'z-index: 10;';
  document.body.style = 'margin-top: 100vh; background: black;';
};

let idClick;
const setClick = () => {
  const who = document.querySelector('.live-label-item');
  if (!who) {
    console.info('footer_copyright not found');
    idClick = setTimeout(setClick, 500);
    return;
  }
  clearTimeout(idClick);
  who.style = 'position:fixed;right:0;bottom:0;cursor:pointer;'
  who.onclick = () => setTimeout(setVideo, 500);
};

setTimeout(setClick, 1000);
