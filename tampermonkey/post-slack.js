// ==UserScript==
// @name         owa
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://example.jsx.jp/owa/
// @grant        none
// ==/UserScript==

(() => {
  const logger = console;
  const token = {
    access: 'xxxx',
    secret: 'xxxx',
    hashed: 'xxxx',
  };
  const url = `https://hooks.slack.com/services/${token.access}/${token.secret}/${token.hashed}`;
  const anchor = 'https://example.jsx.jp/owa/';
  const template = {
    icon_emoji: ':email:',
    username: 'Outlook',
    attachments: [{
      fallback: '',
      thumb_url: 'http://cdn.jsx.jp/img/owa.png',
    }],
  };
  const getCount = () => {
    let count = 0;
    document.querySelectorAll('.ms-font-weight-semibold._n_17')
    .forEach(ele => {
      count += parseInt(ele.textContent, 10) || 0;
    });
    return count;
  };
  const send = data => {
    const body = `payload=${JSON.stringify(data)}`;
    const headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    headers.append('Content-Length', body.length.toString());
    return fetch(url, {
      method: 'post',
      headers,
      body,
    })
    .catch(logger.error);
  };
  let before = 0;
  const loop = () => {
    const count = getCount();
    if (count > before) {
      logger.log(`No Read count email: ${before} to ${count}`);
      template.text = `You got mail. (${count}) <${anchor}|Click here> for details!`;
      send(template).then((response) => {
        logger.log('response:', response);
      });
    }
    if (count !== before) {
      before = count;
      document.querySelector('title').textContent = `${count} 件の未読`;
      logger.log(`Changed Base count email: ${before}`);
    }
  };
  const main = () => {
    before = getCount();
    logger.log(`Base count email: ${before}`);
    setInterval(loop, 5000);
  };
  setTimeout(main, 5000);
})();
