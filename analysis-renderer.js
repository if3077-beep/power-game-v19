/**
 * AnalysisRenderer - 分析结果渲染器
 * 将 AnalysisEngine 的输出渲染为可视化 HTML
 *
 * 用法：
 *   const renderer = new AnalysisRenderer({ container: '#analysis-output' });
 *   renderer.render(analysisResult);
 */

class AnalysisRenderer {
  constructor(config = {}) {
    this.container = typeof config.container === 'string'
      ? document.querySelector(config.container)
      : config.container;
    this.theme = config.theme || 'dark';
    this.onOptionClick = config.onOptionClick || null;
  }

  /**
   * 渲染完整分析结果
   */
  render(result) {
    if (!this.container) {
      console.error('AnalysisRenderer: container not found');
      return;
    }

    const html = [
      this._renderChainOfThought(result.chainOfThought),
      this._renderFrameworkInsights(result.frameworks),
      this._renderOptions(result.options),
      this._renderTensions(result.tensions),
      this._renderSummary(result.summary),
    ].join('');

    this.container.innerHTML = html;
    this._attachEvents();
    this._animateIn();
  }

  /**
   * 仅渲染链式推理（轻量模式）
   */
  renderChainOnly(result) {
    if (!this.container) return;
    this.container.innerHTML = this._renderChainOfThought(result.chainOfThought);
    this._animateIn();
  }

  /**
   * 仅渲染选项评分
   */
  renderOptionsOnly(result) {
    if (!this.container) return;
    this.container.innerHTML = this._renderOptions(result.options);
    this._attachEvents();
    this._animateIn();
  }

