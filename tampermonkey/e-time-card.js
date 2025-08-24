// ==UserScript==
// @name         e-timeCard
// @namespace    http://tampermonkey.net/
// @version      2025-08-25
// @description  try to take over the world!
// @author       You
// @match        https://e-timecard.ne.jp/s/EPSINP*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=e-timecard.ne.jp
// @grant        none
// ==/UserScript==

setTimeout(() => {
  Array.from(document.querySelectorAll('[id^="workPlaceKbnHome"]'))
  .forEach(el => { el.checked = true; });

  const el = document.querySelector('table .cmWidthP04');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, 100);
