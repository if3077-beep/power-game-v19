/**
 * MiroFish v9 - 推演引擎
 * 纯本地推演 + 心理画像分析 + 框架驱动分析
 */

const EMOTION_MAP = {
  anxious:   { valence: -0.6, arousal:  0.7, primary: 'fear',       label: '焦虑' },
  angry:     { valence: -0.7, arousal:  0.9, primary: 'anger',      label: '愤怒' },
  sad:       { valence: -0.8, arousal: -0.5, primary: 'sadness',    label: '难过' },
  confused:  { valence: -0.3, arousal:  0.2, primary: 'surprise',   label: '迷茫' },
  hopeful:   { valence:  0.5, arousal:  0.3, primary: 'anticipation', label: '期待' },
  fearful:   { valence: -0.7, arousal:  0.8, primary: 'fear',       label: '恐惧' },
  neutral:   { valence:  0.0, arousal:  0.0, primary: 'trust',      label: '平静' },
  excited:   { valence:  0.8, arousal:  0.9, primary: 'joy',        label: '兴奋' },
};

const SCOPE_LABELS = ['', '仅自己', '身边几个人', '一个群体', '大范围', '全社会'];
const TIME_LABELS = ['', '一周', '两周', '一个月', '三个月', '一年'];
const INTENSITY_LABELS = ['', '微弱', '轻微', '中等', '强烈', '剧烈'];
const UNCERTAINTY_LABELS = ['', '几乎确定', '比较确定', '中等', '不确定', '完全未知'];

const FACTOR_LABELS = {
  media: '社交媒体放大', authority: '权威介入', peer: '同辈压力',
  money: '经济因素', time: '时间紧迫', reputation: '面子/声誉',
  health: '健康相关', family: '家庭牵扯',
};

// ===== 输入解析器 =====
function parseUserInput(text) {
  const result = { problem: '', fear: '', hope: '', contradiction: '' };

  const fearMatch = text.match(/(?:怕|担心|害怕|焦虑|恐惧|担忧|顾虑|不安|慌|怕的是|担心的是)(.{2,30}?)(?:[，。,.]|$|但是|可是|不过|而且|同时|另外)/);
  if (fearMatch) result.fear = fearMatch[1].trim();

  const hopeMatch = text.match(/(?:想|希望|想要|期望|盼|要是能|最好|渴望|追求|目标是|打算)(.{2,30}?)(?:[，。,.]|$|但是|可是|不过|但是怕|可是怕)/);
  if (hopeMatch) result.hope = hopeMatch[1].trim();

  const contraMatch = text.match(/(?:但是|可是|不过|但|矛盾的是|纠结的是|两难的是|问题是|难的是|麻烦的是)(.{2,30}?)(?:[，。,.]|$)/);
  if (contraMatch) result.contradiction = contraMatch[1].trim();

  const firstSentence = text.split(/[。.！!？?\n]/)[0];
  result.problem = firstSentence.length > 40 ? firstSentence.substring(0, 40) + '...' : firstSentence;

  return result;
}

// ===== 心理画像生成器 =====
function generateProfile(text, mood, factors) {
  const t = text || '';
  const m = mood || 'neutral';
  const f = factors || [];
  const len = t.length;
  const hasQuestion = /[？?]/.test(t);
  const hasExclaim = /[！!]/.test(t);
  const hasNegation = /不|没|别|莫|勿|非|未/.test(t);
  const hasCertainty = /一定|肯定|必须|绝对|当然|显然|必然/.test(t);
  const hasFuture = /以后|未来|将来|会|将|打算|计划|准备/.test(t);
  const hasSocial = /别人|大家|父母|朋友|同事|领导|对象|家人|社会/.test(t);
  const hasEmotion = /焦虑|害怕|恐惧|愤怒|难过|开心|兴奋|崩溃|绝望|希望/.test(t);
  const hasHedge = /可能|也许|大概|或许|应该|似乎|好像|不确定/.test(t);
  const hasAction = /做|干|试|跑|投|学|换|辞|买|卖|找/.test(t);
  const questionCount = (t.match(/[？?]/g) || []).length;
  const wordCount = t.replace(/\s/g, '').length;

  const moodInfo = EMOTION_MAP[m] || EMOTION_MAP.neutral;

  // 风险承受：基于情绪效价 + 行动词 + 确定性词
  let risk = 0.5 + moodInfo.valence * 0.3;
  if (hasAction) risk += 0.1;
  if (hasCertainty) risk += 0.1;
  if (hasNegation) risk -= 0.1;
  if (m === 'fearful' || m === 'anxious') risk -= 0.15;
  if (m === 'excited' || m === 'hopeful') risk += 0.15;
  if (f.includes('money') || f.includes('reputation')) risk -= 0.1;

  // 行动倾向：基于行动词密度 + 情绪唤醒度
  let action = 0.5 + moodInfo.arousal * 0.2;
  if (hasAction) action += 0.15;
  if (hasFuture) action += 0.1;
  if (hasHedge) action -= 0.15;
  if (questionCount > 2) action -= 0.1;
  if (m === 'confused' || m === 'sad') action -= 0.1;
  if (m === 'angry' || m === 'excited') action += 0.15;

  // 情绪觉察：基于情绪词 + 感叹号 + 文本长度
  let emotional = 0.5;
  if (hasEmotion) emotional += 0.2;
  if (hasExclaim) emotional += 0.1;
  if (len > 100) emotional += 0.1;
  if (hasCertainty) emotional -= 0.1;
  if (m === 'neutral') emotional -= 0.15;
  if (m === 'angry' || m === 'sad' || m === 'anxious') emotional += 0.1;

  // 社交依赖：基于社交词 + 问句频率
  let social = 0.5;
  if (hasSocial) social += 0.2;
  if (questionCount > 1) social += 0.1;
  if (hasHedge) social += 0.05;
  if (f.includes('peer') || f.includes('authority')) social += 0.1;
  if (/自己|独立|一个人/.test(t)) social -= 0.15;

  // 不确定容忍：基于模糊词 + 问句 + 对冲表达
  let uncertainty = 0.5;
  if (hasHedge) uncertainty += 0.2;
  if (questionCount > 1) uncertainty += 0.1;
  if (hasCertainty) uncertainty -= 0.2;
  if (m === 'confused') uncertainty += 0.15;
  if (m === 'neutral') uncertainty += 0.05;

  // 时间视角：基于未来词 + 计划表达
  let timeH = 0.5;
  if (hasFuture) timeH += 0.2;
  if (/计划|规划|长远|以后|退休|未来/.test(t)) timeH += 0.15;
  if (/现在|今天|目前|马上|立刻|赶紧/.test(t)) timeH -= 0.15;
  if (m === 'anxious' || m === 'fearful') timeH += 0.05;

  const clamp = v => Math.max(0.05, Math.min(0.95, v));

  return {
    risk_tolerance: clamp(risk),
    action_orientation: clamp(action),
    emotional_awareness: clamp(emotional),
    social_dependency: clamp(social),
    uncertainty_tolerance: clamp(uncertainty),
    time_horizon: clamp(timeH),
  };
}

