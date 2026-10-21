/* global chrome */
const getBasicRealm = response => {
  const challenge = response.headers.get('www-authenticate') ?? '';
  const match = challenge.match(
    /(?:^|,\s*)Basic\s+realm\s*=\s*(?:"((?:\\.|[^"])*)"|([^,\s]+))/i,
  );
  return match ? match[1]?.replace(/\\(.)/g, '$1') ?? match[2] : null;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'get-router-title') return false;
  const routerAddresses = new Set(['192.168.0.1', '172.16.6.1']);
  if (!routerAddresses.has(message.address)) {
    sendResponse({ error: 'Unsupported router address.' });
    return false;
  }
  fetch(`http://${message.address}`, { signal: AbortSignal.timeout(500) })
  .then(response => {
    if (response.status === 401) {
      return { status: 401, realm: getBasicRealm(response) };
    }
    if (response.ok) return response.text();
    throw new Error(`Router returned HTTP ${response.status}`);
  })
  .then(result => {
    sendResponse(typeof result === 'string' ? { data: result } : result);
  })
  .catch(e => sendResponse({ error: e.cause?.message ?? e.cause ?? e.message }));
  return true;
});
