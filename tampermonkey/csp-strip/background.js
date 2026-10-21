/* global chrome */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'get-router-title') return false;
  const routerAddresses = new Set(['192.168.0.1', '172.16.6.1']);
  if (!routerAddresses.has(message.address)) {
    sendResponse({ error: 'Unsupported router address.' });
    return false;
  }
  fetch(`http://${message.address}`)
  .then(response => {
    if (response.ok) return response.text();
    throw new Error(`Router returned HTTP ${response.status}`);
  })
  .then(data => sendResponse({ data }))
  .catch(e => sendResponse({ error: e.cause?.message ?? e.cause ?? e.message }));
  return true;
});
