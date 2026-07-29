/**
 * NarrativeCore — 文字游戏通用内核 v1.0
 * 社会学/心理学驱动的叙事引擎
 *
 * 用法:
 *   const core = new NarrativeCore({ container: '#app' });
 *   core.loadChapter(chapterData);
 *   core.start();
 *
 * 模块: SocialScience | AudioEngine | DebtSystem | StatsEngine
 *       EffectsEngine | APIBridge | EndingResolver | Persistence
 */

// ═══════════════════════════════════════════════════════════
// [1] SOCIAL SCIENCE — 社会学/心理学理论库
// ═══════════════════════════════════════════════════════════

const SocialScience = {
  // 费孝通：差序格局 — 以己为中心的同心圆
  differentialOrder: {
    name: '差序格局',
    author: '费孝通《乡土中国》',
    layers: ['血亲', '姻亲', '密友', '同乡/同学', '同事/同行', '陌生人'],
    analyze(choice, context) {
      const layer = context.relationshipLayer || 5;
      const closeness = 1 - (layer / 6);
      return {
        description: `你与${context.target || '对方'}的关系处于第${layer+1}层（${this.layers[layer]}）`,
        implication: closeness > 0.6
          ? '关系越近，人情债越重，但也越容易获得无条件支持'
          : '关系越远，交易越纯粹，但也越容易被替代',
        quote: '我们的格局不是一捆一捆扎清楚的柴，而是好像把一块石头丢在水面上所发生的一圈圈推出去的波纹。'
      };
    }
  },

  // 黄光国：人情与面子模型
  faceAndFavor: {
    name: '人情与面子',
    author: '黄光国《人情与面子：中国人的权力游戏》',
    relationTypes: ['情感性关系', '混合性关系', '工具性关系'],
    analyze(choice, context) {
      const type = this.relationTypes[context.relationType || 1];
      const isGiver = context.role === 'giver';
      return {
        relationType: type,
        dilemma: isGiver
          ? '作为资源支配者：坚持公平会破坏关系，给予特殊帮助会欠下人情'
          : '作为请托者：被拒绝意味着面子受损，被接受意味着欠下人情',
        strategy: type === '混合性关系'
          ? '最可能以人情和面子来影响他人——因为双方预期未来还会交往'
          : type === '情感性关系'
            ? '可以用真诚行为，不需要人情交换的计算'
            : '只能用公平法则，人情和面子不起作用',
        quote: '在中国社会中，混合性关系是个人最可能以人情和面子来影响他人的人际关系范畴。'
      };
    }
  },

  // Cialdini：六原则
  influence: {
    name: '影响力六原则',
    author: 'Robert Cialdini《影响力》',
    principles: {
      reciprocation: { name: '互惠', desc: '别人给了你东西，你就觉得必须还' },
      commitment: { name: '承诺一致', desc: '一旦表态，就会不自觉地维护一致' },
      authority: { name: '权威', desc: '对权威的服从往往超越理性判断' },
      socialProof: { name: '社会认同', desc: '别人都这么做，你也跟着做' },
      scarcity: { name: '稀缺', desc: '越得不到的越想要' },
      liking: { name: '喜好', desc: '你喜欢的人说什么你都信' }
    },
    analyze(choice, context) {
      const triggered = [];
      if (context.gaveFirst) triggered.push(this.principles.reciprocation);
      if (context.priorCommitment) triggered.push(this.principles.commitment);
      if (context.hasAuthority) triggered.push(this.principles.authority);
      if (context.othersDoing) triggered.push(this.principles.socialProof);
      if (context.rare) triggered.push(this.principles.scarcity);
      if (context.liked) triggered.push(this.principles.liking);
      return {
        triggered: triggered.map(p => p.name),
        description: triggered.length > 0
          ? `这个选择触发了${triggered.map(p => p.name).join('+')}原则——你以为是自己的决定，其实是被设计的`
          : '这个选择没有明显的影响力操纵，可能是你真正的自主判断',
        quote: '我们所有人都会一次次地被愚弄，因为影响力的基本特征具有极大的愚弄性。'
      };
    }
  },

  // 翟学伟：人情交换的本质
  humanExchange: {
    name: '人情交换',
    author: '翟学伟《人情、面子与权力的再生产》',
    analyze(choice, context) {
      return {
        insight: '人情交换不只是资源交换，更是关系维系——即使没人需要帮助，人情交换也有必要发生',
        consequence: context.debtType === 'favor'
          ? '你欠下的不只是利益，还有情感——这比金钱更难还清'
          : '你获得的不只是好处，还有被期待——下次对方开口你很难拒绝',
        quote: '人情不单是说家乡里面的成员彼此之间有一种特定的情感，而是其中包含着彼此间的资源交换。'
      };
    }
  },

  // Asch：从众效应
  conformity: {
    name: '从众效应',
    author: 'Solomon Asch (1956)',
    analyze(choice, context) {
      const isConforming = context.groupPressure && !context.goingAgainst;
      return {
        type: isConforming ? '规范性从众' : '独立判断',
        description: isConforming
          ? '你选择了和多数人一致——不是因为你认同，而是因为你怕被孤立'
          : '你选择了和多数人不同——这需要心理能量，但你保住了自我判断',
        research: 'Asch实验中75%的参与者至少从众一次，即使正确答案显而易见',
        quote: '我们不是因为别人对了而跟从，而是因为怕自己错了而跟从。'
      };
    }
  },

  // Milgram：服从权威
  obedience: {
    name: '服从权威',
    author: 'Stanley Milgram (1963)',
    analyze(choice, context) {
      return {
        description: context.obeyingAuthority
          ? '你在服从权威——Milgram实验显示65%的人会服从到最高电压'
          : '你在抵抗权威——这需要极强的内在信念',
        mechanism: '服从不是因为认同，而是因为"系统"替你承担了道德责任',
        quote: '我只是在执行命令——这是人类历史上最危险的一句话。'
      };
    }
  },

  // 综合分析
  analyzeChoice(choice, context = {}) {
    const analyses = {};
    if (context.relationshipLayer !== undefined) analyses.differentialOrder = this.differentialOrder.analyze(choice, context);
    if (context.relationType !== undefined) analyses.faceAndFavor = this.faceAndFavor.analyze(choice, context);
    if (context.influenceContext) analyses.influence = this.influence.analyze(choice, context.influenceContext);
    if (context.debtType) analyses.humanExchange = this.humanExchange.analyze(choice, context);
    if (context.groupPressure !== undefined) analyses.conformity = this.conformity.analyze(choice, context);
    if (context.obeyingAuthority !== undefined) analyses.obedience = this.obedience.analyze(choice, context);
    return analyses;
  }
};