// ============================================================
//  框架驱动分析引擎（内嵌精简版）
// ============================================================

const AnalysisFrameworks = {

  powerDynamics: {
    name: '权力动力学',
    analyze(ctx) {
      const insights = [];
      if (ctx.stakes === '高' || ctx.stakes === '极高') {
        insights.push({ severity: 'high', text: '高利益情境下，权力弱势方的每一步都被放大审视。表面上的"选择自由"往往是假象——选项本身已经被权力结构预筛选了。' });
      }
      insights.push({ severity: 'medium', text: '注意谁掌握"叙事权"——不是谁说得大声，而是谁的版本会被当作"事实"。掌握叙事权的人不需要直接施压，只需要定义框架。' });
      if (ctx.role && (ctx.role.includes('新人') || ctx.role.includes('下属'))) {
        insights.push({ severity: 'high', text: '当退出成本极高时，"忍"不是懦弱而是理性。但长期来看，必须想办法降低退出成本——这才是真正的权力来源。' });
      }
      return insights;
    },
    score(option, ctx) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('direct') || t.includes('confrontational')) s += 2;
      if (t.includes('passive') || t.includes('avoidant')) s -= 1;
      if (t.includes('coalition') || t.includes('alliance')) s += 3;
      if (t.includes('information') || t.includes('leverage')) s += 2;
      if ((ctx.stakes === '高' || ctx.stakes === '极高') && s > 2) s = 1;
      return { dim: '权力', score: Math.max(-3, Math.min(5, s)) };
    },
  },

  groupPsychology: {
    name: '群体心理',
    analyze(ctx) {
      const insights = [];
      insights.push({ severity: 'medium', text: '人在群体中的行为，往往不是"真实的自己"，而是"群体需要自己成为的样子"。区分这两者，是做出清醒决策的前提。' });
      if (ctx.observers && ctx.observers > 2) {
        insights.push({ severity: 'high', text: `当在场人数超过${ctx.observers}人时，每个人的责任感都会被稀释。如果你想推动行动，必须打破这种分散——指定具体的人做具体的事。` });
      }
      return insights;
    },
    score(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('public') || t.includes('visible')) s += 1;
      if (t.includes('whistle') || t.includes('dissent')) s -= 2;
      if (t.includes('coalition')) s += 2;
      return { dim: '社会成本', score: Math.max(-3, Math.min(5, s)) };
    },
  },

  moralDilemma: {
    name: '道德困境',
    analyze() {
      return [
        { severity: 'high', text: '大多数道德困境之所以"困"，不是因为没有好选项，而是因为你在用不同的道德框架评判同一个选择。先搞清楚你最在意的是结果、规则、品格还是关系。' },
        { severity: 'high', text: '真实世界的道德选择很少是"干净"的。有时候你必须在两个都"不够好"的选项中选一个。承认这一点不是犬儒，是成熟。' },
      ];
    },
    score(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('ethical') || t.includes('principled')) s += 2;
      if (t.includes('selfish') || t.includes('exploitative')) s -= 2;
      if (t.includes('deceptive') || t.includes('manipulative')) s -= 1;
      return { dim: '道德', score: Math.max(-3, Math.min(5, s)) };
    },
  },

  gameTheory: {
    name: '博弈论',
    analyze(ctx) {
      const insights = [];
      if (ctx.standoff || ctx.stakes === '高') {
        insights.push({ severity: 'high', text: '这是一个胆小鬼博弈结构：最理性的做法是让对方相信你绝对不会退让——但如果你真的不退让，两败俱伤。高手的做法是"制造可控的不可预测性"。' });
      } else {
        insights.push({ severity: 'high', text: '这是一个囚徒困境结构：双方合作的总收益最大，但对每个个体来说，背叛都是更安全的策略。这就是为什么信任这么难建立——不是因为人们坏，而是因为理性计算指向背叛。' });
      }
      return insights;
    },
    score(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('cooperate') || t.includes('collaborate')) s += 2;
      if (t.includes('defect') || t.includes('betray')) s -= 2;
      if (t.includes('negotiate') || t.includes('mediate')) s += 2;
      return { dim: '博弈', score: Math.max(-3, Math.min(5, s)) };
    },
  },

  informationAsymmetry: {
    name: '信息不对称',
    analyze() {
      return [
        { severity: 'high', text: '信息不对称是权力的隐形来源。在任何博弈中，先问三个问题：我知道什么对方不知道的？对方知道什么我不知道的？谁能更早获得新信息？' },
        { severity: 'medium', text: '在信息不对称的世界里，行动比语言更有说服力。花大代价做的承诺比口头承诺可信得多——因为代价本身就是信号。' },
      ];
    },
    score(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('information') || t.includes('research')) s += 2;
      if (t.includes('signal') || t.includes('demonstrate')) s += 2;
      if (t.includes('conceal') || t.includes('secret')) s -= 1;
      return { dim: '信息', score: Math.max(-3, Math.min(5, s)) };
    },
  },

  emotionalManipulation: {
    name: '情感操控',
    analyze(ctx) {
      const insights = [
        { severity: 'high', text: '操控之所以有效，是因为操控者利用了你的情感需求（被爱、被认可、不被抛弃）。识别操控的第一步不是"对抗"，而是意识到自己的哪些需求正在被利用。' },
      ];
      if (ctx.relationship && ctx.relationship.includes('亲密')) {
        insights.push({ severity: 'high', text: '亲密关系中的操控最难识别，因为它和"关心"长得很像。区分标准：关心让你更自由，操控让你更受限。' });
      }
      return insights;
    },
    score(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('boundary') || t.includes('assertive')) s += 3;
      if (t.includes('comply') || t.includes('submit')) s -= 2;
      if (t.includes('document') || t.includes('evidence')) s += 2;
      return { dim: '反操控', score: Math.max(-3, Math.min(5, s)) };
    },
  },

  socialExchange: {
    name: '社会交换',
    analyze() {
      return [
        { severity: 'medium', text: '互惠是人类社会最强的规范之一。收到好处会产生"人情债"，这种债务感比金钱债务更难摆脱——因为你没法明确说"我不欠你的"。' },
        { severity: 'high', text: '关系中最危险的不是冲突，而是"不公平感"的积累。当一方觉得自己付出远多于回报时，怨恨会像复利一样增长，直到爆发。' },
      ];
    },
    score(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('invest') || t.includes('build_trust')) s += 2;
      if (t.includes('exploit')) s -= 2;
      if (t.includes('negotiate') || t.includes('clarify')) s += 2;
      return { dim: '关系', score: Math.max(-3, Math.min(5, s)) };
    },
  },

  cognitiveBias: {
    name: '认知偏差',
    analyze(ctx) {
      const biases = [];
      if (ctx.history_length > 3) biases.push('沉没成本谬误');
      if (ctx.conviction_level === 'high') biases.push('确认偏误');
      if (ctx.risk_averse) biases.push('损失厌恶');
      if (ctx.judging_others) biases.push('基本归因错误');

      if (biases.length > 0) {
        return [{ severity: 'high', text: `你可能正在经历：${biases.join('、')}。暂停一下，问自己"如果我之前的判断是错的呢？"` }];
      }
      return [{ severity: 'medium', text: '在做重要决策时，问自己一个问题："如果我对这件事一无所知，只看证据，我会怎么判断？"这个思想实验能帮你绕过大部分认知偏差。' }];
    },
    score(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('evidence') || t.includes('reflect')) s += 2;
      if (t.includes('impulsive') || t.includes('emotional')) s -= 2;
      if (t.includes('consult') || t.includes('outside_view')) s += 2;
      return { dim: '认知', score: Math.max(-3, Math.min(5, s)) };
    },
  },
};


