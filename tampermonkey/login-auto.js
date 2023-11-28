// ==UserScript==
// @name         OutlookWebApp
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://example.jsx.jp/owa/auth/logon.aspx*
// @grant        none
// ==/UserScript==

(() => {
  const logger = console;

  const auth = {
    username: 'xxxx',
    password: 'xxxx',
  };
  const submit = async () => {
    document.querySelector('#UserName').value = auth.username;
    document.querySelector('#Password').value = auth.password;
    document.querySelector('form').submit();
  };
  const run = () => submit().then(logger.info).catch(logger.error);
  setTimeout(run, 2000);
})();
