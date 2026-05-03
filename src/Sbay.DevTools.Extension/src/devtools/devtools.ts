// devtools_page entry — registers the sbay-dev panel with chrome.devtools.panels.
chrome.devtools.panels.create(
  'sbay-dev',
  'icons/icon-32.png',
  'panels/host.html',
  (_panel) => {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    void chrome.runtime.sendMessage({ kind: 'session.attach', tabId });
  }
);
