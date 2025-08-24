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

const getNow = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Paris', // CET/CEST
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(new Date());

const createTime = () => {
  const style = document.createElement('style');
  style.innerText = `
.time {
  background-color: black;
  color: white;
  position: fixed;
  right: 1em;
  bottom: 1em;
  padding: 0.3em;
  z-index: 1000001;
  font-size: 1.2rem;
  pointer-events: none;
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

const drawCanvas = canvas => {
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

  const drawHexagon = (cx, cy) => {
    ctx.beginPath();
    fn(ctx);
    ctx.lineWidth = 1;
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

  for (let row = 0; row < canvas.height / verticalStep + 2; row++) {
    for (let col = 0; col < canvas.width / horizontalStep + 2; col++) {
      const offsetY = (col % 2 === 0) ? 0 : verticalStep / 2;
      const x = col * horizontalStep;
      const y = row * verticalStep + offsetY;
      hexQueue.push({ x, y });
    }
  }

  const drawNext = () => {
    for (let i = 10; i; i--) {
      if (!hexQueue.length) return;
      const { x, y } = hexQueue.shift();
      drawHexagon(x, y);
    }
    requestAnimationFrame(drawNext);
  };

  requestAnimationFrame(drawNext);
};

const createCanvas = () => {
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
  drawCanvas(canvas);
};

document.addEventListener('keydown', e => {
  if (opts.redraw) return;
  opts.redraw = true;
  setTimeout(() => { delete opts.redraw; }, 500);
  if (e.key === 'o' || e.key === 'O') {
    const canvas = document.querySelector('#custom-canvas');
    if (canvas) drawCanvas(canvas);
  }
});

window.addEventListener('load', () => {
  setTimeout(createCanvas, 2200);
  setTimeout(createTime, 3300);
});
