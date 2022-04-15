// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://tver.jp/*/*
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
  who.style = 'position:fixed;left:0;top:0;width:100%;height:auto;display:flex;';
  document.body.style.backgroundColor = 'black';
  document.querySelector('[class^="cross-column-layout_container"]')
    .style = 'margin-top:95vh;'
};

let idClick;
const setClick = () => {
  const who = document.querySelector('[class^="footer_copyright"]');
  if (!who) {
    idClick = setTimeout(setClick, 500);
    return;
  }
  clearTimeout(idClick);
  who.style = 'position:fixed;right:0;bottom:0;cursor:pointer;'
  who.onclick = () => setTimeout(setVideo, 500);
};

window.addEventListener('load', () => setTimeout(setClick, 1000));