// ═══════════════════════════════════════════════════════════
// [2] AUDIO ENGINE — Web Audio API 音频系统
// ═══════════════════════════════════════════════════════════

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.enabled = false;
    this.bgmNodes = [];
    this.bgmRunning = false;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.4;
    this.master.connect(this.ctx.destination);
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.15;
    this.bgmGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.master);
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopBGM();
    return this.enabled;
  }

  // 音效
  play(type) {
    if (!this.enabled || !this.ctx) return;
    const sounds = {
      click:    () => this._tone(800, 0.06, 'sine', this.sfxGain),
      debt:     () => { this._tone(300, 0.25, 'triangle', this.sfxGain); setTimeout(() => this._tone(250, 0.2, 'triangle', this.sfxGain), 120); },
      scene:    () => { this._tone(440, 0.15, 'sine', this.sfxGain); setTimeout(() => this._tone(550, 0.15, 'sine', this.sfxGain), 100); },
      ending:   () => { this._tone(523, 0.3, 'sine', this.sfxGain); setTimeout(() => this._tone(659, 0.3, 'sine', this.sfxGain), 250); setTimeout(() => this._tone(784, 0.5, 'sine', this.sfxGain), 500); },
      ink:      () => this._tone(150, 0.3, 'sawtooth', this.sfxGain, 0.08),
      success:  () => { this._tone(523, 0.2, 'sine', this.sfxGain); setTimeout(() => this._tone(784, 0.3, 'sine', this.sfxGain), 150); },
      fail:     () => { this._tone(330, 0.3, 'sawtooth', this.sfxGain, 0.1); setTimeout(() => this._tone(220, 0.4, 'sawtooth', this.sfxGain, 0.1), 200); },
    };
    (sounds[type] || sounds.click)();
  }

  // BGM: 使用音阶生成氛围音乐
  startBGM(style = 'ambient') {
    if (!this.enabled || !this.ctx || this.bgmRunning) return;
    this.bgmRunning = true;
    const scales = {
      ambient:   [261, 293, 329, 392, 440, 392, 329, 293],
      tension:   [261, 277, 329, 349, 370, 349, 329, 277],
      chinese:   [261, 293, 329, 392, 440, 523, 440, 392],
      dramatic:  [196, 233, 261, 293, 329, 293, 261, 233],
    };
    const notes = scales[style] || scales.ambient;
    let i = 0;
    const playNote = () => {
      if (!this.bgmRunning || !this.enabled) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = style === 'chinese' ? 'triangle' : 'sine';
      osc.frequency.value = notes[i % notes.length];
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 2);
      this.bgmNodes.push(osc);
      i++;
      this._bgmTimer = setTimeout(playNote, 1800);
    };
    playNote();
  }

  stopBGM() {
    this.bgmRunning = false;
    clearTimeout(this._bgmTimer);
    this.bgmNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this.bgmNodes = [];
  }

  _tone(freq, dur, type, dest, vol) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(dest || this.sfxGain);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }
}


