/**
 * MiroFish v12 - 推演引擎
 * 改进的分析模型 + 预测多样性 + 事件随机变体 + 因素影响
 */

const EMOTION_MAP = {
  anxious: { valence: -0.6, arousal: 0.7, label: '焦虑' },
  angry:   { valence: -0.7, arousal: 0.9, label: '愤怒' },
  sad:     { valence: -0.8, arousal: -0.5, label: '难过' },
  confused:{ valence: -0.3, arousal: 0.2, label: '迷茫' },
  hopeful: { valence: 0.5, arousal: 0.3, label: '期待' },
  fearful: { valence: -0.7, arousal: 0.8, label: '恐惧' },
  neutral: { valence: 0.0, arousal: 0.0, label: '平静' },
  excited: { valence: 0.8, arousal: 0.9, label: '兴奋' },
};

const SCOPE_LABELS = ['', '仅自己', '身边几个人', '一个群体', '大范围', '全社会'];
const TIME_LABELS = ['', '一周', '两周', '一个月', '三个月', '一年'];
const INTENSITY_LABELS = ['', '微弱', '轻微', '中等', '强烈', '剧烈'];
const UNCERTAINTY_LABELS = ['', '几乎确定', '比较确定', '中等', '不确定', '完全未知'];

// 因素对路径的影响描述
const FACTOR_EFFECTS = {
  media: {
    optimistic: '社交媒体上的一次曝光可能带来意外机会',
    neutral: '社交媒体的信息过载让你更难做决定',
    pessimistic: '社交媒体上的比较让你的焦虑被放大了十倍',
  },
  authority: {
    optimistic: '一个有经验的前辈给了你关键的建议',
    neutral: '领导/老师的态度让你更加犹豫',
    pessimistic: '权威人物的一句否定让你的信心崩塌',
  },
  peer: {
    optimistic: '同龄人的成功激励了你',
    neutral: '同辈压力让你做出不是自己真正想要的选择',
    pessimistic: '你发现自己已经落后同龄人太多',
  },
  money: {
    optimistic: '经济上的缓冲给了你试错的底气',
    neutral: '经济压力让你不敢轻举妄动',
    pessimistic: '钱的问题成了压垮你的最后一根稻草',
  },
  time: {
    optimistic: '时间紧迫反而让你做出了果断的决定',
    neutral: '截止日期在逼近，但你还在纠结',
    pessimistic: '时间不够了，你被迫做出一个不满意的决定',
  },
  reputation: {
    optimistic: '你决定不在乎别人的看法，反而获得了尊重',
    neutral: '面子问题让你的选择空间变小了',
    pessimistic: '你害怕被评判，所以选择了最安全但最无趣的路',
  },
  health: {
    optimistic: '身体的信号让你及时停下来调整',
    neutral: '健康问题时好时坏，让你分心',
    pessimistic: '身体开始抗议了，但你还在硬撑',
  },
  family: {
    optimistic: '家人的支持成了你最大的后盾',
    neutral: '家庭的期望和你的想法在拉扯',
    pessimistic: '家庭的压力让你无法做出真正属于自己的选择',
  },
};

class PredictionEngine {
  constructor() {
    this.externalQuote = null;
    this.fetchExternalQuote();
  }

