// ==UserScript==
// @name         style change
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://*/*
// @match        https://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=playcode.io
// @grant        none
// ==/UserScript==

const change = () => {
  const css = `
body {
  background-color: #222;
  color: #888;
  height: auto;
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
};

setTimeout(() => {
  change();
  setTimeout(() => change(), 3500);
}, 1500);
