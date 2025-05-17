// ==UserScript==
// @name         Notification Message
// @namespace    http://tampermonkey.net/
// @version      2025-03-18
// @description  try to take over the world!
// @author       You
// @match        https://teams.microsoft.com/v2/*
// @match        https://outlook.office.com/mail/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=microsoft.com
// @grant        none
// ==/UserScript==

setTimeout(() => {
  const logger = console;
  logger.info('TRIGGER');
  const opts = { num: 0 };

  const observer = new MutationObserver(() => {
    logger.info('ACTION');
    const num = [
      ...document.querySelectorAll('.fui-Badge'),
      ...document.querySelectorAll('.WIYG1.Mt2TB'),
    ].reduce((accel, el) => accel + (Number.parseInt(el.textContent, 10) || 0), 0) || 0;

    const idna = document.querySelector('[id^="idna-me"]').textContent;
    const appName = window.location.href.match('teams') ? 'Teams' : 'Other';
    const text = `notification message
${idna} ${appName} (${num})`;
    logger.info(text);
    if (num > opts.num) {
      fetch('https://jsx.jp/api/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icon_emoji: ':anchor:',
          username: 'notification',
          text,
          channel: 'push',
        }),
      });
    }
    opts.num = num;
  });

  observer.observe(document.body, { childList: true, subtree: true });
}, 33000);
