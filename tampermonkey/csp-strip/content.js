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

const start = async () => {
  if (!document.head) return false;
  const tagId = 'custom-color-scheme';
  if (document.querySelector(`#${tagId}`)) return true;
  const meta = document.createElement('meta');
  meta.id = tagId;
  meta.name = 'color-scheme';
  meta.content = 'dark';
  document.head.prepend(meta);
  logger.info(`Inserted custom color scheme meta tag ${formatTimestamp()}`);
  return true;
};

const observer = new MutationObserver(async () => {
  logger.info('Via MutationObserver');
  if (await start()) observer.disconnect();
});
observer.observe(document.documentElement, { childList: true });
