// ==UserScript==
// @name         XVideo
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.xvideos.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xvideos.com
// @grant        none
// ==/UserScript==

(() => {
  const logger = console;

  let idVideo;
  const setVideo = () => {
    const who = document.querySelector('#html5video video');
    if (!who) {
      idVideo = setTimeout(setVideo, 1000);
      return;
    }
    clearTimeout(idVideo);
    who.style = 'position:fixed;left:0;top:0;width:100%;height:auto;display:flex;';
    document.querySelector('#page').style = 'margin-top:100vh;';
    document.querySelector('.input-group').style = 'display: none;';
  };

  let idClick;
  const setClick = () => {
    const who = document.querySelector('#footer p');
    if (!who) {
      logger.info('footer_copyright not found');
      idClick = setTimeout(setClick, 500);
      return;
    }
    clearTimeout(idClick);
    document.querySelector('div#page.video-page').style = 'z-index: 250;';
    document.querySelector('.head__top').style = 'display: none';
    document.querySelector('.head__menu-line').style = 'display: none';
    who.style = 'position:fixed;right:0;bottom:0;cursor:pointer;';
    who.onclick = () => setTimeout(setVideo, 500);
  };

  setTimeout(setClick, 1000);
})();
