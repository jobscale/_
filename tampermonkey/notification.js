// ==UserScript==
// @name         Notification Message
// @namespace    http://tampermonkey.net/
// @version      2026-02-18
// @description  try to take over the world!
// @author       jobscale
// @match        https://teams.microsoft.com/v2/*
// @match        https://outlook.office.com/mail/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=microsoft.com
// @grant        GM_xmlhttpRequest
// @connect      jsx.jp
// ==/UserScript==

(() => {
  const logger = console;

  const store = { num: 0, silent: Date.now() };

  const app = {
    async fetch(url, opts) {
      GM_xmlhttpRequest({
        url,
        ...opts,
        data: opts.body,
        body: undefined,
        onload: logger.info,
        onerror: logger.error,
      });
    },

    notify({ organization, text }) {
      app.fetch('https://jsx.jp/api/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icon_emoji: ':anchor:',
          username: organization,
          text,
          channel: 'push',
        }),
      });
      app.fetch('https://jsx.jp/api/webPush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: organization,
          body: text,
        }),
      });
    },

    main() {
      const span = 60_000;
      store.teams = [...document.querySelectorAll('.fui-Badge')];
      store.outlook = [...document.querySelectorAll('.WIYG1.Mt2TB')];
      store.categories = '';
      if (store.outlook.length) {
        store.categories = [...document.querySelectorAll('div.C2IG3.z6Kje:has(.WIYG1.Mt2TB)')]
        .map(el => el.querySelector('span').textContent).join(', ');
      }
      const num = [...store.teams, ...store.outlook]
      .reduce((accel, el) => accel + (Number.parseInt(el.textContent, 10) || 0), 0) || 0;
      const organization = document.querySelector('[id^="idna-me"]')?.textContent
      ?? document.querySelector('#tenantLogo_container img')?.title
      ?? 'Unknown';
      if (location.href.match('teams')) store.appName = 'Teams';
      else if (location.href.match('outlook')) store.appName = 'Outlook';
      else store.appName = 'Other';
      const text = `${store.appName} ${store.categories} - ${organization} notification (${num})`;
      if (num !== store.num) logger.info(text);
      if (num > store.num && store.silent < Date.now()) {
        store.silent = Date.now() + span;
        app.notify({ organization, text });
      }
      store.num = num;
    },
  };

  const provider = {
    action() {
      app.main();
    },

    handler() {
      if (provider.expired < Date.now()) return;
      requestAnimationFrame(() => {
        clearTimeout(provider.id);
        provider.id = setTimeout(provider.action, 5_200);
      });
    },

    async start() {
      await new Promise(resolve => { setTimeout(resolve, 33_000); });
      provider.expired = Date.now() + 5_000;
      provider.id = setTimeout(provider.action, 5_200);
      provider.observer = new MutationObserver(provider.handler);
      provider.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    },
  };

  provider.start();
})();
