// 多答AI - 内容脚本
// 功能：划词弹出快捷菜单、页面内容提取

(function () {
  'use strict';

  let menuEl = null;
  let lastSelection = '';

  // 创建划词菜单
  function createMenu() {
    if (menuEl) return;
    menuEl = document.createElement('div');
    menuEl.id = 'duoda-selection-menu';
    menuEl.innerHTML = `
      <div class="duoda-menu-item" data-action="ask">提问</div>
      <div class="duoda-menu-item" data-action="translate">翻译</div>
      <div class="duoda-menu-item" data-action="explain">解释</div>
    `;
    document.body.appendChild(menuEl);

    menuEl.addEventListener('click', (e) => {
      const item = e.target.closest('.duoda-menu-item');
      if (!item) return;
      const action = item.dataset.action;
      handleAction(action, lastSelection);
      hideMenu();
    });

    document.addEventListener('mousedown', (e) => {
      if (menuEl && !menuEl.contains(e.target)) {
        hideMenu();
      }
    });
  }

  function showMenu(x, y) {
    createMenu();
    menuEl.style.left = x + 'px';
    menuEl.style.top = y + 'px';
    menuEl.classList.add('duoda-visible');
  }

  function hideMenu() {
    if (menuEl) menuEl.classList.remove('duoda-visible');
  }

  function handleAction(action, text) {
    let mode = 'ask';
    let query = text;
    if (action === 'translate') {
      mode = 'translate';
    } else if (action === 'explain') {
      mode = 'explain';
      query = '请解释：' + text;
    }
    chrome.runtime.sendMessage({
      type: 'OPEN_SIDEPANEL'
    });
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'SIDEBAR_QUERY',
        query: query,
        mode: mode
      });
    }, 600);
  }

  // 监听文本选择
  document.addEventListener('mouseup', (e) => {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel.toString().trim();
      if (text && text.length > 1 && text.length < 2000) {
        lastSelection = text;
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        showMenu(rect.left + window.scrollX, rect.bottom + window.scrollY + 6);
      }
    }, 10);
  });

  // 监听来自后台的页面总结请求
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'EXTRACT_PAGE_CONTENT') {
      const content = extractPageContent();
      sendResponse({ content: content, title: document.title });
    }
    return true;
  });

  function extractPageContent() {
    // 提取正文文本，去除脚本和样式
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, iframe, svg').forEach(el => el.remove());
    let text = clone.innerText || clone.textContent || '';
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text.substring(0, 8000);
  }
})();
