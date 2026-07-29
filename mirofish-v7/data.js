/**
 * MiroFish v7 - 数据层
 * 名言 / 统计数据 / 三联阅读卡片 / 加载洞察 / 口吻数据
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
  { text: '知识就是力量。', author: '弗朗西斯·培根' },
  { text: '未经审视的人生不值得过。', author: '苏格拉底' },
  { text: '吾日三省吾身。', author: '曾子' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '世上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。', author: '罗曼·罗兰' },
  { text: '你今天的日积月累，终将成为别人的望尘莫及。', author: '张爱玲' },
];

// ===== 口吻选择 =====
const PERSONAS = {
  brutal: { name: '毒舌朋友', icon: '🔥', desc: '直接骂醒你，不给面子' },
  elder: { name: '年长10岁的自己', icon: '🪞', desc: '讲真实教训，像照镜子' },
  stranger: { name: '过来人', icon: '🤝', desc: '同样困境的人，分享选择' },
};

// ===== 真实统计数据 =====
const STATS_DATA = {
  财务: [
    { value: '76%', label: '冲动投资亏损率', desc: '因情绪波动做出的投资决定中，76%在三个月内出现亏损', source: '行为金融学研究' },
    { value: '3.2年', label: '平均回本周期', desc: 'A股散户从大幅亏损到回本的平均时间', source: '上交所统计年鉴' },
    { value: '68%', label: '月光族占比', desc: '90后群体中68%是月光族，其中过半有负债', source: '尼尔森消费报告' },
  ],
  职业: [
    { value: '43%', label: '裸辞后悔率', desc: '裸辞者中有43%在三个月内后悔', source: '智联招聘调研' },
    { value: '2.8年', label: '平均跳槽间隔', desc: 'Z世代平均每2.8年跳槽一次', source: '领英职场报告' },
    { value: '67%', label: '副业失败率', desc: '尝试副业的人中67%在半年内放弃', source: 'DT财经' },
  ],
  感情: [
    { value: '6个月', label: '分手恢复期', desc: '平均需要6个月才能从认真的感情中恢复', source: 'J. of Positive Psychology' },
    { value: '72h', label: '冷战临界点', desc: '冷战超过72小时，关系破裂概率翻倍', source: 'Gottman研究所' },
    { value: '49%', label: '复合再分率', desc: '分手后复合的情侣中49%会再次分手', source: 'Social Psychology Quarterly' },
  ],
  教育: [
    { value: '78%', label: '志愿错配率', desc: '78%的大学生表示重新选会选不同专业', source: '麦可思研究院' },
    { value: '52%', label: '考研弃考率', desc: '报名考研的人中约52%最终弃考或裸考', source: '教育部数据' },
    { value: '35万', label: '留学年花费', desc: '主流留学目的地年均总花费', source: '新东方白皮书' },
  ],
  心理: [
    { value: '3.5亿', label: '全球抑郁患者', desc: '全球约3.5亿人受抑郁症困扰', source: 'WHO' },
    { value: '70%', label: '心身疾病占比', desc: '约70%的躯体疾病与心理压力有关', source: '柳叶刀' },
    { value: '21天', label: '习惯养成周期', desc: '形成新习惯平均需要21天持续重复', source: 'European J. of Social Psych.' },
  ],
  健康: [
    { value: '7h', label: '最佳睡眠时长', desc: '成年人每天7小时睡眠的人群死亡率最低', source: 'Nature' },
    { value: '150min', label: '周运动推荐', desc: 'WHO建议每周至少150分钟中等强度运动', source: 'WHO' },
    { value: '80%', label: '亚健康占比', desc: '中国白领中约80%处于亚健康状态', source: '中国医师协会' },
  ],
  创业: [
    { value: '90%', label: '初创失败率', desc: '90%的初创企业会在前5年内倒闭', source: 'CB Insights' },
    { value: '18个月', label: '平均生存期', desc: '中国小微企业平均生存周期约18个月', source: '工商总局' },
    { value: '2.5次', label: '平均创业次数', desc: '成功创业者平均经历过2.5次失败', source: '哈佛商业评论' },
  ],
  家庭: [
    { value: '4.2亿', label: '中国家庭数', desc: '中国约有4.2亿个家庭', source: '国家统计局' },
    { value: '67%', label: '催生压力占比', desc: '已婚未育夫妻中67%感受到催生压力', source: '社会学调查' },
    { value: '35%', label: '原生家庭影响', desc: '35%的心理问题与原生家庭经历直接相关', source: '中国心理卫生杂志' },
  ],
  default: [
    { value: '23天', label: '决策平均周期', desc: '重大人生决策从纠结到决定平均需要23天', source: '行为心理学研究' },
    { value: '62%', label: '事后满意度', desc: '62%的人在做出重大决定后一年内感到满意', source: 'J. of Consumer Psychology' },
  ],
};

// ===== 三联阅读卡片 =====
const READING_CARDS = {
  财务: [
    { type: 'quote', icon: '💬', title: '名言', content: '在别人恐惧时贪婪，在别人贪婪时恐惧。', source: '沃伦·巴菲特' },
    { type: 'history', icon: '📜', title: '历史类比', content: '1637年荷兰郁金香泡沫：一株球茎价格涨到能买一栋阿姆斯特丹运河边的房子。泡沫破裂后无数投机者血本无归。', source: '' },
    { type: 'psychology', icon: '🧠', title: '心理账户', content: '人们会把钱分成不同的"心理账户"——工资是辛苦钱要省着花，意外之财则大方挥霍。这种非理性的分类导致投资决策偏差。', source: '理查德·塞勒' },
  ],
  职业: [
    { type: 'quote', icon: '💬', title: '名言', content: '选择比努力更重要，但选择本身就是一种需要努力培养的能力。', source: '查理·芒格' },
    { type: 'history', icon: '📜', title: '历史类比', content: 'J.K.罗琳写《哈利·波特》时是单亲妈妈、靠救济金生活，手稿被12家出版社拒绝。如果她在第11次拒绝后放弃，就不会有魔法世界。', source: '' },
    { type: 'psychology', icon: '🧠', title: '沉没成本谬误', content: '已经在一份工作上投入了太多时间，所以不舍得离开——这是典型的沉没成本谬误。过去的投入不应该影响面向未来的决策。', source: '丹尼尔·卡尼曼' },
  ],
  感情: [
    { type: 'quote', icon: '💬', title: '名言', content: '爱一个人，就是在他身上看到上帝希望你成为的样子。', source: '雨果' },
    { type: 'history', icon: '📜', title: '历史类比', content: '钱钟书和杨绛初见时，钱钟书说"我没有订婚"，杨绛答"我也没有男朋友"。好的感情往往不是轰轰烈烈的追求，而是两个灵魂在正确的时刻自然相遇。', source: '' },
    { type: 'psychology', icon: '🧠', title: '依恋理论', content: '童年形成的依恋模式会深刻影响成年后的亲密关系。了解自己的依恋类型是改善关系的第一步。', source: '约翰·鲍比' },
  ],
  教育: [
    { type: 'quote', icon: '💬', title: '名言', content: '教育的本质不是把篮子装满，而是把灯点亮。', source: '叶芝' },
    { type: 'history', icon: '📜', title: '历史类比', content: '爱因斯坦小时候被老师认为"反应迟钝"，高考复读一年才考上大学。标准化考试衡量的只是特定维度的能力。', source: '' },
    { type: 'psychology', icon: '🧠', title: '成长型思维', content: '相信能力可以通过努力提升的人，比认为能力是固定的人更容易取得成功。失败不是证明你不行，而是告诉你哪里需要改进。', source: '卡罗尔·德韦克' },
  ],
  心理: [
    { type: 'quote', icon: '💬', title: '名言', content: '人的一切痛苦，本质上都是对自己无能的愤怒。', source: '王小波' },
    { type: 'history', icon: '📜', title: '历史类比', content: '维克多·弗兰克尔在纳粹集中营里失去几乎全部亲人，却在极端苦难中找到了生命的意义，写出了《活出生命的意义》。', source: '' },
    { type: 'psychology', icon: '🧠', title: '认知重评', content: '情绪不是由事件本身引起的，而是由你对事件的解读引起的。改变对事件的看法，就能改变你的情绪反应。', source: '阿尔伯特·埃利斯' },
  ],
  健康: [
    { type: 'quote', icon: '💬', title: '名言', content: '保持健康的唯一方法就是吃你不想吃的，喝你不想喝的，做你不想做的。', source: '马克·吐温' },
    { type: 'history', icon: '📜', title: '历史类比', content: '19世纪伦敦霍乱大爆发时，约翰·斯诺通过绘制疫情地图发现污染水源是罪魁祸首，推翻了"瘴气说"。', source: '' },
    { type: 'psychology', icon: '🧠', title: '安慰剂效应', content: '即使是无药效的糖丸，只要患者相信它有效，症状也能改善。信念对身体的影响远超想象。', source: '亨利·比彻' },
  ],
  创业: [
    { type: 'quote', icon: '💬', title: '名言', content: '最好的创业时机是你还有日常工作的时候。', source: '保罗·格雷厄姆' },
    { type: 'history', icon: '📜', title: '历史类比', content: 'Airbnb创始人最初只是为了付房租，把气垫床租给陌生人。被所有投资人拒绝后，靠卖麦片盒撑过了最难的时期。', source: '' },
    { type: 'psychology', icon: '🧠', title: '幸存者偏差', content: '我们只看到成功的创业者，却看不到无数失败者。决策时要考虑看不见的"沉默数据"。', source: '亚伯拉罕·瓦尔德' },
  ],
  家庭: [
    { type: 'quote', icon: '💬', title: '名言', content: '家是世界上唯一隐藏人类缺点与失败的地方，同时也蕴藏着甜蜜的爱。', source: '萧伯纳' },
    { type: 'history', icon: '📜', title: '历史类比', content: '曾国藩在家书中反复强调"家和万事兴"，但他的家庭关系也曾极度紧张。和解的关键不是谁对谁错，而是谁先放下。', source: '' },
    { type: 'psychology', icon: '🧠', title: '边界感', content: '健康的家庭关系需要清晰的心理边界。爱不等于没有边界，有边界不等于不爱。', source: '苏珊·福沃德' },
  ],
  default: [
    { type: 'quote', icon: '💬', title: '名言', content: '你不能控制发生在你身上的事，但你可以控制你的态度。', source: '查理·芒格' },
    { type: 'history', icon: '📜', title: '历史类比', content: '司马迁遭受宫刑后忍辱完成《史记》。人生低谷往往是伟大作品的起点。', source: '' },
    { type: 'psychology', icon: '🧠', title: '自我效能感', content: '对自己完成任务能力的信念，比实际能力更能预测成功。', source: '阿尔伯特·班杜拉' },
  ],
};

// ===== 加载洞察 =====
const LOADING_INSIGHTS = [
  { icon: '🧠', text: '心理学发现：写下焦虑本身就能降低焦虑水平约30%。' },
  { icon: '📊', text: '数据洞察：下午2-4点做出的决定质量最低。' },
  { icon: '🔬', text: '行为科学：人每天做35000个决定，真正重要的不超过5个。' },
  { icon: '💡', text: '认知科学：大脑处理"做不做"比"怎么做"消耗更多能量。' },
  { icon: '🌍', text: '社会学：你最常接触的5个人的平均水平决定了你的水平。' },
  { icon: '⚡', text: '神经科学：运动后2小时内大脑执行功能提升约20%。' },
  { icon: '🎯', text: '经济学：沉没成本谬误让我们在错误的道路上越走越远。' },
  { icon: '🔮', text: '概率思维：大多数人在预测未来时过度自信。' },
  { icon: '🧘', text: '正念研究：每天10分钟冥想，8周后情绪调节区域明显增厚。' },
  { icon: '📈', text: '复利效应：每天进步1%，一年后强37倍。' },
];

// ===== 模拟投票数据（按领域）=====
const POLL_DATA = {
  财务:   { optimistic: 18, neutral: 42, pessimistic: 40 },
  职业:   { optimistic: 28, neutral: 45, pessimistic: 27 },
  感情:   { optimistic: 22, neutral: 35, pessimistic: 43 },
  教育:   { optimistic: 30, neutral: 40, pessimistic: 30 },
  心理:   { optimistic: 20, neutral: 38, pessimistic: 42 },
  健康:   { optimistic: 35, neutral: 40, pessimistic: 25 },
  创业:   { optimistic: 15, neutral: 35, pessimistic: 50 },
  家庭:   { optimistic: 25, neutral: 42, pessimistic: 33 },
  科技:   { optimistic: 32, neutral: 45, pessimistic: 23 },
  自媒体: { optimistic: 28, neutral: 42, pessimistic: 30 },
  居住:   { optimistic: 25, neutral: 48, pessimistic: 27 },
  日常:   { optimistic: 30, neutral: 40, pessimistic: 30 },
};

// ===== 领域情绪共鸣 =====
const DOMAIN_EMPATHY = {
  财务: {
    anxious: ['钱的焦虑最容易让人失眠。你不是一个人——中国超过2亿人背负消费贷。'],
    angry: ['亏钱的愤怒是真实的。但愤怒时做的交易决定，往往会让亏损扩大。'],
    sad: ['看着数字缩水确实难受。但周期是市场的本质。'],
    fearful: ['恐惧让很多人在最低点割肉，在最高点追涨。'],
    confused: ['理财信息太多互相矛盾。但有一个原则永远没错：不懂的不碰。'],
    hopeful: ['期待是好的，但别让期待变成赌博。分散投资，控制仓位。'],
    neutral: ['以平静的心态审视自己的财务状况，本身就是一种勇气。'],
    excited: ['市场疯狂的时候，冷静的人才能赚到钱。'],
  },
  教育: {
    anxious: ['升学压力确实很大，但一次考试决定不了一生。'],
    hopeful: ['你的努力不会白费。学习的回报有时会迟到，但不会缺席。'],
    confused: ['选专业选学校让人头大。但记住：没有绝对正确的选择。'],
    neutral: ['以平和的心态看待学业，给自己一个合理的预期。'],
  },
  心理: {
    anxious: ['焦虑是一种信号，它在提醒你某些事情需要被关注。'],
    angry: ['愤怒的背后往往是受伤。允许自己生气，也试着找到愤怒下面更深的情绪。'],
    sad: ['悲伤不是需要被"修好"的故障。允许自己感受它。'],
    fearful: ['恐惧是大脑在保护你。但有时候保护过度了。'],
  },
  健康: {
    anxious: ['身体不适时的焦虑会放大症状。先做个全面检查，用数据代替想象。'],
    fearful: ['对健康的恐惧有时比疾病本身更伤人。'],
  },
  创业: {
    anxious: ['创业焦虑是所有创业者的常态。不确定性是创业的一部分。'],
    fearful: ['害怕失败很正常。但不尝试的结果是确定的。'],
    excited: ['创业的兴奋感很宝贵，但别让兴奋冲昏头脑。'],
  },
  感情: {},
  职业: {},
  家庭: {},
  default: {},
};

window.DAILY_QUOTES = DAILY_QUOTES;
window.PERSONAS = PERSONAS;
window.STATS_DATA = STATS_DATA;
window.READING_CARDS = READING_CARDS;
window.LOADING_INSIGHTS = LOADING_INSIGHTS;
window.POLL_DATA = POLL_DATA;
window.DOMAIN_EMPATHY = DOMAIN_EMPATHY;