  // ------ 链式推理 ------
  _renderChainOfThought(steps) {
    if (!steps || steps.length === 0) return '';

    const stepsHtml = steps.map((s, i) => `
      <div class="ae-step" style="animation-delay:${i * 0.15}s">
        <div class="ae-step-num">${s.step}</div>
        <div class="ae-step-body">
          <div class="ae-step-label">${s.icon} ${s.label}</div>
          <div class="ae-step-content">${s.content}</div>
          ${s.subtext ? `<div class="ae-step-subtext">${s.subtext}</div>` : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="ae-section ae-chain">
        <div class="ae-section-title">推理链</div>
        <div class="ae-steps">${stepsHtml}</div>
      </div>
    `;
  }

  // ------ 框架洞察 ------
  _renderFrameworkInsights(frameworks) {
    if (!frameworks) return '';

    const cards = Object.entries(frameworks).map(([key, fw]) => {
      if (!fw.insights || fw.insights.length === 0) return '';

      const insightsHtml = fw.insights.map(insight => {
        let extra = '';
        if (insight.strategies) {
          extra = `<div class="ae-strategies">
            ${insight.strategies.map(s => `
              <div class="ae-strategy ae-fit-${s.fit}">
                <span class="ae-strategy-name">${s.name}</span>
                <span class="ae-strategy-desc">${s.desc}</span>
              </div>
            `).join('')}
          </div>`;
        }
        if (insight.patterns) {
          const patternNames = {
            guilt: '愧疚诱导', gaslighting: '煤气灯效应', silent_treatment: '冷暴力',
            love_bombing: '爱意轰炸', triangulation: '三角化', moving_goalpost: '移动球门',
          };
          extra = `<div class="ae-patterns">
            ${insight.patterns.map(p => `<span class="ae-pattern-tag">${patternNames[p] || p}</span>`).join('')}
          </div>`;
        }
        return `
          <div class="ae-insight ae-severity-${insight.severity}">
            <div class="ae-insight-text">${insight.text}</div>
            ${extra}
          </div>
        `;
      }).join('');

      return `
        <div class="ae-framework-card">
          <div class="ae-framework-header">
            <span class="ae-framework-icon">${fw.icon}</span>
            <span class="ae-framework-name">${fw.name}</span>
          </div>
          <div class="ae-framework-insights">${insightsHtml}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="ae-section ae-frameworks">
        <div class="ae-section-title">多维透视</div>
        <div class="ae-framework-grid">${cards}</div>
      </div>
    `;
  }

  // ------ 选项评分 ------
  _renderOptions(options) {
    if (!options || options.length === 0) return '';

    const optionsHtml = options.map((opt, i) => {
      const rank = i === 0 ? 'ae-rank-best' : (i === options.length - 1 ? 'ae-rank-worst' : '');

      const scoresHtml = Object.entries(opt.scores).map(([fw, score]) => {
        const barWidth = Math.max(5, ((score.score + 3) / 8) * 100);
        const barColor = score.score > 1 ? 'var(--ae-green)' : score.score < -1 ? 'var(--ae-red)' : 'var(--ae-yellow)';
        return `
          <div class="ae-score-row">
            <span class="ae-score-label">${score.dimension}</span>
            <div class="ae-score-bar-bg">
              <div class="ae-score-bar" style="width:${barWidth}%;background:${barColor}"></div>
            </div>
            <span class="ae-score-val">${score.score > 0 ? '+' : ''}${score.score}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="ae-option ${rank}" data-option-id="${opt.id}">
          <div class="ae-option-header">
            <span class="ae-option-rank">#${i + 1}</span>
            <span class="ae-option-text">${opt.text}</span>
            <span class="ae-option-total">${opt.totalScore > 0 ? '+' : ''}${opt.totalScore}</span>
          </div>
          <div class="ae-option-profile">${opt.profile}</div>
          <div class="ae-option-scores">${scoresHtml}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="ae-section ae-options">
        <div class="ae-section-title">选项评估</div>
        <div class="ae-options-list">${optionsHtml}</div>
      </div>
    `;
  }

  // ------ 核心张力 ------
  _renderTensions(tensions) {
    if (!tensions || tensions.length === 0) return '';

    const items = tensions.map(t => `
      <div class="ae-tension">
        <div class="ae-tension-label">${t.label}</div>
        <div class="ae-tension-text">${t.text}</div>
      </div>
    `).join('');

    return `
      <div class="ae-section ae-tensions">
        <div class="ae-section-title">核心张力</div>
        ${items}
      </div>
    `;
  }

  // ------ 总结 ------
  _renderSummary(summary) {
    if (!summary || summary.length === 0) return '';

    const parts = summary.map(s => `
      <div class="ae-summary-part">
        <div class="ae-summary-label">${s.label}</div>
        <div class="ae-summary-content">${s.content}</div>
      </div>
    `).join('');

    return `
      <div class="ae-section ae-summary">
        <div class="ae-section-title">总结</div>
        ${parts}
      </div>
    `;
  }

  // ------ 事件绑定 ------
  _attachEvents() {
    if (!this.onOptionClick) return;
    this.container.querySelectorAll('.ae-option').forEach(el => {
      el.addEventListener('click', () => {
        this.onOptionClick(el.dataset.optionId);
      });
    });
  }

  // ------ 入场动画 ------
  _animateIn() {
    const sections = this.container.querySelectorAll('.ae-section');
    sections.forEach((s, i) => {
      s.style.opacity = '0';
      s.style.transform = 'translateY(20px)';
      setTimeout(() => {
        s.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        s.style.opacity = '1';
        s.style.transform = 'translateY(0)';
      }, i * 150);
    });
  }
}


// ============================================================
//  默认样式注入
//  如果你有自己的样式，可以在 config 中设置 injectStyles: false
// ============================================================

function injectAnalysisStyles() {
  if (document.getElementById('ae-styles')) return;

  const style = document.createElement('style');
  style.id = 'ae-styles';
  style.textContent = `
    /* ====== Analysis Engine Styles ====== */
    :root {
      --ae-bg: #0a0a0a;
      --ae-surface: rgba(255,255,255,0.03);
      --ae-border: rgba(255,255,255,0.08);
      --ae-text: #e8e4de;
      --ae-muted: #6b6560;
      --ae-accent: #c9a96e;
      --ae-green: #6b8f71;
      --ae-red: #c45c4a;
      --ae-yellow: #b8a04e;
      --ae-blue: #5a7fa0;
    }

    .ae-section {
      margin-bottom: 2.5rem;
    }

    .ae-section-title {
      font-size: 0.65rem;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--ae-accent);
      margin-bottom: 1.2rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--ae-border);
    }

    /* ------ Chain of Thought ------ */
    .ae-steps {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .ae-step {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.2rem;
      background: var(--ae-surface);
      border: 1px solid var(--ae-border);
      border-left: 3px solid var(--ae-accent);
      opacity: 0;
      transform: translateY(20px);
      animation: ae-fadeIn 0.5s ease forwards;
    }

    .ae-step-num {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ae-accent);
      border: 1px solid var(--ae-accent);
      border-radius: 50%;
    }

    .ae-step-label {
      font-size: 0.75rem;
      color: var(--ae-accent);
      letter-spacing: 0.1em;
      margin-bottom: 0.4rem;
    }

    .ae-step-content {
      font-size: 0.85rem;
      line-height: 1.8;
      color: var(--ae-text);
      white-space: pre-line;
    }

    .ae-step-subtext {
      font-size: 0.7rem;
      color: var(--ae-muted);
      margin-top: 0.4rem;
      font-style: italic;
    }

    /* ------ Framework Cards ------ */
    .ae-framework-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .ae-framework-card {
      background: var(--ae-surface);
      border: 1px solid var(--ae-border);
      padding: 1.2rem;
      transition: border-color 0.3s;
    }

    .ae-framework-card:hover {
      border-color: rgba(255,255,255,0.15);
    }

    .ae-framework-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 1rem;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid var(--ae-border);
    }

    .ae-framework-icon {
      font-size: 1.2rem;
    }

    .ae-framework-name {
      font-size: 0.8rem;
      color: var(--ae-accent);
      letter-spacing: 0.15em;
    }

    .ae-insight {
      margin-bottom: 0.8rem;
      padding: 0.8rem;
      background: rgba(255,255,255,0.02);
      border-left: 2px solid transparent;
    }

    .ae-insight.ae-severity-high {
      border-left-color: var(--ae-red);
    }

    .ae-insight.ae-severity-medium {
      border-left-color: var(--ae-yellow);
    }

    .ae-insight.ae-severity-low {
      border-left-color: var(--ae-muted);
    }

    .ae-insight-text {
      font-size: 0.8rem;
      line-height: 1.8;
      color: var(--ae-text);
    }

    .ae-strategies {
      margin-top: 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .ae-strategy {
      display: flex;
      gap: 0.5rem;
      font-size: 0.7rem;
      padding: 0.4rem 0.6rem;
      background: rgba(255,255,255,0.02);
    }

    .ae-strategy.ae-fit-high {
      border-left: 2px solid var(--ae-green);
    }

    .ae-strategy.ae-fit-medium {
      border-left: 2px solid var(--ae-yellow);
    }

    .ae-strategy.ae-fit-low {
      border-left: 2px solid var(--ae-red);
    }

    .ae-strategy-name {
      color: var(--ae-accent);
      white-space: nowrap;
    }

    .ae-strategy-desc {
      color: var(--ae-muted);
    }

    .ae-patterns {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    .ae-pattern-tag {
      font-size: 0.65rem;
      padding: 0.2rem 0.5rem;
      background: rgba(196,92,74,0.15);
      color: var(--ae-red);
      border: 1px solid rgba(196,92,74,0.3);
    }

    /* ------ Options ------ */
    .ae-options-list {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .ae-option {
      background: var(--ae-surface);
      border: 1px solid var(--ae-border);
      padding: 1.2rem;
      cursor: pointer;
      transition: all 0.3s;
    }

    .ae-option:hover {
      background: rgba(255,255,255,0.05);
      transform: translateX(4px);
    }

    .ae-option.ae-rank-best {
      border-left: 3px solid var(--ae-green);
    }

    .ae-option.ae-rank-worst {
      border-left: 3px solid var(--ae-red);
    }

    .ae-option-header {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 0.5rem;
    }

    .ae-option-rank {
      font-size: 0.65rem;
      color: var(--ae-muted);
      letter-spacing: 0.1em;
    }

    .ae-option-text {
      flex: 1;
      font-size: 0.9rem;
      color: var(--ae-text);
    }

    .ae-option-total {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ae-accent);
    }

    .ae-option-profile {
      font-size: 0.7rem;
      color: var(--ae-muted);
      margin-bottom: 0.8rem;
      padding-left: 1.5rem;
    }

    .ae-option-scores {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .ae-score-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .ae-score-label {
      width: 80px;
      font-size: 0.65rem;
      color: var(--ae-muted);
      text-align: right;
      flex-shrink: 0;
    }

    .ae-score-bar-bg {
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.05);
      overflow: hidden;
    }

    .ae-score-bar {
      height: 100%;
      transition: width 0.8s ease;
    }

    .ae-score-val {
      width: 30px;
      font-size: 0.65rem;
      color: var(--ae-muted);
      text-align: right;
    }

    /* ------ Tensions ------ */
    .ae-tension {
      padding: 1rem 1.2rem;
      background: var(--ae-surface);
      border: 1px solid var(--ae-border);
      border-left: 3px solid var(--ae-red);
      margin-bottom: 0.6rem;
    }

    .ae-tension-label {
      font-size: 0.7rem;
      color: var(--ae-red);
      letter-spacing: 0.15em;
      margin-bottom: 0.4rem;
    }

    .ae-tension-text {
      font-size: 0.8rem;
      line-height: 1.8;
      color: var(--ae-text);
    }

    /* ------ Summary ------ */
    .ae-summary-part {
      padding: 1rem 1.2rem;
      background: var(--ae-surface);
      border: 1px solid var(--ae-border);
      margin-bottom: 0.6rem;
    }

    .ae-summary-label {
      font-size: 0.7rem;
      color: var(--ae-accent);
      letter-spacing: 0.15em;
      margin-bottom: 0.4rem;
    }

    .ae-summary-content {
      font-size: 0.85rem;
      line-height: 1.8;
      color: var(--ae-text);
    }

    /* ------ Animations ------ */
    @keyframes ae-fadeIn {
      to { opacity: 1; transform: translateY(0); }
    }

    /* ------ Responsive ------ */
    @media (max-width: 600px) {
      .ae-framework-grid {
        grid-template-columns: 1fr;
      }
      .ae-score-label {
        width: 60px;
      }
    }
  `;

  document.head.appendChild(style);
}

// 自动注入样式
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAnalysisStyles);
  } else {
    injectAnalysisStyles();
  }
}


// ============================================================
//  快捷函数：一行代码完成分析+渲染
// ============================================================

/**
 * 快捷分析函数
 * @param {string} selector - CSS选择器
 * @param {Object} input - 分析输入（同 AnalysisEngine.analyze）
 * @param {Object} config - 可选配置
 * @returns {Object} 分析结果
 */
function quickAnalyze(selector, input, config = {}) {
  const engine = new AnalysisEngine(config);
  const result = engine.analyze(input);

  const renderer = new AnalysisRenderer({
    container: selector,
    ...config,
  });
  renderer.render(result);

  return result;
}


window.AnalysisRenderer = AnalysisRenderer;
window.quickAnalyze = quickAnalyze;