  async fetchExternalQuote() {
    if (!API_CONFIG || !API_CONFIG.quotes) return;
    for (const api of API_CONFIG.quotes) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), API_CONFIG.timeout || 3000);
        const res = await fetch(api.url, { signal: controller.signal });
        clearTimeout(timer);
        const data = await res.json();
        const parsed = api.parser(data);
        if (parsed && parsed.text) { this.externalQuote = parsed; return; }
      } catch (e) {}
    }
  }

  // ===== 改进的 MBTI 推断 =====
  inferMBTI(text, mood, userPreferences = {}) {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    const textLower = text.toLowerCase();

    // 用户预选（高权重）
    if (userPreferences.EI) scores[userPreferences.EI] += 6;
    if (userPreferences.SN) scores[userPreferences.SN] += 6;
    if (userPreferences.TF) scores[userPreferences.TF] += 6;
    if (userPreferences.JP) scores[userPreferences.JP] += 6;

    // 关键词匹配
    for (const [dim, info] of Object.entries(MBTI_DIMENSIONS)) {
      for (const kw of info.keywords) {
        if (textLower.includes(kw)) scores[dim] += 1.5;
      }
    }

    // 情绪修正
    if (['anxious', 'fearful', 'sad'].includes(mood)) { scores.I += 0.5; scores.F += 0.5; }
    if (['angry', 'excited'].includes(mood)) { scores.E += 0.5; scores.T += 0.5; }
    if (mood === 'confused') { scores.P += 0.5; scores.N += 0.5; }
    if (mood === 'neutral') { scores.T += 0.3; scores.J += 0.3; }

    // 文本特征修正（降低权重，避免过度推断）
    if (text.length > 150) { scores.I += 0.3; scores.N += 0.3; }
    if (text.length < 20) { scores.E += 0.3; scores.S += 0.3; }

    const questionCount = (text.match(/[？?]/g) || []).length;
    if (questionCount >= 3) { scores.N += 0.5; scores.P += 0.5; }

    if (/一定|必须|肯定|绝对/.test(text)) { scores.J += 1; }
    if (/可能|也许|大概|不确定|不知道/.test(text)) { scores.P += 1; }
    if (/因为|所以|导致|因此|逻辑|分析/.test(text)) { scores.T += 1; }
    if (/感觉|觉得|心疼|难受|开心|喜欢/.test(text)) { scores.F += 1; }

    const type = (scores.E >= scores.I ? 'E' : 'I') +
                 (scores.S >= scores.N ? 'S' : 'N') +
                 (scores.T >= scores.F ? 'T' : 'F') +
                 (scores.J >= scores.P ? 'J' : 'P');

    // 计算置信度
    const dims = [['E','I'], ['S','N'], ['T','F'], ['J','P']];
    const dimDiffs = dims.map(([a,b]) => Math.abs(scores[a] - scores[b]));
    const avgDiff = dimDiffs.reduce((s,d) => s + d, 0) / 4;
    const hasUserPref = Object.keys(userPreferences).length;
    const baseConfidence = hasUserPref ? 70 : 35;
    const confidence = Math.min(95, Math.max(25, Math.round(baseConfidence + avgDiff * 8)));

    return {
      type,
      confidence,
      scores,
      style: MBTI_STYLES[type] || MBTI_STYLES['ISFJ'],
      userPreferences,
    };
  }

  // ===== MBTI 增强的共情 =====
  generateEmpathyWithMBTI(text, mood, persona, mbti) {
    const keywords = this.extractKeywords(text);
    const domain = keywords[0]?.tag || '日常';
    const pool = DOMAIN_EMPATHY[domain];
    let base;
    if (pool && pool[mood] && pool[mood].length) {
      base = pool[mood][Math.floor(Math.random() * pool[mood].length)];
    } else {
      const defaults = {
        anxious: '我能感受到你内心的不安。',
        angry: '你的愤怒是可以理解的。',
        sad: '我能感受到你的难过。',
        confused: '迷茫的时候最难熬。',
        hopeful: '你的期待让我感到振奋。',
        fearful: '恐惧是人类最原始的保护机制。',
        neutral: '你看起来比较平静。',
        excited: '你的兴奋很有感染力！',
      };
      base = defaults[mood] || defaults.neutral;
    }

    // MBTI 维度增强（更温和的措辞）
    const dim = mbti.type;
    const additions = [];
    if (dim[0] === 'I') additions.push('你习惯在内心消化这些，但有时候说出来会更好');
    if (dim[0] === 'E') additions.push('你可能会想找人聊聊这件事，这对你来说很重要');
    if (dim[1] === 'N') additions.push('你总是在想"如果"和"万一"，这让你看到了更多可能性');
    if (dim[1] === 'S') additions.push('你更关注眼前的具体问题，这是务实的表现');
    if (dim[2] === 'F') additions.push('这件事对你的意义，比表面上看起来更深');
    if (dim[2] === 'T') additions.push('你在试图理性分析，但有些情绪是分析不了的');
    if (dim[3] === 'J') additions.push('你想要一个确定的答案，但人生有时候就是没有标准答案');
    if (dim[3] === 'P') additions.push('你不想被框住，但有时候做选择本身就是一种解脱');

    // 随机选一个添加
    if (additions.length > 0) {
      base += additions[Math.floor(Math.random() * additions.length)] + '。';
    }

    return this.personaModify(base, persona, mood);
  }

  extractKeywords(text) {
    const keywords = [];
    const patterns = [
      { regex: /跳槽|换工作|辞职|离职|求职|面试|升职|降薪|加班|职场|职业倦怠|副业|offer|简历/g, tag: '职业', icon: '💼' },
      { regex: /对象|男友|女友|老公|老婆|分手|吵架|冷战|恋爱|结婚|离婚|暧昧|前任|复合/g, tag: '感情', icon: '💕' },
      { regex: /公司|老板|同事|领导|团队|项目|裁员|失业|被裁|优化|述职/g, tag: '职业', icon: '🏢' },
      { regex: /创业|开公司|合伙人|融资|生意|天使轮|商业模式/g, tag: '创业', icon: '🚀' },
      { regex: /孩子|高考|考试|学校|成绩|老师|同学|留学|考研|志愿|录取|补课|作业/g, tag: '教育', icon: '📚' },
      { regex: /股票|基金|投资|理财|亏损|赚钱|房价|房贷|工资|消费|存钱|保险|信用卡|网贷|负债|借钱/g, tag: '财务', icon: '💰' },
      { regex: /焦虑|抑郁|失眠|压力|崩溃|迷茫|害怕|内耗|情绪|心理咨询|自残|绝望|孤独/g, tag: '心理', icon: '🧠' },
      { regex: /父母|家人|亲戚|家庭|养老|带娃|原生家庭|催生|逼婚|遗产|赡养/g, tag: '家庭', icon: '👨‍👩‍👧' },
      { regex: /健康|生病|医院|体检|减肥|运动|疲劳|亚健康|癌症|慢性病|康复/g, tag: '健康', icon: '❤️' },
      { regex: /AI|人工智能|ChatGPT|技术|转型|被取代|程序员/g, tag: '科技', icon: '🤖' },
      { regex: /自媒体|短视频|直播|流量|粉丝|内容|创作|公众号|抖音|小红书/g, tag: '自媒体', icon: '📱' },
      { regex: /物业|小区|邻居|装修|搬家|租房|买房|换城市|通勤|合租/g, tag: '居住', icon: '🏠' },
    ];
    patterns.forEach(p => {
      const matches = text.match(p.regex);
      if (matches) keywords.push({ tag: p.tag, icon: p.icon, words: [...new Set(matches)].slice(0, 3) });
    });
    if (keywords.length === 0) keywords.push({ tag: '日常', icon: '📌', words: [text.substring(0, 6)] });
    return keywords;
  }

  personaModify(text, persona, mood) {
    if (persona === 'brutal') {
      const p = ['说实话，', '别骗自己了——', '我直说吧：', '残酷的真相是：'];
      return p[Math.floor(Math.random() * p.length)] + text;
    }
    if (persona === 'elder') {
      const p = ['十年前的我也经历过这个。回头看，', '如果我能回到你这个时候——', '以过来人的经验：'];
      return p[Math.floor(Math.random() * p.length)] + text;
    }
    return text;
  }

  personaTitle(title, persona) {
    if (persona === 'brutal') {
      const map = { '积极变化': '运气不错的话，可能会有转机', '缓慢调整': '大概率不痛不痒地凑合下去', '压力持续': '不改变的话，等着被生活教做人' };
      for (const [k, v] of Object.entries(map)) { if (title.includes(k)) return v; }
      return '说白了就是：' + title;
    }
    if (persona === 'elder') {
      const map = { '积极变化': '这条路我走过，确实能走通', '缓慢调整': '大多数人最后都选了这条路', '压力持续': '我当年就是这么耗过来的' };
      for (const [k, v] of Object.entries(map)) { if (title.includes(k)) return v; }
      return '从我的经验来看：' + title;
    }
    return title;
  }

  personaTurningPoint(event, persona) {
    if (persona === 'brutal') return event.replace(/可能/g, '大概率').replace(/开始/g, '终于').replace(/改善/g, '没那么烂了');
    if (persona === 'elder') return '我当时也经历了这个——' + event;
    return event;
  }

  personaYouLose(lose, persona) {
    if (persona === 'brutal') return '选了这条路，你得做好准备：' + lose;
    if (persona === 'elder') return '如果重来一次，我会担心失去的：' + lose;
    return '这条路的代价是：' + lose;
  }

  personaCostOfNothing(cost, persona) {
    if (persona === 'brutal') return '三个月后你还是现在这个鬼样子——' + cost;
    if (persona === 'elder') return '别问我怎么知道的——' + cost;
    return '如果什么都不做：' + cost;
  }

  // ===== 生成三件烂事（带变体） =====
  generateBadThings(domain, persona) {
    const templates = {
      财务: [
        { icon: '💳', variants: ['月底翻信用卡账单时发现数字比上个月又多了一截', '收到银行短信提醒"本期最低还款额"，心跳漏了一拍', '你发现自己已经在三个平台上借了钱'] },
        { icon: '🛒', variants: ['深夜刷到"限时折扣"，告诉自己"就这一次"', '你把购物车清空了三次，但每次又加回来更多', '收到快递时已经忘了自己买过这个'] },
        { icon: '💸', variants: ['朋友约饭你说"最近有点紧"，对方说"没事我请你"', '你发现请客吃饭一个月花了三千多', '同事讨论旅游计划时你默默不说话'] },
      ],
      职业: [
        { icon: '😴', variants: ['周一早上闹钟响了三遍你才起来', '你在工位上发呆了二十分钟才打开电脑', '你发现自己已经连续三周没有期待过任何一天'] },
        { icon: '📧', variants: ['领导在群里@你，心跳漏了一拍——结果只是普通文件', '你打开邮箱发现有67封未读，但没有一封是好消息', '你收到一封"关于组织架构调整的通知"'] },
        { icon: '🪞', variants: ['新来的实习生比你小五岁，干的活比你多', '你更新简历时发现能写的亮点比想象中少', '面试时被问"你的核心竞争力是什么"，你卡壳了'] },
      ],
      感情: [
        { icon: '📱', variants: ['你忍不住翻对方朋友圈，看到一条模糊动态就脑补一出大戏', '你打了一段话又删掉，反复三次', '你发现对方的朋友圈对你设置了三天可见'] },
        { icon: '🌙', variants: ['某个周五晚上一个人待着，突然特别想找人说话', '你路过你们以前常去的地方，脚步不自觉地慢了下来', '你在凌晨两点翻到了半年前的聊天记录'] },
        { icon: '💬', variants: ['你们可能会有一次"假性和好"——表面恢复联系，但谁都没提根本问题', '你们的对话越来越短，从长语音变成了"嗯""好"', '你发现你们已经一个月没有打过电话了'] },
      ],
      教育: [
        { icon: '📊', variants: ['成绩出来那天假装不在意，手抖着点开查询页面', '你发现自己"假装学习"的时间比真正学习多', '模考成绩出来后你在厕所待了十分钟'] },
        { icon: '👨‍👩‍👧', variants: ['家庭聚餐时亲戚问"考得怎么样"', '爸妈打电话说"我们不给你压力"，但语气里全是压力', '你发现自己的朋友圈把家人屏蔽了'] },
        { icon: '📱', variants: ['凌晨两点打开学习APP，刷了五分钟切回短视频', '你的书桌上堆满了资料但一本都没翻完', '你发现自己收藏的学习方法比做过的题还多'] },
      ],
      心理: [
        { icon: '🛏️', variants: ['某天请了一天假，不是身体不舒服，就是不想动', '你发现自己已经连续一周没有出过门了', '你躺在床上但怎么也睡不着，脑子里全是事'] },
        { icon: '😶', variants: ['有人问"最近怎么样"，你说"还行"', '你发现自己已经很久没有真正笑过了', '你在朋友圈发了"我很好"但其实一点都不好'] },
        { icon: '🔄', variants: ['情绪好转那天觉得自己"已经好了"，然后下一次低谷崩溃得更厉害', '你发现自己又在重复去年的模式', '你在某个瞬间觉得一切都没有意义'] },
      ],
      健康: [
        { icon: '🏥', variants: ['搜某个症状被结果吓到，纠结三天要不要去医院', '体检报告上多了一个"建议复查"的项目', '你发现自己已经三个月没有运动了'] },
        { icon: '🍔', variants: ['说"从明天开始健康饮食"，但明天加班到九点又点了外卖', '你发现自己一周吃了五次外卖', '你把冰箱里的蔬菜放到了过期'] },
        { icon: '😴', variants: ['知道该早睡了，但到了晚上就是不想结束这一天', '你发现自己已经连续一个月凌晨一点后才睡', '你在凌晨三点醒来，然后再也睡不着'] },
      ],
      创业: [
        { icon: '📊', variants: ['商业计划给朋友看，对方说"挺好的"然后岔开话题', '你发现你的"独特想法"其实已经有人在做了', '你的产品上线一周，访问量大部分是你自己'] },
        { icon: '💰', variants: ['算了一笔账：按现在的烧钱速度还能撑X个月', '你发现自己的积蓄比创业前少了一半', '你在犹豫要不要跟家里开口借钱'] },
        { icon: '🪞', variants: ['某天突然想"如果当初继续上班会怎样"', '你发现自己已经三个月没有休息日了', '你在深夜算完账后失眠了'] },
      ],
      家庭: [
        { icon: '📞', variants: ['爸妈打电话开头"没什么事就是问问"，结尾变成"你到底怎么想的"', '你发现自己已经两个月没有主动给家里打电话了', '你在家庭群里只发红包不说话'] },
        { icon: '🏠', variants: ['过年回家第一天其乐融融，第三天开始摩擦', '你发现和父母的对话已经变成了"嗯""好""知道了"', '你在某个瞬间发现自己说话的语气越来越像你妈/爸'] },
        { icon: '😶', variants: ['某个瞬间发现自己说话的语气越来越像你妈/爸，被自己吓到', '你发现自己已经开始用父母当年说你的话来说别人了', '你在某个深夜突然很想家但不知道该打给谁'] },
      ],
      default: [
        { icon: '📱', variants: ['深夜突然焦虑，打开手机搜各种"怎么办"', '你发现自己一晚上解锁了50次手机', '你在凌晨三点刷到了一条让你更焦虑的帖子'] },
        { icon: '⏰', variants: ['跟自己说"下个月开始改变"，然后下个月再说同样的话', '你发现自己已经在同一个问题上纠结了三个月', '你翻开去年的日记发现写的是同样的话'] },
        { icon: '🪞', variants: ['突然意识到一年前你也在纠结同样的事', '你发现自己已经很久没有为任何事感到兴奋了', '你在某个瞬间觉得自己好像被困住了'] },
      ],
    };

    const pool = templates[domain] || templates.default;
    return pool.map(item => {
      const variant = item.variants[Math.floor(Math.random() * item.variants.length)];
      let event = variant;
      if (persona === 'brutal') event = '听好了——' + event;
      else if (persona === 'elder') event = '过来人告诉你——' + event;
      return { icon: item.icon, event };
    });
  }

  generatePollData(domain) {
    const base = POLL_DATA[domain] || POLL_DATA.日常;
    const j = () => Math.round((Math.random() - 0.5) * 6);
    return {
      optimistic: Math.max(5, base.optimistic + j()),
      neutral: Math.max(5, base.neutral + j()),
      pessimistic: Math.max(5, base.pessimistic + j()),
    };
  }

  // ===== 主推演入口 =====
  async run(text, mood, scope, intensity, timeScale, uncertainty, factors, persona, mbtiPrefs, onStep) {
    if (onStep) onStep('empathy', '正在分析你的性格特征...', 8);
    await this.delay(200);
    const mbti = this.inferMBTI(text, mood, mbtiPrefs);
    if (onStep) onStep('mbti', `性格类型：${mbti.type}（${mbti.style.approach}）`, 20);
    await this.delay(300);
    if (onStep) onStep('analyze', '理解你的处境...', 40);
    await this.delay(300);
    if (onStep) onStep('paths', '生成三条推演路径...', 60);
    await this.delay(400);
    if (onStep) onStep('persona', '用' + (PERSONAS[persona]?.name || '毒舌朋友') + '的口吻改写...', 80);
    await this.delay(300);
    const result = this.generateLocal(text, mood, scope, intensity, timeScale, uncertainty, factors, persona, mbti);
    if (onStep) onStep('complete', '推演完成', 100);
    return result;
  }

  generateLocal(text, mood, scope, intensity, timeScale, uncertainty, factors, persona, mbti) {
    const moodInfo = EMOTION_MAP[mood] || EMOTION_MAP.neutral;
    const keywords = this.extractKeywords(text);
    const domain = keywords[0]?.tag || '日常';
    const timeLabel = TIME_LABELS[timeScale] || '一个月';
    const empathy = this.generateEmpathyWithMBTI(text, mood, persona, mbti);

    // 概率计算（引入更多随机性）
    const baseOpt = moodInfo.valence > 0.2 ? 38 : (moodInfo.valence < -0.2 ? 22 : 32);
    const basePes = moodInfo.valence < -0.2 ? 32 : (moodInfo.valence > 0.2 ? 14 : 22);
    const uncFactor = uncertainty / 5;
    const intFactor = intensity / 5;

    // 因素影响概率
    let optMod = 0, pesMod = 0;
    factors.forEach(f => {
      if (['money', 'health'].includes(f)) { optMod -= 2; pesMod += 2; }
      if (['authority', 'family'].includes(f)) { optMod -= 1; pesMod += 1; }
      if (['time'].includes(f)) { optMod -= 1; pesMod += 3; }
    });

    const optimistic = Math.max(10, Math.min(55, baseOpt + optMod + Math.round((Math.random() - 0.5) * uncFactor * 24)));
    const pessimistic = Math.max(10, Math.min(50, basePes + pesMod + Math.round((Math.random() - 0.5) * uncFactor * 18)));
    const neutral = Math.max(15, 100 - optimistic - pessimistic);

    const templates = PATH_TEMPLATES[domain] || PATH_TEMPLATES.default;

    // 生成带变体的路径
    const makePath = (pathFn) => {
      const base = pathFn(text, timeLabel);
      const variants = EVENT_VARIANTS[domain]?.[pathFn === templates.optimistic ? 'optimistic' : pathFn === templates.neutral ? 'neutral' : 'pessimistic'] || [];
      // 随机替换转折点事件
      const turningPoints = base.turning_points.map((tp, i) => {
        if (variants.length > 0 && Math.random() > 0.5) {
          return { period: tp.period, event: variants[Math.floor(Math.random() * variants.length)] };
        }
        return tp;
      });

      // 因素影响
      let factorNote = '';
      if (factors.length > 0) {
        const f = factors[Math.floor(Math.random() * factors.length)];
        const effect = FACTOR_EFFECTS[f];
        if (effect) {
          const pathType = pathFn === templates.optimistic ? 'optimistic' : pathFn === templates.neutral ? 'neutral' : 'pessimistic';
          factorNote = effect[pathType];
        }
      }

      return { ...base, turning_points: turningPoints, factorNote };
    };

    return {
      empathy,
      mbti,
      optimistic: { probability: optimistic, ...this.applyPersona(makePath(templates.optimistic), persona) },
      neutral: { probability: neutral, ...this.applyPersona(makePath(templates.neutral), persona) },
      pessimistic: { probability: pessimistic, ...this.applyPersona(makePath(templates.pessimistic), persona) },
      badThings: this.generateBadThings(domain, persona),
      readingCards: READING_CARDS[domain] || READING_CARDS.default,
      stats: STATS_DATA[domain] || STATS_DATA.default,
      poll: this.generatePollData(domain),
      domain,
      factors,
    };
  }

  applyPersona(path, persona) {
    return {
      ...path,
      title: this.personaTitle(path.title, persona),
      turning_points: path.turning_points.map(tp => ({ period: tp.period, event: this.personaTurningPoint(tp.event, persona) })),
      you_lose: this.personaYouLose(path.you_lose, persona),
      cost_of_nothing: this.personaCostOfNothing(path.cost_of_nothing, persona),
    };
  }

  delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// ===== 路径模板 =====
