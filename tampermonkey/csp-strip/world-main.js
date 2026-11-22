/* global Temporal */
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
  pendingRequests: new Map(),
  memo: { serial: 0 },

  onMessage(event) {
    if (event.source !== window || event.origin !== location.origin) return;
    const response = event.data;
    if (response?.channel !== 'csp-strip'
      || response.type !== 'router-title-result'
      || typeof response.requestId !== 'string') return;

    const prom = self.pendingRequests.get(response.requestId);
    if (!prom) return;
    self.pendingRequests.delete(response.requestId);

    if (typeof response.error === 'string') {
      prom.reject(new Error(response.error));
    } else if (typeof response.title === 'string') {
      prom.resolve(response.title);
    } else {
      prom.reject(new Error('Invalid router title response.'));
    }
  },

  getRouterTitle() {
    const requestId = `${Date.now()}-${++self.memo.serial}`;
    logger.info('[world MAIN]', JSON.stringify({ requestId }), formatTimestamp());
    const prom = {};
    prom.pending = new Promise((resolve, reject) => {
      Object.assign(prom, { resolve, reject });
      self.pendingRequests.set(requestId, prom);
      postMessage({
        channel: 'csp-strip',
        type: 'get-router-title',
        requestId,
      }, location.origin);
    });
    return prom.pending;
  },

  start() {
    addEventListener('message', self.onMessage);

    window.getRouterTitle = self.getRouterTitle;
  },
};

setTimeout(self.start, 0);
