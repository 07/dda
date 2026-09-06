// 多答AI - 后台 Service Worker
// 负责：右键菜单、侧边栏打开、消息中转

const MODELS = [
  { id: 'doubao', name: '豆包', color: '#e8a33d' },
  { id: 'deepseek', name: 'DeepSeek', color: '#4a9eff' },
  { id: 'kimi', name: 'Kimi', color: '#7c5cff' },
  { id: 'glm', name: '智谱GLM', color: '#3db88a' }
];

// 安装时初始化存储
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    selectedModels: ['doubao', 'deepseek', 'kimi'],
    apiKeys: {},
    theme: 'dark'
  });

  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'duoda-ask',
    title: '用多答AI提问：%s',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'duoda-summarize',
    title: '多答AI：总结当前页面',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'duoda-translate',
    title: '多答AI：翻译选中文字',
    contexts: ['selection']
  });
});

// 右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'duoda-ask' && info.selectionText) {
    openSidePanelWithQuery(tab.windowId, info.selectionText, 'ask');
  } else if (info.menuItemId === 'duoda-summarize') {
    openSidePanelWithQuery(tab.windowId, '', 'summarize');
  } else if (info.menuItemId === 'duoda-translate' && info.selectionText) {
    openSidePanelWithQuery(tab.windowId, info.selectionText, 'translate');
  }
});

// 打开侧边栏并传递查询
function openSidePanelWithQuery(windowId, query, mode) {
  chrome.sidePanel.setOptions({
    windowId: windowId,
    path: 'sidepanel/sidepanel.html',
    enabled: true
  }).then(() => {
    chrome.sidePanel.open({ windowId: windowId });
    // 延迟发送，等侧边栏加载
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'SIDEBAR_QUERY',
        query: query,
        mode: mode
      });
    }, 500);
  }).catch(err => {
    console.error('打开侧边栏失败:', err);
  });
}

// 监听来自 popup / content script 的消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'OPEN_SIDEPANEL') {
    const windowId = msg.windowId || (sender.tab && sender.tab.windowId);
    if (windowId) {
      chrome.sidePanel.open({ windowId: windowId });
    }
    sendResponse({ ok: true });
  }
  if (msg.type === 'GET_MODELS') {
    sendResponse({ models: MODELS });
  }
  return true; // 保持通道开放以支持异步响应
});
