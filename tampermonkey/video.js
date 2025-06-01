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
    const who = document.querySelector('#video-player-bg');
    if (!who) {
      idVideo = setTimeout(setVideo, 1000);
      return;
    }
    clearTimeout(idVideo);
    who.style = `
    overflow: hidden;
    background: #000;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    position: fixed;
`;
    document.body.style = 'margin-top:100vh;';
  };

  let idClick;
  const setClick = () => {
    const who = document.querySelector('.slogan.mobile-hide');
    if (!who) {
      logger.info('footer_copyright not found');
      idClick = setTimeout(setClick, 500);
      return;
    }
    clearTimeout(idClick);
    who.style = 'position:fixed;right:0;bottom:0;cursor:pointer;';
    who.onclick = () => setTimeout(setVideo, 500);
  };

  setTimeout(setClick, 1000);
})();
