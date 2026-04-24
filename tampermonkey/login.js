// ==UserScript==
// @name         Microsoft Auto Login
// @namespace    http://tampermonkey.net/
// @version      2026-04-24
// @description  try to take over the world!
// @author       jobscale
// @match        https://login.microsoftonline.com/common/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=teams.microsoft.com
// @grant        none
// ==/UserScript==

(() => {
  const app = {
    main() {
      if (document.querySelector('div[data-bind*="CT_PWD_STR_EnterPassword_Title"]')) {
        document.querySelector('input[type="submit"]').click();
        return;
      }
      if (document.querySelector('div[data-bind*="STR_Kmsi_Title"]')) {
        document.querySelector('input[type="submit"]').click();
        return;
      }
      setTimeout(() => app.main(), 1000);
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
      requestAnimationFrame(() => {
        clearTimeout(provider.id);
        provider.id = setTimeout(provider.action, 500);
      });
    },

    async start() {
      await new Promise(resolve => { setTimeout(resolve, 500); });
      provider.id = setTimeout(provider.handler, 500);
      provider.observer = new MutationObserver(provider.handler);
      provider.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    },
  };

  setTimeout(() => provider.start(), 500);
})();
