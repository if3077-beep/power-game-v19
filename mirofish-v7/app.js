/**
 * MiroFish v7 - 主应用
 * 三口吻 + 精简路径 + 毒舌烂事 + 互动投票 + 不服从写
 */

class App {
  constructor() {
    this.engine = new PredictionEngine();
    this.selectedMood = null;
    this.selectedFactors = new Set();
    this.currentPhase = 'input';
    this.lastResult = null;
    this.insightTimer = null;
    this.selectedPersona = 'brutal';
    this.userVote = null;
    this.rating = 0;
    this.emojiState = { emojis: [], nextId: 0, selectedId: null, dragState: null, history: [], activeCategory: 0 };

    this.init();
  }

  init() {
    this.setupBgCanvas();
    this.setupInspiration();
    this.setupScenes();
    this.setupInput();
    this.setupMood();
    this.setupSliders();
    this.setupFactors();
    this.setupNav();
    this.setupPersona();
    this.setupExport();
  }

  // ===== 背景粒子 =====
  setupBgCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 45; i++) {
      particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 1.5 + 0.3, a: Math.random() * 0.15 + 0.02 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(139,92,246,${p.a})`; ctx.fill(); });
      for (let i = 0; i < particles.length; i++) { for (let j = i + 1; j < particles.length; j++) { const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y; const d = Math.sqrt(dx * dx + dy * dy); if (d < 120) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(139,92,246,${0.03 * (1 - d / 120)})`; ctx.lineWidth = 0.7; ctx.stroke(); } } }
      requestAnimationFrame(draw);
    };
    draw();
  }

  setupInspiration() {
    const today = new Date();
    const idx = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % DAILY_QUOTES.length;
    const quote = DAILY_QUOTES[idx];
    document.getElementById('inspirationText').textContent = quote.text;
    const authorEl = document.getElementById('inspirationAuthor');
    if (authorEl) authorEl.textContent = '— ' + quote.author;
  }

  setupScenes() {
    const track = document.getElementById('sceneTrack');
    document.querySelectorAll('.scene-card').forEach(card => {
      card.addEventListener('click', () => {
        document.getElementById('userInput').value = card.dataset.text;
        this.updateInputState();
        if (card.dataset.mood) {
          this.selectedMood = card.dataset.mood;
          document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));
          const chip = document.querySelector(`.mood-chip[data-mood="${card.dataset.mood}"]`);
          if (chip) chip.classList.add('selected');
        }
        audioSystem.play('click');
      });
    });
    let dir = 1;
    let auto = setInterval(() => { if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) dir = -1; if (track.scrollLeft <= 0) dir = 1; track.scrollBy({ left: dir * 0.8, behavior: 'auto' }); }, 30);
    track.addEventListener('mouseenter', () => clearInterval(auto));
    track.addEventListener('mouseleave', () => { auto = setInterval(() => { if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) dir = -1; if (track.scrollLeft <= 0) dir = 1; track.scrollBy({ left: dir * 0.8, behavior: 'auto' }); }, 30); });
  }

  setupInput() {
    const textarea = document.getElementById('userInput');
    textarea.addEventListener('input', () => this.updateInputState());
    document.getElementById('btnNext').addEventListener('click', () => {
      if (textarea.value.trim()) { audioSystem.play('transition'); this.goToPhase('calibrate'); this.analyzeInput(); }
    });
  }

  updateInputState() {
    const ta = document.getElementById('userInput');
    document.getElementById('btnNext').disabled = ta.value.trim().length === 0;
  }

  setupMood() {
    document.querySelectorAll('.mood-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedMood = chip.dataset.mood;
        audioSystem.play('click');
      });
    });
  }

  setupSliders() {
    const sliders = [
      { id: 'slScope', valId: 'valScope', labels: SCOPE_LABELS },
      { id: 'slIntensity', valId: 'valIntensity', labels: INTENSITY_LABELS },
      { id: 'slTime', valId: 'valTime', labels: TIME_LABELS },
      { id: 'slUncertainty', valId: 'valUncertainty', labels: UNCERTAINTY_LABELS },
    ];
    sliders.forEach(s => { const el = document.getElementById(s.id); const val = document.getElementById(s.valId); el.addEventListener('input', () => { val.textContent = s.labels[el.value]; }); });
  }

  setupFactors() {
    document.querySelectorAll('.factor-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const f = chip.dataset.factor;
        if (this.selectedFactors.has(f)) { this.selectedFactors.delete(f); chip.classList.remove('selected'); }
        else { this.selectedFactors.add(f); chip.classList.add('selected'); }
        audioSystem.play('click');
      });
    });
  }

  setupNav() {
    document.getElementById('btnBack').addEventListener('click', () => { audioSystem.play('click'); this.goToPhase('input'); });
    document.getElementById('btnStart').addEventListener('click', () => this.startSimulation());
    document.getElementById('btnNew').addEventListener('click', () => { audioSystem.play('click'); this.reset(); this.goToPhase('input'); });
  }

  setupPersona() {
    document.querySelectorAll('.persona-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.persona-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedPersona = btn.dataset.persona;
        audioSystem.play('click');
      });
    });
  }

  analyzeInput() {
    const text = document.getElementById('userInput').value;
    const keywords = this.engine.extractKeywords(text);
    document.getElementById('keywordCloud').innerHTML = keywords.map(k => `<span class="keyword-tag">${k.icon} ${k.tag} · ${k.words.join('、')}</span>`).join('');
    this.selectedFactors.clear();
    document.querySelectorAll('.factor-chip').forEach(c => c.classList.remove('selected'));
    const autoMap = { media: /朋友圈|微博|抖音|群里|社交/, family: /父母|家人|亲戚|家庭/, peer: /同事|朋友|同学|大家/, money: /钱|工资|投资|房贷|亏|赚/, reputation: /面子|别人怎么看|丢人/, time: /急|赶|截止|来不及|马上/, health: /身体|健康|生病|失眠|疲劳/ };
    for (const [f, re] of Object.entries(autoMap)) { if (re.test(text)) { this.selectedFactors.add(f); const chip = document.querySelector(`.factor-chip[data-factor="${f}"]`); if (chip) chip.classList.add('selected'); } }
  }

  startInsightRotation() {
    const container = document.getElementById('loadingInsights');
    if (!container) return;
    container.innerHTML = '';
    let idx = Math.floor(Math.random() * LOADING_INSIGHTS.length);
    const show = () => { const insight = LOADING_INSIGHTS[idx % LOADING_INSIGHTS.length]; container.innerHTML = `<div class="loading-insight"><span class="loading-insight-icon">${insight.icon}</span><span>${insight.text}</span></div>`; idx++; };
    show();
    this.insightTimer = setInterval(show, 4000);
  }

  stopInsightRotation() { if (this.insightTimer) { clearInterval(this.insightTimer); this.insightTimer = null; } }

  async startSimulation() {
    const text = document.getElementById('userInput').value;
    const mood = this.selectedMood || 'neutral';
    const scope = parseInt(document.getElementById('slScope').value);
    const intensity = parseInt(document.getElementById('slIntensity').value);
    const timeScale = parseInt(document.getElementById('slTime').value);
    const uncertainty = parseInt(document.getElementById('slUncertainty').value);
    const factors = [...this.selectedFactors];
    const persona = this.selectedPersona;

    audioSystem.play('scan');
    this.goToPhase('simulate');

    const stepsEl = document.getElementById('simSteps');
    stepsEl.innerHTML = '';
    document.getElementById('empathyText').textContent = '';
    document.getElementById('simProgressBar').style.width = '0%';

    this.startInsightRotation();

    try {
      const result = await this.engine.run(text, mood, scope, intensity, timeScale, uncertainty, factors, persona,
        (step, msg, progress) => {
          document.getElementById('simProgressBar').style.width = progress + '%';
          const stepEl = document.createElement('div');
          stepEl.className = 'sim-step active';
          stepEl.innerHTML = `<span class="sim-step-icon">⟳</span><span>${msg}</span>`;
          stepsEl.appendChild(stepEl);
          const prev = stepsEl.querySelectorAll('.sim-step');
          if (prev.length > 1) { const p = prev[prev.length - 2]; p.classList.remove('active'); p.classList.add('done'); p.querySelector('.sim-step-icon').textContent = '✓'; }
        }
      );

      this.lastResult = result;
      this.userVote = null;
      this.rating = 0;

      const allSteps = stepsEl.querySelectorAll('.sim-step');
      if (allSteps.length > 0) { const last = allSteps[allSteps.length - 1]; last.classList.remove('active'); last.classList.add('done'); last.querySelector('.sim-step-icon').textContent = '✓'; }
      if (result.empathy) document.getElementById('empathyText').textContent = result.empathy;

      await this.delay(800);
      this.stopInsightRotation();
      this.showResult(result);
    } catch (err) {
      console.error('推演失败:', err);
      this.stopInsightRotation();
      this.showToast('推演出错，请重试');
      this.goToPhase('input');
    }
  }

  showResult(result) {
    audioSystem.play('complete');
    this.goToPhase('result');

    // 口吻图标
    const personaInfo = PERSONAS[result.persona || this.selectedPersona] || PERSONAS.brutal;
    document.getElementById('personaResultIcon').textContent = personaInfo.icon;

    document.getElementById('empathyBubble').textContent = result.empathy || '';

    document.getElementById('probOptimistic').textContent = result.optimistic.probability + '%';
    document.getElementById('probNeutral').textContent = result.neutral.probability + '%';
    document.getElementById('probPessimistic').textContent = result.pessimistic.probability + '%';

    this.renderPath('pathOptimistic', result.optimistic, 'optimistic');
    this.renderPath('pathNeutral', result.neutral, 'neutral');
    this.renderPath('pathPessimistic', result.pessimistic, 'pessimistic');

    // 三件烂事
    if (result.badThings) {
      document.getElementById('badThingsList').innerHTML = result.badThings.map(b => `
        <div class="bad-thing-card">
          <span class="bad-thing-icon">${b.icon}</span>
          <span class="bad-thing-text">${b.event}</span>
        </div>
      `).join('');
    }

    // 统计卡片
    if (result.stats) {
      document.getElementById('statsGrid').innerHTML = result.stats.map(s => `
        <div class="stat-card">
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
          <div class="stat-desc">${s.desc}</div>
          <div class="stat-source">${s.source}</div>
        </div>
      `).join('');
    }

    // 延伸阅读
    if (result.readingCards) {
      const typeMap = { quote: 'card-quote', history: 'card-history', psychology: 'card-psychology' };
      document.getElementById('readingCards').innerHTML = result.readingCards.map(c => `
        <div class="reading-card ${typeMap[c.type] || ''}">
          <div class="reading-card-header"><span class="reading-card-icon">${c.icon}</span><span class="reading-card-type">${c.title}</span></div>
          <div class="reading-card-content">${c.content}</div>
          ${c.source ? `<div class="reading-card-source">— ${c.source}</div>` : ''}
        </div>
      `).join('');
    }

    // 心理学洞察 - removed (replaced by reading cards)
    const insightEl = document.getElementById('insightCard');
    if (insightEl) insightEl.parentElement.style.display = 'none';

    // 投票
    this.setupPoll(result.poll);

    // 打分
    this.setupRating();

    // Emoji
    this.setupEmojiInline();
    this.initEmojiForInput();

    this.saveHistory(result);
  }

  renderPath(containerId, path, type) {
    const el = document.getElementById(containerId);
    const persona = this.selectedPersona;
    let html = '';

    // 转折点（精简版）
    html += `<div class="path-section">
      <div class="path-section-title">关键转折点</div>
      <ul class="path-section-list">
        ${path.turning_points.map(t => `<li><strong>${t.period}：</strong>${t.event}</li>`).join('')}
      </ul>
    </div>`;

    // 你会失去什么
    if (path.you_lose) {
      html += `<div class="path-cost-box cost-lose">
        <span class="cost-label">选择这条路的代价</span>
        ${path.you_lose}
      </div>`;
    }

    // 什么都不做的代价
    if (path.cost_of_nothing) {
      html += `<div class="path-cost-box cost-nothing">
        <span class="cost-label">什么都不做会怎样</span>
        ${path.cost_of_nothing}
      </div>`;
    }

    // 不服按钮
    html += `<button class="btn-retry" data-path="${type}" data-persona="${persona}">🔄 不服？换个更狠的说法</button>`;

    el.innerHTML = html;

    // 绑定不服按钮
    el.querySelector('.btn-retry').addEventListener('click', (e) => {
      const pathType = e.currentTarget.dataset.path;
      this.handleRetry(pathType, path);
    });
  }

  handleRetry(pathType, currentPath) {
    const persona = this.selectedPersona;
    const retried = this.engine.retryPath(currentPath, persona);
    const containerId = 'path' + pathType.charAt(0).toUpperCase() + pathType.slice(1);
    this.renderPath(containerId, retried, pathType);
    audioSystem.play('expand');
    this.showToast('已用更狠的语气重写');
  }

  setupPoll(poll) {
    this.currentPoll = poll;
    this.userVote = null;
    document.querySelectorAll('.poll-option').forEach(opt => {
      opt.classList.remove('selected');
      opt.onclick = () => this.votePoll(opt.dataset.vote);
    });
    document.getElementById('pollResult').classList.remove('show');
    // Set voted count
    const total = Math.floor(Math.random() * 800) + 200;
    document.getElementById('pollVotedCount').textContent = `已有 ${total} 人参与投票`;
  }

  votePoll(vote) {
    if (this.userVote) return;
    this.userVote = vote;
    document.querySelectorAll('.poll-option').forEach(opt => opt.classList.toggle('selected', opt.dataset.vote === vote));

    const poll = this.currentPoll;
    setTimeout(() => {
      document.getElementById('pollBarOpt').style.width = poll.optimistic + '%';
      document.getElementById('pollPctOpt').textContent = poll.optimistic + '%';
      document.getElementById('pollBarNeu').style.width = poll.neutral + '%';
      document.getElementById('pollPctNeu').textContent = poll.neutral + '%';
      document.getElementById('pollBarPes').style.width = poll.pessimistic + '%';
      document.getElementById('pollPctPes').textContent = poll.pessimistic + '%';
      document.getElementById('pollResult').classList.add('show');
      audioSystem.play('success');
    }, 300);
  }

  setupRating() {
    this.rating = 0;
    document.querySelectorAll('.rating-star').forEach(star => {
      star.classList.remove('active');
      star.onclick = () => this.setRating(parseInt(star.dataset.rating));
    });
    document.getElementById('ratingThanks').style.display = 'none';
    document.getElementById('ratingFeedbackInput').value = '';
    document.getElementById('btnRatingSubmit').onclick = () => this.submitRating();
  }

  setRating(n) {
    this.rating = n;
    document.querySelectorAll('.rating-star').forEach(star => {
      star.classList.toggle('active', parseInt(star.dataset.rating) <= n);
    });
  }

  submitRating() {
    if (this.rating === 0) { this.showToast('请先打个分'); return; }
    const feedback = document.getElementById('ratingFeedbackInput').value.trim();
    try {
      const ratings = JSON.parse(localStorage.getItem('mf_ratings') || '[]');
      ratings.push({ rating: this.rating, feedback, time: new Date().toISOString() });
      localStorage.setItem('mf_ratings', JSON.stringify(ratings));
    } catch (e) {}
    document.getElementById('ratingThanks').style.display = 'block';
    audioSystem.play('success');
    this.showToast('感谢反馈！');
  }

  // ===== 内联 Emoji =====
  setupEmojiInline() {
    this.emojiCanvas = document.getElementById('emojiCanvas');
    this.emojiCtx = this.emojiCanvas ? this.emojiCanvas.getContext('2d') : null;
    this.emojiCategories = [
      { name: '表情', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋'] },
      { name: '手势', emojis: ['👍','👎','👏','🙌','🤝','✌️','🤞','🫰','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚'] },
      { name: '爱心', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟'] },
      { name: '自然', emojis: ['🌸','🌺','🌻','🌹','🌷','💐','🌿','☘️','🍀','🍁','🍂','🌾','🌵','🌴','🌳','🌊','⭐','🌙','☀️','🌈'] },
      { name: '物品', emojis: ['🎯','🎮','🎲','🧩','🎭','🎪','🎨','🎬','🎤','🎧','🎸','🎹','🎺','🎻','🪘','📚','📖','✏️','💡','🔔'] },
      { name: '食物', emojis: ['🍕','🍔','🍟','🌭','🍿','🧁','🍰','🎂','🍩','🍪','🍫','🍬','🍭','☕','🍵','🧋','🥤','🍺','🍷','🥂'] },
    ];
    this.emojiKeywordMap = {
      '开心':'😀','快乐':'😄','高兴':'😁','笑':'😆','欢乐':'🤣','幸福':'🥰','愉快':'😊',
      '难过':'😢','伤心':'💔','哭':'😭','悲伤':'😞','沮丧':'😔','痛苦':'😫',
      '生气':'😤','愤怒':'😡','讨厌':'😠','烦':'😩','暴躁':'🤬',
      '爱':'❤️','喜欢':'😍','恋爱':'💕','浪漫':'🌹','心动':'💓','暗恋':'🥰',
      '工作':'💼','加班':'🖥️','开会':'📋','上班':'🏢','打工':'🔨','升职':'📈','加薪':'💰',
      '学习':'📚','考试':'📝','读书':'📖','毕业':'🎓','知识':'💡',
      '钱':'💰','工资':'💵','投资':'📈','理财':'💹','穷':'😅','富有':'🤑','买房':'🏠',
      '吃':'😋','美食':'🍕','喝':'☕','饿':'🤤','零食':'🍿','大餐':'🥘',
      '睡觉':'😴','困':'😪','失眠':'🥱','梦':'💭','休息':'🛌',
      '旅行':'✈️','旅游':'🏖️','出差':'🧳','飞':'🛫',
      '健康':'💪','运动':'🏃','减肥':'🏋️','健身':'💯','瑜伽':'🧘',
      '朋友':'🤝','社交':'👥','聚会':'🎉','友情':'🫂',
      '家庭':'👨‍👩‍👧','父母':'👪','孩子':'👶','家人':'❤️','亲情':'🫶',
      '焦虑':'😰','紧张':'😬','压力':'😩','担心':'😟','害怕':'😨','恐惧':'😱',
      '期待':'🤩','希望':'🌟','梦想':'✨','目标':'🎯','未来':'🔮',
      '孤独':'🥺','寂寞':'😿','无聊':'😐','迷茫':'😵‍💫',
      '成功':'🏆','胜利':'✌️','完成':'✅','挑战':'⚡',
      '失败':'😞','挫折':'⛈️','困难':'🧗','问题':'❓',
      '科技':'🤖','AI':'🧠','编程':'💻','代码':'⌨️','互联网':'🌐',
      '音乐':'🎵','唱歌':'🎤','跳舞':'💃','演奏':'🎸',
      '天气':'🌤️','下雨':'🌧️','晴天':'☀️','雪':'❄️','风':'💨',
      '生日':'🎂','礼物':'🎁','庆祝':'🎊','节日':'🎄',
      '时间':'⏰','快':'⏩','慢':'⏳','等待':'🕰️',
      '电影':'🎬','电视':'📺','游戏':'🎮','综艺':'🎪',
      '宠物':'🐱','猫':'🐱','狗':'🐶','动物':'🐾',
      '咖啡':'☕','茶':'🍵','奶茶':'🧋','酒':'🍷','啤酒':'🍺','干杯':'🥂',
      '花':'🌸','樱花':'🌸','玫瑰':'🌹','向日葵':'🌻',
      '星星':'⭐','月亮':'🌙','太阳':'☀️','宇宙':'🌌',
      '创业':'🚀','副业':'📱','自媒体':'📹','直播':'📺',
      '高考':'📝','志愿':'📋','成绩':'📊','录取':'🎓',
      '体检':'🏥','生病':'🤒','药':'💊','康复':'💪',
      '分手':'💔','冷战':'🥶','吵架':'💢','和好':'🫶','道歉':'🙇',
      '房子':'🏠','搬家':'📦','装修':'🔨','租房':'🏢',
      '面试':'🤝','简历':'📄','offer':'🎉','入职':'💼',
    };
    if (!this.emojiCanvas) return;
    this.resizeEmojiCanvas();
    this.buildEmojiPalette();
    this.bindEmojiEvents();
    this.drawEmoji();
    window.addEventListener('resize', () => { this.resizeEmojiCanvas(); this.drawEmoji(); });
  }

  resizeEmojiCanvas() {
    const wrap = this.emojiCanvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    this.emojiCanvas.width = wrap.clientWidth * dpr;
    this.emojiCanvas.height = wrap.clientHeight * dpr;
    this.emojiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.emojiCanvas.style.width = wrap.clientWidth + 'px';
    this.emojiCanvas.style.height = wrap.clientHeight + 'px';
  }

  buildEmojiPalette() {
    const tabs = document.getElementById('emojiPaletteTabs');
    const grid = document.getElementById('emojiPaletteGrid');
    if (!tabs || !grid) return;
    tabs.innerHTML = '';
    this.emojiCategories.forEach((cat, i) => {
      const tab = document.createElement('button');
      tab.className = 'emoji-palette-tab' + (i === 0 ? ' active' : '');
      tab.textContent = cat.name;
      tab.onclick = () => this.switchEmojiCategory(i);
      tabs.appendChild(tab);
    });
    this.renderEmojiGrid(0);
  }

  switchEmojiCategory(i) {
    this.emojiState.activeCategory = i;
    document.querySelectorAll('.emoji-palette-tab').forEach((t, idx) => t.classList.toggle('active', idx === i));
    this.renderEmojiGrid(i);
  }

  renderEmojiGrid(i) {
    const grid = document.getElementById('emojiPaletteGrid');
    if (!grid) return;
    grid.innerHTML = '';
    this.emojiCategories[i].emojis.forEach(char => {
      const btn = document.createElement('button');
      btn.className = 'emoji-char-btn';
      btn.textContent = char;
      btn.onclick = () => this.addEmoji(char);
      grid.appendChild(btn);
    });
  }

  addEmoji(char, x, y, size) {
    const cw = this.emojiCanvas.width / (window.devicePixelRatio || 1);
    const ch = this.emojiCanvas.height / (window.devicePixelRatio || 1);
    this.pushEmojiHistory();
    this.emojiState.emojis.push({ id: this.emojiState.nextId++, char, x: x ?? cw / 2 + (Math.random() - 0.5) * 100, y: y ?? ch / 2 + (Math.random() - 0.5) * 100, size: size || 40 });
    this.saveEmojiState();
    this.drawEmoji();
  }

  pushEmojiHistory() { this.emojiState.history.push(JSON.stringify(this.emojiState.emojis)); if (this.emojiState.history.length > 30) this.emojiState.history.shift(); }

  drawEmoji() {
    if (!this.emojiCtx) return;
    const ctx = this.emojiCtx;
    const w = this.emojiCanvas.width / (window.devicePixelRatio || 1);
    const h = this.emojiCanvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    // grid dots
    ctx.fillStyle = 'rgba(139,92,246,0.03)';
    for (let x = 0; x < w; x += 20) { for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); } }
    // emoji font stack fix
    const emojiFont = (size) => `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    this.emojiState.emojis.forEach(e => {
      ctx.font = emojiFont(e.size);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.char, e.x, e.y);
      if (e.id === this.emojiState.selectedId) {
        ctx.strokeStyle = 'rgba(139,92,246,0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        const m = ctx.measureText(e.char);
        const hw = Math.max((m.width || e.size) / 2, e.size / 2) + 6;
        const hh = e.size / 2 + 6;
        ctx.strokeRect(e.x - hw, e.y - hh, hw * 2, hh * 2);
        ctx.setLineDash([]);
      }
    });
  }

  emojiHitTest(mx, my) {
    const ctx = this.emojiCtx;
    const emojiFont = (size) => `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    for (let i = this.emojiState.emojis.length - 1; i >= 0; i--) {
      const e = this.emojiState.emojis[i];
      ctx.font = emojiFont(e.size);
      const m = ctx.measureText(e.char);
      const hw = Math.max((m.width || e.size) / 2, e.size / 2);
      const hh = e.size / 2;
      if (mx >= e.x - hw && mx <= e.x + hw && my >= e.y - hh && my <= e.y + hh) return e;
    }
    return null;
  }

  getEmojiPos(ev) { const rect = this.emojiCanvas.getBoundingClientRect(); if (ev.touches) return { x: ev.touches[0].clientX - rect.left, y: ev.touches[0].clientY - rect.top }; return { x: ev.clientX - rect.left, y: ev.clientY - rect.top }; }

  generateEmojiFromKeyword(text) {
    this.pushEmojiHistory();
    this.emojiState.emojis = [];
    const keys = Object.keys(this.emojiKeywordMap).sort((a, b) => b.length - a.length);
    const found = [];
    let remaining = text;
    for (const k of keys) { if (remaining.indexOf(k) !== -1) { found.push(this.emojiKeywordMap[k]); remaining = remaining.replace(k, ''); } }
    if (found.length === 0) { for (const c of text.split('')) { if (this.emojiKeywordMap[c]) found.push(this.emojiKeywordMap[c]); } }
    if (found.length === 0) { for (let i = 0; i < 5; i++) { const cat = this.emojiCategories[Math.floor(Math.random() * this.emojiCategories.length)]; found.push(cat.emojis[Math.floor(Math.random() * cat.emojis.length)]); } }
    this.layoutEmojiPattern(found);
    this.saveEmojiState();
    this.showToast(`已生成 ${found.length} 个 Emoji`);
  }

  randomEmoji() {
    const count = 6 + Math.floor(Math.random() * 6);
    const chars = [];
    for (let i = 0; i < count; i++) { const cat = this.emojiCategories[Math.floor(Math.random() * this.emojiCategories.length)]; chars.push(cat.emojis[Math.floor(Math.random() * cat.emojis.length)]); }
    this.pushEmojiHistory();
    this.emojiState.emojis = [];
    this.layoutEmojiPattern(chars);
    this.saveEmojiState();
  }

  layoutEmojiPattern(chars) {
    const patterns = ['circle', 'heart', 'grid', 'spiral'];
    const pat = patterns[Math.floor(Math.random() * patterns.length)];
    const cw = this.emojiCanvas.width / (window.devicePixelRatio || 1);
    const ch = this.emojiCanvas.height / (window.devicePixelRatio || 1);
    const cx = cw / 2, cy = ch / 2, n = chars.length;
    if (pat === 'circle') { const r = Math.min(cw, ch) * 0.3; chars.forEach((char, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; this.addEmoji(char, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 36); }); }
    else if (pat === 'heart') { chars.forEach((char, i) => { const t = (i / n) * Math.PI * 2; const hx = 16 * Math.pow(Math.sin(t), 3); const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); this.addEmoji(char, cx + hx * 8, cy + hy * 8, 34); }); }
    else if (pat === 'grid') { const cols = Math.ceil(Math.sqrt(n)); const spacing = 50; chars.forEach((char, i) => { this.addEmoji(char, cx + ((i % cols) - (cols - 1) / 2) * spacing, cy + (Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2) * spacing, 38); }); }
    else { chars.forEach((char, i) => { this.addEmoji(char, cx + Math.cos(i * 0.8) * (20 + i * 14), cy + Math.sin(i * 0.8) * (20 + i * 14), 30 + i * 2); }); }
  }

  saveEmojiState() { try { localStorage.setItem('mf_emoji_state', JSON.stringify(this.emojiState.emojis)); } catch (e) {} }
  loadEmojiState() { try { const s = localStorage.getItem('mf_emoji_state'); if (s) { this.emojiState.emojis = JSON.parse(s); this.emojiState.nextId = this.emojiState.emojis.reduce((m, e) => Math.max(m, e.id), 0) + 1; this.drawEmoji(); } } catch (e) {} }

  initEmojiForInput() { const text = document.getElementById('userInput').value; if (text) this.generateEmojiFromKeyword(text); else this.loadEmojiState(); }

  bindEmojiEvents() {
    if (!this.emojiCanvas) return;
    const canvas = this.emojiCanvas;
    canvas.addEventListener('mousedown', ev => { const p = this.getEmojiPos(ev); const hit = this.emojiHitTest(p.x, p.y); if (hit) { this.emojiState.selectedId = hit.id; this.emojiState.dragState = { id: hit.id, ox: p.x - hit.x, oy: p.y - hit.y }; canvas.classList.add('dragging'); } else { this.emojiState.selectedId = null; } this.drawEmoji(); });
    canvas.addEventListener('mousemove', ev => { if (!this.emojiState.dragState) return; const p = this.getEmojiPos(ev); const e = this.emojiState.emojis.find(e => e.id === this.emojiState.dragState.id); if (e) { e.x = p.x - this.emojiState.dragState.ox; e.y = p.y - this.emojiState.dragState.oy; this.drawEmoji(); } });
    canvas.addEventListener('mouseup', () => { if (this.emojiState.dragState) { this.emojiState.dragState = null; canvas.classList.remove('dragging'); this.saveEmojiState(); } });
    canvas.addEventListener('dblclick', ev => { const p = this.getEmojiPos(ev); const hit = this.emojiHitTest(p.x, p.y); if (hit) { this.pushEmojiHistory(); this.emojiState.emojis = this.emojiState.emojis.filter(e => e.id !== hit.id); this.emojiState.selectedId = null; this.saveEmojiState(); this.drawEmoji(); } });
    canvas.addEventListener('wheel', ev => { ev.preventDefault(); const p = this.getEmojiPos(ev); const hit = this.emojiHitTest(p.x, p.y); if (hit) { hit.size = Math.max(12, Math.min(120, hit.size + (ev.deltaY < 0 ? 3 : -3))); this.saveEmojiState(); this.drawEmoji(); } }, { passive: false });
    let touchDist = 0;
    canvas.addEventListener('touchstart', ev => { if (ev.touches.length === 1) { const p = this.getEmojiPos(ev); const hit = this.emojiHitTest(p.x, p.y); if (hit) { this.emojiState.selectedId = hit.id; this.emojiState.dragState = { id: hit.id, ox: p.x - hit.x, oy: p.y - hit.y }; } } else if (ev.touches.length === 2) { const dx = ev.touches[0].clientX - ev.touches[1].clientX; const dy = ev.touches[0].clientY - ev.touches[1].clientY; touchDist = Math.sqrt(dx * dx + dy * dy); } this.drawEmoji(); }, { passive: true });
    canvas.addEventListener('touchmove', ev => { ev.preventDefault(); if (ev.touches.length === 1 && this.emojiState.dragState) { const p = this.getEmojiPos(ev); const e = this.emojiState.emojis.find(e => e.id === this.emojiState.dragState.id); if (e) { e.x = p.x - this.emojiState.dragState.ox; e.y = p.y - this.emojiState.dragState.oy; this.drawEmoji(); } } else if (ev.touches.length === 2 && this.emojiState.selectedId != null) { const dx = ev.touches[0].clientX - ev.touches[1].clientX; const dy = ev.touches[0].clientY - ev.touches[1].clientY; const d = Math.sqrt(dx * dx + dy * dy); const e = this.emojiState.emojis.find(e => e.id === this.emojiState.selectedId); if (e) { e.size = Math.max(12, Math.min(120, e.size + (d - touchDist) * 0.2)); touchDist = d; this.drawEmoji(); } } }, { passive: false });
    canvas.addEventListener('touchend', () => { this.emojiState.dragState = null; this.saveEmojiState(); });
    document.addEventListener('keydown', ev => { if ((ev.key === 'Delete' || ev.key === 'Backspace') && this.emojiState.selectedId != null && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { this.pushEmojiHistory(); this.emojiState.emojis = this.emojiState.emojis.filter(e => e.id !== this.emojiState.selectedId); this.emojiState.selectedId = null; this.saveEmojiState(); this.drawEmoji(); } if (ev.key === 'Escape') { this.emojiState.selectedId = null; this.drawEmoji(); } });

    // Buttons
    const btnG = document.getElementById('btnEmojiGenerate');
    const btnR = document.getElementById('btnEmojiRandom');
    const btnC = document.getElementById('btnEmojiClear');
    const btnU = document.getElementById('btnEmojiUndo');
    const kwInput = document.getElementById('emojiKeywordInput');
    if (btnG) btnG.onclick = () => { const t = kwInput.value.trim(); if (t) this.generateEmojiFromKeyword(t); };
    if (kwInput) kwInput.addEventListener('keydown', ev => { if (ev.key === 'Enter') { const t = kwInput.value.trim(); if (t) this.generateEmojiFromKeyword(t); } });
    if (btnR) btnR.onclick = () => this.randomEmoji();
    if (btnC) btnC.onclick = () => { this.pushEmojiHistory(); this.emojiState.emojis = []; this.emojiState.selectedId = null; this.saveEmojiState(); this.drawEmoji(); };
    if (btnU) btnU.onclick = () => { if (this.emojiState.history.length) { this.emojiState.emojis = JSON.parse(this.emojiState.history.pop()); this.emojiState.nextId = this.emojiState.emojis.reduce((m, e) => Math.max(m, e.id), 0) + 1; this.emojiState.selectedId = null; this.saveEmojiState(); this.drawEmoji(); } };
  }

  // ===== 导出 =====
  setupExport() {
    document.getElementById('btnExport').addEventListener('click', () => { if (this.lastResult) this.exportShareImage(); });
    document.getElementById('btnShare').addEventListener('click', () => {
      if (!this.lastResult) return;
      const r = this.lastResult;
      const personaName = PERSONAS[this.selectedPersona]?.name || '毒舌朋友';
      const share = `MiroFish 未来推演 [${personaName}]\n\n${r.empathy}\n\n🌅 乐观 ${r.optimistic.probability}%：${r.optimistic.title}\n🌊 中性 ${r.neutral.probability}%：${r.neutral.title}\n🌧️ 悲观 ${r.pessimistic.probability}%：${r.pessimistic.title}\n\n— MiroFish v7`;
      if (navigator.clipboard) { navigator.clipboard.writeText(share).then(() => { audioSystem.play('success'); this.showToast('已复制到剪贴板'); }); }
    });
  }

  exportShareImage() {
    const r = this.lastResult;
    const text = document.getElementById('userInput').value;
    const canvas = document.createElement('canvas');
    const dpr = 2;
    const W = 375;
    let Y = 0;
    canvas.width = W * dpr;
    canvas.height = 2000 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const grad = ctx.createLinearGradient(0, 0, 0, 2000);
    grad.addColorStop(0, '#0d0d1a'); grad.addColorStop(1, '#06060e');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, 2000);

    const personaName = PERSONAS[this.selectedPersona]?.name || '毒舌朋友';
    ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`MiroFish [${personaName}]`, W / 2, Y += 36);
    ctx.fillStyle = '#5a5a78'; ctx.font = '10px sans-serif'; ctx.fillText(new Date().toLocaleDateString('zh-CN'), W / 2, Y += 18);
    Y += 10;

    ctx.fillStyle = '#9898b8'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    this.wrapText(ctx, `"${text}"`, W - 48).forEach(line => { ctx.fillText(line, 24, Y += 18); });
    Y += 12;

    ctx.fillStyle = '#e8e8f5'; ctx.font = '12px sans-serif';
    this.wrapText(ctx, r.empathy, W - 48).forEach(line => { ctx.fillText(line, 24, Y += 18); });
    Y += 16;

    const paths = [
      { name: '乐观', prob: r.optimistic.probability, title: r.optimistic.title, color: '#10b981', icon: '🌅' },
      { name: '中性', prob: r.neutral.probability, title: r.neutral.title, color: '#f59e0b', icon: '🌊' },
      { name: '悲观', prob: r.pessimistic.probability, title: r.pessimistic.title, color: '#ef4444', icon: '🌧️' },
    ];
    paths.forEach(p => {
      ctx.fillStyle = 'rgba(13,13,26,0.8)'; this.roundRect(ctx, 20, Y, W - 40, 50, 10); ctx.fill();
      ctx.fillStyle = p.color; ctx.fillRect(20, Y, 3, 50);
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`${p.icon} ${p.name}路径`, 32, Y + 20);
      ctx.textAlign = 'right'; ctx.fillText(`${p.prob}%`, W - 32, Y + 20);
      ctx.fillStyle = '#9898b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
      this.wrapText(ctx, p.title, W - 72).slice(0, 1).forEach(line => { ctx.fillText(line, 32, Y + 40); });
      Y += 58;
    });
    Y += 12;

    ctx.fillStyle = '#5a5a78'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('— MiroFish v7 —', W / 2, Y += 15);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = W * dpr; finalCanvas.height = (Y + 30) * dpr;
    finalCanvas.getContext('2d').drawImage(canvas, 0, 0);
    const a = document.createElement('a');
    a.href = finalCanvas.toDataURL('image/png'); a.download = `mirofish-${Date.now()}.png`; a.click();
    audioSystem.play('success'); this.showToast('截图已保存');
  }

  wrapText(ctx, text, maxWidth) { const lines = []; let line = ''; for (const char of text) { const test = line + char; if (ctx.measureText(test).width > maxWidth) { lines.push(line); line = char; } else { line = test; } } if (line) lines.push(line); return lines; }
  roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }

  showToast(msg) { let toast = document.querySelector('.toast'); if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); } toast.textContent = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500); }

  goToPhase(name) {
    document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
    document.getElementById(`phase${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.add('active');
    this.currentPhase = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveHistory(result) { try { const h = JSON.parse(localStorage.getItem('mf_history') || '[]'); h.unshift({ text: document.getElementById('userInput').value, time: new Date().toLocaleString(), opt: result.optimistic.title, neu: result.neutral.title, pes: result.pessimistic.title }); if (h.length > 30) h.length = 30; localStorage.setItem('mf_history', JSON.stringify(h)); } catch (e) {} }

  reset() {
    this.selectedMood = null; this.selectedFactors.clear(); this.lastResult = null; this.userVote = null; this.rating = 0;
    document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.factor-chip').forEach(c => c.classList.remove('selected'));
    document.getElementById('userInput').value = '';
    this.updateInputState();
  }

  delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
