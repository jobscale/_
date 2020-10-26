// ==UserScript==
// @name         tver style
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://tver.jp/*/*
// @grant        none
// ==/UserScript==

(() => {
  const setup = (scale, top) => {
    const style = `body {
transform: scale(${scale}, ${scale});
transform-origin: top;
margin-top: ${top};
}`;
    const element = document.createElement('style');
    element.textContent = style;
    document.head.appendChild(element);
  };

  const genList = [];
  const generateAction = (scale, top, text) => {
    const element = document.createElement('span');
    const style = 'font-size: 2em; cursor: pointer; text-align: right;';
    element.setAttribute('style', style);
    element.textContent = text;
    genList.push(element);
    document.querySelector('#cx_player').style.textAlign = 'center';
    document.querySelector('#cx_player').append(element);
    element.addEventListener('click', () => {
      genList.forEach(el => el.setAttribute('style', 'color: dimgray;'));
      setup(scale, top);
    });
  };

  const action = () => {
    const check = () => document.querySelector('iframe[src^="https://i.fod"]');
    if (!check()) return;
    generateAction('210%', '-167px', ' >>> BIG SIZE <<< ');
    generateAction('170%', '-135px', ' >>> WIDE <<< ');
    generateAction('130%', '-103px', ' >>> MIDINUM <<< ');
  };
  setTimeout(action, 3000);
})();

