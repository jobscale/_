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
  getBasicRealm(response) {
    const challenge = response.headers.get('www-authenticate') ?? '';
    const match = challenge.match(
      /(?:^|,\s*)Basic\s+realm\s*=\s*(?:"((?:\\.|[^"])*)"|([^,\s]+))/i,
    );
    return match ? match[1]?.replace(/\\(.)/g, '$1') ?? match[2] : null;
  },

  onMessage(message, _sender, sendResponse) {
    if (message?.type !== 'get-router-title') return false;
    const routerAddresses = new Set(['192.168.0.1', '172.16.6.1']);
    if (!routerAddresses.has(message.address)) {
      logger.error('[background]', `Unsupported router address: ${message.address}`);
      sendResponse({ error: 'Unsupported router address.' });
      return false;
    }
    logger.info('[background]', `Fetching router title for address: ${message.address}`, formatTimestamp());
    fetch(`http://${message.address}`, { signal: AbortSignal.timeout(500) })
    .then(response => {
      if (response.status === 401) {
        return { status: 401, realm: self.getBasicRealm(response) };
      }
      if (response.ok) return response.text();
      throw new Error(`Router returned HTTP ${response.status}`);
    })
    .then(result => {
      sendResponse(typeof result === 'string' ? { data: result } : result);
    })
    .catch(e => {
      logger.error('[background]', e.cause?.message ?? e.message, formatTimestamp());
      sendResponse({ error: e.cause?.message ?? e.message });
    });
    return true;
  },

  start() {
    chrome.runtime.onMessage.addListener(self.onMessage);
  },
};

setTimeout(self.start, 0);
