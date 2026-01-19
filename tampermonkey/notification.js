// ==UserScript==
// @name         Notification Message
// @namespace    http://tampermonkey.net/
// @version      2026-01-17
// @description  try to take over the world!
// @author       jobscale
// @match        https://teams.microsoft.com/v2/*
// @match        https://outlook.office.com/mail/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=microsoft.com
// @grant        none
// ==/UserScript==

setTimeout(() => {
  const logger = console;
  logger.info('TRIGGER');
  const store = { num: 0 };

  const notify = ({ organization, text }) => {
    fetch('https://jsx.jp/api/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        icon_emoji: ':anchor:',
        username: organization,
        text,
        channel: 'push',
      }),
    });
    fetch('https://jsx.jp/api/webPush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: organization,
        body: text,
      }),
    });
  };

  const action = () => {
    logger.info('ACTION');
    const num = [
      ...document.querySelectorAll('.fui-Badge'),
      ...document.querySelectorAll('.WIYG1.Mt2TB'),
    ].reduce((accel, el) => accel + (Number.parseInt(el.textContent, 10) || 0), 0) || 0;

    const organization = document.querySelector('[id^="idna-me"]')?.textContent || 'Unknown';
    const appName = window.location.href.match('teams') ? 'Teams' : 'Other';
    const text = `${organization} ${appName} (${num}) notification`;
    logger.info(text);
    if (num > store.num) notify({ organization, text });
    store.num = num;
  };

  const handler = () => {
    requestAnimationFrame(() => {
      clearTimeout(store.id);
      store.id = setTimeout(action, 200);
    });
  };

  const observer = new MutationObserver(handler);
  observer.observe(document.body, { childList: true, subtree: true });
}, 33000);