// ============================================================
//  推演引擎（纯本地 + 集成分析引擎）
// ============================================================

class PredictionEngine {
  constructor() {
    this.analysisEngine = new MiniAnalysisEngine();
  }

  extractKeywords(text) {
    const keywords = [];
    const patterns = [
      { regex: /跳槽|换工作|辞职|离职|求职|面试|升职|降薪|加班|职场|职业倦怠|副业|offer|简历/g, tag: '职业', icon: 'C' },
      { regex: /对象|男友|女友|老公|老婆|分手|吵架|冷战|恋爱|结婚|离婚|暧昧|前任|复合/g, tag: '感情', icon: 'H' },
      { regex: /公司|老板|同事|领导|团队|项目|裁员|失业|被裁|优化|述职|汇报/g, tag: '职场', icon: 'B' },
      { regex: /创业|开公司|合伙人|融资|生意|天使轮|孵化器|商业模式/g, tag: '创业', icon: 'R' },
      { regex: /孩子|高考|考试|学校|成绩|老师|同学|留学|考研|志愿|录取|补课|作业/g, tag: '教育', icon: 'E' },
      { regex: /股票|基金|投资|理财|亏损|赚钱|房价|房贷|工资|消费|存钱|保险|信用卡|网贷|负债|借钱/g, tag: '财务', icon: 'F' },
      { regex: /焦虑|抑郁|失眠|压力|崩溃|迷茫|害怕|内耗|情绪|心理咨询|自残|绝望|孤独/g, tag: '心理', icon: 'M' },
      { regex: /父母|家人|亲戚|家庭|养老|带娃|原生家庭|催生|逼婚|遗产|赡养/g, tag: '家庭', icon: 'A' },
      { regex: /健康|生病|医院|体检|减肥|运动|疲劳|亚健康|癌症|慢性病|康复|住院/g, tag: '健康', icon: 'W' },
      { regex: /AI|人工智能|ChatGPT|技术|转型|学习|被取代|机器人|自动化|程序员/g, tag: '科技', icon: 'T' },
    ];

    patterns.forEach(p => {
      const matches = text.match(p.regex);
      if (matches) {
        keywords.push({ tag: p.tag, icon: p.icon, words: [...new Set(matches)].slice(0, 3) });
      }
    });

    if (keywords.length === 0) {
      keywords.push({ tag: '日常', icon: 'D', words: [text.substring(0, 6)] });
    }
    return keywords;
  }

