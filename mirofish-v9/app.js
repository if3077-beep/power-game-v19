/**
 * MiroFish v9 — 滚动叙事主应用
 * IntersectionObserver 触发 / 命运河流 Canvas / 心理画像雷达图
 * 动画计数器 / 决策矩阵 / 毒舌转折 / 投票弹窗
 */

class App {
  constructor() {
    this.engine = new PredictionEngine();
    this.selectedMood = null;
    this.selectedFactors = new Set();
    this.lastResult = null;
    this.twistState = {};
    this.animCounters = new Set();

    this.init();
  }

  init() {
    this.setupDailyQuote();
    this.setupInput();
    this.setupMoodSelector();
    this.setupFactors();
    this.setupControls();
    this.setupRandomDilemma();
    this.setupScrollObserver();
    this.setupActions();
  }

  // ===== Daily Quote =====
  setupDailyQuote() {
    const el = document.getElementById('dailyQuote');
    if (!el) return;
    const today = new Date();
    const idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % DAILY_QUOTES.length;
    const q = DAILY_QUOTES[idx];
    el.innerHTML = `"${q.text}"<span class="quote-author">-- ${q.author}</span>`;
  }

  // ===== Input =====
  setupInput() {
    const textarea = document.getElementById('userInput');
    const btn = document.getElementById('btnAnalyze');
    if (!textarea || !btn) return;

    textarea.addEventListener('input', () => {
      btn.disabled = textarea.value.trim().length === 0;
    });

    btn.addEventListener('click', () => {
      if (textarea.value.trim()) this.startAnalysis();
    });
  }

