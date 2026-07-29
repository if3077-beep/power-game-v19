/**
 * MiroFish v9 - 数据层
 * 滚动叙事 / 心理画像 / 决策矩阵 — 无 Emoji
 */

const DAILY_QUOTES = [
  { text: '你无法控制风的方向，但你可以调整帆的角度。', author: '克里斯蒂安·博宾' },
  { text: '预测未来的最好方式就是创造它。', author: '彼得·德鲁克' },
  { text: '每一次危机都孕育着机遇。', author: '丘吉尔' },
  { text: '焦虑不会消除明天的悲伤，只会消耗今天的力量。', author: '马可·奥勒留' },
  { text: '改变能改变的，接受不能改变的。', author: '莱茵霍尔德·尼布尔' },
  { text: '人生没有白走的路，每一步都算数。', author: '史铁生' },
  { text: '种一棵树最好的时间是十年前，其次是现在。', author: '中国谚语' },
  { text: '没有一个冬天不可逾越，没有一个春天不会来临。', author: '毕淑敏' },
  { text: '所谓无底深渊，下去也是前程万里。', author: '木心' },
  { text: '真正的平静不是避开车马喧嚣，而是在心中修篱种菊。', author: '林清玄' },
  { text: '勇敢不是不害怕，而是害怕了还能坚持去做。', author: '纳尔逊·曼德拉' },
  { text: '所有的失去，都会以另一种方式归来。', author: '耿帅' },
  { text: '当你凝视深渊时，深渊也在凝视你。', author: '尼采' },
  { text: '未经审视的人生不值得过。', author: '苏格拉底' },
  { text: '世上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。', author: '罗曼·罗兰' },
  { text: '人的一切痛苦，本质上都是对自己无能的愤怒。', author: '王小波' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '千里之行，始于足下。', author: '老子' },
];

const RANDOM_DILEMMAS = [
  '想辞职但怕找不到更好的工作，现在至少稳定',
  '对象冷战三天了，不知道要不要先开口',
  '信用卡欠了好几万，每个月都在拆东墙补西墙',
  '想创业但不确定时机对不对，怕把积蓄全赔进去',
  '公司要裁员，不知道自己安不安全',
  '孩子成绩不好，要不要给他报补习班',
  '体检指标异常，很担心但又不敢去复查',
  '想和暧昧对象表白，怕被拒绝连朋友都做不成',
  '父母催婚催得紧，但我不想随便找个人凑合',
  '投资亏了30%，不知道该割肉还是继续持有',
  '想换城市发展，但舍不得这边的社交圈',
  '副业做了半年没什么起色，要不要继续',
  '考研二战还是直接工作，家里经济压力很大',
  'AI 要取代我的工作了，现在转行来得及吗',
];

const TWIST_REPLACEMENTS = {
  default: [
    '当然，以上都是理想情况。现实往往更喜欢给人惊喜——或者惊吓。',
    '但说实话，你也可能第三天就放弃了。',
    '前提是你的执行力配得上你的想象力。',
    '不过别忘了，人类是唯一会在同一个坑里摔两次的动物。',
    '以上分析假设你是理性的——但你我都知道，人不是。',
    '说到底，改变需要的不是方法，是痛够了。',
  ],
  财务: ['当然，前提是你的消费欲望能跟着一起降级。','但如果你管不住手，这些数字只是屏幕上的像素。','不过以你的消费习惯，可能需要先卸载淘宝和小红书。','前提是别再相信"这次不一样"。'],
  职业: ['前提是你的简历能撑起你的野心。','不过跳槽解决不了能力问题，只是换了个地方焦虑。','当然，也有可能新公司比现在这家还烂。','说到底，你缺的不是机会，是敢不敢迈出那一步。'],
  感情: ['前提是对方也有同样的意愿——但你没法控制别人。','不过感情这种事，努力不一定有用，不努力一定没用。','说到底，你值得更好的——但更好的人凭什么选你？'],
  教育: ['前提是别再用"学习方法不对"来掩盖"不够努力"。','当然，学历不能决定一切——但它决定了别人愿不愿意给你机会。','说到底，你不是学不会，是还没被逼到那份上。'],
  心理: ['当然，如果这些都能轻松做到，你也不会搜这个问题了。','不过道理你都懂，做不到才是问题所在。','说到底，你不是不知道怎么办，是不想面对。'],
  健康: ['前提是别等到身体发出最后通牒才行动。','但"明天开始"是最长的明天。','说到底，你的身体正在为你的每一个坏习惯记账。'],
  创业: ['前提是别用"创业"来逃避"打工"的不爽。','不过90%的创业者在第一年就后悔了——但没人会在朋友圈说。','说到底，创业不是勇气问题，是算账问题。'],
  家庭: ['前提是别指望一次谈话就能改变几十年的相处模式。','不过血缘是最牢固的枷锁——也是最温柔的。','说到底，家人就是让你又爱又恨的存在。'],
};

