// ==UserScript==
// @name         style change
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://*/*
// @match        https://*/*
// @grant        none
// ==/UserScript==

(() => {
  const url = 'https://jsx.jp/assets/css/assign.css';
  const element = document.createElement('link');
  element.setAttribute('href', url);
  element.setAttribute('type', 'text/css');
  element.setAttribute('rel', 'stylesheet');
  document.head.appendChild(element);
})();
