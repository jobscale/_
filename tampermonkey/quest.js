// ==UserScript==
// @name         Navy Quest
// @namespace    http://tampermonkey.net/
// @version      2025-05-17
// @description  try to take over the world!
// @author       You
// @match        https://navy.quest/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=navy.quest
// @grant        none
// ==/UserScript==

const getNow = () => new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Europe/Paris', // CET/CEST を自動判定
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(new Date()).replace(/\//g, '-');

const action = () => {
  const style = document.createElement('style');
  style.innerText = `
.time {
  background-color: black;
  color: white;
  position: fixed;
  left: 22em;
  bottom: 3em;
  padding: 0.3em;
  z-index: 1000001;
  font-size: 1.2rem;
}
`;
  document.head.append(style);
  const div = document.createElement('div');
  div.classList.add('time');
  document.body.append(div);

  const loop = () => {
    [, div.textContent] = getNow().split(' ');
  };
  setInterval(loop, 1000);
};

setTimeout(action, 3300);