// 统计数据：数值 + 后缀，支持动画计数
const STATS_DATA = {
  财务: [
    { value: 76, suffix: '%', label: '冲动投资亏损率', desc: '因情绪波动做出的投资决定中，76%在三个月内出现亏损', source: '行为金融学研究' },
    { value: 56, suffix: '%', label: '应急金缺口', desc: '56%的人无法应对突发的1000元支出', source: 'Bankrate' },
    { value: 78, suffix: '%', label: '月光族占比', desc: '78%的人靠工资过日子，没有储蓄缓冲', source: 'CareerBuilder' },
  ],
  职业: [
    { value: 43, suffix: '%', label: '裸辞后悔率', desc: '裸辞者中有43%在三个月内后悔', source: '智联招聘' },
    { value: 12, suffix: '次', label: '一生换工作次数', desc: '平均一个人一生会换12-15份工作', source: '美国劳工统计局' },
    { value: 4.1, suffix: '年', label: '平均任职时长', desc: '当前平均一份工作的任期只有4.1年', source: 'BLS' },
  ],
  感情: [
    { value: 6, suffix: '个月', label: '分手恢复期', desc: '平均需要6个月才能从一段认真的感情中恢复', source: 'J. of Positive Psychology' },
    { value: 72, suffix: '小时', label: '冷战临界点', desc: '冷战超过72小时，关系破裂概率翻倍', source: 'Gottman研究所' },
    { value: 49, suffix: '%', label: '复合再分率', desc: '分手后复合的情侣中，49%会再次分手', source: 'Social Psychology Quarterly' },
  ],
  教育: [
    { value: 78, suffix: '%', label: '志愿错配率', desc: '78%的大学生表示如果重新选会选不同专业', source: '麦可思' },
    { value: 52, suffix: '%', label: '考研弃考率', desc: '报名考研的人中约52%最终弃考或裸考', source: '教育部' },
    { value: 25, suffix: '岁', label: '决策高峰起点', desc: '重大人生决策集中在25-35岁之间', source: '发展心理学' },
  ],
  心理: [
    { value: 3.5, suffix: '亿', label: '全球抑郁患者', desc: '全球约3.5亿人受抑郁症困扰', source: 'WHO' },
    { value: 70, suffix: '%', label: '心身疾病占比', desc: '约70%的躯体疾病与心理压力有关', source: '柳叶刀' },
    { value: 21, suffix: '天', label: '习惯养成周期', desc: '形成一个新习惯平均需要21天', source: 'European J. of Social Psychology' },
  ],
  健康: [
    { value: 7, suffix: '小时', label: '最佳睡眠时长', desc: '每天7小时睡眠的人群死亡率最低', source: 'Nature' },
    { value: 150, suffix: '分钟', label: '周运动推荐量', desc: 'WHO建议每周至少150分钟中等强度运动', source: 'WHO' },
    { value: 80, suffix: '%', label: '亚健康占比', desc: '中国白领中约80%处于亚健康状态', source: '中国医师协会' },
  ],
  创业: [
    { value: 90, suffix: '%', label: '初创失败率', desc: '90%的初创企业会在前5年内倒闭', source: 'CB Insights' },
    { value: 18, suffix: '个月', label: '平均生存期', desc: '中国小微企业平均生存周期约18个月', source: '工商总局' },
    { value: 2.5, suffix: '次', label: '失败次数', desc: '成功创业者平均经历过2.5次失败', source: 'HBR' },
  ],
  家庭: [
    { value: 2.4, suffix: '亿', label: '独居人口', desc: '中国独居人口已超过2.4亿', source: '国家统计局' },
    { value: 67, suffix: '%', label: '代际冲突率', desc: '67%的年轻人与父母存在观念冲突', source: '中国青年报' },
    { value: 30, suffix: '分钟', label: '日均亲子时间', desc: '中国父母平均每天陪伴孩子仅30分钟', source: '全国妇联' },
  ],
  default: [
    { value: 23, suffix: '天', label: '决策平均周期', desc: '重大决策从纠结到决定平均需要23天', source: '行为心理学' },
    { value: 62, suffix: '%', label: '事后满意度', desc: '62%的人在做出重大决定后一年内感到满意', source: 'J. of Consumer Psychology' },
    { value: 12, suffix: '次', label: '一生换工作次数', desc: '平均一个人一生会换12-15份工作', source: 'BLS' },
  ],
};