// ═══════════════════════════════════════════════════════════
// [3] DEBT SYSTEM — 人情债记录本
// ═══════════════════════════════════════════════════════════

class DebtSystem {
  constructor() {
    this.debts = [];
    // 债务类型：基于社会学分类
    this.types = {
      favor:     { label: '人情债', color: '#c9a96e', theory: '黄光国：人情交换一旦发生，就产生了不对等的权力关系' },
      face:      { label: '面子债', color: '#9b8ec4', theory: '翟学伟：面子是社会交往中的信用货币，透支就破产' },
      loyalty:   { label: '忠诚债', color: '#6b8f71', theory: 'Milgram：服从权威的代价是让渡道德判断权' },
      betrayal:  { label: '背叛债', color: '#c45c4a', theory: '社会交换论：背叛打破互惠平衡，修复成本极高' },
      silence:   { label: '沉默债', color: '#7a8ba0', theory: 'Asch：沉默是最隐蔽的从众——你以为没表态，其实已经表态了' },
      principle: { label: '原则债', color: '#d4a574', theory: '坚持原则的代价：短期被孤立，长期获得道德资本' },
    };
  }

  add(debt) {
    const entry = {
      id: Date.now() + Math.random(),
      text: debt.text,
      type: debt.type || 'favor',
      scene: debt.scene || 0,
      timestamp: Date.now(),
      analysis: debt.analysis || null,
    };
    this.debts.push(entry);
    return entry;
  }

  getAll() { return [...this.debts]; }
  getLast() { return this.debts[this.debts.length - 1]; }
  count() { return this.debts.length; }

  // 按类型统计
  byType() {
    const result = {};
    for (const d of this.debts) {
      result[d.type] = (result[d.type] || 0) + 1;
    }
    return result;
  }

  // 主导类型
  dominantType() {
    const byType = this.byType();
    let max = 0, dominant = 'favor';
    for (const [type, count] of Object.entries(byType)) {
      if (count > max) { max = count; dominant = type; }
    }
    return { type: dominant, count: max, total: this.debts.length, label: this.types[dominant]?.label };
  }

  // 生成政治墓志铭
  epitaph() {
    const last = this.getLast();
    const dominant = this.dominantType();
    const typeInfo = this.types[dominant.type];
    return {
      finalDebt: last?.text || '无',
      dominantType: typeInfo?.label || '未知',
      dominantTheory: typeInfo?.theory || '',
      totalDebts: this.debts.length,
      summary: `你一生留下了${this.debts.length}笔人情债，其中"${typeInfo?.label}"最多（${dominant.count}笔）。最后一条是：「${last?.text || '无'}」`
    };
  }

  reset() { this.debts = []; }
}


// ═══════════════════════════════════════════════════════════
// [4] STATS ENGINE — 隐藏数值系统
// ═══════════════════════════════════════════════════════════

class StatsEngine {
  constructor(statsDef = []) {
    this.stats = {};
    this.history = [];
    statsDef.forEach(s => {
      this.stats[s.key] = s.value || 50;
    });
    this.definitions = statsDef;
  }

  get(key) { return this.stats[key] || 0; }

  modify(key, delta) {
    if (this.stats[key] === undefined) return;
    const old = this.stats[key];
    this.stats[key] = Math.max(0, Math.min(100, this.stats[key] + delta));
    return { key, old, value: this.stats[key], delta };
  }

  snapshot() {
    this.history.push({ ...this.stats, timestamp: Date.now() });
  }

  getAll() { return { ...this.stats }; }

  reset(statsDef) {
    this.stats = {};
    this.history = [];
    (statsDef || this.definitions).forEach(s => this.stats[s.key] = s.value || 50);
  }
}


// ═══════════════════════════════════════════════════════════
// [5] EFFECTS ENGINE — 视觉效果
// ═══════════════════════════════════════════════════════════

class EffectsEngine {
  constructor() {
    this.particles = [];
    this.animFrame = null;
    this.canvas = null;
    this.ctx = null;
  }