  // ===== Mood Selector =====
  setupMoodSelector() {
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMood = btn.dataset.mood;
      });
    });
  }

  // ===== Factors =====
  setupFactors() {
    document.querySelectorAll('.factor-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const f = chip.dataset.factor;
        if (this.selectedFactors.has(f)) {
          this.selectedFactors.delete(f);
          chip.classList.remove('active');
        } else {
          this.selectedFactors.add(f);
          chip.classList.add('active');
        }
      });
    });
  }

  // ===== Controls =====
  setupControls() {
    const sliders = [
      { id: 'slScope', valId: 'valScope', labels: SCOPE_LABELS },
      { id: 'slIntensity', valId: 'valIntensity', labels: INTENSITY_LABELS },
      { id: 'slTime', valId: 'valTime', labels: TIME_LABELS },
      { id: 'slUncertainty', valId: 'valUncertainty', labels: UNCERTAINTY_LABELS },
    ];
    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      const val = document.getElementById(s.valId);
      if (el && val) {
        el.addEventListener('input', () => { val.textContent = s.labels[el.value]; });
      }
    });
  }

  // ===== Random Dilemma =====
  setupRandomDilemma() {
    const btn = document.getElementById('btnRandom');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const dilemma = RANDOM_DILEMMAS[Math.floor(Math.random() * RANDOM_DILEMMAS.length)];
      const textarea = document.getElementById('userInput');
      textarea.value = dilemma;
      textarea.dispatchEvent(new Event('input'));
    });
  }

  // ===== Scroll Observer =====
  setupScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Trigger animated counters
          if (entry.target.querySelector('.stat-value[data-target]')) {
            this.animateCounters(entry.target);
          }
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.section').forEach(s => observer.observe(s));
  }

  // ===== Animated Counters =====
  animateCounters(container) {
    container.querySelectorAll('.stat-value[data-target]').forEach(el => {
      if (this.animCounters.has(el)) return;
      this.animCounters.add(el);

      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = 1500;
      const start = performance.now();

      const animate = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;

        if (Number.isInteger(target)) {
          el.textContent = Math.round(current);
        } else {
          el.textContent = current.toFixed(1);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          el.textContent = Number.isInteger(target) ? target : target.toFixed(1);
          const suffixEl = el.nextElementSibling;
          if (suffixEl && suffixEl.classList.contains('stat-suffix')) {
            suffixEl.textContent = suffix;
          }
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // ===== Start Analysis =====
  async startAnalysis() {
    const text = document.getElementById('userInput').value;
    const mood = this.selectedMood || 'neutral';
    const scope = parseInt(document.getElementById('slScope')?.value || 3);
    const intensity = parseInt(document.getElementById('slIntensity')?.value || 3);
    const timeScale = parseInt(document.getElementById('slTime')?.value || 3);
    const uncertainty = parseInt(document.getElementById('slUncertainty')?.value || 3);
    const factors = [...this.selectedFactors];

    // Show loading
    const loading = document.getElementById('loadingOverlay');
    const progressEl = document.getElementById('loadingProgress');
    const textEl = document.getElementById('loadingText');
    const insightEl = document.getElementById('loadingInsightText');
    loading.classList.add('active');

    const insights = LOADING_INSIGHTS;
    let insightIdx = Math.floor(Math.random() * insights.length);
    const insightTimer = setInterval(() => {
      insightEl.textContent = insights[insightIdx % insights.length];
      insightIdx++;
    }, 3000);
    insightEl.textContent = insights[insightIdx % insights.length];

    try {
      const result = await this.engine.run(text, mood, scope, intensity, timeScale, uncertainty, factors,
        (step, msg, progress) => {
          textEl.textContent = msg;
          progressEl.style.width = progress + '%';
        }
      );

      this.lastResult = result;
      this.twistState = {};

      clearInterval(insightTimer);
      loading.classList.remove('active');

      this.renderResults(result);
      this.showResultsSection();

    } catch (err) {
      console.error('Analysis failed:', err);
      clearInterval(insightTimer);
      loading.classList.remove('active');
      alert('分析出错，请重试');
    }
  }

  // ===== Show Results Section =====
  showResultsSection() {
    const results = document.getElementById('results');
    if (results) {
      results.classList.remove('hidden');
      // Re-observe all sections now that they're visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.querySelector('.stat-value[data-target]')) {
              this.animateCounters(entry.target);
            }
          }
        });
      }, { threshold: 0.15 });
      results.querySelectorAll('.section').forEach(s => observer.observe(s));
      results.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ===== Render All Results =====
  renderResults(result) {
    this.renderEmpathy(result);
    this.renderRiver(result);
    this.renderPaths(result);
    this.renderRadar(result);
    this.renderStats(result);
    this.renderDecisionMatrix(result);
    this.renderReadingCards(result);
    this.renderPsychology(result);
    this.renderAdvice(result);
    this.renderAnalysis(result);
    this.setupTwistButtons(result);
    this.setupVotePopup(result);
  }

  // ===== Empathy =====
  renderEmpathy(result) {
    const el = document.getElementById('empathyText');
    if (el) el.textContent = result.empathy || '';
    const tag = document.getElementById('domainTag');
    if (tag) tag.textContent = result.domain || '日常';
  }

  // ===== River of Fate Canvas =====
  renderRiver(result) {
    const canvas = document.getElementById('riverCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const opt = result.optimistic.probability / 100;
    const neu = result.neutral.probability / 100;
    const pess = result.pessimistic.probability / 100;

    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
    bgGrad.addColorStop(0, 'rgba(168, 85, 247, 0.03)');
    bgGrad.addColorStop(1, 'rgba(34, 211, 238, 0.03)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Draw three flowing streams
    const streams = [
      { prob: opt, color: '#34d399', label: '乐观', yBase: H * 0.25 },
      { prob: neu, color: '#f59e0b', label: '中性', yBase: H * 0.5 },
      { prob: pess, color: '#ef4444', label: '悲观', yBase: H * 0.75 },
    ];

    const time = performance.now() / 1000;

    streams.forEach(stream => {
      const width = Math.max(8, stream.prob * 60);

      // Draw flowing stream
      ctx.beginPath();
      ctx.moveTo(0, stream.yBase);

      for (let x = 0; x <= W; x += 2) {
        const wave1 = Math.sin(x * 0.015 + time * 1.5) * 8;
        const wave2 = Math.sin(x * 0.008 + time * 0.8 + 1) * 5;
        const y = stream.yBase + wave1 + wave2;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = stream.color;
      ctx.lineWidth = width;
      ctx.globalAlpha = 0.3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow effect
      ctx.strokeStyle = stream.color;
      ctx.lineWidth = width * 0.4;
      ctx.globalAlpha = 0.6;
      ctx.stroke();

      ctx.globalAlpha = 1;

      // Draw particles along stream
      for (let i = 0; i < 6; i++) {
        const px = ((time * 40 + i * W / 6) % (W + 20)) - 10;
        const wave1 = Math.sin(px * 0.015 + time * 1.5) * 8;
        const wave2 = Math.sin(px * 0.008 + time * 0.8 + 1) * 5;
        const py = stream.yBase + wave1 + wave2;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = stream.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Label
      ctx.fillStyle = stream.color;
      ctx.globalAlpha = 0.7;
      ctx.font = '12px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${stream.label} ${Math.round(stream.prob * 100)}%`, 12, stream.yBase - width / 2 - 8);
      ctx.globalAlpha = 1;
    });

    // Animate
    if (!this._riverAnimating) {
      this._riverAnimating = true;
      const animateRiver = () => {
        if (this.lastResult) this.renderRiver(this.lastResult);
        this._riverRAF = requestAnimationFrame(animateRiver);
      };
      animateRiver();
    }
  }

  // ===== Path Cards =====
  renderPaths(result) {
    const paths = [
      { key: 'optimistic', data: result.optimistic, label: '乐观路径', color: 'optimistic' },
      { key: 'neutral', data: result.neutral, label: '中性路径', color: 'neutral' },
      { key: 'pessimistic', data: result.pessimistic, label: '悲观路径', color: 'pessimistic' },
    ];

    paths.forEach(p => {
      const card = document.getElementById(`path-${p.key}`);
      if (!card) return;

      let html = `
        <div class="path-label">${p.label}</div>
        <div class="path-title">${p.data.title}</div>
        <div class="probability" data-target="${p.data.probability}" data-suffix="%">0</div>
        <div class="prob-label">概率</div>
      `;

      if (p.data.driving_factors?.length) {
        html += `<ul class="factors-list">${p.data.driving_factors.map(f => `<li>${f}</li>`).join('')}</ul>`;
      }

      if (p.data.timeline?.length) {
        html += `<div class="timeline">${p.data.timeline.map(t => `
          <div class="timeline-item">
            <div class="period">${t.period}</div>
            <div class="event">${t.event}</div>
          </div>
        `).join('')}</div>`;
      }

      if (p.data.chain_effects?.length) {
        html += `<div style="margin-bottom:12px"><div style="font-size:0.75rem;color:var(--accent-cyan);font-weight:600;margin-bottom:6px">连锁效应</div><ul class="factors-list">${p.data.chain_effects.map(e => `<li>${e}</li>`).join('')}</ul></div>`;
      }

      if (p.data.risks?.length) {
        html += `<div style="margin-bottom:12px"><div style="font-size:0.75rem;color:var(--accent-red);font-weight:600;margin-bottom:6px">风险</div><ul class="factors-list">${p.data.risks.map(r => `<li>${r}</li>`).join('')}</ul></div>`;
      }

      html += `<button class="btn-twist" id="twist-${p.key}">毒舌一下</button>`;
      html += `<div class="twist-text" id="twist-text-${p.key}"></div>`;

      card.innerHTML = html;

      // Animate probability counter
      setTimeout(() => {
        const probEl = card.querySelector('.probability');
        if (probEl) this.animateSingleCounter(probEl);
      }, 300);
    });
  }

  animateSingleCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(animate);
      else el.textContent = target + suffix;
    };

    requestAnimationFrame(animate);
  }

  // ===== Radar Chart Canvas =====
  renderRadar(result) {
    if (!result.profile) return;
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 110;
    const dims = Object.keys(PROFILE_DIMENSIONS);
    const n = dims.length;
    const angleStep = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);

    // Draw grid rings
    for (let ring = 1; ring <= 4; ring++) {
      const r = (radius * ring) / 4;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = '#8888a0';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    dims.forEach((key, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const labelR = radius + 20;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);
      ctx.fillText(PROFILE_DIMENSIONS[key].label, x, y);
    });

    // Draw data polygon
    const values = dims.map(key => result.profile[key] || 0.5);

    ctx.beginPath();
    values.forEach((v, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * v;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Fill
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw dots
    values.forEach((v, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * v;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.fill();
      ctx.strokeStyle = '#0a0a0f';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Render legend
    const legend = document.getElementById('radarLegend');
    if (legend) {
      legend.innerHTML = dims.map(key => {
        const dim = PROFILE_DIMENSIONS[key];
        const val = Math.round((result.profile[key] || 0.5) * 100);
        const desc = val > 60 ? dim.high : (val < 40 ? dim.low : '居中');
        return `
          <div class="radar-legend-item">
            <span class="dim-label">${dim.label}</span>
            <div class="dim-bar"><div class="dim-bar-fill" style="width:${val}%"></div></div>
            <span class="dim-value">${val}%</span>
            <span class="dim-desc">${desc}</span>
          </div>
        `;
      }).join('');
    }
  }

  // ===== Stats =====
  renderStats(result) {
    const grid = document.getElementById('statsGrid');
    if (!grid || !result.stats) return;

    grid.innerHTML = result.stats.map(s => `
      <div class="stat-card">
        <div>
          <span class="stat-value" data-target="${s.value}" data-suffix="${s.suffix}">0</span>
          <span class="stat-suffix"></span>
        </div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-desc">${s.desc}</div>
        <div class="stat-source">${s.source}</div>
      </div>
    `).join('');

    // Trigger counter animation directly (IntersectionObserver may miss already-visible elements)
    const statsSection = grid.closest('.section');
    if (statsSection) {
      setTimeout(() => this.animateCounters(statsSection), 500);
    }
  }

  // ===== Decision Matrix =====
  renderDecisionMatrix(result) {
    const container = document.getElementById('decisionMatrix');
    if (!container || !result.analysis?.options) return;

    const options = result.analysis.options;
    if (options.length === 0) return;

    const dims = options[0]?.scores?.map(s => s.dim) || [];

    let html = `<table class="matrix-table">
      <thead><tr>
        <th>选项</th>
        ${dims.map(d => `<th>${d}</th>`).join('')}
        <th>总分</th>
      </tr></thead><tbody>`;

    options.forEach(opt => {
      html += `<tr>
        <td class="option-name">${opt.text}</td>
        ${opt.scores.map(s => {
          const cls = s.score > 1 ? 'score-positive' : s.score < -1 ? 'score-negative' : 'score-neutral';
          return `<td class="score-cell ${cls}">${s.score > 0 ? '+' : ''}${s.score}</td>`;
        }).join('')}
        <td class="total-score" style="color:${opt.total > 0 ? 'var(--accent-green)' : opt.total < 0 ? 'var(--accent-red)' : 'var(--accent-orange)'}">${opt.total > 0 ? '+' : ''}${opt.total}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ===== Reading Cards =====
  renderReadingCards(result) {
    const grid = document.getElementById('readingCards');
    if (!grid || !result.readingCards) return;

    grid.innerHTML = result.readingCards.map(c => `
      <div class="reading-card">
        <div class="card-type ${c.type}">${c.icon}</div>
        <div class="card-title">${c.title}</div>
        <div class="card-content">${c.content}</div>
        ${c.source ? `<div class="card-source">${c.source}</div>` : ''}
      </div>
    `).join('');
  }

  // ===== Psychology =====
  renderPsychology(result) {
    const card = document.getElementById('psychologyCard');
    if (!card || !result.psychology) return;

    card.innerHTML = `
      <div class="psych-title">${result.psychology.title}</div>
      <div class="psych-content">${result.psychology.content}</div>
    `;
  }

  // ===== Advice =====
  renderAdvice(result) {
    const list = document.getElementById('adviceList');
    if (!list || !result.advice) return;

    list.innerHTML = result.advice.map(a => `
      <div class="advice-item">
        <div class="advice-icon">${(a.icon || 'tip').substring(0, 2).toUpperCase()}</div>
        <div class="advice-text">${a.text}</div>
      </div>
    `).join('');
  }

  // ===== Analysis =====
  renderAnalysis(result) {
    const container = document.getElementById('analysisContent');
    if (!container || !result.analysis) return;

    const analysis = result.analysis;
    let html = '';

    // Chain
    if (analysis.chain?.length) {
      html += `<div class="chain-list">${analysis.chain.map((step, i) => `
        <div class="chain-item">
          <div class="chain-label">${step.label}</div>
          <div class="chain-content">${step.content}</div>
          ${step.sub ? `<div class="chain-sub">${step.sub}</div>` : ''}
        </div>
      `).join('')}</div>`;
    }

    // Tensions
    if (analysis.tensions?.length) {
      html += `<div class="tensions-list">${analysis.tensions.map(t => `
        <div class="tension-item">
          <div class="tension-label">${t.label}</div>
          <div class="tension-text">${t.text}</div>
        </div>
      `).join('')}</div>`;
    }

    container.innerHTML = html;
  }

  // ===== Twist Buttons =====
  setupTwistButtons(result) {
    ['optimistic', 'neutral', 'pessimistic'].forEach(key => {
      const btn = document.getElementById(`twist-${key}`);
      const textEl = document.getElementById(`twist-text-${key}`);
      if (!btn || !textEl) return;

      btn.addEventListener('click', () => {
        const twists = result.twists || TWIST_REPLACEMENTS.default;
        if (!this.twistState[key]) {
          const twist = twists[Math.floor(Math.random() * twists.length)];
          textEl.textContent = twist;
          textEl.classList.add('show');
          this.twistState[key] = true;
        } else {
          textEl.classList.remove('show');
          this.twistState[key] = false;
        }
      });
    });
  }

  // ===== Vote Popup =====
  setupVotePopup(result) {
    setTimeout(() => {
      const popup = document.getElementById('votePopup');
      if (!popup) return;

      popup.classList.add('active');

      const options = popup.querySelectorAll('.vote-option');
      options.forEach(opt => {
        opt.addEventListener('click', () => {
          options.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');

          setTimeout(() => {
            popup.classList.remove('active');
          }, 1500);
        });
      });

      const closeBtn = popup.querySelector('.vote-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => popup.classList.remove('active'));
      }
    }, 2000);
  }

  // ===== Actions =====
  setupActions() {
    const btnAgain = document.getElementById('btnAgain');
    if (btnAgain) {
      btnAgain.addEventListener('click', () => {
        document.getElementById('results')?.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const btnShare = document.getElementById('btnShare');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        if (!this.lastResult) return;
        const r = this.lastResult;
        const text = `MiroFish 未来推演\n\n${r.empathy}\n\n乐观 ${r.optimistic.probability}%：${r.optimistic.title}\n中性 ${r.neutral.probability}%：${r.neutral.title}\n悲观 ${r.pessimistic.probability}%：${r.pessimistic.title}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'));
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