const READING_CARDS = {
  财务: [
    { type: 'quote', icon: 'Q', title: '名言', content: '在别人恐惧时贪婪，在别人贪婪时恐惧。', source: '沃伦·巴菲特' },
    { type: 'history', icon: 'H', title: '历史类比', content: '1637年荷兰郁金香泡沫：一株球茎价格涨到能买一栋房子。泡沫破裂后，无数投机者血本无归。', source: '' },
    { type: 'psychology', icon: 'P', title: '心理账户', content: '人们会把钱分成不同的"心理账户"——工资是辛苦钱要省着花，意外之财则大方挥霍。', source: '理查德·塞勒' },
  ],
  职业: [
    { type: 'quote', icon: 'Q', title: '名言', content: '选择比努力更重要，但选择本身就是一种需要努力培养的能力。', source: '查理·芒格' },
    { type: 'history', icon: 'H', title: '历史类比', content: 'J.K.罗琳写《哈利·波特》时是单亲妈妈、靠救济金生活，手稿被12家出版社拒绝。', source: '' },
    { type: 'psychology', icon: 'P', title: '沉没成本谬误', content: '已经在一份工作上投入了太多时间，所以不舍得离开——这是典型的沉没成本谬误。', source: '丹尼尔·卡尼曼' },
  ],
  感情: [
    { type: 'quote', icon: 'Q', title: '名言', content: '爱一个人，就是在他身上看到上帝希望你成为的样子。', source: '雨果' },
    { type: 'history', icon: 'H', title: '历史类比', content: '钱钟书和杨绛初见时，钱钟书说"我没有订婚"，杨绛答"我也没有男朋友"。', source: '' },
    { type: 'psychology', icon: 'P', title: '依恋理论', content: '童年形成的依恋模式会深刻影响成年后的亲密关系。焦虑型害怕被抛弃，回避型害怕亲密。', source: '约翰·鲍比' },
  ],
  教育: [
    { type: 'quote', icon: 'Q', title: '名言', content: '教育的本质不是把篮子装满，而是把灯点亮。', source: '叶芝' },
    { type: 'history', icon: 'H', title: '历史类比', content: '爱因斯坦小时候被老师认为"反应迟钝"，高考复读一年才考上大学。', source: '' },
    { type: 'psychology', icon: 'P', title: '成长型思维', content: '相信能力可以通过努力提升的人，比认为能力是固定的人更容易取得成功。', source: '卡罗尔·德韦克' },
  ],
  心理: [
    { type: 'quote', icon: 'Q', title: '名言', content: '人的一切痛苦，本质上都是对自己无能的愤怒。', source: '王小波' },
    { type: 'history', icon: 'H', title: '历史类比', content: '弗兰克尔在纳粹集中营里失去了几乎全部亲人，却在极端苦难中找到了生命的意义。', source: '' },
    { type: 'psychology', icon: 'P', title: '认知重评', content: '情绪不是由事件本身引起的，而是由你对事件的解读引起的。改变看法，就能改变情绪。', source: '阿尔伯特·埃利斯' },
  ],
  健康: [
    { type: 'quote', icon: 'Q', title: '名言', content: '保持健康的唯一方法就是吃你不想吃的，喝你不想喝的，做你不想做的。', source: '马克·吐温' },
    { type: 'history', icon: 'H', title: '历史类比', content: '19世纪伦敦霍乱大爆发时，约翰·斯诺通过绘制疫情地图发现污染水源是罪魁祸首。', source: '' },
    { type: 'psychology', icon: 'P', title: '安慰剂效应', content: '即使是无药效的糖丸，只要患者相信它有效，症状也能改善。', source: '亨利·比彻' },
  ],
  创业: [
    { type: 'quote', icon: 'Q', title: '名言', content: '最好的创业时机是你还有日常工作的时候。', source: '保罗·格雷厄姆' },
    { type: 'history', icon: 'H', title: '历史类比', content: 'Airbnb创始人最初只是为了付房租，把气垫床租给陌生人。被所有投资人拒绝后，靠卖麦片盒撑过了最难的时期。', source: '' },
    { type: 'psychology', icon: 'P', title: '幸存者偏差', content: '我们只看到成功的创业者，却看不到无数失败者。决策时要考虑看不见的"沉默数据"。', source: '亚伯拉罕·瓦尔德' },
  ],
  家庭: [
    { type: 'quote', icon: 'Q', title: '名言', content: '家是世界上唯一隐藏人类缺点与失败的地方，它同时也蕴藏着甜蜜的爱。', source: '萧伯纳' },
    { type: 'history', icon: 'H', title: '历史类比', content: '曾国藩年轻时与父亲关系紧张，后来在日记中写道"家和则福自生"。', source: '' },
    { type: 'psychology', icon: 'P', title: '分化理论', content: '健康的家庭关系需要"分化"——在保持情感连接的同时，建立独立的自我。', source: '默里·鲍文' },
  ],
  default: [
    { type: 'quote', icon: 'Q', title: '名言', content: '你不能控制发生在你身上的事，但你可以控制你的态度。', source: '查理·芒格' },
    { type: 'history', icon: 'H', title: '历史类比', content: '司马迁遭受宫刑后忍辱完成《史记》。人生低谷往往是伟大作品的起点。', source: '' },
    { type: 'psychology', icon: 'P', title: '自我效能感', content: '对自己完成任务能力的信念，比实际能力更能预测成功。', source: '阿尔伯特·班杜拉' },
  ],
};