  initParticles(canvasId = 'particles') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
    for (let i = 0; i < 50; i++) this.particles.push(this._createParticle());
    this._animate();
  }

  _resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _createParticle() {
    return {
      x: Math.random() * (this.canvas?.width || 800),
      y: Math.random() * (this.canvas?.height || 600),
      size: Math.random() * 1.5 + 0.3,
      speedY: -(Math.random() * 0.3 + 0.05),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.4 + 0.1,
      life: Math.random() * 200 + 100,
      maxLife: 0,
    };
  }

  _animate() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => {
      if (!p.maxLife) p.maxLife = p.life;
      p.x += p.speedX; p.y += p.speedY; p.life--;
      if (p.life <= 0 || p.y < -10) Object.assign(p, this._createParticle(), { maxLife: 0 });
      const alpha = p.opacity * (p.life / p.maxLife);
      this.ctx.fillStyle = `rgba(201,169,110,${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.animFrame = requestAnimationFrame(() => this._animate());
  }

  // 打字机效果
  typewrite(el, text, callback, speed = 30) {
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'tw-cursor';
    cursor.style.cssText = 'display:inline-block;width:2px;height:1em;background:#c9a96e;margin-left:2px;animation:twblink 1s step-end infinite;vertical-align:text-bottom;';
    el.textContent = '';
    el.appendChild(cursor);
    const type = () => {
      if (i < text.length) {
        if (text[i] === '\n') el.insertBefore(document.createElement('br'), cursor);
        else el.insertBefore(document.createTextNode(text[i]), cursor);
        i++;
        const ch = text[i-1];
        const d = ch === '。' ? speed * 4 : ch === '，' ? speed * 2.5 : ch === '\n' ? speed * 6 : speed + Math.random() * 15;
        setTimeout(type, d);
      } else {
        setTimeout(() => { cursor.remove(); callback?.(); }, 400);
      }
    };
    type();
  }

  // 转场动画
  transition(callback, duration = 500) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:#0a0a0a;z-index:500;opacity:0;transition:opacity ${duration/2}ms ease;pointer-events:all;`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.style.opacity = '1');
    setTimeout(() => {
      callback?.();
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), duration / 2);
      }, 50);
    }, duration / 2);
  }

  // 墨渍效果（中式风格）
  inkSplash(x, y) {
    const splash = document.createElement('div');
    splash.style.cssText = `position:fixed;left:${x-100}px;top:${y-100}px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(139,69,19,0.15),transparent 70%);pointer-events:none;z-index:2;animation:inkSpread 2s ease-out forwards;`;
    document.body.appendChild(splash);
    setTimeout(() => splash.remove(), 2000);
  }

  // 彩带效果
  confetti(count = 60) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:300;overflow:hidden;';
    document.body.appendChild(container);
    const colors = ['#c9a96e','#6b8f71','#9b8ec4','#7a8ba0','#c45c4a'];
    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      const size = Math.random() * 8 + 4;
      c.style.cssText = `position:absolute;width:${size}px;height:${size}px;top:-10px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation:confettiFall ${Math.random()*3+2}s linear ${Math.random()*2}s forwards;`;
      container.appendChild(c);
    }
    setTimeout(() => container.remove(), 6000);
  }

  // 暗调氛围
  darkAtmosphere() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,rgba(80,0,0,0.1),rgba(0,0,0,0.8));pointer-events:none;z-index:300;opacity:0;transition:opacity 2s;';
    document.body.appendChild(el);
    requestAnimationFrame(() => el.style.opacity = '1');
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 2000); }, 5000);
  }

  // 注入CSS动画（只需调用一次）
  injectStyles() {
    if (document.getElementById('nc-styles')) return;
    const style = document.createElement('style');
    style.id = 'nc-styles';
    style.textContent = `
      @keyframes twblink { 50% { opacity:0; } }
      @keyframes inkSpread { 0% { transform:scale(0); opacity:1; } 100% { transform:scale(4); opacity:0; } }
      @keyframes confettiFall { 0% { transform:translateY(0) rotate(0deg); opacity:1; } 100% { transform:translateY(100vh) rotate(720deg); opacity:0; } }
      @keyframes ncFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes ncDebtSlide { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    `;
    document.head.appendChild(style);
  }
}


// ═══════════════════════════════════════════════════════════
// [6] API BRIDGE — 外部API接口
// ═══════════════════════════════════════════════════════════

class APIBridge {
  constructor() {
    this.cache = {};
    this.hitokotoUrl = 'https://v1.hitokoto.cn/';
  }

  // 一言API：获取随机名言
  // 分类: a动画 b漫画 c游戏 d文学 e原创 f网络 g其他 h影视 i诗词 j网易云 k哲学 l抖机灵
  async getQuote(category = 'd') {
    const cacheKey = `hitokoto_${category}`;
    if (this.cache[cacheKey]?.length) {
      return this.cache[cacheKey].pop();
    }
    try {
      const promises = Array(5).fill().map(() =>
        fetch(`${this.hitokotoUrl}?c=${category}`).then(r => r.json())
      );
      const results = await Promise.all(promises);
      const quotes = results.map(d => ({
        text: d.hitokoto,
        source: d.from,
        author: d.from_who || '',
        formatted: `「${d.hitokoto}」——${d.from_who || ''}《${d.from}》`
      }));
      this.cache[cacheKey] = quotes.reverse();
      return quotes[quotes.length - 1];
    } catch (e) {
      return { text: '命运的礼物早已在暗中标好了价格', source: '', author: '', formatted: '「命运的礼物早已在暗中标好了价格」' };
    }
  }