  generateEmpathy(text, mood) {
    const keywords = this.extractKeywords(text);
    const domain = keywords[0]?.tag || '日常';
    const domainPool = DOMAIN_EMPATHY[domain];
    const parsed = parseUserInput(text);

    if (parsed.fear && parsed.hope) {
      const templates = [
        `你想的是${parsed.hope}，但心里真正怕的是${parsed.fear}。这种拉扯感我懂。`,
        `一边是"${parsed.hope}"的期待，一边是"${parsed.fear}"的恐惧。你卡在中间，确实难受。`,
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }

    if (domainPool && domainPool[mood]) {
      const pool = domainPool[mood];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    const empathyTemplates = {
      anxious: ['我能感受到你内心的不安。面对不确定性时，焦虑是很正常的反应——这说明你在认真对待这件事。'],
      angry: ['你的愤怒是可以理解的。当我们的付出没有得到应有的回报时，生气是人之常情。'],
      sad: ['我能感受到你的难过。有些事情确实让人心里不好受，允许自己悲伤是很重要的。'],
      confused: ['迷茫的时候最难熬，因为连方向都看不清。但很多时候，迷茫恰恰是成长的前奏。'],
      hopeful: ['你的期待让我感到振奋。有目标、有动力，这本身就是一种很宝贵的状态。'],
      fearful: ['恐惧是人类最原始的保护机制。你感到害怕，说明你意识到了某种真实的风险。'],
      neutral: ['你看起来比较平静，这种状态其实很适合做理性分析。让我们来看看各种可能的走向。'],
      excited: ['你的兴奋很有感染力！这种能量是推动事情发展的重要动力。'],
    };

    const templates = empathyTemplates[mood] || empathyTemplates.neutral;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateLocal(text, mood, scope, intensity, timeScale, uncertainty, factors) {
    const moodInfo = EMOTION_MAP[mood] || EMOTION_MAP.neutral;
    const keywords = this.extractKeywords(text);
    const domain = keywords[0]?.tag || '日常';
    const timeLabel = TIME_LABELS[timeScale] || '一个月';
    const parsed = parseUserInput(text);

    const empathy = this.generateEmpathy(text, mood);

    // 生成心理画像
    const profile = generateProfile(text, mood, factors);

    const baseOptimistic = moodInfo.valence > 0.2 ? 40 : (moodInfo.valence < -0.2 ? 25 : 35);
    const basePessimistic = moodInfo.valence < -0.2 ? 30 : (moodInfo.valence > 0.2 ? 15 : 20);

    const uncFactor = uncertainty / 5;
    const optimistic = Math.max(10, Math.min(60, baseOptimistic + Math.round((Math.random() - 0.5) * uncFactor * 20)));
    const pessimistic = Math.max(10, Math.min(50, basePessimistic + Math.round((Math.random() - 0.5) * uncFactor * 15)));
    const neutral = 100 - optimistic - pessimistic;

    const templates = PATH_TEMPLATES[domain] || PATH_TEMPLATES.default;

    // 运行分析引擎
    const analysis = this.analysisEngine.analyze({
      scenario: text,
      context: { role: '', stakes: scope >= 4 ? '高' : '中等', relationship: domain, trust_level: 'low' },
      options: [
        { id: 'a', text: '主动出击', tags: ['direct', 'confrontational'] },
        { id: 'b', text: '隐忍观察', tags: ['passive', 'strategic'] },
        { id: 'c', text: '寻求帮助', tags: ['coalition', 'seek_help'] },
      ],
    });

    return {
      empathy,
      parsed,
      profile,
      optimistic: { probability: optimistic, ...templates.optimistic(text, timeLabel, parsed) },
      neutral: { probability: Math.max(15, neutral), ...templates.neutral(text, timeLabel, parsed) },
      pessimistic: { probability: pessimistic, ...templates.pessimistic(text, timeLabel, parsed) },
      advice: this.generateAdvice(domain, mood),
      psychology: this.getPsychologyInsight(mood),
      domain,
      keywords,
      readingCards: READING_CARDS[domain] || READING_CARDS.default,
      stats: STATS_DATA[domain] || STATS_DATA.default,
      twists: TWIST_REPLACEMENTS[domain] || TWIST_REPLACEMENTS.default,
      analysis,
    };
  }

  generateAdvice(domain, mood) {
    const advicePool = {
      财务: [
        { text: '先列出所有收入支出，搞清楚钱到底去了哪里。很多人惊恐地发现"消失的钱"花在了外卖和订阅上。', icon: 'doc' },
        { text: '投资前先存够3-6个月的应急金。没有安全垫就上赌桌，输不起的。', icon: 'shield' },
      ],
      职业: [
        { text: '列出你真正在意的3件事（成长、收入、自由、意义），用它们做判断标准。', icon: 'list' },
        { text: '找一个做过类似决定的人聊聊，比搜100篇文章更有用。', icon: 'chat' },
      ],
      感情: [
        { text: '先想清楚自己想要什么，再去看对方做了什么。', icon: 'heart' },
        { text: '给彼此空间和时间，情绪过去后再沟通效果会好很多。', icon: 'clock' },
      ],
      default: [
        { text: '聚焦在你能控制的事情上，放下无法控制的。', icon: 'target' },
        { text: '把大问题拆成小步骤，每完成一步都是真实的进展。', icon: 'steps' },
      ],
    };

    const moodAdvice = {
      anxious: { text: '先照顾好自己的情绪。深呼吸、运动、和信任的人聊聊，比做任何决定都重要。', icon: 'breathe' },
      angry: { text: '在做重大决定前，给自己至少24小时的冷静期。愤怒时做的决定90%会后悔。', icon: 'pause' },
      fearful: { text: '接受不确定性本身。把注意力放在你能控制的事情上。', icon: 'eye' },
      confused: { text: '把所有选项写在纸上，给每个选项打分。理性分析能减少50%的纠结。', icon: 'chart' },
    };

    const pool = advicePool[domain] || advicePool.default;
    const result = [];
    if (moodAdvice[mood]) result.push(moodAdvice[mood]);
    result.push(...pool);
    return result.slice(0, 3);
  }

  getPsychologyInsight(mood) {
    const insights = {
      anxious: { title: '情绪预测偏差 (Impact Bias)', content: '人们倾向于高估未来事件对自己情绪的影响强度。无论好事还是坏事，实际带来的情绪变化通常没有想象中那么剧烈，恢复也比预期快。' },
      angry: { title: '确认偏误 (Confirmation Bias)', content: '愤怒时我们倾向于寻找支持自己已有信念的信息，而忽略相反证据。在做重要决定时，主动寻找反对意见是明智的。' },
      sad: { title: '峰终定律 (Peak-End Rule)', content: '人们对经历的评价主要取决于情绪最强烈的峰值和结束时的感受。结尾的质量比过程的长度更重要。' },
      confused: { title: '选择悖论 (Paradox of Choice)', content: '选项越多反而越难做出决定，做出决定后的满意度也越低。减少选项反而能提升幸福感。' },
      fearful: { title: '习得性无助 (Learned Helplessness)', content: '当人反复经历无法控制的负面事件后，即使环境改变了也会放弃尝试。意识到这一点是打破循环的第一步。' },
      hopeful: { title: '心理韧性 (Psychological Resilience)', content: '韧性不是不受伤，而是受伤后能恢复。经历过适度逆境的人比从未经历挫折的人具有更强的心理韧性。' },
      neutral: { title: '自我服务偏差 (Self-Serving Bias)', content: '人们倾向于把成功归因于自己的能力，把失败归因于外部因素。这种偏差保护了自尊，但也阻碍了成长。' },
      excited: { title: '情绪传染 (Emotional Contagion)', content: '情绪像病毒一样在人群中传播。与积极的人在一起会让你也变得积极，反之亦然。选择你的社交圈就是选择你的情绪状态。' },
    };
    return insights[mood] || insights.neutral;
  }

  async run(text, mood, scope, intensity, timeScale, uncertainty, factors, onStep) {
    if (onStep) onStep('empathy', '正在理解你的处境...', 10);
    await this.delay(400);
    if (onStep) onStep('analyze', '识别领域与关键词...', 30);
    await this.delay(300);
    if (onStep) onStep('profile', '生成心理画像...', 50);
    await this.delay(300);
    if (onStep) onStep('frameworks', '运行分析框架...', 65);
    await this.delay(300);
    if (onStep) onStep('paths', '生成三条推演路径...', 80);
    await this.delay(400);
    if (onStep) onStep('insights', '整合数据与洞察...', 90);
    await this.delay(300);

    const result = this.generateLocal(text, mood, scope, intensity, timeScale, uncertainty, factors);
    if (onStep) onStep('complete', '推演完成', 100);
    return result;
  }

  delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}


// ============================================================
//  精简版分析引擎
// ============================================================

class MiniAnalysisEngine {
  constructor() {
    this.frameworks = Object.keys(AnalysisFrameworks);
  }

  analyze(input) {
    const { scenario, context = {}, options = [] } = input;
    const ctx = { ...context };

    const frameworkResults = [];
    const allInsights = [];

    for (const fwKey of this.frameworks) {
      const fw = AnalysisFrameworks[fwKey];
      const insights = fw.analyze(ctx);
      frameworkResults.push({ name: fw.name, key: fwKey, insights });
      allInsights.push(...insights.map(i => ({ ...i, framework: fw.name })));
    }

    const scoredOptions = options.map(option => {
      const scores = [];
      for (const fwKey of this.frameworks) {
        const fw = AnalysisFrameworks[fwKey];
        if (fw.score) scores.push(fw.score(option, ctx));
      }
      const total = scores.length > 0
        ? scores.reduce((a, b) => a + b.score, 0) / scores.length
        : 0;
      return { ...option, scores, total: Math.round(total * 10) / 10 };
    });

    scoredOptions.sort((a, b) => b.total - a.total);

    const chain = [
      { label: '观察事实', content: `情境核心：${scenario}` },
    ];

    const highInsights = allInsights.filter(i => i.severity === 'high');
    if (highInsights.length > 0) {
      chain.push({ label: '识别模式', content: highInsights[0].text, sub: highInsights[0].framework });
    }

    chain.push({ label: '归因动机', content: '先区分三个层次：对方做了什么（事实）、对方为什么这么做（假设）、你为什么这么解读（投射）。大部分冲突源于把第3层当成了第1层。' });

    if (scoredOptions.length > 0) {
      chain.push({ label: '评估选项', content: `综合评分最高的选项："${scoredOptions[0].text}"（${scoredOptions[0].total}分）` });
    }

    chain.push({ label: '预测走向', content: '无论你选什么，记住：人的反应往往比你预期的更极端。好的结果不会像你想的那么好，坏的结果也不会像你想的那么坏。', sub: '情绪预测偏差' });

    const tensions = [];
    tensions.push({ label: '策略张力', text: '短期利益与长期关系之间的矛盾——这是所有社会博弈的核心张力。' });
    tensions.push({ label: '行动张力', text: '做点什么的冲动 vs 什么都不做的安全。大部分决策焦虑来自这个根本矛盾。' });

    return {
      frameworks: frameworkResults,
      options: scoredOptions,
      chain,
      tensions,
      insights: allInsights,
    };
  }
}


// ===== 路径模板 =====
const PATH_TEMPLATES = {
  财务: {
    optimistic: (text, time, parsed) => ({
      title: '开源节流，财务状况逐步改善',
      driving_factors: ['你开始正视财务问题，这是改变的第一步', '调整消费习惯能释放出意想不到的现金流'],
      timeline: [
        { period: '第1周', event: '梳理所有收入支出，发现至少2-3个可以立刻砍掉的"隐形消费"' },
        { period: '第2-3周', event: '制定了还债/储蓄计划，开始严格执行' },
        { period: `第1个月`, event: '消费习惯明显改善，月底发现比预期多存了一笔' },
      ],
      chain_effects: ['财务压力减轻带来睡眠质量改善', '有钱傍底让你做其他决定时更有底气'],
      opportunities: ['养成的理财习惯会持续产生复利效应'],
      risks: ['过度节省可能影响生活质量和社交'],
      stakeholders: [{ role: '你自己', view: '从焦虑转为掌控，金钱不再是噩梦' }],
    }),
    neutral: (text, time) => ({
      title: '收入和支出基本持平，原地踏步',
      driving_factors: ['缺乏明确的理财目标和计划', '收入增长赶不上消费欲望的增长'],
      timeline: [
        { period: '第1-2周', event: '想过要改变，但迟迟没有行动' },
        { period: '第3-4周', event: '偶尔记账，但坚持不下来' },
      ],
      chain_effects: ['财务焦虑周期性发作'],
      opportunities: ['现状至少没有恶化，还有调整的空间'],
      risks: ['通货膨胀在悄悄侵蚀你的购买力'],
      stakeholders: [{ role: '你自己', view: '知道该管钱了，但总是缺乏执行力' }],
    }),
    pessimistic: (text, time) => ({
      title: '消费失控，债务雪球越滚越大',
      driving_factors: ['情绪化消费成为应对压力的方式', '以贷养贷的恶性循环开始形成'],
      timeline: [
        { period: '第1-2周', event: '继续用消费缓解焦虑，信用卡账单又创新高' },
        { period: '第3-4周', event: '开始拆东墙补西墙，多张信用卡轮转还款' },
      ],
      chain_effects: ['长期的财务压力导致焦虑和失眠'],
      opportunities: ['危机也可能成为彻底改变消费习惯的契机'],
      risks: ['债务危机可能引发更严重的心理问题'],
      stakeholders: [{ role: '你自己', view: '被数字压得喘不过气' }],
    }),
  },

  职业: {
    optimistic: (text, time) => ({
      title: '破局而出，找到新的职业赛道',
      driving_factors: ['主动出击带来的信息差优势'],
      timeline: [
        { period: '第1-2周', event: '更新简历，拓展人脉，获得几个面试机会' },
        { period: '第3-4周', event: '面试过程中更清晰了自己的定位，收到1-2个offer' },
      ],
      chain_effects: ['收入提升带来生活质量改善'],
      opportunities: ['新行业可能带来意想不到的发展方向'],
      risks: ['新环境的文化适应需要时间'],
      stakeholders: [{ role: '你自己', view: '虽然紧张但充满期待' }],
    }),
    neutral: (text, time) => ({
      title: '原地调整，在现有位置上寻找突破',
      driving_factors: ['现有平台的稳定性价值'],
      timeline: [
        { period: '第1-2周', event: '和领导谈了一次，表达了想尝试新方向的想法' },
        { period: '第3-4周', event: '被安排参与一个新项目，工作内容有了变化' },
      ],
      chain_effects: ['暂时缓解了焦虑，但根本矛盾未解决'],
      opportunities: ['内部转岗的成本远低于外部跳槽'],
      risks: ['如果新项目也不满意，可能陷入反复纠结'],
      stakeholders: [{ role: '你自己', view: '选择观望，但内心仍在权衡' }],
    }),
    pessimistic: (text, time) => ({
      title: '继续消耗，职业倦怠逐渐加深',
      driving_factors: ['缺乏改变的勇气或外部条件不支持'],
      timeline: [
        { period: '第1-2周', event: '投了几份简历，但回复寥寥' },
        { period: '第3-4周', event: '面试了几家但都不太合适，开始怀疑自己' },
      ],
      chain_effects: ['持续的不满影响工作表现'],
      opportunities: ['这段经历让你更清楚自己不想要什么'],
      risks: ['长期职业倦怠可能导致更严重的职业危机'],
      stakeholders: [{ role: '你自己', view: '感到无力和挫败' }],
    }),
  },

  感情: {
    optimistic: (text, time) => ({
      title: '坦诚沟通后，关系进入新的阶段',
      driving_factors: ['真诚的表达打开了对方的心防'],
      timeline: [
        { period: '第1周', event: '鼓起勇气表达了自己的真实感受' },
        { period: '第2-3周', event: '开始更频繁地沟通，发现之前的很多矛盾其实是误解' },
      ],
      chain_effects: ['关系的改善提升了整体生活满意度'],
      opportunities: ['经历过波折的感情往往更牢固'],
      risks: ['不要因为和好就忽视之前的根本问题'],
      stakeholders: [{ role: '你自己', view: '从纠结变成释然' }, { role: '对方', view: '感受到你的真诚' }],
    }),
    neutral: (text, time) => ({
      title: '冷淡期持续，关系进入不确定状态',
      driving_factors: ['双方都不愿意先低头'],
      timeline: [
        { period: '第1-2周', event: '冷战继续，偶尔的交流也很表面' },
        { period: '第3-4周', event: '开始习惯这种疏远的状态' },
      ],
      chain_effects: ['长期冷淡会让感情慢慢消磨殆尽'],
      opportunities: ['冷静期也可以让双方更清楚自己想要什么'],
      risks: ['拖得越久，和好的难度越大'],
      stakeholders: [{ role: '你自己', view: '不知道该坚持还是放弃' }],
    }),
    pessimistic: (text, time) => ({
      title: '矛盾加深，关系走向破裂边缘',
      driving_factors: ['核心矛盾始终未被正视'],
      timeline: [
        { period: '第1-2周', event: '一次小争吵可能引爆积压已久的情绪' },
        { period: '第3-4周', event: '开始认真考虑是否还要继续' },
      ],
      chain_effects: ['关系的破裂会影响双方的信任感'],
      opportunities: ['即使分手，也是一种解脱和新的开始'],
      risks: ['在情绪最激烈的时候做决定往往会后悔'],
      stakeholders: [{ role: '你自己', view: '疲惫又心痛' }],
    }),
  },

  default: {
    optimistic: (text, time) => ({
      title: '积极变化正在发生，事情向好的方向发展',
      driving_factors: ['你的主动应对创造了有利条件'],
      timeline: [
        { period: '第1-2周', event: '开始采取行动，心态逐渐从被动转为主动' },
        { period: '第3-4周', event: '看到一些积极的反馈，信心增强' },
      ],
      chain_effects: ['积极的心态带来更多机会'],
      opportunities: ['这段经历可能成为人生的转折点'],
      risks: ['不要因为顺利而掉以轻心'],
      stakeholders: [{ role: '你自己', view: '从焦虑转为自信' }],
    }),
    neutral: (text, time) => ({
      title: '缓慢调整，找到一个中间状态',
      driving_factors: ['时间带来的自然缓冲'],
      timeline: [
        { period: '第1-2周', event: '情绪波动较大' },
        { period: '第3-4周', event: '开始接受现状，减少内耗' },
      ],
      chain_effects: ['心态趋于平稳'],
      opportunities: ['稳定期是为下一次突破积蓄力量的好时机'],
      risks: ['可能陷入舒适区'],
      stakeholders: [{ role: '你自己', view: '不再那么痛苦，但也没有特别满意' }],
    }),
    pessimistic: (text, time) => ({
      title: '压力持续，需要做好长期应对准备',
      driving_factors: ['外部环境没有明显改善'],
      timeline: [
        { period: '第1-2周', event: '尝试了一些方法但效果不明显' },
        { period: '第3-4周', event: '感到疲惫和无力' },
      ],
      chain_effects: ['长期压力可能影响身心健康'],
      opportunities: ['逆境中的成长往往最深刻'],
      risks: ['需要警惕长期压力带来的健康问题'],
      stakeholders: [{ role: '你自己', view: '虽然艰难，但没有放弃' }],
    }),
  },

  心理: {
    optimistic: (text, time) => ({
      title: '开始自我觉察，情绪管理能力明显提升',
      driving_factors: ['你愿意面对自己的情绪而不是压抑它'],
      timeline: [
        { period: '第1周', event: '尝试写情绪日记，开始觉察自己的情绪触发点' },
        { period: '第2-3周', event: '发现运动或冥想对情绪有明显改善' },
      ],
      chain_effects: ['情绪稳定带来决策质量的提升'],
      opportunities: ['这段自我探索的经历会让你终身受益'],
      risks: ['不要期望线性进步，情绪的波动是正常的'],
      stakeholders: [{ role: '你自己', view: '开始和自己和解' }],
    }),
    neutral: (text, time) => ({
      title: '时好时坏，情绪在波动中缓慢调整',
      driving_factors: ['情绪问题不是一天形成的，也不会一天解决'],
      timeline: [
        { period: '第1-2周', event: '好的日子和坏的日子交替出现' },
        { period: '第3-4周', event: '偶尔尝试一些调节方法，但没有坚持' },
      ],
      chain_effects: ['长期的情绪波动会消耗大量心理能量'],
      opportunities: ['波动本身也说明你还有感受力'],
      risks: ['如果持续超过三个月没有改善，建议寻求专业帮助'],
      stakeholders: [{ role: '你自己', view: '有点累了，但还在撑着' }],
    }),
    pessimistic: (text, time) => ({
      title: '情绪问题加重，开始影响日常生活',
      driving_factors: ['问题的根源没有被触及'],
      timeline: [
        { period: '第1-2周', event: '情绪低落的时间越来越长' },
        { period: '第3-4周', event: '开始影响工作效率、社交和睡眠' },
      ],
      chain_effects: ['情绪问题影响工作/学业，反过来加重情绪问题'],
      opportunities: ['危机可能是促使你真正寻求帮助的契机'],
      risks: ['长期的情绪问题可能导致抑郁症等临床问题'],
      stakeholders: [{ role: '你自己', view: '感觉被困住了' }],
    }),
  },

  家庭: {
    optimistic: (text, time) => ({
      title: '找到边界感，家庭关系趋于健康',
      driving_factors: ['你开始学会在爱和自我之间找到平衡'],
      timeline: [
        { period: '第1-2周', event: '尝试温和但坚定地表达自己的边界' },
        { period: '第3-4周', event: '虽然有摩擦，但家人开始慢慢尊重你的选择' },
      ],
      chain_effects: ['健康的家庭关系提升了整体幸福感'],
      opportunities: ['你的改变可能会带动整个家庭系统的改善'],
      risks: ['改变的过程中会有反复，需要耐心'],
      stakeholders: [{ role: '你自己', view: '从"忍"变成"沟通"' }],
    }),
    neutral: (text, time) => ({
      title: '维持表面和平，核心问题悬而未决',
      driving_factors: ['改变家庭关系需要勇气和时机'],
      timeline: [
        { period: '第1-2周', event: '想改变但不知道怎么开口' },
        { period: '第3-4周', event: '偶尔尝试表达，但很快被旧模式淹没' },
      ],
      chain_effects: ['压抑的情绪会以其他方式表现出来'],
      opportunities: ['稳定至少意味着没有恶化'],
      risks: ['长期压抑可能导致情绪爆发'],
      stakeholders: [{ role: '你自己', view: '习惯了，但偶尔还是会觉得委屈' }],
    }),
    pessimistic: (text, time) => ({
      title: '矛盾升级，家庭关系陷入僵局',
      driving_factors: ['长期积累的矛盾到了临界点'],
      timeline: [
        { period: '第1-2周', event: '一次冲突可能引爆所有积怨' },
        { period: '第3-4周', event: '互相不理解，沟通变成争吵' },
      ],
      chain_effects: ['家庭矛盾会影响工作和社交'],
      opportunities: ['危机也可能打破僵局'],
      risks: ['家庭关系的破裂对所有成员都是巨大的伤害'],
      stakeholders: [{ role: '你自己', view: '心累又无奈' }],
    }),
  },

  创业: {
    optimistic: (text, time) => ({
      title: '验证需求，找到可行的商业模式',
      driving_factors: ['你发现了一个真实存在的市场需求'],
      timeline: [
        { period: '第1-2周', event: '用MVP测试市场反应，收到真实用户反馈' },
        { period: '第3-4周', event: '根据反馈快速迭代，产品方向开始清晰' },
      ],
      chain_effects: ['早期用户成为口碑传播的种子'],
      opportunities: ['这段经历培养的创业思维终身受用'],
      risks: ['初期的成功可能是幸存者偏差'],
      stakeholders: [{ role: '你自己', view: '从"想做"变成"在做"' }],
    }),
    neutral: (text, time) => ({
      title: '想法很多但缺乏执行，原地踏步',
      driving_factors: ['完美主义让你迟迟不肯开始'],
      timeline: [
        { period: '第1-2周', event: '看了大量创业课程和文章，但没有动手' },
        { period: '第3-4周', event: '写了几版商业计划书，但总觉得不够完善' },
      ],
      chain_effects: ['准备的时间越长，启动的阻力越大'],
      opportunities: ['充分的准备也可以减少试错成本'],
      risks: ['市场窗口可能在你准备的过程中关闭'],
      stakeholders: [{ role: '你自己', view: '脑子里在创业，现实中在准备' }],
    }),
    pessimistic: (text, time) => ({
      title: '投入过多但市场不买账',
      driving_factors: ['对市场需求的判断出现偏差'],
      timeline: [
        { period: '第1-2周', event: '产品上线但反响冷淡' },
        { period: '第3-4周', event: '尝试了几种获客方式，成本都太高' },
      ],
      chain_effects: ['财务压力影响判断'],
      opportunities: ['及时止损也是成功'],
      risks: ['不甘心导致持续投入，亏损扩大'],
      stakeholders: [{ role: '你自己', view: '不甘心但也疲惫了' }],
    }),
  },

  教育: {
    optimistic: (text, time) => ({
      title: '找到适合自己的节奏，成绩稳步提升',
      driving_factors: ['调整学习方法后效率明显提高'],
      timeline: [
        { period: '第1周', event: '分析了自己的薄弱环节，制定了针对性计划' },
        { period: '第2-3周', event: '开始用费曼学习法，发现很多以为懂的知识其实没懂' },
      ],
      chain_effects: ['成绩提升带来的正反馈让学习动力更强'],
      opportunities: ['好的学习习惯一旦形成，后续学习会越来越轻松'],
      risks: ['不要因为进步就松懈'],
      stakeholders: [{ role: '你自己', view: '从"我不行"变成"我可以试试"' }],
    }),
    neutral: (text, time) => ({
      title: '不上不下，维持现状',
      driving_factors: ['缺乏足够的动力或压力去改变'],
      timeline: [
        { period: '第1-2周', event: '按部就班地上课、写作业' },
        { period: '第3-4周', event: '偶尔焦虑一下，但很快被日常节奏冲淡' },
      ],
      chain_effects: ['稳定但没有突破，时间在不知不觉中流逝'],
      opportunities: ['稳定期也是积蓄力量的时期'],
      risks: ['如果不主动寻求突破，可能错过关键的提升窗口期'],
      stakeholders: [{ role: '你自己', view: '说不上满意也说不上不满意' }],
    }),
    pessimistic: (text, time) => ({
      title: '学习动力持续下降，陷入恶性循环',
      driving_factors: ['越学越没信心，越没信心越不想学'],
      timeline: [
        { period: '第1-2周', event: '上课走神、作业拖延的情况加重' },
        { period: '第3-4周', event: '开始逃避学习相关的讨论' },
      ],
      chain_effects: ['成绩下滑导致自我评价降低'],
      opportunities: ['低谷也可能是重新审视"为什么学"的契机'],
      risks: ['固定型思维一旦形成，需要专业干预才能打破'],
      stakeholders: [{ role: '你自己', view: '对学习彻底失去了兴趣和信心' }],
    }),
  },

  健康: {
    optimistic: (text, time) => ({
      title: '问题发现及时，积极干预效果明显',
      driving_factors: ['早期发现是治疗成功的关键'],
      timeline: [
        { period: '第1周', event: '做了全面检查，医生给出了明确的改善方案' },
        { period: '第2-4周', event: '开始执行改善方案：规律作息、调整饮食、适度运动' },
      ],
      chain_effects: ['身体改善带来情绪改善'],
      opportunities: ['这次健康警报可能成为生活方式的转折点'],
      risks: ['改善后容易松懈'],
      stakeholders: [{ role: '你自己', view: '从害怕变成积极' }],
    }),
    neutral: (text, time) => ({
      title: '问题存在但没有明显恶化',
      driving_factors: ['有些健康问题确实需要时间观察'],
      timeline: [
        { period: '第1-2周', event: '做了基本检查，医生说观察即可' },
        { period: '第3-4周', event: '偶尔会担心，但日常基本不受影响' },
      ],
      chain_effects: ['定期检查的习惯建立起来了'],
      opportunities: ['观察期也是了解自己身体的好机会'],
      risks: ['如果忽视定期复查，可能错过最佳干预窗口'],
      stakeholders: [{ role: '你自己', view: '不再那么紧张了，但也没有完全放心' }],
    }),
    pessimistic: (text, time) => ({
      title: '忽视身体信号，小问题可能发展为大问题',
      driving_factors: ['工作生活太忙，总是把健康排在最后'],
      timeline: [
        { period: '第1-2周', event: '觉得"应该没什么大事"，拖延就医' },
        { period: '第3-4周', event: '症状时好时坏，用止痛药凑合' },
      ],
      chain_effects: ['拖延就医导致治疗难度和成本增加'],
      opportunities: ['现在行动还不晚，越早越好'],
      risks: ['小病拖成大病的案例比比皆是'],
      stakeholders: [{ role: '你自己', view: '心里知道该管了，但总是有借口' }],
    }),
  },

  科技: {
    optimistic: (text, time) => ({
      title: '主动学习新技术，反而获得了竞争优势',
      driving_factors: ['恐惧转化为学习动力'],
      timeline: [
        { period: '第1-2周', event: '开始系统学习AI相关技能' },
        { period: '第3-4周', event: '在工作中尝试用AI工具提效，效果显著' },
      ],
      chain_effects: ['技能提升带来职业安全感'],
      opportunities: ['掌握AI工具的人会比被取代的人更有价值'],
      risks: ['技术变化快，需要持续学习'],
      stakeholders: [{ role: '你自己', view: '从恐惧变成好奇' }],
    }),
    neutral: (text, time) => ({
      title: '观望中，不确定该不该投入时间学习',
      driving_factors: ['信息过载导致选择困难'],
      timeline: [
        { period: '第1-2周', event: '看了很多关于AI的新闻，越看越焦虑' },
        { period: '第3-4周', event: '偶尔尝试了一些AI工具，但没有深入' },
      ],
      chain_effects: ['焦虑在持续，但行动跟不上'],
      opportunities: ['至少你开始关注这个领域了'],
      risks: ['等到"必须学"的时候再学，可能已经晚了'],
      stakeholders: [{ role: '你自己', view: '知道重要，但总是拖' }],
    }),
    pessimistic: (text, time) => ({
      title: '持续焦虑但没有行动，被时代甩开',
      driving_factors: ['恐惧让人瘫痪而不是行动'],
      timeline: [
        { period: '第1-2周', event: '继续刷焦虑新闻，但没有开始学习' },
        { period: '第3-4周', event: '看到同行开始用AI提效，更加焦虑' },
      ],
      chain_effects: ['焦虑-逃避-更焦虑的恶性循环'],
      opportunities: ['任何时候开始都不算晚'],
      risks: ['技术替代是不可逆的趋势'],
      stakeholders: [{ role: '你自己', view: '被困在焦虑里' }],
    }),
  },
};

window.PredictionEngine = PredictionEngine;
window.parseUserInput = parseUserInput;
window.generateProfile = generateProfile;
window.EMOTION_MAP = EMOTION_MAP;
window.SCOPE_LABELS = SCOPE_LABELS;
window.TIME_LABELS = TIME_LABELS;
window.INTENSITY_LABELS = INTENSITY_LABELS;
window.UNCERTAINTY_LABELS = UNCERTAINTY_LABELS;
window.AnalysisFrameworks = AnalysisFrameworks;
window.MiniAnalysisEngine = MiniAnalysisEngine;