const LOADING_INSIGHTS = [
  '写下焦虑本身就能降低焦虑水平约30%。表达即疗愈。',
  '人在下午2-4点做出的决定质量最低。',
  '大脑每天做35000个决定，但真正重要的不超过5个。',
  '大脑处理"做不做"比"怎么做"消耗更多能量。先决定方向，再想方法。',
  '运动后2小时内大脑执行功能提升约20%。',
  '沉没成本谬误让我们在错误的道路上越走越远。',
  '承认不确定性，反而能做出更好的决策。',
  '每天进步1%，一年后你将比现在强37倍。',
  '环境设计比意志力更可靠。',
  '规划谬误：人类系统性地低估完成任务所需的时间。',
  'OODA循环：观察、判断、决策、行动。快速迭代比完美计划更有效。',
];

const DOMAIN_EMPATHY = {
  财务: {
    anxious: ['钱的焦虑最容易让人失眠。你不是一个人——78%的人靠工资过日子，没有储蓄缓冲。'],
    angry: ['亏钱的愤怒是真实的。但愤怒时做的交易决定，往往会让亏损扩大。'],
    sad: ['看着数字缩水确实难受。但周期是市场的本质，没有只跌不涨的市场。'],
    fearful: ['恐惧让很多人在最低点割肉，在最高点追涨。'],
    confused: ['理财信息太多，互相矛盾。但有一个原则永远不会错：不懂的不碰。'],
    hopeful: ['期待是好的，但别让期待变成赌博。分散投资，控制仓位。'],
    neutral: ['以平静的心态审视自己的财务状况，这本身就是一种勇气。'],
    excited: ['市场疯狂的时候，冷静的人才能赚到钱。'],
  },
  教育: {
    anxious: ['升学压力确实很大，但一次考试决定不了一生。'],
    sad: ['成绩不理想很难受，但它不代表你这个人的价值。'],
    hopeful: ['你的努力不会白费。学习的回报有时会迟到，但不会缺席。'],
    confused: ['没有绝对正确的选择，只有你把它变成正确的。'],
    neutral: ['以平和的心态看待学业，给自己一个合理的预期。'],
    fearful: ['害怕考砸是正常的。但恐惧往往比实际结果更具破坏力。'],
  },
  心理: {
    anxious: ['焦虑是一种信号，它在提醒你某些事情需要被关注。'],
    angry: ['愤怒的背后往往是受伤。允许自己生气，但也要找到愤怒下面更深的情绪。'],
    sad: ['悲伤不是需要被"修好"的故障。它是人类情感的自然组成部分。'],
    confused: ['迷茫说明你在思考，这比浑浑噩噩地活着强多了。'],
    fearful: ['恐惧是大脑在保护你。但有时候保护过度了。'],
    hopeful: ['对未来抱有希望是心理韧性的重要组成部分。'],
    neutral: ['内心的平静是最珍贵的状态。'],
  },
  健康: {
    anxious: ['身体不适时的焦虑会放大症状。先做个全面检查，用数据代替想象。'],
    fearful: ['对健康的恐惧有时比疾病本身更伤人。'],
    neutral: ['以平常心对待健康，不忽视也不过度关注。'],
    hopeful: ['积极的心态对康复有真实的影响。'],
  },
  创业: {
    anxious: ['创业焦虑是所有创业者的常态。不确定性是创业的一部分。'],
    fearful: ['害怕失败很正常。但不尝试的结果是确定的——什么都改变不了。'],
    excited: ['创业的兴奋感很宝贵，但别让兴奋冲昏头脑。'],
    confused: ['信息太多、方向不明时，回到最本质的问题：你要为谁解决什么问题？'],
    hopeful: ['希望和信心是创业最需要的燃料。但也要做好最坏的打算。'],
  },
  default: {},
};

// 心理画像维度 — 用于雷达图
const PROFILE_DIMENSIONS = {
  risk_tolerance: { label: '风险承受', low: '规避风险', high: '拥抱风险' },
  action_orientation: { label: '行动倾向', low: '深思熟虑', high: '快速行动' },
  emotional_awareness: { label: '情绪觉察', low: '理性主导', high: '感性主导' },
  social_dependency: { label: '社交依赖', low: '独立决策', high: '依赖他人' },
  uncertainty_tolerance: { label: '不确定容忍', low: '追求确定', high: '接受未知' },
  time_horizon: { label: '时间视角', low: '关注当下', high: '放眼长远' },
};

window.DAILY_QUOTES = DAILY_QUOTES;
window.RANDOM_DILEMMAS = RANDOM_DILEMMAS;
window.TWIST_REPLACEMENTS = TWIST_REPLACEMENTS;
window.STATS_DATA = STATS_DATA;
window.READING_CARDS = READING_CARDS;
window.LOADING_INSIGHTS = LOADING_INSIGHTS;
window.DOMAIN_EMPATHY = DOMAIN_EMPATHY;
window.PROFILE_DIMENSIONS = PROFILE_DIMENSIONS;
