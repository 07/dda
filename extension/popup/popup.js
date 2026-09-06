// 多答AI - Popup 逻辑

const MODELS = [
  { id: 'doubao', name: '豆包', color: '#e8a33d' },
  { id: 'deepseek', name: 'DeepSeek', color: '#4a9eff' },
  { id: 'kimi', name: 'Kimi', color: '#7c5cff' },
  { id: 'glm', name: '智谱GLM', color: '#3db88a' }
];

let selectedModels = ['doubao', 'deepseek', 'kimi'];

// 渲染模型选择
function renderModels() {
  const list = document.getElementById('modelList');
  list.innerHTML = '';
  MODELS.forEach(m => {
    const chip = document.createElement('div');
    chip.className = 'model-chip' + (selectedModels.includes(m.id) ? ' active' : '');
    chip.textContent = m.name;
    chip.style.borderLeft = selectedModels.includes(m.id) ? '3px solid ' + m.color : '';
    chip.addEventListener('click', () => {
      const idx = selectedModels.indexOf(m.id);
      if (idx > -1) {
        if (selectedModels.length > 1) selectedModels.splice(idx, 1);
      } else {
        selectedModels.push(m.id);
      }
      chrome.storage.sync.set({ selectedModels: selectedModels });
      renderModels();
    });
    list.appendChild(chip);
  });
}

// 加载已保存的选择
chrome.storage.sync.get(['selectedModels'], (data) => {
  if (data.selectedModels) selectedModels = data.selectedModels;
  renderModels();
});

// 提问按钮
document.getElementById('askBtn').addEventListener('click', () => {
  const input = document.getElementById('questionInput');
  const query = input.value.trim();
  if (!query) {
    input.focus();
    return;
  }
  chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'SIDEBAR_QUERY',
      query: query,
      mode: 'ask'
    });
  }, 600);
  window.close();
});

// 打开侧边栏
document.getElementById('sidepanelBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
  window.close();
});

// 快捷操作
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'SIDEBAR_QUERY',
        query: '',
        mode: action
      });
    }, 600);
    window.close();
  });
});

// 回车提交（Ctrl+Enter）
document.getElementById('questionInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    document.getElementById('askBtn').click();
  }
});
