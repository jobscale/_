// ==UserScript==
// @name         Navy Quest
// @namespace    http://tampermonkey.net/
// @version      2025-08-25
// @description  try to take over the world!
// @author       You
// @match        https://navy.quest/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=navy.quest
// @grant        none
// ==/UserScript==

const logger = console;

const formatTimestamp = (ts = new Date()) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Paris', // CET/CEST
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(ts);

const NEXT_TICK = 9 * 60;

const opts = {
  setup: [{}, {
    fn: ctx => {
      ctx.strokeStyle = 'black';
      ctx.setLineDash([4, 4]);
    },
  }, {
    fn: ctx => {
      ctx.strokeStyle = 'black';
      ctx.setLineDash([]);
    },
  }, {}, {
    fn: ctx => {
      ctx.strokeStyle = 'white';
      ctx.setLineDash([4, 4]);
    },
  }, {
    fn: ctx => {
      ctx.strokeStyle = 'white';
      ctx.setLineDash([]);
    },
  }],
  current: 0,
};

class App {
  createTime() {
    const style = document.createElement('style');
    style.innerText = `
.time {
  position: fixed;
  right: 1em;
  bottom: 1em;
  padding: 0.3em;
  z-index: 1000001;
  font-family: Tahoma;
  font-size: 2.2rem;
  pointer-events: none;
}
.outlined-text {
  color: white;
  font-weight: bold;
  -webkit-text-stroke: 1px black;
  text-shadow:
    0 0 2px black,
    1px 1px 2px black,
   -1px 1px 2px black,
    1px -1px 2px black,
   -1px -1px 2px black;
}
`;
    document.head.append(style);
    const div = document.createElement('div');
    div.classList.add('time');
    div.classList.add('outlined-text');
    document.body.append(div);

    const loop = () => {
      [, div.textContent] = formatTimestamp().split(' ');
      setTimeout(loop, 1000 - (Date.now() % 1000));
    };
    loop();
  }

  drawCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { fn } = opts.setup[opts.current];
    opts.current = (opts.current + 1) % opts.setup.length;
    if (!fn) return;

    const radius = 70;
    const gridRadius = { x: 80, y: 85 };
    const spacing = gridRadius.x - radius;

    // drawHexagon
    const verticalStep = gridRadius.y * 1.5; // step Y
    const horizontalStep = gridRadius.x * Math.sqrt(3) - spacing; // step X

    const drawHexagon = ({ cx, cy, row, col }) => {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.shadowColor = 'transparent';
      fn(ctx);
      if (((row % 7) === 4 && col % 2) || (col % 14) === 1) {
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 5;
      }
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i; // flat-topped
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle) * 0.8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const hexQueue = [];

    const begin = { x: -28, y: 12 };
    for (let row = 0; row < canvas.height / verticalStep + 2; row++) {
      for (let col = 0; col < canvas.width / horizontalStep + 2; col++) {
        const offsetY = (col % 2 === 0) ? 0 : verticalStep / 2;
        const cx = col * horizontalStep + begin.x;
        const cy = row * verticalStep + offsetY + begin.y;
        hexQueue.push({ cx, cy, row, col });
      }
    }

    const drawNext = () => {
      for (let i = 10; i; i--) {
        if (!hexQueue.length) return;
        drawHexagon(hexQueue.shift());
      }
      requestAnimationFrame(drawNext);
    };

