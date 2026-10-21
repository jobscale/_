const logger = { ...console };
setTimeout(() => {
  const pendingRequests = new Map();
  const memo = { serial: 0 };

  addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const response = event.data;
    if (response?.channel !== 'csp-strip' || response.type !== 'router-title-result'
      || typeof response.requestId !== 'string') return;

    const pending = pendingRequests.get(response.requestId);
    if (!pending) return;
    pendingRequests.delete(response.requestId);

    if (typeof response.error === 'string') {
      pending.reject(new Error(response.error));
    } else if (typeof response.title === 'string') {
      pending.resolve(response.title);
    } else {
      pending.reject(new Error('Invalid router title response.'));
    }
  });

  logger.info({ content: window.contentContext ?? 'no content' });
  window.getRouterTitle = () => {
    const requestId = `${Date.now()}-${++memo.serial}`;
    return new Promise((resolve, reject) => {
      pendingRequests.set(requestId, { resolve, reject });
      postMessage({
        channel: 'csp-strip',
        type: 'get-router-title',
        requestId,
      }, location.origin);
    });
  };
}, 0);
