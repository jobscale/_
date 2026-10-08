const logger = { ...console };
const start = () => {
  if (!document.head) return false;
  const tagId = 'custom-color-scheme';
  if (document.querySelector(`#${tagId}`)) return true;
  const meta = document.createElement('meta');
  meta.id = tagId;
  meta.name = 'color-scheme';
  meta.content = 'dark';
  document.head.prepend(meta);
  return true;
};

const observer = new MutationObserver(() => {
  logger.info('via MutationObserver');
  if (start()) observer.disconnect();
});
observer.observe(document.documentElement, { childList: true });