    requestAnimationFrame(drawNext);
  }

  createCanvas() {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'custom-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.backgroundColor = 'transparent';
    // canvas.style.opacity = '0.9';
    canvas.style.zIndex = '1000000';
    document.body.append(canvas);

    // Draw canvas
    this.drawCanvas(canvas);
  }

  postSlack(body) {
    const url = 'https://jsx.jp/api/slack';
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
    return fetch(url, options);
  }

  async onlineUsers() {
    // const url = 'https://navy.quest/ally';
    // const res = await (await fetch(url, {
    //   mode: 'cors',
    //   credentials: 'include',
    // })).text();
    // const html = document.createElement('html');
    // html.innerHTML = res;
    const area = document.querySelector('table.allyprofil');
    if (!area) return;
    const table = {
      name: [...area.querySelectorAll('td:nth-child(2)')],
      mail: [...area.querySelectorAll('td:nth-child(1)')],
      point: [...area.querySelectorAll('td:nth-child(3)')],
      online: [...area.querySelectorAll('td:nth-child(6)')],
    };

    const data = table.name.map((_, i) => {
      const item = {
        name: table.name[i].textContent.trim(),
        mail: table.mail[i].querySelector('a'),
        point: Math.floor(Number.parseInt(table.point[i].textContent.trim().replace(/[.]/g, ''), 10) / 10000),
        online: table.online[i].textContent.trim(),
      };
      return item;
    }).slice(1).filter(item => item.mail);

    const users = data.filter(item => {
      if (item.point < 3) return false;
      if (item.online === 'On') return true;
      if (item.online.match('h')) return false;
      const num = Number.parseInt(item.online.match(/>(\d+)min/)?.[1], 10);
      if (num < 10) return true;
      return false;
    });
    const names = users.map(item => item.name).join(' ');
    const saveNames = localStorage.getItem('names');
    if (saveNames !== names) {
      localStorage.setItem('names', names);
    }
    const before = saveNames.split(' ').length;
    const after = names.split(' ').length;
    if (before < after) {
      const online = users.map(item => {
        const text = `${item.name.padStart(15)} ${item.point.toString().padStart(8)} ${item.online.padStart(8)}`;
        return text;
      });
      const block = {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: ['```', ...online, '```'].join('\n') },
        ],
      };
      const text = users.map(item => {
        return `${item.name} (${item.point})`;
      }).join(' \n');
      this.postSlack({
        channel: '#push',
        icon_emoji: ':video_game:',
        username: 'Navy Quest',
        text,
        blocks: [block],
      }).catch(e => logger.warn(JSON.stringify(e)));
    }
  }

  async battleReport() {
    const name = 'BLACKD';
    const url = new RegExp(`https://navy.quest/gold\\?b=3&o3=[0-9a-f]+${name}`);
    if (!window.location.href.match(url)) return false;
    const report = [...document.querySelectorAll('table table tr:nth-child(1) td')].map(el => el.textContent).join('\n');
    if (!report) return false;
    const known = localStorage.getItem('report');
    if (known !== report) {
      localStorage.setItem('report', report);
      this.postSlack({
        channel: '#push',
        icon_emoji: ':video_game:',
        username: 'Navy Quest',
        text: ['```', report, '```'].join('\n'),
      }).catch(e => logger.warn(JSON.stringify(e)));
    }
    return true;
  }

  async watchOnline() {
    const url = 'https://navy.quest/ally.php?b=33';
    if (window.location.href !== url) return;
    const next = new Date();
    next.setSeconds(next.getSeconds() + NEXT_TICK);
    logger.info(JSON.stringify({
      date: formatTimestamp(), next: formatTimestamp(next),
    }, null, 2));
    await this.onlineUsers();
    setTimeout(() => window.location.reload(), NEXT_TICK * 1000);
  }
}

const app = new App();

const isTypingContext = target => {
  const { tagName, type, isContentEditable } = target;
  const tag = tagName.toLowerCase();
  return isContentEditable || tag === 'textarea'
  || (tag === 'input' && !['button', 'submit'].includes(type));
};

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() !== 'o') return;
  if (isTypingContext(e.target)) return;

  if (opts.busy) return;
  opts.busy = true;
  setTimeout(() => { delete opts.busy; }, 500);
  const canvas = document.querySelector('#custom-canvas');
  if (canvas) app.drawCanvas(canvas);
});

window.addEventListener('load', () => {
  setTimeout(() => app.createCanvas(), 2200);
  setTimeout(() => app.createTime(), 3300);
  setTimeout(() => app.watchOnline(), 4400);
});