  // 预加载名言
  async preload(categories = ['d', 'i', 'k']) {
    await Promise.all(categories.map(c => this.getQuote(c)));
  }
}


// ═══════════════════════════════════════════════════════════
// [7] ENDING RESOLVER — 结局判定 + 身份卡片
// ═══════════════════════════════════════════════════════════

class EndingResolver {
  constructor() {
    this.endings = [];
  }

  setEndings(endings) { this.endings = endings; }

  // 根据债务系统和数值判定结局
  resolve(debtSystem, statsEngine) {
    const epitaph = debtSystem.epitaph();
    const stats = statsEngine.getAll();
    const lastDebt = debtSystem.getLast();
    const dominant = debtSystem.dominantType();

    // 先检查每个结局的条件
    for (const ending of this.endings) {
      if (ending.condition && ending.condition({ epitaph, stats, lastDebt, dominant, debts: debtSystem.getAll() })) {
        return { ...ending, epitaph };
      }
    }
    // 兜底：根据主导债务类型匹配
    return this.endings[this.endings.length - 1] || { title: '未知', subtitle: '你的命运无法定义' };
  }

  // 生成身份卡片HTML
  generateCard(ending, debtSystem, statsEngine, chapterTitle) {
    const epitaph = debtSystem.epitaph();
    const stats = statsEngine.getAll();
    const debts = debtSystem.getAll();
    const last5 = debts.slice(-5);

    return `
      <div class="nc-card" style="width:380px;max-width:90vw;margin:0 auto;padding:2.5rem 2rem;background:linear-gradient(135deg,#1a1814,#0d0b09);border:1px solid #c9a96e;position:relative;overflow:hidden;text-align:left;font-family:'Inter','Noto Serif SC',sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;">
          <div style="font-size:2rem;">${ending.icon || '⚖️'}</div>
          <div style="font-size:0.55rem;letter-spacing:0.3em;text-transform:uppercase;color:#6b6560;">权力的身份卡</div>
        </div>
        <div style="font-family:'Noto Serif SC',serif;font-size:1.8rem;font-weight:900;color:#c9a96e;margin-bottom:0.3rem;">${ending.title}</div>
        <div style="font-size:0.85rem;color:#e8e4de;line-height:1.6;margin-bottom:1.5rem;font-style:italic;">${ending.subtitle}</div>
        <div style="width:100%;height:1px;background:linear-gradient(90deg,transparent,#c9a96e,transparent);margin:1.2rem 0;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:1.2rem;">
          <div style="text-align:center;"><div style="font-family:'Noto Serif SC',serif;font-size:1.3rem;font-weight:700;color:#e8e4de;">${debts.length}</div><div style="font-size:0.55rem;color:#6b6560;letter-spacing:0.15em;">人情债总数</div></div>
          <div style="text-align:center;"><div style="font-family:'Noto Serif SC',serif;font-size:1.3rem;font-weight:700;color:#e8e4de;">${epitaph.dominantType}</div><div style="font-size:0.55rem;color:#6b6560;letter-spacing:0.15em;">主导债型</div></div>
        </div>
        <div style="margin-bottom:1.2rem;">
          ${last5.map(d => `<div style="font-size:0.7rem;color:#6b6560;line-height:1.5;margin-bottom:0.3rem;padding-left:0.8rem;border-left:1px solid rgba(255,255,255,0.08);">— ${d.text}</div>`).join('')}
        </div>
        <div style="font-size:0.75rem;color:#e8e4de;line-height:1.8;margin-bottom:1.2rem;padding:1rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
          ${ending.verdict || ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.55rem;color:#6b6560;letter-spacing:0.1em;">
          <span>${chapterTitle || ''}</span>
          <span>${new Date().toLocaleDateString('zh-CN')}</span>
        </div>
        <div style="position:absolute;bottom:2rem;right:2rem;font-family:'Noto Serif SC',serif;font-size:4rem;color:rgba(201,169,110,0.06);font-weight:900;pointer-events:none;">权</div>
      </div>
    `;
  }
}


// ═══════════════════════════════════════════════════════════
// [8] PERSISTENCE — 存档系统
// ═══════════════════════════════════════════════════════════

class Persistence {
  constructor(prefix = 'nc_') {
    this.prefix = prefix;
  }

  save(key, data) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  load(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  }

  remove(key) { localStorage.removeItem(this.prefix + key); }

  // 结局图鉴
  unlockEnding(chapterId, endingId) {
    const unlocked = this.load('endings') || {};
    if (!unlocked[chapterId]) unlocked[chapterId] = [];
    if (!unlocked[chapterId].includes(endingId)) unlocked[chapterId].push(endingId);
    this.save('endings', unlocked);
  }

