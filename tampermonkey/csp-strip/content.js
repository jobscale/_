/* global chrome, Temporal */
const logger = { ...console };
const formatTimestamp = (opts = {}) => {
  const {
    ts = Date.now(), iso = false, ms = false, tz = true,
    timeZone = 'Asia/Tokyo',
  } = opts;
  const instant = Temporal.Instant.fromEpochMilliseconds(new Date(ts).getTime());
  const zonedDateTime = instant.toZonedDateTimeISO(timeZone);
  const timestamp = zonedDateTime.toString({
    timeZoneName: 'never',
    offset: tz ? 'auto' : 'never',
    smallestUnit: ms ? 'millisecond' : 'second',
    fractionalSecondDigits: ms ? 3 : 0,
  });
  return iso ? timestamp : timestamp.replace('T', ' ');
};

const self = {
  async getRouterTitle(address) {
    const response = await chrome.runtime.sendMessage({
      type: 'get-router-title', address,
    });
    if (response?.error) throw new Error(response.error);
    if (typeof response?.data !== 'string') throw new Error('Router response was empty.');
    const title = new DOMParser()
    .parseFromString(response.data, 'text/html')
    .querySelector('title')?.textContent?.trim();
    if (!title) throw new Error(`${address} did not return a <title>.`);
    return { address, title };
  },

  async findRouter() {
    const errors = [];
    const memo = {};
    for (const address of ['172.16.6.1', '192.168.0.1']) {
      await self.getRouterTitle(address).then(router => {
        memo.router = router;
      }).catch(e => {
        errors.push(e);
      });
      if (memo.router) break;
    }
    if (!memo.router) throw new AggregateError(errors, 'Could not get the router.');
    return memo.router;
  },

  eventListen() {
    logger.info({ exists: window.getRouterTitle ?? 'notfound' });
    window.contentContext = { iam: 'content' };
    addEventListener('message', async event => {
      if (event.source !== window || event.origin !== location.origin) return;
      const request = event.data;
      if (request?.channel !== 'csp-strip'
        || request.type !== 'get-router-title'
        || typeof request.requestId !== 'string') return;

      await self.findRouter().then(router => {
        postMessage({
          channel: 'csp-strip',
          type: 'router-title-result',
          requestId: request.requestId,
          title: router.title,
        }, location.origin);
      }).catch(e => {
        postMessage({
          channel: 'csp-strip',
          type: 'router-title-result',
          requestId: request.requestId,
          error: e.cause?.message ?? e.cause ?? e.message,
        }, location.origin);
      });
    });
  },

  async setScheme() {
    const tagId = 'custom-color-scheme';
    if (document.querySelector(`#${tagId}`)) return;
    const meta = document.createElement('meta');
    meta.id = tagId;
    meta.name = 'color-scheme';
    meta.content = 'dark';
    document.head.prepend(meta);
    logger.info(`Inserted custom color scheme meta tag ${formatTimestamp()}`);
  },

  async start() {
    if (!document.head) return false;
    if (self.once) return true;
    self.once = true;

    self.eventListen();
    self.setScheme();

    return true;
  },
};

const observer = new MutationObserver(async () => {
  logger.info('Via MutationObserver');
  if (await self.start()) observer.disconnect();
});
observer.observe(document.documentElement, { childList: true });