const PATH_TEMPLATES = {
  财务: {
    optimistic: (text, time) => ({
      title: '开源节流，财务状况逐步改善',
      turning_points: [
        { period: '第1周', event: '梳理所有收入支出，发现至少2-3个可以砍掉的隐形消费' },
        { period: '第2-3周', event: '制定还债/储蓄计划，看到数字变化带来的正反馈' },
        { period: '第1个月', event: '消费习惯明显改善，月底发现比预期多存了一笔' },
      ],
      you_lose: '至少半年的消费自由，社交开支要大幅压缩',
      cost_of_nothing: '信用卡账单继续涨，利息像滚雪球一样吃掉你的收入',
    }),
    neutral: (text, time) => ({
      title: '收入支出基本持平，原地踏步',
      turning_points: [
        { period: '第1-2周', event: '想过要改变但迟迟没有行动' },
        { period: '第3-4周', event: '偶尔记账但坚持不下来' },
        { period: '第2-3个月', event: '财务状况没有恶化也没有改善' },
      ],
      you_lose: '时间——这段时间本可以用来建立好的理财习惯',
      cost_of_nothing: '通货膨胀在悄悄侵蚀你的购买力',
    }),
    pessimistic: (text, time) => ({
      title: '消费失控，债务雪球越滚越大',
      turning_points: [
        { period: '第1-2周', event: '继续用消费缓解焦虑' },
        { period: '第3-4周', event: '开始拆东墙补西墙' },
        { period: '第2-3个月', event: '最低还款额在增长' },
      ],
      you_lose: '信用记录、未来的贷款资格',
      cost_of_nothing: '半年后你可能连最低还款都还不上',
    }),
  },
  职业: {
    optimistic: (text, time) => ({
      title: '找到新方向，职业重新起飞',
      turning_points: [
        { period: '第1-2周', event: '更新简历、开始投递，获得几个面试机会' },
        { period: '第3-4周', event: '面试中更清晰自己的定位，收到1-2个offer' },
        { period: '第2-3个月', event: '进入新环境，成长速度明显加快' },
      ],
      you_lose: '目前的舒适区和稳定的收入来源',
      cost_of_nothing: '你会继续坐在那个位置上，看着比你年轻的人一个个超过你',
    }),
    neutral: (text, time) => ({
      title: '原地调整，在现有位置上寻找突破',
      turning_points: [
        { period: '第1-2周', event: '和领导表达了想尝试新方向的想法' },
        { period: '第3-4周', event: '被安排参与一个新项目' },
        { period: '第2-3个月', event: '新项目有进展，但核心问题仍在' },
      ],
      you_lose: '跳槽的最佳窗口期',
      cost_of_nothing: '两年后你还是在同一个工位上',
    }),
    pessimistic: (text, time) => ({
      title: '继续消耗，职业倦怠加深',
      turning_points: [
        { period: '第1-2周', event: '投了几份简历但回复寥寥' },
        { period: '第3-4周', event: '面试了几家但都不合适' },
        { period: '第2-3个月', event: '回到原点，热情进一步下降' },
      ],
      you_lose: '自信——每一次被拒都在告诉你"你不行"',
      cost_of_nothing: '你会变成那种每天数着下班时间的人',
    }),
  },
  感情: {
    optimistic: (text, time) => ({
      title: '坦诚沟通后，关系进入新阶段',
      turning_points: [
        { period: '第1周', event: '鼓起勇气表达真实感受' },
        { period: '第2-3周', event: '发现之前的很多矛盾其实是误解' },
        { period: '第1个月', event: '关系明显升温' },
      ],
      you_lose: '一部分"自我"——好的关系需要妥协',
      cost_of_nothing: '冷战变成常态，你们的对话越来越表面',
    }),
    neutral: (text, time) => ({
      title: '冷淡期持续，关系进入不确定状态',
      turning_points: [
        { period: '第1-2周', event: '冷战继续' },
        { period: '第3-4周', event: '开始习惯这种疏远' },
        { period: '第2-3个月', event: '关系悬而未决' },
      ],
      you_lose: '确定性——你不知道这段关系到底还值不值得投入',
      cost_of_nothing: '拖到最后，你们会以最平淡的方式分开',
    }),
    pessimistic: (text, time) => ({
      title: '矛盾加深，关系走向破裂',
      turning_points: [
        { period: '第1-2周', event: '一次小争吵引爆积压已久的情绪' },
        { period: '第3-4周', event: '开始认真考虑是否还要继续' },
        { period: '第2-3个月', event: '关系走到临界点' },
      ],
      you_lose: '这段关系本身，以及对未来感情的信心',
      cost_of_nothing: '你会收到一条"我们谈谈吧"的消息',
    }),
  },
  教育: {
    optimistic: (text, time) => ({
      title: '找到节奏，成绩稳步提升',
      turning_points: [
        { period: '第1周', event: '分析薄弱环节，制定针对性计划' },
        { period: '第2-3周', event: '用费曼学习法检验自己' },
        { period: '第1个月', event: '小测验成绩明显进步' },
      ],
      you_lose: '娱乐时间',
      cost_of_nothing: '下次考试你会得到差不多的分数',
    }),
    neutral: (text, time) => ({
      title: '不上不下，维持现状',
      turning_points: [
        { period: '第1-2周', event: '按部就班上课写作业' },
        { period: '第3-4周', event: '偶尔焦虑但很快冲淡' },
        { period: '第2-3个月', event: '成绩没大波动' },
      ],
      you_lose: '突破的可能性',
      cost_of_nothing: '毕业时你发现简历上什么亮点都没有',
    }),
    pessimistic: (text, time) => ({
      title: '学习动力持续下降',
      turning_points: [
        { period: '第1-2周', event: '上课走神、作业拖延加重' },
        { period: '第3-4周', event: '开始逃避学习相关讨论' },
        { period: '第2-3个月', event: '形成"我就是学不好"的固定思维' },
      ],
      you_lose: '对自己学习能力的信心',
      cost_of_nothing: '你会变成看到书就烦的人',
    }),
  },
  心理: {
    optimistic: (text, time) => ({
      title: '开始自我觉察，情绪管理提升',
      turning_points: [
        { period: '第1周', event: '尝试写情绪日记' },
        { period: '第2-3周', event: '发现运动或冥想对情绪有改善' },
        { period: '第1-2个月', event: '遇到压力时学会了暂停和呼吸' },
      ],
      you_lose: '部分"敏感性"',
      cost_of_nothing: '焦虑会变成你身体的一部分',
    }),
    neutral: (text, time) => ({
      title: '时好时坏，缓慢调整',
      turning_points: [
        { period: '第1-2周', event: '好的日子和坏的日子交替' },
        { period: '第3-4周', event: '偶尔尝试调节但没坚持' },
        { period: '第2-3个月', event: '整体没明显改善' },
      ],
      you_lose: '时间和精力',
      cost_of_nothing: '三个月后你会发现自己比现在更累',
    }),
    pessimistic: (text, time) => ({
      title: '情绪问题加重，影响日常生活',
      turning_points: [
        { period: '第1-2周', event: '情绪低落时间越来越长' },
        { period: '第3-4周', event: '开始影响工作效率和社交' },
        { period: '第2-3个月', event: '可能出现躯体化症状' },
      ],
      you_lose: '正常生活的能力',
      cost_of_nothing: '你可能开始失眠、暴食或厌食',
    }),
  },
  健康: {
    optimistic: (text, time) => ({
      title: '问题发现及时，积极干预效果明显',
      turning_points: [
        { period: '第1周', event: '做了全面检查，结果比想象中好' },
        { period: '第2-4周', event: '执行改善方案' },
        { period: '第2-3个月', event: '身体指标改善' },
      ],
      you_lose: '一些坏习惯带来的即时快感',
      cost_of_nothing: '小问题会变成大问题',
    }),
    neutral: (text, time) => ({
      title: '问题存在但没有明显恶化',
      turning_points: [
        { period: '第1-2周', event: '做了基本检查' },
        { period: '第3-4周', event: '偶尔担心但日常不受影响' },
        { period: '第2-3个月', event: '定期复查' },
      ],
      you_lose: '主动权',
      cost_of_nothing: '有些慢性病就是这样"温水煮青蛙"',
    }),
    pessimistic: (text, time) => ({
      title: '忽视身体信号，小问题变大问题',
      turning_points: [
        { period: '第1-2周', event: '觉得"应该没什么大事"' },
        { period: '第3-4周', event: '症状时好时坏' },
        { period: '第2-3个月', event: '问题在不知不觉中加重' },
      ],
      you_lose: '最佳治疗窗口',
      cost_of_nothing: '你可能在某个凌晨因为疼痛醒来',
    }),
  },
  创业: {
    optimistic: (text, time) => ({
      title: '验证需求，找到可行模式',
      turning_points: [
        { period: '第1-2周', event: 'MVP测试收到真实用户反馈' },
        { period: '第3-4周', event: '快速迭代，产品方向清晰' },
        { period: '第2-3个月', event: '有付费用户或合作意向' },
      ],
      you_lose: '稳定的收入和社交时间',
      cost_of_nothing: '一年后你在聚会上听到有人说"我做了个和你当时想法差不多的东西"',
    }),
    neutral: (text, time) => ({
      title: '想法很多但缺乏执行',
      turning_points: [
        { period: '第1-2周', event: '看了大量创业课程但没动手' },
        { period: '第3-4周', event: '写了商业计划书但觉得不够完善' },
        { period: '第2-3个月', event: '还在"准备阶段"' },
      ],
      you_lose: '时间窗口',
      cost_of_nothing: '六个月后你发现自己还在"准备"',
    }),
    pessimistic: (text, time) => ({
      title: '投入过多但市场不买账',
      turning_points: [
        { period: '第1-2周', event: '产品上线但反响冷淡' },
        { period: '第3-4周', event: '获客成本太高' },
        { period: '第2-3个月', event: '现金流紧张' },
      ],
      you_lose: '钱、时间、以及一部分自信',
      cost_of_nothing: '深夜算完账发现钱只够再撑两个月',
    }),
  },
  家庭: {
    optimistic: (text, time) => ({
      title: '找到边界感，关系趋于健康',
      turning_points: [
        { period: '第1-2周', event: '尝试温和但坚定地表达边界' },
        { period: '第3-4周', event: '家人开始慢慢尊重你的选择' },
        { period: '第2-3个月', event: '家庭互动模式有了积极变化' },
      ],
      you_lose: '"全家和谐"的假象',
      cost_of_nothing: '你会继续在每次家庭聚会后生一肚子闷气',
    }),
    neutral: (text, time) => ({
      title: '维持表面和平',
      turning_points: [
        { period: '第1-2周', event: '想改变但不知道怎么开口' },
        { period: '第3-4周', event: '偶尔尝试表达但被旧模式淹没' },
        { period: '第2-3个月', event: '关系基本维持原状' },
      ],
      you_lose: '表达真实自我的机会',
      cost_of_nothing: '你会越来越不想回家',
    }),
    pessimistic: (text, time) => ({
      title: '矛盾升级，关系陷入僵局',
      turning_points: [
        { period: '第1-2周', event: '一次冲突引爆所有积怨' },
        { period: '第3-4周', event: '沟通变成争吵' },
        { period: '第2-3个月', event: '可能需要专业人士介入' },
      ],
      you_lose: '家庭作为后盾的安全感',
      cost_of_nothing: '你会变成逢年过节不想回家的人',
    }),
  },
  default: {
    optimistic: (text, time) => ({
      title: '积极变化正在发生',
      turning_points: [
        { period: '第1-2周', event: '开始采取行动' },
        { period: '第3-4周', event: '看到积极反馈' },
        { period: '第2-3个月', event: '进入良性循环' },
      ],
      you_lose: '一些安逸',
      cost_of_nothing: '三个月后你发现自己还在原地',
    }),
    neutral: (text, time) => ({
      title: '缓慢调整，找到中间状态',
      turning_points: [
        { period: '第1-2周', event: '情绪波动较大' },
        { period: '第3-4周', event: '开始接受现状' },
        { period: '第2-3个月', event: '找到平衡状态' },
      ],
      you_lose: '突破的可能',
      cost_of_nothing: '你会变成那种说"还行吧"的人',
    }),
    pessimistic: (text, time) => ({
      title: '压力持续，需要长期应对',
      turning_points: [
        { period: '第1-2周', event: '尝试了一些方法但效果不明显' },
        { period: '第3-4周', event: '感到疲惫和无力' },
        { period: '第2-3个月', event: '学会和压力共处' },
      ],
      you_lose: '一部分对生活的热情',
      cost_of_nothing: '压力不会消失，只会转移',
    }),
  },
};

window.PredictionEngine = PredictionEngine;
window.EMOTION_MAP = EMOTION_MAP;
window.SCOPE_LABELS = SCOPE_LABELS;
window.TIME_LABELS = TIME_LABELS;
window.INTENSITY_LABELS = INTENSITY_LABELS;
window.UNCERTAINTY_LABELS = UNCERTAINTY_LABELS;
window.FACTOR_EFFECTS = FACTOR_EFFECTS;
