/**
 * MiroFish v7 - 推演引擎
 * 三口吻 + 精简路径 + 三件烂事 + 不服从写
 */

const EMOTION_MAP = {
  anxious:   { valence: -0.6, arousal:  0.7, label: '焦虑' },
  angry:     { valence: -0.7, arousal:  0.9, label: '愤怒' },
  sad:       { valence: -0.8, arousal: -0.5, label: '难过' },
  confused:  { valence: -0.3, arousal:  0.2, label: '迷茫' },
  hopeful:   { valence:  0.5, arousal:  0.3, label: '期待' },
  fearful:   { valence: -0.7, arousal:  0.8, label: '恐惧' },
  neutral:   { valence:  0.0, arousal:  0.0, label: '平静' },
  excited:   { valence:  0.8, arousal:  0.9, label: '兴奋' },
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

class PredictionEngine {
  constructor() {}

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

  generateEmpathy(text, mood, persona) {
    const keywords = this.extractKeywords(text);
    const domain = keywords[0]?.tag || '日常';
    const pool = DOMAIN_EMPATHY[domain];
    if (pool && pool[mood] && pool[mood].length) return pool[mood][Math.floor(Math.random() * pool[mood].length)];

    const base = {
      anxious: '我能感受到你内心的不安。',
      angry: '你的愤怒是可以理解的。',
      sad: '我能感受到你的难过。',
      confused: '迷茫的时候最难熬。',
      hopeful: '你的期待让我感到振奋。',
      fearful: '恐惧是人类最原始的保护机制。',
      neutral: '你看起来比较平静。',
      excited: '你的兴奋很有感染力！',
    };

    const raw = base[mood] || base.neutral;
    return this.personaModify(raw, persona, mood);
  }

  // ===== 口吻改写 =====
  personaModify(text, persona, mood) {
    if (persona === 'brutal') {
      const brutalPrefixes = [
        '说实话，',
        '别骗自己了——',
        '我直说吧：',
        '你先冷静想想——',
        '残酷的真相是：',
      ];
      const p = brutalPrefixes[Math.floor(Math.random() * brutalPrefixes.length)];
      return p + text;
    }
    if (persona === 'elder') {
      const elderPrefixes = [
        '十年前的我也经历过这个。回头看，',
        '如果我能回到你这个时候，我会告诉自己：',
        '现在30多岁的我想对当时的自己说——',
        '时间会证明，',
        '以过来人的经验：',
      ];
      return elderPrefixes[Math.floor(Math.random() * elderPrefixes.length)] + text;
    }
    return text; // stranger uses default
  }

  // ===== 口吻化路径标题 =====
  personaTitle(title, persona) {
    if (persona === 'brutal') {
      const map = {
        '积极变化正在发生，事情向好的方向发展': '运气不错的话，可能会有转机',
        '缓慢调整，找到一个中间状态': '大概率不痛不痒地凑合下去',
        '压力持续，需要做好长期应对准备': '不改变的话，等着被生活教做人',
      };
      return map[title] || '说白了就是：' + title;
    }
    if (persona === 'elder') {
      const map = {
        '积极变化正在发生，事情向好的方向发展': '这条路我走过，确实能走通',
        '缓慢调整，找到一个中间状态': '大多数人最后都选了这条路',
        '压力持续，需要做好长期应对准备': '我当年就是这么耗过来的',
      };
      return map[title] || '从我的经验来看：' + title;
    }
    return title;
  }

  // ===== 口吻化转折点 =====
  personaTurningPoint(event, persona) {
    if (persona === 'brutal') return event.replace(/可能/g, '大概率').replace(/开始/g, '终于').replace(/改善/g, '没那么烂了');
    if (persona === 'elder') return '我当时也经历了这个——' + event;
    return event;
  }

  // ===== 口吻化"你会失去什么" =====
  personaYouLose(lose, persona) {
    if (persona === 'brutal') return '选了这条路，你得做好准备：' + lose;
    if (persona === 'elder') return '如果重来一次，我会担心失去的：' + lose;
    return '这条路的代价是：' + lose;
  }

  // ===== 口吻化"什么都不做" =====
  personaCostOfNothing(cost, persona) {
    if (persona === 'brutal') return '三个月后你还是现在这个鬼样子——' + cost;
    if (persona === 'elder') return '别问我怎么知道的——' + cost;
    return '如果什么都不做：' + cost;
  }

  // ===== 三件烂事 =====
  generateBadThings(domain, persona) {
    const templates = {
      财务: [
        { icon: '💳', event: '月底翻信用卡账单时发现数字比上个月又多了一截，你会心跳加速地算着最低还款额，然后默默关掉APP假装没事。' },
        { icon: '🛒', event: '深夜刷到一个"限时折扣"，你告诉自己"就这一次"，然后第二天醒来发现又花了五百多。' },
        { icon: '💸', event: '朋友约你出去吃饭，你说"最近有点紧"，对方说"没事我请你"，你笑着答应但心里特别不是滋味。' },
      ],
      职业: [
        { icon: '😴', event: '周一早上闹钟响了三遍你才起来，出门前在镜子前站了十秒钟，问自己"今天能不能不去了"。' },
        { icon: '📧', event: '领导突然在群里@你，你心跳漏了一拍——结果只是一份普通文件。但这种惊弓之鸟的状态会越来越频繁。' },
        { icon: '🪞', event: '新来的实习生比你小五岁，干的活比你多，你嘴上说"年轻人有冲劲"，心里却慌得一批。' },
      ],
      感情: [
        { icon: '📱', event: '你会忍不住翻对方朋友圈/微博，看到一条模糊的动态就脑补出一出大戏，然后花两小时分析那条动态到底什么意思。' },
        { icon: '🌙', event: '某个周五晚上你一个人待着，突然特别想找人说话，翻遍通讯录却不知道该打给谁。' },
        { icon: '💬', event: '你们可能会有一次"假性和好"——表面上恢复了联系，但谁都没提根本问题，下次爆发只是时间问题。' },
      ],
      教育: [
        { icon: '📊', event: '成绩出来那天你假装不在意，但手抖着点开了查询页面。看到分数的那一刻，你花了三秒钟说服自己"还行"。' },
        { icon: '👨‍👩‍👧', event: '家庭聚餐时亲戚会问"考得怎么样/找到工作了没"，你笑着说"还在努力"，筷子却攥得很紧。' },
        { icon: '📱', event: '你会在凌晨两点打开学习APP，刷了五分钟就切回短视频，然后带着罪恶感睡着。' },
      ],
      心理: [
        { icon: '🛏️', event: '某个工作日你请了一天假，不是因为身体不舒服，就是突然不想动。你躺在床上刷了一整天手机，天黑了才发现什么都没做。' },
        { icon: '😶', event: '有人问你"最近怎么样"，你说"还行"，但你自己知道这两个字有多假。' },
        { icon: '🔄', event: '你会在情绪好转的那天觉得自己"已经好了"，然后在下一次低谷时崩溃得更厉害。' },
      ],
      健康: [
        { icon: '🏥', event: '你会在搜索引擎上输入某个症状，然后被各种结果吓到，纠结了三天要不要去医院，最后还是没去。' },
        { icon: '🍔', event: '你说"从明天开始健康饮食"，但明天加班到九点，你又点了外卖。这个循环会重复至少五次。' },
        { icon: '😴', event: '你知道该早睡了，但到了晚上就是不想结束这一天——因为睡觉意味着明天马上就要来了。' },
      ],
      创业: [
        { icon: '📊', event: '你精心准备的商业计划给朋友看，对方说"挺好的"然后岔开了话题。你知道"挺好的"等于"我不看好但不好意思说"。' },
        { icon: '💰', event: '你算了一笔账：按照现在的烧钱速度，还能撑X个月。这个数字会在你脑子里挥之不去。' },
        { icon: '🪞', event: '某天你会突然想"如果当初继续上班会怎样"，这个念头一旦出现就很难压下去。' },
      ],
      家庭: [
        { icon: '📞', event: '爸妈会打来一个电话，开头是"没什么事就是问问"，结尾变成了"你到底怎么想的"。挂完电话你会沉默很久。' },
        { icon: '🏠', event: '过年回家第一天其乐融融，第三天开始各种摩擦，第五天你已经在买返程票了。' },
        { icon: '😶', event: '你会在某个瞬间发现自己说话的语气越来越像你妈/爸，然后被自己吓到。' },
      ],
      default: [
        { icon: '📱', event: '你会在某个深夜突然焦虑，打开手机搜各种"怎么办"，看了二十篇回答，一个都没记住。' },
        { icon: '⏰', event: '你会跟自己说"下个月开始改变"，然后下个月再说同样的话。' },
        { icon: '🪞', event: '某个瞬间你会突然意识到：一年前你也在纠结同样的事。这个认知会比任何事都让你难受。' },
      ],
    };

    const pool = templates[domain] || templates.default;
    return pool.map(item => {
      if (persona === 'brutal') return { icon: item.icon, event: '听好了——' + item.event };
      if (persona === 'elder') return { icon: item.icon, event: '过来人告诉你——' + item.event };
      return item;
    });
  }

  // ===== 生成投票数据 =====
  generatePollData(domain) {
    const base = POLL_DATA[domain] || POLL_DATA.日常;
    const jitter = () => Math.round((Math.random() - 0.5) * 6);
    return {
      optimistic: Math.max(5, base.optimistic + jitter()),
      neutral: Math.max(5, base.neutral + jitter()),
      pessimistic: Math.max(5, base.pessimistic + jitter()),
    };
  }

  // ===== 不服从重写 =====
  retryPath(pathData, persona) {
    const intensified = JSON.parse(JSON.stringify(pathData));
    // 加强语气
    intensified.turning_points = intensified.turning_points.map(tp => {
      let ev = tp.event;
      if (persona === 'brutal') {
        ev = '别天真了——' + ev.replace(/可能/g, '一定会').replace(/也许/g, '肯定');
      } else if (persona === 'elder') {
        ev = '听我说完——' + ev + '，我当年就是这样。';
      } else {
        ev = '我必须告诉你——' + ev.replace(/可能/g, '大概率会');
      }
      return { period: tp.period, event: ev };
    });

    if (intensified.you_lose) {
      if (persona === 'brutal') intensified.you_lose = '再直白点：' + intensified.you_lose;
      if (persona === 'elder') intensified.you_lose = '说真的，我最后悔的就是：' + intensified.you_lose;
    }
    if (intensified.cost_of_nothing) {
      if (persona === 'brutal') intensified.cost_of_nothing = '你继续装没事？等着吧：' + intensified.cost_of_nothing;
      if (persona === 'elder') intensified.cost_of_nothing = '我当年就是不听劝——' + intensified.cost_of_nothing;
    }
    return intensified;
  }

  // ===== 主推演 =====
  async run(text, mood, scope, intensity, timeScale, uncertainty, factors, persona, onStep) {
    if (onStep) onStep('empathy', '正在理解你的处境...', 10);
    await this.delay(200);

    if (onStep) onStep('analyze', '分析输入内容...', 30);
    await this.delay(300);

    if (onStep) onStep('paths', '生成三条推演路径...', 50);
    await this.delay(400);

    if (onStep) onStep('brutal', '正在用' + (PERSONAS[persona]?.name || '毒舌朋友') + '的口吻改写...', 75);
    await this.delay(300);

    const result = this.generateLocal(text, mood, scope, intensity, timeScale, uncertainty, factors, persona);
    if (onStep) onStep('complete', '推演完成', 100);
    return result;
  }

  generateLocal(text, mood, scope, intensity, timeScale, uncertainty, factors, persona) {
    const moodInfo = EMOTION_MAP[mood] || EMOTION_MAP.neutral;
    const keywords = this.extractKeywords(text);
    const domain = keywords[0]?.tag || '日常';
    const timeLabel = TIME_LABELS[timeScale] || '一个月';
    const empathy = this.generateEmpathy(text, mood, persona);

    const baseOpt = moodInfo.valence > 0.2 ? 40 : (moodInfo.valence < -0.2 ? 25 : 35);
    const basePes = moodInfo.valence < -0.2 ? 30 : (moodInfo.valence > 0.2 ? 15 : 20);
    const uncFactor = uncertainty / 5;
    const optimistic = Math.max(10, Math.min(60, baseOpt + Math.round((Math.random() - 0.5) * uncFactor * 20)));
    const pessimistic = Math.max(10, Math.min(50, basePes + Math.round((Math.random() - 0.5) * uncFactor * 15)));
    const neutral = Math.max(15, 100 - optimistic - pessimistic);

    const templates = PATH_TEMPLATES[domain] || PATH_TEMPLATES.default;

    return {
      empathy,
      optimistic: { probability: optimistic, ...this.applyPersona(templates.optimistic(text, timeLabel), persona) },
      neutral: { probability: neutral, ...this.applyPersona(templates.neutral(text, timeLabel), persona) },
      pessimistic: { probability: pessimistic, ...this.applyPersona(templates.pessimistic(text, timeLabel), persona) },
      badThings: this.generateBadThings(domain, persona),
      readingCards: READING_CARDS[domain] || READING_CARDS.default,
      stats: STATS_DATA[domain] || STATS_DATA.default,
      poll: this.generatePollData(domain),
      domain,
    };
  }

  applyPersona(path, persona) {
    return {
      ...path,
      title: this.personaTitle(path.title, persona),
      turning_points: path.turning_points.map(tp => ({
        period: tp.period,
        event: this.personaTurningPoint(tp.event, persona),
      })),
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
        { period: `第1个月`, event: '消费习惯明显改善，月底发现比预期多存了一笔' },
        { period: `第2-3个月`, event: '应急金基本建立，开始学习基础理财' },
      ],
      you_lose: '至少半年的消费自由，社交开支要大幅压缩，朋友圈里那些晒消费的人会让你不舒服',
      cost_of_nothing: '信用卡账单会继续涨，利息像滚雪球一样吃掉你的收入，等到有一天你需要用钱的时候发现根本拿不出来',
    }),
    neutral: (text, time) => ({
      title: '收入支出基本持平，原地踏步',
      turning_points: [
        { period: '第1-2周', event: '想过要改变但迟迟没有行动' },
        { period: '第3-4周', event: '偶尔记账但坚持不下来' },
        { period: `第2-3个月`, event: '财务状况没有恶化也没有改善' },
      ],
      you_lose: '时间——这段时间本可以用来建立好的理财习惯',
      cost_of_nothing: '通货膨胀在悄悄侵蚀你的购买力，三年后你会发现同样的钱买到的东西少了一大截',
    }),
    pessimistic: (text, time) => ({
      title: '消费失控，债务雪球越滚越大',
      turning_points: [
        { period: '第1-2周', event: '继续用消费缓解焦虑，信用卡账单又创新高' },
        { period: '第3-4周', event: '开始拆东墙补西墙，多张信用卡轮转还款' },
        { period: `第2-3个月`, event: '最低还款额在增长，利息吃掉越来越多的收入' },
      ],
      you_lose: '信用记录、未来的贷款资格、以及在需要用钱时的任何选择权',
      cost_of_nothing: '半年后你可能连最低还款都还不上，催收电话会打到你手机关机，征信黑名单上的名字不会消失',
    }),
  },

  职业: {
    optimistic: (text, time) => ({
      title: '找到新方向，职业重新起飞',
      turning_points: [
        { period: '第1-2周', event: '更新简历、开始投递，获得几个面试机会' },
        { period: '第3-4周', event: '面试中更清晰自己的定位，收到1-2个offer' },
        { period: `第2-3个月`, event: '进入新环境，成长速度明显加快' },
      ],
      you_lose: '目前的舒适区和稳定的收入来源，至少1-2个月的适应期会很累',
      cost_of_nothing: '你会继续坐在那个位置上，每天做同样的事，看着比你年轻的人一个个超过你，然后安慰自己"稳定就好"',
    }),
    neutral: (text, time) => ({
      title: '原地调整，在现有位置上寻找突破',
      turning_points: [
        { period: '第1-2周', event: '和领导表达了想尝试新方向的想法' },
        { period: '第3-4周', event: '被安排参与一个新项目' },
        { period: `第2-3个月`, event: '新项目有进展，但核心问题仍在' },
      ],
      you_lose: '跳槽的最佳窗口期——越拖年龄越大，选择越少',
      cost_of_nothing: '两年后你还是在同一个工位上，工资涨幅跑不过通胀，但你已经习惯了，这才是最可怕的',
    }),
    pessimistic: (text, time) => ({
      title: '继续消耗，职业倦怠加深',
      turning_points: [
        { period: '第1-2周', event: '投了几份简历但回复寥寥' },
        { period: '第3-4周', event: '面试了几家但都不合适' },
        { period: `第2-3个月`, event: '回到原点，热情进一步下降' },
      ],
      you_lose: '自信——每一次被拒都在告诉你"你不行"，即使这不是事实',
      cost_of_nothing: '你会变成那种每天数着下班时间的人，周一盼周五，月初盼月底，一年盼过年，然后发现自己已经35了',
    }),
  },

  感情: {
    optimistic: (text, time) => ({
      title: '坦诚沟通后，关系进入新阶段',
      turning_points: [
        { period: '第1周', event: '鼓起勇气表达真实感受' },
        { period: '第2-3周', event: '发现之前的很多矛盾其实是误解' },
        { period: `第1个月`, event: '关系明显升温' },
      ],
      you_lose: '一部分"自我"——好的关系需要妥协，你不能再完全按自己的节奏来',
      cost_of_nothing: '冷战会变成常态，你们的对话越来越表面，直到有一天你们变成了住在同一个屋檐下的陌生人',
    }),
    neutral: (text, time) => ({
      title: '冷淡期持续，关系进入不确定状态',
      turning_points: [
        { period: '第1-2周', event: '冷战继续' },
        { period: '第3-4周', event: '开始习惯这种疏远' },
        { period: `第2-3个月`, event: '关系悬而未决' },
      ],
      you_lose: '确定性——你不知道这段关系到底还值不值得投入',
      cost_of_nothing: '拖到最后，你们会以一种最平淡的方式分开——没有争吵，没有眼泪，就是突然觉得"算了"',
    }),
    pessimistic: (text, time) => ({
      title: '矛盾加深，关系走向破裂',
      turning_points: [
        { period: '第1-2周', event: '一次小争吵引爆积压已久的情绪' },
        { period: '第3-4周', event: '开始认真考虑是否还要继续' },
        { period: `第2-3个月`, event: '关系走到临界点' },
      ],
      you_lose: '这段关系本身，以及对未来感情的信心',
      cost_of_nothing: '你会在某天突然收到一条"我们谈谈吧"的消息，而你心里其实早就知道要谈什么',
    }),
  },

  教育: {
    optimistic: (text, time) => ({
      title: '找到节奏，成绩稳步提升',
      turning_points: [
        { period: '第1周', event: '分析薄弱环节，制定针对性计划' },
        { period: '第2-3周', event: '用费曼学习法检验自己，发现以为懂的其实没懂' },
        { period: `第1个月`, event: '小测验成绩明显进步' },
      ],
      you_lose: '娱乐时间——认真学习意味着你要砍掉大量的刷手机时间',
      cost_of_nothing: '下次考试你会得到一个和现在差不多的分数，然后告诉自己"下次一定"，周而复始',
    }),
    neutral: (text, time) => ({
      title: '不上不下，维持现状',
      turning_points: [
        { period: '第1-2周', event: '按部就班上课写作业' },
        { period: '第3-4周', event: '偶尔焦虑但很快冲淡' },
        { period: `第2-3个月`, event: '成绩没大波动' },
      ],
      you_lose: '突破的可能性——稳定但平庸',
      cost_of_nothing: '毕业时你会发现自己简历上什么亮点都没有，然后怪自己当初为什么不努力',
    }),
    pessimistic: (text, time) => ({
      title: '学习动力持续下降',
      turning_points: [
        { period: '第1-2周', event: '上课走神、作业拖延加重' },
        { period: '第3-4周', event: '开始逃避学习相关讨论' },
        { period: `第2-3个月`, event: '形成"我就是学不好"的固定思维' },
      ],
      you_lose: '对自己学习能力的信心——一旦失去，很难恢复',
      cost_of_nothing: '你会变成那种看到书就烦的人，然后在需要学习新技能的时候发现自己已经丧失了学习的能力',
    }),
  },

  心理: {
    optimistic: (text, time) => ({
      title: '开始自我觉察，情绪管理提升',
      turning_points: [
        { period: '第1周', event: '尝试写情绪日记' },
        { period: '第2-3周', event: '发现运动或冥想对情绪有改善' },
        { period: `第1-2个月`, event: '遇到压力时学会了暂停和呼吸' },
      ],
      you_lose: '部分"敏感性"——情绪稳定的同时，你可能不再那么容易被感动',
      cost_of_nothing: '焦虑会变成你身体的一部分，你甚至会忘记不焦虑是什么感觉',
    }),
    neutral: (text, time) => ({
      title: '时好时坏，缓慢调整',
      turning_points: [
        { period: '第1-2周', event: '好的日子和坏的日子交替' },
        { period: '第3-4周', event: '偶尔尝试调节但没坚持' },
        { period: `第2-3个月`, event: '整体没明显改善' },
      ],
      you_lose: '时间和精力——情绪波动消耗的心理能量比你想象的大',
      cost_of_nothing: '三个月后你会发现自己比现在更累，不是因为事情变多了，而是内耗变大了',
    }),
    pessimistic: (text, time) => ({
      title: '情绪问题加重，影响日常生活',
      turning_points: [
        { period: '第1-2周', event: '情绪低落时间越来越长' },
        { period: '第3-4周', event: '开始影响工作效率和社交' },
        { period: `第2-3个月`, event: '可能出现躯体化症状' },
      ],
      you_lose: '正常生活的能力——当情绪问题严重到影响吃饭睡觉时，其他一切都无从谈起',
      cost_of_nothing: '你可能会开始失眠、暴食或厌食，身体会出现各种莫名其妙的疼痛，去医院检查又说没病',
    }),
  },

  健康: {
    optimistic: (text, time) => ({
      title: '问题发现及时，积极干预效果明显',
      turning_points: [
        { period: '第1周', event: '做了全面检查，结果比想象中好' },
        { period: '第2-4周', event: '执行改善方案：规律作息、调整饮食' },
        { period: `第2-3个月`, event: '身体指标改善，精力充沛' },
      ],
      you_lose: '一些坏习惯带来的即时快感——熬夜、垃圾食品、久坐不动',
      cost_of_nothing: '小问题会变成大问题，到时候就不是"调整生活习惯"能解决的了',
    }),
    neutral: (text, time) => ({
      title: '问题存在但没有明显恶化',
      turning_points: [
        { period: '第1-2周', event: '做了基本检查' },
        { period: '第3-4周', event: '偶尔担心但日常不受影响' },
        { period: `第2-3个月`, event: '定期复查，指标基本稳定' },
      ],
      you_lose: '主动权——你把健康交给了"运气"',
      cost_of_nothing: '有些慢性病就是这样"温水煮青蛙"——等你感觉到明显不适时，已经错过了最佳干预窗口',
    }),
    pessimistic: (text, time) => ({
      title: '忽视身体信号，小问题变大问题',
      turning_points: [
        { period: '第1-2周', event: '觉得"应该没什么大事"，拖延就医' },
        { period: '第3-4周', event: '症状时好时坏，用止痛药凑合' },
        { period: `第2-3个月`, event: '问题在不知不觉中加重' },
      ],
      you_lose: '最佳治疗窗口——很多病早期和晚期的治疗成本和预后差距是十倍级别的',
      cost_of_nothing: '你可能会在某个凌晨因为疼痛醒来，然后在急诊室的走廊里后悔"为什么没有早点去"',
    }),
  },

  创业: {
    optimistic: (text, time) => ({
      title: '验证需求，找到可行模式',
      turning_points: [
        { period: '第1-2周', event: 'MVP测试收到真实用户反馈' },
        { period: '第3-4周', event: '快速迭代，产品方向清晰' },
        { period: `第2-3个月`, event: '有付费用户或合作意向' },
      ],
      you_lose: '稳定的收入和社交时间——创业者没有下班时间',
      cost_of_nothing: '你会在一年后的某个聚会上听到有人说"我做了个和你当时想法差不多的东西，现在估值XX万"',
    }),
    neutral: (text, time) => ({
      title: '想法很多但缺乏执行',
      turning_points: [
        { period: '第1-2周', event: '看了大量创业课程但没动手' },
        { period: '第3-4周', event: '写了商业计划书但觉得不够完善' },
        { period: `第2-3个月`, event: '还在"准备阶段"' },
      ],
      you_lose: '时间窗口——市场不会等你准备好',
      cost_of_nothing: '六个月后你会发现自己还在"准备"，而那个市场已经被别人做了',
    }),
    pessimistic: (text, time) => ({
      title: '投入过多但市场不买账',
      turning_points: [
        { period: '第1-2周', event: '产品上线但反响冷淡' },
        { period: '第3-4周', event: '获客成本太高' },
        { period: `第2-3个月`, event: '现金流紧张，面临止损抉择' },
      ],
      you_lose: '钱、时间、以及一部分自信',
      cost_of_nothing: '你会在一个深夜算完账后发现钱只够再撑两个月，然后在"再试一下"和"及时止损"之间反复横跳',
    }),
  },

  家庭: {
    optimistic: (text, time) => ({
      title: '找到边界感，关系趋于健康',
      turning_points: [
        { period: '第1-2周', event: '尝试温和但坚定地表达边界' },
        { period: '第3-4周', event: '家人开始慢慢尊重你的选择' },
        { period: `第2-3个月`, event: '家庭互动模式有了积极变化' },
      ],
      you_lose: '"全家和谐"的假象——真话有时候伤人，但比憋着强',
      cost_of_nothing: '你会继续在每次家庭聚会后生一肚子闷气，然后告诉自己"他们也是为我好"',
    }),
    neutral: (text, time) => ({
      title: '维持表面和平',
      turning_points: [
        { period: '第1-2周', event: '想改变但不知道怎么开口' },
        { period: '第3-4周', event: '偶尔尝试表达但被旧模式淹没' },
        { period: `第2-3个月`, event: '关系基本维持原状' },
      ],
      you_lose: '表达真实自我的机会',
      cost_of_nothing: '你会越来越不想回家，打电话越来越短，直到有一天你发现自己已经习惯了没有家庭温暖的生活',
    }),
    pessimistic: (text, time) => ({
      title: '矛盾升级，关系陷入僵局',
      turning_points: [
        { period: '第1-2周', event: '一次冲突引爆所有积怨' },
        { period: '第3-4周', event: '沟通变成争吵' },
        { period: `第2-3个月`, event: '可能需要专业人士介入' },
      ],
      you_lose: '家庭作为后盾的安全感',
      cost_of_nothing: '你会变成那种逢年过节不想回家的人，朋友圈屏蔽家人，电话设置免打扰',
    }),
  },

  default: {
    optimistic: (text, time) => ({
      title: '积极变化正在发生',
      turning_points: [
        { period: '第1-2周', event: '开始采取行动' },
        { period: '第3-4周', event: '看到积极反馈' },
        { period: `第2-3个月`, event: '进入良性循环' },
      ],
      you_lose: '一些安逸——改变意味着要走出舒适区',
      cost_of_nothing: '三个月后你会发现自己还在原地，只是又老了三个月',
    }),
    neutral: (text, time) => ({
      title: '缓慢调整，找到中间状态',
      turning_points: [
        { period: '第1-2周', event: '情绪波动较大' },
        { period: '第3-4周', event: '开始接受现状' },
        { period: `第2-3个月`, event: '找到平衡状态' },
      ],
      you_lose: '突破的可能——平衡有时只是另一种形式的停滞',
      cost_of_nothing: '你会变成那种说"还行吧"的人，不好不坏，不上不下，直到某天突然醒悟',
    }),
    pessimistic: (text, time) => ({
      title: '压力持续，需要长期应对',
      turning_points: [
        { period: '第1-2周', event: '尝试了一些方法但效果不明显' },
        { period: '第3-4周', event: '感到疲惫和无力' },
        { period: `第2-3个月`, event: '学会和压力共处' },
      ],
      you_lose: '一部分对生活的热情',
      cost_of_nothing: '压力不会消失，只会转移——它会从心理转移到身体上，变成失眠、胃痛、头疼',
    }),
  },
};

window.PredictionEngine = PredictionEngine;
window.EMOTION_MAP = EMOTION_MAP;
window.SCOPE_LABELS = SCOPE_LABELS;
window.TIME_LABELS = TIME_LABELS;
window.INTENSITY_LABELS = INTENSITY_LABELS;
window.UNCERTAINTY_LABELS = UNCERTAINTY_LABELS;