  getUnlocked(chapterId) {
    const unlocked = this.load('endings') || {};
    return unlocked[chapterId] || [];
  }

  getAllUnlocked() { return this.load('endings') || {}; }
}


// ═══════════════════════════════════════════════════════════
// [9] NARRATIVE CORE — 主门面
// ═══════════════════════════════════════════════════════════

class NarrativeCore {
  constructor(options = {}) {
    this.container = options.container || '#app';
    this.social = SocialScience;
    this.audio = new AudioEngine();
    this.debts = new DebtSystem();
    this.stats = null;
    this.effects = new EffectsEngine();
    this.api = new APIBridge();
    this.ending = new EndingResolver();
    this.storage = new Persistence(options.prefix || 'nc_');

    this.state = {
      chapter: null,
      sceneIndex: 0,
      started: false,
      ended: false,
    };

    this.effects.injectStyles();
  }

  // 加载篇章数据
  loadChapter(chapter) {
    this.state.chapter = chapter;
    this.state.sceneIndex = 0;
    this.state.started = false;
    this.state.ended = false;
    this.debts.reset();
    this.stats = new StatsEngine(chapter.stats || []);
    this.ending.setEndings(chapter.endings || []);
    if (chapter.bgmStyle) this.audio.bgmStyle = chapter.bgmStyle;
  }

  // 开始游戏
  start() {
    if (!this.state.chapter) return;
    this.state.started = true;
    this.effects.initParticles();
    this._renderScene();
  }

  // 处理选择
  choose(choiceIndex) {
    const scene = this._currentScene();
    if (!scene || choiceIndex >= scene.choices.length) return;

    const choice = scene.choices[choiceIndex];
    this.audio.play('click');

    // 记录债务
    if (choice.debt) {
      const debtEntry = this.debts.add({
        text: choice.debt,
        type: choice.debtType || 'favor',
        scene: this.state.sceneIndex,
        analysis: choice.analysis || null,
      });
      this.audio.play('debt');
    }

    // 修改数值
    if (choice.effects) {
      Object.entries(choice.effects).forEach(([key, delta]) => {
        this.stats.modify(key, delta);
      });
    }
    this.stats.snapshot();

    // 社会学分析
    const socialAnalysis = choice.socialContext
      ? this.social.analyzeChoice(choice, choice.socialContext)
      : null;

    // 显示后果
    this._renderConsequence(choice, socialAnalysis);
  }

  // 下一场景
  nextScene() {
    const chapter = this.state.chapter;
    if (this.state.sceneIndex < chapter.scenes.length - 1) {
      this.effects.transition(() => {
        this.state.sceneIndex++;
        this._renderScene();
      });
    } else {
      this._showEnding();
    }
  }

  // 重新开始
  restart() {
    this.debts.reset();
    this.stats.reset();
    this.state.sceneIndex = 0;
    this.state.ended = false;
    this.effects.transition(() => this._renderScene());
  }

  // 获取当前状态
  getState() {
    return {
      sceneIndex: this.state.sceneIndex,
      debts: this.debts.getAll(),
      stats: this.stats?.getAll() || {},
      epitaph: this.debts.epitaph(),
    };
  }

  // ─── 内部渲染方法 ───

  _currentScene() {
    return this.state.chapter?.scenes?.[this.state.sceneIndex];
  }

  _renderScene() {
    const scene = this._currentScene();
    if (!scene) return;
    const container = document.querySelector(this.container);
    if (!container) return;

    this.audio.play('scene');

    container.innerHTML = `
      <div class="nc-scene" style="max-width:680px;margin:0 auto;padding:6rem 1.5rem 4rem;">
        <div class="nc-chapter-label" style="font-size:0.65rem;letter-spacing:0.4em;text-transform:uppercase;color:#c9a96e;margin-bottom:2rem;opacity:0;animation:ncFadeUp 0.8s ease 0.1s both;">${scene.chapter || ''} · ${scene.title || ''}</div>
        <div class="nc-scene-text" id="ncSceneText" style="font-family:'Noto Serif SC',serif;font-size:clamp(1rem,2.5vw,1.15rem);line-height:2.2;color:#e8e4de;margin-bottom:2rem;opacity:0;animation:ncFadeUp 0.8s ease 0.3s both;"></div>
        ${scene.narrator ? `<div class="nc-narrator" id="ncNarrator" style="font-size:0.8rem;color:#6b6560;font-style:italic;margin-bottom:2rem;padding:1rem 1.5rem;border-left:2px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);opacity:0;animation:ncFadeUp 0.8s ease 0.5s both;">${scene.narrator}</div>` : ''}
        <div class="nc-choices" id="ncChoices" style="opacity:0;animation:ncFadeUp 0.8s ease 0.7s both;"></div>
      </div>
      <div class="nc-debt-scroll" id="ncDebtScroll" style="position:fixed;right:0;top:0;bottom:0;width:260px;background:rgba(20,18,14,0.95);border-left:1px solid rgba(255,255,255,0.06);padding:4rem 1rem 1rem;overflow-y:auto;z-index:90;">
        <div style="font-family:'Noto Serif SC',serif;font-size:0.8rem;color:#c9a96e;letter-spacing:0.2em;text-align:center;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.06);">人情债记录本</div>
        <div id="ncDebtList">${this._renderDebtList()}</div>
        <div style="text-align:center;font-size:0.65rem;color:#6b6560;margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06);">共 ${this.debts.count()} 笔</div>
      </div>
    `;

    // 打字机效果
    const textEl = document.getElementById('ncSceneText');
    if (textEl) {
      this.effects.typewrite(textEl, scene.text, () => {
        this._renderChoices(scene);
      });
    }
  }

