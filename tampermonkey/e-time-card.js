// ==UserScript==
// @name         e-timeCard
// @namespace    http://tampermonkey.net/
// @version      2026-02-18
// @description  try to take over the world!
// @author       You
// @match        https://e-timecard.ne.jp/s/EPSINP*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.tempstaff.co.jp
// @grant        none
// ==/UserScript==

(() => {
  const app = {
    main() {
      [...document.querySelectorAll('tr:not(:has(.sat), :has(.sun)) [id^="workPlaceKbnHome"]')]
      .forEach(el => { el.checked = true; });
      [...document.querySelectorAll('tr:not(:has(.sat), :has(.sun)) input[name$="startTimeInput"]')]
      .forEach(el => { if (!el.value) el.value = '900'; });
      [...document.querySelectorAll('tr:not(:has(.sat), :has(.sun)) input[name$="endTimeInput"]')]
      .forEach(el => { if (!el.value) el.value = '1745'; });
      [...document.querySelectorAll('tr:not(:has(.sat), :has(.sun)) input[name$="rstTimeInput"]')]
      .forEach(el => { if (!el.value) el.value = '45'; });

      const el = document.querySelector('table .cmWidthP04');
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  };

  const provider = {
    action() {
      if (provider.once) return;
      provider.once = true;
      provider.observer.disconnect();
      app.main();
    },

    handler() {
      if (provider.expired < Date.now()) return;
      requestAnimationFrame(() => {
        clearTimeout(provider.id);
        provider.id = setTimeout(provider.action, 200);
      });
    },

    start() {
      provider.expired = Date.now() + 5_000;
      provider.id = setTimeout(provider.action, 2_200);
      provider.observer = new MutationObserver(provider.handler);
      provider.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    },
  };

  provider.start();
})();
