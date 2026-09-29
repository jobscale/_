const ignore = ['debug'];
const logger = new Proxy(console, {
  get(target, prop) {
    if (ignore.includes(prop)) {
      return () => undefined;
    }
    return target[prop];
  },
});

export class Speedtest {
  onSpeed() {
    this.speed().catch(e => {
      const message = e.cause?.message ?? e.cause ?? e.message;
      logger.error(message);
    });
  }

  async speed() {
    const store = {};
    const start = Date.now();
    const res = await fetch('https://api.jsx.jp/api/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: start }),
    });
    if (!res.ok) throw new Error(`HTTP unsuccessful: ${res.status}`);
    const blob = await res.blob();
    const duration = Date.now() - start;
    logger.debug(`received size: ${blob.size} / ${2 ** 20 / 8} bytes in ${duration} ms`);
    // 全体の経過時間での計算 (RTT含む)
    const safeDuration = Math.max(duration, 1);
    store.download = `${(blob.size * 8 / safeDuration / 1000).toFixed(2)} Mbps (${duration} ms) real`;
    logger.info(store);
  }
}

export default new Speedtest().onSpeed();
