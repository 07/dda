// 多答AI - 侧边栏逻辑
// 多模型并行回答（演示版使用模拟响应，可在设置中填入真实API Key）

const MODELS = [
  { id: 'doubao', name: '豆包', color: '#e8a33d' },
  { id: 'deepseek', name: 'DeepSeek', color: '#4a9eff' },
  { id: 'kimi', name: 'Kimi', color: '#7c5cff' },
  { id: 'glm', name: '智谱GLM', color: '#3db88a' }
];

let selectedModels = ['doubao', 'deepseek', 'kimi'];
let activeModel = null;
let currentAnswers = {};

const contentArea = document.getElementById('contentArea');
const modelTabs = document.getElementById('modelTabs');
const queryInput = document.getElementById('queryInput');

// 加载设置
chrome.storage.sync.get(['selectedModels'], (data) => {
  if (data.selectedModels) selectedModels = data.selectedModels;
  renderModelTabs();
});

function renderModelTabs() {
  modelTabs.innerHTML = '';
  selectedModels.forEach(id => {
    const m = MODELS.find(x => x.id === id);
    if (!m) return;
    const tab = document.createElement('div');
    tab.className = 'model-tab' + (activeModel === id ? ' active' : '');
    tab.textContent = m.name;
    tab.style.borderLeft = '3px solid ' + m.color;
    tab.addEventListener('click', () => {
      activeModel = id;
      renderModelTabs();
      renderAnswers();
    });
    modelTabs.appendChild(tab);
  });
}

// 模拟AI回答（演示用）
function generateMockAnswer(modelId, query, mode) {
  const model = MODELS.find(m => m.id === modelId);
  const prefixes = {
    doubao: '【豆包回答】',
    deepseek: '【DeepSeek 回答】',
    kimi: '【Kimi 回答】',
    glm: '【智谱GLM 回答】'
  };

  let response = '';
  if (mode === 'summarize') {
    response = prefixes[modelId] + '\n\n这是当前页面的核心内容摘要：\n\n1. 页面主要讨论了相关主题的关键要点\n2. 作者提出了几个值得关注的观点\n3. 整体结构清晰，论据充分\n\n（注：这是演示版本的模拟回答。在扩展设置中填入各模型的 API Key 后，将获得真实的AI回答。）';
  } else if (mode === 'translate') {
    response = prefixes[modelId] + '\n\n翻译结果：\n\n"' + query + '"\n\n（注：这是演示版本。填入 API Key 后可获得真实翻译。）';
  } else {
    response = prefixes[modelId] + '\n\n关于"' + query + '"这个问题：\n\n这是一个很好的问题。从多个角度来看：\n\n首先，需要理解问题的核心要点。\n其次，可以从不同维度进行分析。\n最后，综合各方面因素得出结论。\n\n（注：这是演示版本的模拟回答。请在扩展设置中填入各模型的 API Key，即可获得真实的AI回答并进行多模型对比。）';
  }
  return response;
}

// 发送查询
async function sendQuery(query, mode) {
  if (!query && mode !== 'summarize') return;

  // 如果是总结模式，先提取页面内容
  if (mode === 'summarize') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        const result = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE_CONTENT' });
        if (result && result.content) {
          query = '请总结以下页面内容：\n\n' + result.content.substring(0, 3000);
        }
      } catch (e) {
        query = '请总结当前页面内容';
      }
    }
  }

  // 显示查询
  contentArea.innerHTML = '<div class="query-block">' + escapeHtml(query.substring(0, 200)) + '</div>';
  currentAnswers = {};

  // 逐个模型生成回答（模拟流式）
  selectedModels.forEach((modelId, index) => {
    const model = MODELS.find(m => m.id === modelId);
    const block = createAnswerBlock(model);
    contentArea.appendChild(block);

    setTimeout(() => {
      const answer = generateMockAnswer(modelId, query, mode);
      currentAnswers[modelId] = answer;
      block.querySelector('.answer-body').textContent = answer;
      block.querySelector('.answer-body').style.opacity = '1';
    }, 600 + index * 400);
  });
}

function createAnswerBlock(model) {
  const block = document.createElement('div');
  block.className = 'answer-block';
  block.innerHTML = `
    <div class="answer-header">
      <span class="answer-model-dot" style="background:${model.color}"></span>
      <span class="answer-model-name">${model.name}</span>
    </div>
    <div class="answer-body" style="opacity:0.4">正在思考中...</div>
  `;
  return block;
}

function renderAnswers() {
  // 当前实现是全部展示，activeModel 用于未来的单模型视图切换
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 监听来自后台的查询
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SIDEBAR_QUERY') {
    queryInput.value = msg.mode === 'summarize' ? '（总结当前页面）' : msg.query;
    sendQuery(msg.query, msg.mode);
  }
});

// 发送按钮
document.getElementById('sendBtn').addEventListener('click', () => {
  const q = queryInput.value.trim();
  if (q) sendQuery(q, 'ask');
});

queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    document.getElementById('sendBtn').click();
  }
});

// 清空
document.getElementById('clearBtn').addEventListener('click', () => {
  contentArea.innerHTML = `
    <div class="sp-welcome">
      <div class="welcome-icon">多</div>
      <h3>一个问题，多个答案</h3>
      <p>在任意网页选中文字，或在此输入问题，多个AI模型将同时为你作答。</p>
      <div class="welcome-tips">
        <div class="tip">选中文字 → 右键 → 多答AI提问</div>
        <div class="tip">点击插件图标 → 快速提问</div>
        <div class="tip">Ctrl+Enter 快捷发送</div>
      </div>
    </div>
  `;
  queryInput.value = '';
});