  _renderChoices(scene) {
    const choicesEl = document.getElementById('ncChoices');
    if (!choicesEl) return;

    scene.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.style.cssText = `width:100%;padding:1.2rem 1.5rem;margin-bottom:0.5rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:#e8e4de;font-family:'Noto Serif SC',serif;font-size:0.95rem;text-align:left;cursor:pointer;transition:all 0.4s cubic-bezier(0.23,1,0.32,1);position:relative;overflow:hidden;display:block;opacity:0;transform:translateX(-15px);`;
      btn.innerHTML = `
        <div>${choice.text}</div>
        ${choice.hint ? `<div style="font-family:'Inter',sans-serif;font-size:0.7rem;color:#6b6560;margin-top:0.4rem;font-style:italic;max-height:0;overflow:hidden;transition:max-height 0.5s;">${choice.hint}</div>` : ''}
        ${choice.bookQuote ? `<div style="font-size:0.65rem;color:rgba(196,92,74,0.7);margin-top:0.3rem;font-style:italic;">${choice.bookQuote}</div>` : ''}
        ${choice.debt ? `<div style="font-size:0.7rem;color:#c9a96e;margin-top:0.3rem;opacity:0.6;">↳ 将记录: ${choice.debt}</div>` : ''}
      `;
      btn.onmouseenter = () => { btn.style.background = 'rgba(255,255,255,0.06)'; btn.style.transform = 'translateX(8px)'; btn.style.borderColor = 'rgba(255,255,255,0.15)'; btn.querySelector('div:nth-child(2)')?.style && (btn.querySelector('div:nth-child(2)').style.maxHeight = '100px'); };
      btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.03)'; btn.style.transform = 'translateX(0)'; btn.style.borderColor = 'rgba(255,255,255,0.06)'; };
      btn.onclick = () => this.choose(i);
      choicesEl.appendChild(btn);
      setTimeout(() => { btn.style.opacity = '1'; btn.style.transform = 'translateX(0)'; }, 150 + i * 120);
    });
  }

  _renderConsequence(choice, socialAnalysis) {
    const container = document.querySelector(this.container + ' .nc-scene');
    if (!container) return;

    // 禁用选项
    document.querySelectorAll('#ncChoices button').forEach(btn => {
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.3';
    });

    // 后果
    const box = document.createElement('div');
    box.style.cssText = 'margin-top:2rem;padding:1.5rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-left:3px solid #c9a96e;opacity:0;transform:translateY(15px);transition:all 0.8s ease;';
    box.innerHTML = `
      <div style="font-size:0.65rem;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:0.8rem;">后果</div>
      <div style="font-family:'Noto Serif SC',serif;font-size:0.9rem;line-height:1.8;color:#e8e4de;">${choice.consequence || ''}</div>
      ${choice.debt ? `<div style="margin-top:1rem;padding-top:0.8rem;border-top:1px solid rgba(255,255,255,0.06);font-size:0.8rem;color:#c9a96e;font-style:italic;">📜 已记录: ${choice.debt}</div>` : ''}
      ${socialAnalysis ? `<div style="margin-top:0.8rem;font-size:0.7rem;color:#6b6560;line-height:1.6;">${Object.values(socialAnalysis).map(a => a.quote || a.description || '').filter(Boolean).map(q => `<div style="margin-bottom:0.3rem;">${q}</div>`).join('')}</div>` : ''}
    `;
    container.appendChild(box);
    requestAnimationFrame(() => { box.style.opacity = '1'; box.style.transform = 'translateY(0)'; });

    // 更新债务卷轴
    this._updateDebtScroll();

    // 继续按钮
    setTimeout(() => {
      const btn = document.createElement('button');
      btn.style.cssText = 'margin-top:2rem;padding:0.8rem 2rem;background:transparent;border:1px solid rgba(255,255,255,0.06);color:#e8e4de;font-family:"Noto Serif SC",serif;font-size:0.9rem;cursor:pointer;transition:all 0.4s;opacity:0;';
      btn.textContent = this.state.sceneIndex < this.state.chapter.scenes.length - 1 ? '继续 →' : '查看结局 →';
      btn.onmouseenter = () => btn.style.borderColor = '#c9a96e';
      btn.onmouseleave = () => btn.style.borderColor = 'rgba(255,255,255,0.06)';
      btn.onclick = () => this.nextScene();
      container.appendChild(btn);
      setTimeout(() => btn.style.opacity = '1', 100);
    }, 1500);
  }

  _updateDebtScroll() {
    const list = document.getElementById('ncDebtList');
    if (list) list.innerHTML = this._renderDebtList();
    const count = document.querySelector('#ncDebtScroll div:last-child');
    if (count) count.textContent = `共 ${this.debts.count()} 笔`;
  }

  _renderDebtList() {
    return this.debts.getAll().map(d => {
      const typeInfo = this.debts.types[d.type] || {};
      return `<div style="padding:0.6rem;margin-bottom:0.6rem;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);font-size:0.72rem;line-height:1.5;color:#6b6560;border-left:2px solid ${typeInfo.color || '#6b6560'};animation:ncDebtSlide 0.5s ease;">
        <span style="color:${typeInfo.color || '#6b6560'};font-size:0.6rem;">[${typeInfo.label || d.type}]</span> ${d.text}
      </div>`;
    }).join('');
  }

  async _showEnding() {
    this.state.ended = true;
    const ending = this.ending.resolve(this.debts, this.stats);
    this.audio.play('ending');
    this.audio.stopBGM();

    // 记录结局
    if (ending.id) {
      this.storage.unlockEnding(this.state.chapter.id || 'default', ending.id);
    }

    // 特效
    if (ending.atmosphere === 'confetti') this.effects.confetti();
    if (ending.atmosphere === 'dark') this.effects.darkAtmosphere();

    const epitaph = this.debts.epitaph();
    const card = this.ending.generateCard(ending, this.debts, this.stats, this.state.chapter.title);

    // 获取随机名言
    let quote = ending.quote || '';
    try {
      const q = await this.api.getQuote(this.state.chapter.id === 'ming' ? 'i' : 'k');
      if (q) quote = q.formatted;
    } catch (e) {}

    const container = document.querySelector(this.container);
    container.innerHTML = `
      <div style="max-width:680px;margin:0 auto;padding:4rem 1.5rem;text-align:center;">
        <div style="font-family:'Noto Serif SC',serif;font-size:clamp(2rem,5vw,3rem);font-weight:900;margin-bottom:0.5rem;background:linear-gradient(135deg,#e8e4de,#c9a96e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;opacity:0;animation:ncFadeUp 1s ease 0.3s both;">${ending.title}</div>
        <div style="font-size:1rem;color:#6b6560;margin-bottom:2rem;opacity:0;animation:ncFadeUp 1s ease 0.5s both;">${ending.subtitle}</div>
        <div style="opacity:0;animation:ncFadeUp 1s ease 0.7s both;">${card}</div>
        <div style="font-style:italic;color:#6b6560;font-size:0.85rem;margin:2rem 0;opacity:0;animation:ncFadeUp 1s ease 0.9s both;">${quote}</div>
        ${ending.analysis ? `<div style="max-width:600px;margin:0 auto 2rem;text-align:left;padding:1.5rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);font-size:0.8rem;color:#6b6560;line-height:1.8;opacity:0;animation:ncFadeUp 1s ease 1.1s both;"><div style="color:#c9a96e;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:0.8rem;">社会学解读</div>${ending.analysis}</div>` : ''}
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;opacity:0;animation:ncFadeUp 1s ease 1.3s both;">
          <button onclick="location.reload()" style="padding:0.8rem 2rem;background:transparent;border:1px solid #c9a96e;color:#e8e4de;font-family:'Noto Serif SC',serif;font-size:0.9rem;cursor:pointer;transition:all 0.4s;">再来一次</button>
        </div>
      </div>
    `;
  }
}

// ─── CSS 注入（响应式） ───
(function() {
  if (document.getElementById('nc-responsive')) return;
  const style = document.createElement('style');
  style.id = 'nc-responsive';
  style.textContent = `
    @media (max-width:900px) {
      .nc-debt-scroll { display:none !important; }
    }
    @media (min-width:901px) {
      .nc-scene { margin-right:260px !important; }
    }
  `;
  document.head.appendChild(style);
})();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NarrativeCore, SocialScience, AudioEngine, DebtSystem, StatsEngine, EffectsEngine, APIBridge, EndingResolver, Persistence };
}
