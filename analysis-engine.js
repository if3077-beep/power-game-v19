/**
 * AnalysisEngine - 框架驱动的人性/社会分析引擎
 * 设计原则：用分析框架组合生成洞察，而非模板填充
 *
 * 用法：
 *   const engine = new AnalysisEngine();
 *   const result = engine.analyze({
 *     scenario: '你发现同事在背后说你坏话',
 *     context: { role: '职场新人', stakes: '中等' },
 *     character: '我',
 *     options: [
 *       { id: 'a', text: '当面质问', tags: [' confrontational', 'direct'] },
 *       { id: 'b', text: '装作不知道', tags: ['passive', 'avoidant'] },
 *       { id: 'c', text: '找领导反映', tags: ['hierarchical', 'escalation'] },
 *     ]
 *   });
 */

// ============================================================
//  第一层：分析框架（Analytical Frameworks）
//  每个框架是一个独立的"透镜"，从不同角度剖析同一情境
// ============================================================

const Frameworks = {

  // ------ 权力动力学 ------
  powerDynamics: {
    name: '权力动力学',
    icon: '⚖️',
    description: '分析情境中的权力结构、资源控制和影响力流向',

    dimensions: [
      { id: 'formal',    label: '正式权力', desc: '职位、法律、制度赋予的权力' },
      { id: 'informal',  label: '非正式权力', desc: '人脉、信息、魅力带来的影响力' },
      { id: 'resource',  label: '资源控制', desc: '对关键资源（钱、信息、关系）的掌控' },
      { id: 'narrative', label: '叙事权', desc: '谁能定义"真相"、谁能讲更有说服力的故事' },
      { id: 'exit',      label: '退出成本', desc: '离开这个关系/组织的代价有多高' },
    ],

    analyze(ctx) {
      const insights = [];

      // 识别权力不对称
      if (ctx.stakes === '高' || ctx.stakes === '极高') {
        insights.push({
          type: 'power_asymmetry',
          severity: 'high',
          text: '高利益情境下，权力弱势方的每一步都被放大审视。表面上的"选择自由"往往是假象——选项本身已经被权力结构预筛选了。',
          framework: this.name,
        });
      }

      // 识别隐性权力
      insights.push({
        type: 'hidden_power',
        severity: 'medium',
        text: '注意情境中谁掌握"叙事权"——不是谁说得大声，而是谁的版本会被当作"事实"。掌握叙事权的人不需要直接施压，只需要定义框架。',
        framework: this.name,
      });

      // 退出成本分析
      if (ctx.role && (ctx.role.includes('新人') || ctx.role.includes('下属') || ctx.role.includes('依赖'))) {
        insights.push({
          type: 'exit_cost',
          severity: 'high',
          text: '当退出成本极高时，"忍"不是懦弱而是理性。但长期来看，必须想办法降低退出成本——这才是真正的权力来源。',
          framework: this.name,
        });
      }

      return insights;
    },

    scoreOption(option, ctx) {
      let powerGain = 0;
      const tags = option.tags || [];

      if (tags.includes('direct') || tags.includes('confrontational')) powerGain += 2;
      if (tags.includes('passive') || tags.includes('avoidant')) powerGain -= 1;
      if (tags.includes('hierarchical') || tags.includes('escalation')) powerGain += 1;
      if (tags.includes('coalition') || tags.includes('alliance')) powerGain += 3;
      if (tags.includes('information') || tags.includes('leverage')) powerGain += 2;

      // 高stakes时正面对抗风险更大
      if ((ctx.stakes === '高' || ctx.stakes === '极高') && powerGain > 2) {
        powerGain = 1; // 降级，因为风险太高
      }

      return {
        dimension: '权力增益',
        score: Math.max(-3, Math.min(5, powerGain)),
        reasoning: powerGain > 1 ? '这个选项能提升你的权力地位' : powerGain < 0 ? '这个选项可能削弱你的权力地位' : '对权力格局影响不大',
      };
    },
  },

  // ------ 群体心理学 ------
  groupPsychology: {
    name: '群体心理学',
    icon: '👥',
    description: '分析群体压力、从众效应、社会认同等群体层面的心理机制',

    dimensions: [
      { id: 'conformity',  label: '从众压力', desc: '群体对个体的同质化压力' },
      { id: 'deindiv',     label: '去个性化', desc: '匿名/群体中的责任感稀释' },
      { id: 'polarize',    label: '群体极化', desc: '群体讨论让立场更极端' },
      { id: 'conformity',  label: '社会认同', desc: '群体身份对个体行为的塑造' },
      { id: 'bystander',   label: '旁观者效应', desc: '责任分散导致的不作为' },
    ],

    analyze(ctx) {
      const insights = [];

      insights.push({
        type: 'social_mirror',
        severity: 'medium',
        text: '人在群体中的行为，往往不是"真实的自己"，而是"群体需要自己成为的样子"。区分这两者，是做出清醒决策的前提。',
        framework: this.name,
      });

      if (ctx.observers && ctx.observers > 2) {
        insights.push({
          type: 'bystander_effect',
          severity: 'high',
          text: `当在场人数超过${ctx.observers}人时，每个人的责任感都会被稀释。如果你想推动行动，必须打破这种分散——指定具体的人做具体的事。`,
          framework: this.name,
        });
      }

      insights.push({
        type: 'pluralistic_ignorance',
        severity: 'medium',
        text: '群体中常常出现"多元无知"——每个人都私下不同意，但都以为其他人都同意，于是所有人都沉默。打破沉默的第一个人承担最大风险，但也获得最大影响力。',
        framework: this.name,
      });

      return insights;
    },

    scoreOption(option, ctx) {
      let socialScore = 0;
      const tags = option.tags || [];

      if (tags.includes('public') || tags.includes('visible')) socialScore += 1;
      if (tags.includes('conformist') || tags.includes('go_along')) socialScore += 1;
      if (tags.includes('whistle') || tags.includes('dissent')) socialScore -= 2;
      if (tags.includes('coalition') || tags.includes('alliance')) socialScore += 2;
      if (tags.includes('private') || tags.includes('discrete')) socialScore += 1;

      return {
        dimension: '社会成本',
        score: Math.max(-3, Math.min(5, socialScore)),
        reasoning: socialScore > 1 ? '符合群体期望，社会成本低' : socialScore < -1 ? '挑战群体共识，社会成本高但可能获得独特影响力' : '社会成本适中',
      };
    },
  },

  // ------ 道德困境 ------
  moralDilemma: {
    name: '道德困境',
    icon: '🎭',
    description: '分析道德冲突、伦理选择和价值观博弈',

    dimensions: [
      { id: 'utilitarian', label: '功利主义', desc: '结果导向：哪个选项带来最大总福祉' },
      { id: 'deontological', label: '义务论', desc: '规则导向：哪个选项符合道德准则' },
      { id: 'virtue', label: '美德伦理', desc: '品格导向：哪个选项体现了你想成为的人' },
      { id: 'care', label: '关怀伦理', desc: '关系导向：哪个选项最好地维护了重要关系' },
    ],

    analyze(ctx) {
      const insights = [];

      insights.push({
        type: 'moral_framing',
        severity: 'high',
        text: '大多数道德困境之所以"困"，不是因为没有好选项，而是因为你在用不同的道德框架评判同一个选择。先搞清楚你最在意的是结果、规则、品格还是关系。',
        framework: this.name,
      });

      insights.push({
        type: 'dirty_hands',
        severity: 'high',
        text: '真实世界的道德选择很少是"干净"的。有时候你必须在两个都"不够好"的选项中选一个。承认这一点不是犬儒，是成熟。',
        framework: this.name,
      });

      insights.push({
        type: 'moral_license',
        severity: 'medium',
        text: '做了好事之后，人会不自觉地允许自己做坏事——"道德许可效应"。反过来，一次"坏选择"也不意味着你就是坏人。不要用单一行为定义自己。',
        framework: this.name,
      });

      return insights;
    },

    scoreOption(option, ctx) {
      let moralScore = 0;
      const tags = option.tags || [];

      if (tags.includes('ethical') || tags.includes('principled')) moralScore += 2;
      if (tags.includes('pragmatic') || tags.includes('practical')) moralScore += 1;
      if (tags.includes('selfish') || tags.includes('exploitative')) moralScore -= 2;
      if (tags.includes('sacrifice') || tags.includes('altruistic')) moralScore += 1;
      if (tags.includes('deceptive') || tags.includes('manipulative')) moralScore -= 1;

      return {
        dimension: '道德清晰度',
        score: Math.max(-3, Math.min(5, moralScore)),
        reasoning: moralScore > 1 ? '这个选择在多数道德框架下都站得住脚' : moralScore < -1 ? '这个选择有明显的道德张力' : '道德上有争议，取决于你优先哪个框架',
      };
    },
  },

  // ------ 博弈论 ------
  gameTheory: {
    name: '博弈论',
    icon: '🎲',
    description: '用博弈论模型分析策略互动、利益冲突和合作可能',

    models: {
      prisonerDilemma: {
        name: '囚徒困境',
        desc: '双方合作最优，但个体理性导致互相背叛',
        applicable: (ctx) => ctx.parties >= 2 && ctx.trust_level !== 'high',
        analyze: (ctx) => ({
          insight: '这是一个囚徒困境结构：双方合作（CC）的总收益最大，但对每个个体来说，无论对方怎么选，背叛（D）都是更安全的策略。这就是为什么信任这么难建立——不是因为人们坏，而是因为理性计算指向背叛。',
          strategies: [
            { name: '以牙还牙 (Tit-for-Tat)', desc: '第一轮合作，之后模仿对方上一轮的选择。简单、可预测、长期收益最高。', fit: 'high' },
            { name: '慷慨的以牙还牙', desc: '偶尔原谅对方的背叛，给关系修复的机会。', fit: 'medium' },
            { name: '冷酷触发 (Grim Trigger)', desc: '合作直到对方背叛一次，之后永远背叛。高风险高威慑。', fit: 'low' },
          ],
        }),
      },

      chickenGame: {
        name: '胆小鬼博弈',
        desc: '双方都在等对方先退让，谁先退谁输',
        applicable: (ctx) => ctx.standoff === true || ctx.stakes === '高',
        analyze: (ctx) => ({
          insight: '胆小鬼博弈的核心悖论：最理性的做法是让对方相信你绝对不会退让——但如果你真的不退让，两败俱伤。高手的做法是"制造可控的不可预测性"，让对方无法确定你会不会退。',
          strategies: [
            { name: '烧桥策略', desc: '公开切断自己的退路，让对方知道你不可能退。极端但有效。', fit: 'medium' },
            { name: '信号博弈', desc: '通过小动作传递"我不会退"的信号，但保留回旋余地。', fit: 'high' },
            { name: '第三方介入', desc: '引入一个双方都尊重的中间人来打破僵局。', fit: 'high' },
          ],
        }),
      },

      ultimatumGame: {
        name: '最后通牒博弈',
        desc: '一方提分配方案，另一方只能接受或拒绝',
        applicable: (ctx) => ctx.asymmetric === true || ctx.power_imbalance === true,
        analyze: (ctx) => ({
          insight: '理论上，提议者只要给1分钱，接受者就该接受（有总比没有好）。但现实中，低于20%的提议经常被拒绝——人宁愿两败俱伤也不愿接受"不公平"。这说明人类决策不完全由利益驱动，"公平感"本身就是一种需求。',
          strategies: [
            { name: '锚定效应', desc: '先提出一个略高于你真实底线的方案，利用锚定效应影响对方预期。', fit: 'high' },
            { name: '框架重构', desc: '把"分配"框架改成"合作"框架，让对方觉得这不是零和博弈。', fit: 'high' },
            { name: '退出威胁', desc: '让对方知道你有其他选择，降低其议价能力。', fit: 'medium' },
          ],
        }),
      },

      coordinationGame: {
        name: '协调博弈',
        desc: '双方利益一致但需要协调行动',
        applicable: (ctx) => ctx.cooperation_needed === true,
        analyze: (ctx) => ({
          insight: '协调博弈的关键不是"要不要合作"，而是"怎么让对方相信你会合作"。承诺问题（commitment problem）是合作失败的最常见原因。',
          strategies: [
            { name: '先行承诺', desc: '率先做出不可逆的行动，让对方看到你的诚意。', fit: 'high' },
            { name: '信号传递', desc: '通过代价高昂的信号（花钱、花时间）传递合作意图。', fit: 'high' },
            { name: '渐进信任', desc: '从小规模合作开始，逐步建立信任。', fit: 'high' },
          ],
        }),
      },
    },

    analyze(ctx) {
      const insights = [];
      const applicableModels = [];

      for (const [key, model] of Object.entries(this.models)) {
        if (model.applicable(ctx)) {
          applicableModels.push({ key, ...model.analyze(ctx) });
        }
      }

      if (applicableModels.length === 0) {
        // 默认用囚徒困境
        const pd = this.models.prisonerDilemma.analyze(ctx);
        applicableModels.push({ key: 'prisonerDilemma', ...pd });
      }

      for (const model of applicableModels) {
        insights.push({
          type: 'game_model',
          severity: 'high',
          text: model.insight,
          strategies: model.strategies,
          modelName: this.models[model.key]?.name || model.key,
          framework: this.name,
        });
      }

      return insights;
    },

    scoreOption(option, ctx) {
      let coopScore = 0;
      const tags = option.tags || [];

      if (tags.includes('cooperate') || tags.includes('collaborate')) coopScore += 2;
      if (tags.includes('defect') || tags.includes('betray')) coopScore -= 2;
      if (tags.includes('signal') || tags.includes('commit')) coopScore += 1;
      if (tags.includes('retaliate') || tags.includes('punish')) coopScore -= 1;
      if (tags.includes('negotiate') || tags.includes('mediate')) coopScore += 2;

      return {
        dimension: '博弈收益',
        score: Math.max(-3, Math.min(5, coopScore)),
        reasoning: coopScore > 1 ? '促进合作，长期收益高' : coopScore < -1 ? '短期可能获利但破坏长期关系' : '策略性模糊，保留灵活性',
      };
    },
  },

  // ------ 信息不对称 ------
  informationAsymmetry: {
    name: '信息不对称',
    icon: '🔍',
    description: '分析谁掌握了什么信息、信息差如何影响博弈',

    analyze(ctx) {
      const insights = [];

      insights.push({
        type: 'info_power',
        severity: 'high',
        text: '信息不对称是权力的隐形来源。在任何博弈中，先问三个问题：我知道什么对方不知道的？对方知道什么我不知道的？谁能更早获得新信息？',
        framework: this.name,
      });

      insights.push({
        type: 'adverse_selection',
        severity: 'medium',
        text: '当信息不对称时，"好"的人/选项往往先退出市场（逆向选择）。如果一个机会看起来好得不像真的，大概率就不是真的。',
        framework: this.name,
      });

      insights.push({
        type: 'signaling',
        severity: 'medium',
        text: '在信息不对称的世界里，行动比语言更有说服力。花大代价做的承诺（烧桥、公开承诺）比口头承诺可信得多——因为代价本身就是信号。',
        framework: this.name,
      });

      return insights;
    },

    scoreOption(option, ctx) {
      let infoScore = 0;
      const tags = option.tags || [];

      if (tags.includes('information') || tags.includes('research')) infoScore += 2;
      if (tags.includes('reveal') || tags.includes('transparency')) infoScore += 1;
      if (tags.includes('conceal') || tags.includes('secret')) infoScore -= 1;
      if (tags.includes('signal') || tags.includes('demonstrate')) infoScore += 2;

      return {
        dimension: '信息优势',
        score: Math.max(-3, Math.min(5, infoScore)),
        reasoning: infoScore > 1 ? '增加你的信息优势' : infoScore < -1 ? '减少你的信息优势' : '对信息格局影响不大',
      };
    },
  },

  // ------ 情感操控识别 ------
  emotionalManipulation: {
    name: '情感操控',
    icon: '🎪',
    description: '识别和分析情境中的情感操控策略',

    patterns: [
      { id: 'guilt', name: '愧疚诱导', desc: '"我为你付出了这么多，你怎么能这样对我？"', counter: '区分"事实"和"情感绑架"。付出是对方的选择，不构成你必须回报的义务。' },
      { id: 'gaslighting', name: '煤气灯效应', desc: '"你想多了"/"你太敏感了"/"这件事根本没发生过"', counter: '信任自己的感知。如果多次出现"我的记忆有问题"的感觉，大概率不是你的问题。' },
      { id: 'silent_treatment', name: '冷暴力', desc: '用沉默和冷淡来惩罚你', counter: '不要追着对方跑。冷暴力的权力来源是你的焦虑——你越不焦虑，它越无效。' },
      { id: 'love_bombing', name: '爱意轰炸', desc: '过度的热情和关注，让你产生依赖', counter: '观察行为的持续性。真正的关心是稳定的，不是忽冷忽热的。' },
      { id: 'triangulation', name: '三角化', desc: '引入第三方来施压或制造嫉妒', counter: '拒绝参与三角游戏。直接和当事人沟通，不传话。' },
      { id: 'moving_goalpost', name: '移动球门', desc: '无论你怎么努力，标准永远在变', counter: '要求明确、可衡量的标准。如果对方拒绝明确，说明"标准"本身就是控制工具。' },
    ],

    analyze(ctx) {
      const insights = [];

      insights.push({
        type: 'manipulation_awareness',
        severity: 'high',
        text: '操控之所以有效，是因为操控者利用了你的情感需求（被爱、被认可、不被抛弃）。识别操控的第一步不是"对抗"，而是意识到自己的哪些需求正在被利用。',
        framework: this.name,
      });

      // 根据context推断可能的操控模式
      if (ctx.relationship && ctx.relationship.includes('亲密')) {
        insights.push({
          type: 'intimate_manipulation',
          severity: 'high',
          text: '亲密关系中的操控最难识别，因为它和"关心"长得很像。区分标准：关心让你更自由，操控让你更受限。',
          framework: this.name,
          patterns: ['guilt', 'gaslighting', 'silent_treatment'],
        });
      }

      if (ctx.relationship && ctx.relationship.includes('职场')) {
        insights.push({
          type: 'workplace_manipulation',
          severity: 'medium',
          text: '职场操控常伪装成"团队精神"或"职业发展"。当"机会"总是伴随着模糊的承诺和不断变化的条件时，要警惕。',
          framework: this.name,
          patterns: ['moving_goalpost', 'guilt', 'triangulation'],
        });
      }

      return insights;
    },

    scoreOption(option, ctx) {
      let resistScore = 0;
      const tags = option.tags || [];

      if (tags.includes('boundary') || tags.includes('assertive')) resistScore += 3;
      if (tags.includes('seek_help') || tags.includes('support')) resistScore += 2;
      if (tags.includes('comply') || tags.includes('submit')) resistScore -= 2;
      if (tags.includes('manipulate_back')) resistScore -= 1;
      if (tags.includes('document') || tags.includes('evidence')) resistScore += 2;

      return {
        dimension: '反操控力',
        score: Math.max(-3, Math.min(5, resistScore)),
        reasoning: resistScore > 1 ? '增强你的自主性' : resistScore < -1 ? '可能让你陷入更深的被动' : '效果取决于执行方式',
      };
    },
  },

  // ------ 社会交换理论 ------
  socialExchange: {
    name: '社会交换',
    icon: '🔄',
    description: '分析关系中的成本-收益、互惠规范和人情债',

    analyze(ctx) {
      const insights = [];

      insights.push({
        type: 'reciprocity_norm',
        severity: 'medium',
        text: '互惠是人类社会最强的规范之一。收到好处会产生"人情债"，这种债务感比金钱债务更难摆脱——因为你没法明确说"我不欠你的"。',
        framework: this.name,
      });

      insights.push({
        type: 'comparison_level',
        severity: 'medium',
        text: '人对关系的满意度不取决于绝对收益，取决于与"替代选项"的比较。如果一个人觉得自己"别无选择"，即使现状不差也会不满。',
        framework: this.name,
      });

      insights.push({
        type: 'equity_theory',
        severity: 'high',
        text: '关系中最危险的不是冲突，而是"不公平感"的积累。当一方觉得自己付出远多于回报时，怨恨会像复利一样增长，直到爆发。',
        framework: this.name,
      });

      return insights;
    },

    scoreOption(option, ctx) {
      let exchangeScore = 0;
      const tags = option.tags || [];

      if (tags.includes('reciprocate') || tags.includes('return_favor')) exchangeScore += 1;
      if (tags.includes('exploit') || tags.includes('take_advantage')) exchangeScore -= 2;
      if (tags.includes('invest') || tags.includes('build_trust')) exchangeScore += 2;
      if (tags.includes('withdraw') || tags.includes('exit')) exchangeScore -= 1;
      if (tags.includes('negotiate') || tags.includes('clarify')) exchangeScore += 2;

      return {
        dimension: '关系投资',
        score: Math.max(-3, Math.min(5, exchangeScore)),
        reasoning: exchangeScore > 1 ? '长期来看增加关系价值' : exchangeScore < -1 ? '可能破坏关系平衡' : '对关系影响中性',
      };
    },
  },

  // ------ 认知偏差 ------
  cognitiveBias: {
    name: '认知偏差',
    icon: '🧠',
    description: '识别情境中可能影响判断的认知偏差',

    biases: [
      { id: 'sunk_cost', name: '沉没成本谬误', desc: '因为已经投入太多而继续错误的路径', test: (ctx) => ctx.history_length > 3 },
      { id: 'confirmation', name: '确认偏误', desc: '只看到支持自己观点的证据', test: (ctx) => ctx.conviction_level === 'high' },
      { id: 'anchoring', name: '锚定效应', desc: '被第一个接收到的信息过度影响', test: (ctx) => ctx.first_impression === true },
      { id: 'availability', name: '可得性偏差', desc: '高估容易想到的事件的概率', test: (ctx) => ctx.recent_event === true },
      { id: 'loss_aversion', name: '损失厌恶', desc: '对损失的恐惧是等额收益渴望的2倍', test: (ctx) => ctx.risk_averse === true },
      { id: 'dunning_kruger', name: '达克效应', desc: '能力不足者高估自己，专家低估自己', test: (ctx) => ctx.experience_level === 'low' },
      { id: 'status_quo', name: '现状偏见', desc: '倾向于维持现状，即使改变更好', test: (ctx) => ctx.change_resistance === true },
      { id: 'fundamental', name: '基本归因错误', desc: '把别人的行为归因于人品，把自己的行为归因于环境', test: (ctx) => ctx.judging_others === true },
    ],

    analyze(ctx) {
      const insights = [];
      const activeBiases = this.biases.filter(b => b.test(ctx));

      if (activeBiases.length === 0) {
        // 给通用的偏差提醒
        insights.push({
          type: 'bias_awareness',
          severity: 'medium',
          text: '在做重要决策时，问自己一个问题："如果我对这件事一无所知，只看证据，我会怎么判断？"这个思想实验能帮你绕过大部分认知偏差。',
          framework: this.name,
        });
      } else {
        for (const bias of activeBiases) {
          insights.push({
            type: 'active_bias',
            severity: 'high',
            text: `你可能正在经历${bias.name}：${bias.desc}。暂停一下，问自己"如果我之前的判断是错的呢？"`,
            biasName: bias.name,
            framework: this.name,
          });
        }
      }

      return insights;
    },

    scoreOption(option, ctx) {
      let clarityScore = 0;
      const tags = option.tags || [];

      if (tags.includes('evidence') || tags.includes('data')) clarityScore += 2;
      if (tags.includes('reflect') || tags.includes('pause')) clarityScore += 2;
      if (tags.includes('impulsive') || tags.includes('emotional')) clarityScore -= 2;
      if (tags.includes('perspective') || tags.includes('reframe')) clarityScore += 2;
      if ( tags.includes('consult') || tags.includes('outside_view')) clarityScore += 2;

      return {
        dimension: '认知清晰度',
        score: Math.max(-3, Math.min(5, clarityScore)),
        reasoning: clarityScore > 1 ? '帮助你跳出偏差，看清真实情况' : clarityScore < -1 ? '可能强化已有的认知偏差' : '对认知清晰度影响不大',
      };
    },
  },

  // ------ 制度分析 ------
  institutionalAnalysis: {
    name: '制度分析',
    icon: '🏛️',
    description: '分析正式制度与非正式规则如何塑造行为',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'formal_informal',
        severity: 'high',
        text: '任何组织都存在两套规则：写在纸上的和活在人心里的。只看正式制度会误判局势——真正驱动行为的往往是那些"不成文的规矩"。',
        framework: this.name,
      });
      if (ctx.role && (ctx.role.includes('新人') || ctx.role.includes('基层'))) {
        insights.push({
          type: 'institutional_capture',
          severity: 'medium',
          text: '新人最容易犯的错误是"按规矩办事"。规矩是死的，人是活的。先观察三个月，搞清楚"真规矩"再行动。',
          framework: this.name,
        });
      }
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('institutional') || t.includes('procedural')) s += 2;
      if (t.includes('informal') || t.includes('backdoor')) s -= 1;
      return { dimension: '制度适应', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '符合制度逻辑' : '挑战制度安排' };
    },
  },

  // ------ 叙事控制 ------
  narrativeControl: {
    name: '叙事权',
    icon: '📜',
    description: '分析谁在定义"真相"、谁的故事会被相信',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'framing_power',
        severity: 'high',
        text: '控制叙事的人不需要控制事实——只需要控制"怎么讲"。同一件事，换个框架就是完全不同的故事。在博弈中，抢先定义框架的人往往赢在起跑线。',
        framework: this.name,
      });
      insights.push({
        type: 'counter_narrative',
        severity: 'medium',
        text: '反驳一个故事最好的方式不是"你说的不对"，而是讲一个更好的故事。人脑对叙事的接受度远高于逻辑论证。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('narrative') || t.includes('framing') || t.includes('story')) s += 2;
      if (t.includes('silence') || t.includes('conceal')) s -= 1;
      return { dimension: '叙事力', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '增强你的叙事权' : '削弱你的叙事权' };
    },
  },

  // ------ 网络理论 ------
  networkTheory: {
    name: '网络理论',
    icon: '🕸️',
    description: '分析社会资本、关系网络和结构洞',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'structural_hole',
        severity: 'high',
        text: '最有利可图的位置不是网络中心，而是"结构洞"——连接两个原本不联通的群体的桥梁。谁占据了结构洞，谁就掌握了信息优势和议价权。',
        framework: this.name,
      });
      insights.push({
        type: 'network_density',
        severity: 'medium',
        text: '关系网络越密集，信息传播越快，但也越难保密。稀疏网络信息慢但更可控。选择哪种网络结构取决于你的目标。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('network') || t.includes('bridge') || t.includes('connect')) s += 2;
      if (t.includes('isolate') || t.includes('withdraw')) s -= 2;
      return { dimension: '社会资本', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '扩展你的关系网络' : '缩小你的关系网络' };
    },
  },

  // ------ 时间动态 ------
  temporalDynamics: {
    name: '时间动态',
    icon: '⏳',
    description: '分析决策的短期收益与长期后果',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'temporal_discount',
        severity: 'high',
        text: '人天然高估即时收益、低估延迟后果。这就是为什么"眼前的诱惑"总是比"未来的代价"更有吸引力。做重大决策时，问自己："十年后的我会怎么看待这个选择？"',
        framework: this.name,
      });
      insights.push({
        type: 'path_dependence',
        severity: 'medium',
        text: '每一个选择都在缩小未来的选择空间。路径依赖意味着"现在的小选择"可能决定"未来的大格局"。不要只看眼前的选项，要看这些选项各自通向什么方向。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('long_term') || t.includes('sustainable')) s += 2;
      if (t.includes('short_term') || t.includes('immediate')) s -= 1;
      return { dimension: '长期价值', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '长期来看更可持续' : '短期收益高但长期风险大' };
    },
  },

  // ------ 科层制理论 ------
  bureaucracy: {
    name: '科层制',
    icon: '📋',
    description: '分析组织内部的权力结构、晋升逻辑和生存法则',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'peter_principle',
        severity: 'medium',
        text: '彼得原理：在科层制中，人会被晋升到自己不胜任的位置。如果你想往上走，要么在当前层级证明自己"过度胜任"，要么找到跳过中间层级的路径。',
        framework: this.name,
      });
      insights.push({
        type: 'upward_management',
        severity: 'high',
        text: '在科层制中，"向上管理"比"向下管理"更重要。你的上级决定你的资源、信息和晋升。但向上管理不是拍马屁——是让上级觉得你"好用"且"安全"。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('hierarchical') || t.includes('upward') || t.includes('report')) s += 1;
      if (t.includes('grassroots') || t.includes('bottom_up')) s += 1;
      if (t.includes('insubordinate') || t.includes('defy')) s -= 2;
      return { dimension: '组织生存', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '在科层制中有利' : '在科层制中有风险' };
    },
  },

  // ------ 信任动力学 ------
  trustDynamics: {
    name: '信任动力学',
    icon: '🤝',
    description: '分析信任的建立、维持和崩塌机制',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'trust_equation',
        severity: 'high',
        text: '信任 = (可信度 + 可靠性 + 亲近感) / 自我导向。提高前三项降低最后一项就能增加信任。但最容易被忽视的是最后一项——过度自我导向会迅速侵蚀信任。',
        framework: this.name,
      });
      insights.push({
        type: 'trust_asymmetry',
        severity: 'high',
        text: '信任建立需要十年，崩塌只需一秒。这种不对称性意味着：在信任问题上，防御永远优先于进攻。一次背叛需要十次修复。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('build_trust') || t.includes('consistent') || t.includes('transparent')) s += 2;
      if (t.includes('betray') || t.includes('deceive') || t.includes('break_trust')) s -= 3;
      return { dimension: '信任资本', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '积累信任资本' : '消耗信任资本' };
    },
  },

  // ------ 声誉经济学 ------
  reputationEconomics: {
    name: '声誉经济',
    icon: '🏷️',
    description: '分析声誉作为一种无形资产的运作规律',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'reputation_capital',
        severity: 'medium',
        text: '声誉是最难获得、最容易失去的资本。它有两个特性：1) 不可交易——你不能把好名声卖给别人；2) 复利效应——好声誉带来更多机会，更多机会强化好声誉。',
        framework: this.name,
      });
      insights.push({
        type: 'reputation_signal',
        severity: 'medium',
        text: '在信息不对称的环境中，声誉是最重要的信号。人们不会花时间深入了解你——他们用你的声誉来做快速判断。管理声誉就是管理别人对你的"快速判断"。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('reputation') || t.includes('visible') || t.includes('public')) s += 1;
      if (t.includes('scandal') || t.includes('controversy')) s -= 2;
      return { dimension: '声誉影响', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '提升你的声誉' : '损害你的声誉' };
    },
  },

  // ------ 委托代理 ------
  principalAgent: {
    name: '委托代理',
    icon: '🔗',
    description: '分析委托人与代理人之间的利益冲突和激励设计',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'agency_problem',
        severity: 'high',
        text: '委托代理问题的核心：代理人的利益永远不完全等于委托人的利益。你让别人替你做事，就要假设他会在"你的利益"和"他的利益"之间找平衡。激励设计的关键是让两者尽可能重合。',
        framework: this.name,
      });
      insights.push({
        type: 'moral_hazard',
        severity: 'medium',
        text: '当代理人不承担自己行为的全部后果时，就会出现道德风险。最常见的解决方案：让代理人"有皮肤在游戏里"——利益捆绑、风险共担。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('align') || t.includes('incentive') || t.includes('skin_in_game')) s += 2;
      if (t.includes('delegate') || t.includes('trust_other')) s += 1;
      if (t.includes('micromanage') || t.includes('control')) s -= 1;
      return { dimension: '激励对齐', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '利益更一致' : '利益可能分化' };
    },
  },

  // ------ 风险评估 ------
  riskAssessment: {
    name: '风险评估',
    icon: '⚠️',
    description: '系统分析决策的风险维度、概率和影响',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'risk_types',
        severity: 'medium',
        text: '风险分三种：已知的已知（你清楚风险是什么）、已知的未知（你知道有风险但不确定）、未知的未知（你根本没想到的风险）。大多数致命打击来自第三种——所以永远给自己留"冗余"。',
        framework: this.name,
      });
      insights.push({
        type: 'reversibility',
        severity: 'high',
        text: '决策分为可逆决策和不可逆决策。可逆决策要快——试错成本低；不可逆决策要慢——一旦错了就回不了头。在做不可逆决策时，"什么都不做"也是一个选项。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('reversible') || t.includes('flexible') || t.includes('hedge')) s += 2;
      if (t.includes('irreversible') || t.includes('all_in') || t.includes('burn_bridge')) s -= 2;
      return { dimension: '风险控制', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '保留了灵活性' : '锁死了选择空间' };
    },
  },

  // ------ 身份认同 ------
  identityPolitics: {
    name: '身份认同',
    icon: '🎭',
    description: '分析身份标签如何影响行为和他人的期望',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'identity_cage',
        severity: 'high',
        text: '身份标签是一把双刃剑：它帮你快速获得认同，也限制了你的行为空间。一旦你被定义为"某类人"，做"不符合身份"的事就会付出额外代价。',
        framework: this.name,
      });
      insights.push({
        type: 'role_conflict',
        severity: 'medium',
        text: '每个人同时扮演多个角色（下属、领导、父母、朋友），不同角色的要求常常冲突。角色冲突不是你的问题——是结构性问题。解决方案不是"选一个角色"，而是在不同场景中切换。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('authentic') || t.includes('consistent')) s += 1;
      if (t.includes('role_break') || t.includes('unexpected')) s += 1;
      return { dimension: '身份管理', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '强化你的身份资本' : '挑战身份边界' };
    },
  },

  // ------ 零和 vs 正和 ------
  zeroSumThinking: {
    name: '零和博弈',
    icon: '⚖️',
    description: '识别零和思维陷阱，寻找正和可能',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'zero_sum_trap',
        severity: 'high',
        text: '人类天生有"零和偏见"——倾向于认为一方的收益必然等于另一方的损失。但现实中大多数博弈都有正和可能。问自己："有没有办法把蛋糕做大，而不是争怎么分？"',
        framework: this.name,
      });
      insights.push({
        type: 'win_lose_framing',
        severity: 'medium',
        text: '当一个局面被框架为"你赢我输"时，双方都会变得更aggressive。尝试重构框架："我们共同面对的问题是什么？"这能把对抗变成合作。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('win_win') || t.includes('expand') || t.includes('create_value')) s += 2;
      if (t.includes('zero_sum') || t.includes('winner_take_all')) s -= 1;
      return { dimension: '正和潜力', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '创造正和可能' : '强化零和格局' };
    },
  },

  // ------ 沉默螺旋 ------
  spiralOfSilence: {
    name: '沉默螺旋',
    icon: '🔇',
    description: '分析群体中少数意见如何被压制',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'spiral_mechanism',
        severity: 'high',
        text: '沉默螺旋：当人们觉得自己的观点是少数派时，会因为害怕被孤立而沉默。少数派越沉默，多数派越强势，少数派就越不敢说话——形成恶性循环。打破螺旋需要勇气，但也需要策略。',
        framework: this.name,
      });
      insights.push({
        type: 'minority_influence',
        severity: 'medium',
        text: '少数派要影响多数派，关键不是"声音大"，而是"一致性"。持续、一致、自信地表达少数意见，比偶尔爆发更有效。人们最终会被"坚定"本身说服。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('dissent') || t.includes('speak_up') || t.includes('minority')) s += 1;
      if (t.includes('conform') || t.includes('silent') || t.includes('go_along')) s -= 1;
      return { dimension: '独立声音', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '打破沉默螺旋' : '强化沉默螺旋' };
    },
  },

  // ------ 承诺升级 ------
  escalationOfCommitment: {
    name: '承诺升级',
    icon: '📈',
    description: '分析为何人们会在失败的路径上越走越远',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'escalation_trap',
        severity: 'high',
        text: '承诺升级：已经投入太多所以不能放弃→继续投入→投入更多→更不能放弃。这不是理性决策，是"证明自己没错"的心理需求在驱动。止损的最佳时机永远是"现在"。',
        framework: this.name,
      });
      insights.push({
        type: 'sunk_cost_awareness',
        severity: 'high',
        text: '问自己一个残忍的问题："如果我之前没有投入任何东西，我现在还会做这个选择吗？"如果答案是"不会"，那你继续的原因就不是理性，而是沉没成本。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('cut_loss') || t.includes('pivot') || t.includes('exit')) s += 2;
      if (t.includes('double_down') || t.includes('persist') || t.includes('continue')) s -= 1;
      return { dimension: '止损能力', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '避免沉没成本陷阱' : '可能陷入承诺升级' };
    },
  },

  // ------ 社会比较 ------
  socialComparison: {
    name: '社会比较',
    icon: '📊',
    description: '分析社会比较如何影响决策和情绪',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'comparison_direction',
        severity: 'medium',
        text: '向上比较（和比你好的人比）产生动力或嫉妒；向下比较（和比你差的人比）产生满足或焦虑。大多数人的痛苦不是来自绝对处境，而是来自比较对象的选择。',
        framework: this.name,
      });
      insights.push({
        type: 'relative_deprivation',
        severity: 'medium',
        text: '相对剥夺感：即使客观条件改善了，如果别人改善得更多，你反而更不满。这就是为什么"共同富裕"比"一部分人先富"更难引发不满。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('absolute') || t.includes('intrinsic')) s += 1;
      if (t.includes('relative') || t.includes('competitive')) s -= 1;
      return { dimension: '比较心态', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '减少社会比较依赖' : '强化社会比较心态' };
    },
  },

  // ------ 权力腐化 ------
  powerCorruption: {
    name: '权力腐化',
    icon: '👑',
    description: '分析权力如何改变人的认知和行为',

    analyze(ctx) {
      const insights = [];
      insights.push({
        type: 'power_paradox',
        severity: 'high',
        text: '权力悖论：获得权力需要共情、合作和社交智慧；但拥有权力后，这些能力会退化。权力让人更冲动、更自我中心、更不善于换位思考。这就是为什么"好人变坏"往往发生在掌权之后。',
        framework: this.name,
      });
      insights.push({
        type: 'hubris_syndrome',
        severity: 'medium',
        text: '傲慢综合征：长期掌权者会发展出一种"我不会错"的幻觉。预防方法：在身边保留敢说真话的人——哪怕你不想听。',
        framework: this.name,
      });
      return insights;
    },
    scoreOption(option) {
      let s = 0;
      const t = option.tags || [];
      if (t.includes('humility') || t.includes('check_power') || t.includes('accountable')) s += 2;
      if (t.includes('accumulate_power') || t.includes('centralize')) s -= 1;
      return { dimension: '权力自律', score: Math.max(-3, Math.min(5, s)), reasoning: s > 0 ? '对权力保持警觉' : '可能加速权力腐化' };
    },
  },
};


// ============================================================
//  第二层：分析引擎核心
//  组合多个框架，生成结构化分析结果
// ============================================================

class AnalysisEngine {
  constructor(config = {}) {
    this.frameworks = config.frameworks || Object.keys(Frameworks);
    this.depth = config.depth || 'standard'; // 'quick' | 'standard' | 'deep'
  }

  /**
   * 主分析入口
   * @param {Object} input - 分析输入
   * @param {string} input.scenario - 情境描述
   * @param {Object} input.context - 上下文信息 { role, stakes, relationship, ... }
   * @param {Array}  input.options - 可选项 [{ id, text, tags }]
   * @returns {Object} 结构化分析结果
   */
  analyze(input) {
    const { scenario, context = {}, options = [] } = input;
    const ctx = { ...context };

    // 1. 运行所有框架
    const frameworkResults = {};
    const allInsights = [];

    for (const fwKey of this.frameworks) {
      const fw = Frameworks[fwKey];
      if (!fw) continue;

      const insights = fw.analyze(ctx);
      frameworkResults[fwKey] = {
        name: fw.name,
        icon: fw.icon,
        insights,
      };
      allInsights.push(...insights);
    }

    // 2. 对每个选项进行多维度评分
    const scoredOptions = options.map(option => {
      const scores = {};
      const dimensionScores = [];

      for (const fwKey of this.frameworks) {
        const fw = Frameworks[fwKey];
        if (!fw || !fw.scoreOption) continue;

        const score = fw.scoreOption(option, ctx);
        scores[fwKey] = score;
        dimensionScores.push(score.score);
      }

      const totalScore = dimensionScores.length > 0
        ? dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length
        : 0;

      return {
        ...option,
        scores,
        totalScore: Math.round(totalScore * 10) / 10,
        profile: this._generateOptionProfile(scores),
      };
    });

    // 按总分排序
    scoredOptions.sort((a, b) => b.totalScore - a.totalScore);

    // 3. 生成链式推理
    const chainOfThought = this._generateChainOfThought(scenario, ctx, scoredOptions, allInsights);

    // 4. 识别核心张力
    const tensions = this._identifyTensions(scoredOptions, allInsights);

    // 5. 生成总结
    const summary = this._generateSummary(scenario, ctx, scoredOptions, tensions);

    return {
      scenario,
      context: ctx,
      frameworks: frameworkResults,
      options: scoredOptions,
      chainOfThought,
      tensions,
      summary,
      insights: allInsights,
    };
  }

  /**
   * 生成选项的特征画像
   */
  _generateOptionProfile(scores) {
    const labels = [];
    for (const [fw, score] of Object.entries(scores)) {
      if (score.score >= 2) labels.push(`✓${score.dimension}`);
      if (score.score <= -2) labels.push(`✗${score.dimension}`);
    }
    return labels.length > 0 ? labels.join(' / ') : '中性';
  }

  /**
   * 生成链式推理步骤
   */
  _generateChainOfThought(scenario, ctx, options, insights) {
    const steps = [];

    // Step 1: 观察
    steps.push({
      step: 1,
      label: '观察事实',
      icon: '👁️',
      content: `情境核心：${scenario}`,
      subtext: ctx.role ? `你的身份：${ctx.role}` : null,
    });

    // Step 2: 识别模式
    const highInsights = insights.filter(i => i.severity === 'high');
    if (highInsights.length > 0) {
      steps.push({
        step: 2,
        label: '识别模式',
        icon: '🔍',
        content: highInsights[0].text,
        subtext: `来自：${highInsights[0].framework}`,
      });
    }

    // Step 3: 归因动机
    steps.push({
      step: 3,
      label: '归因动机',
      icon: '🎯',
      content: '在做归因之前，先区分三个层次：\n1. 对方做了什么（行为事实）\n2. 对方为什么这么做（动机假设）\n3. 你为什么这么解读（你的投射）',
      subtext: '大部分冲突源于把第3层当成了第1层',
    });

    // Step 4: 评估选项
    if (options.length > 0) {
      const best = options[0];
      const worst = options[options.length - 1];
      steps.push({
        step: 4,
        label: '评估选项',
        icon: '⚖️',
        content: `综合评分最高的选项："${best.text}"（${best.totalScore}分）`,
        subtext: best.profile,
      });

      if (options.length > 1 && best.totalScore !== worst.totalScore) {
        steps.push({
          step: 5,
          label: '关键差异',
          icon: '📊',
          content: `最优与最差选项的核心差异在于：${this._findKeyDifference(best, worst)}`,
        });
      }
    }

    // Step 5/6: 预测走向
    steps.push({
      step: steps.length + 1,
      label: '预测走向',
      icon: '🔮',
      content: '无论你选什么，记住：人的反应往往比你预期的更极端。好的结果不会像你想的那么好，坏的结果也不会像你想的那么坏——但你的情绪波动会比实际结果大得多。',
      subtext: '情绪预测偏差 (Impact Bias)',
    });

    return steps;
  }

  /**
   * 找出最优和最差选项的关键差异
   */
  _findKeyDifference(best, worst) {
    let maxDiff = 0;
    let diffDimension = '';

    for (const fw of Object.keys(best.scores)) {
      if (worst.scores[fw]) {
        const diff = best.scores[fw].score - worst.scores[fw].score;
        if (Math.abs(diff) > Math.abs(maxDiff)) {
          maxDiff = diff;
          diffDimension = best.scores[fw].dimension;
        }
      }
    }

    return diffDimension || '多个维度的综合差异';
  }

  /**
   * 识别核心张力（矛盾点）
   */
  _identifyTensions(options, insights) {
    const tensions = [];

    // 从博弈论洞察中提取
    const gameInsights = insights.filter(i => i.framework === '博弈论');
    if (gameInsights.length > 0) {
      tensions.push({
        type: 'strategic',
        label: '策略张力',
        text: '短期利益与长期关系之间的矛盾——这是所有社会博弈的核心张力。',
      });
    }

    // 从道德困境中提取
    const moralInsights = insights.filter(i => i.framework === '道德困境');
    if (moralInsights.length > 0) {
      tensions.push({
        type: 'moral',
        label: '道德张力',
        text: '做"对的事"和做"聪明的事"之间往往存在裂痕。这个裂痕就是你必须自己承受的代价。',
      });
    }

    // 从权力分析中提取
    const powerInsights = insights.filter(i => i.framework === '权力动力学');
    if (powerInsights.length > 0) {
      tensions.push({
        type: 'power',
        label: '权力张力',
        text: '维护尊严与保护安全之间的矛盾。在权力不对等时，"体面"本身就是一种奢侈品。',
      });
    }

    // 通用张力
    if (tensions.length === 0) {
      tensions.push({
        type: 'general',
        label: '行动张力',
        text: '做点什么的冲动 vs 什么都不做的安全。大部分决策焦虑来自这个根本矛盾。',
      });
    }

    return tensions;
  }

  /**
   * 生成分析总结
   */
  _generateSummary(scenario, ctx, options, tensions) {
    const bestOption = options[0];
    const parts = [];

    parts.push({
      label: '核心判断',
      content: bestOption
        ? `在当前情境下，"${bestOption.text}"是综合评分最高的选择。但评分不等于答案——它只是帮你看清每个选项在不同维度上的代价和收益。`
        : '没有完美的选项。每个选择都是一笔交易——你用某种确定的代价，换取某种不确定的可能。',
    });

    if (tensions.length > 0) {
      parts.push({
        label: '最该警惕的',
        content: tensions[0].text,
      });
    }

    parts.push({
      label: '元认知',
      content: '你现在的焦虑程度，和这件事的实际重要性，大概率不匹配。如果三年后的你回头看今天，你会怎么选？',
    });

    return parts;
  }
}


// ============================================================
//  第三层：专用分析器
//  针对特定场景的深度分析
// ============================================================

const Analyzers = {

  /**
   * 人物画像分析器
   * 根据行为描述生成多维度人物分析
   */
  characterProfile: {
    dimensions: [
      { id: 'power_seeking', label: '权力欲', low: '随遇而安', high: '控制欲强' },
      { id: 'empathy', label: '共情力', low: '自我中心', high: '换位思考' },
      { id: 'risk_tolerance', label: '风险偏好', low: '极度保守', high: '赌徒心态' },
      { id: 'authenticity', label: '真实度', low: '高度表演', high: '表里如一' },
      { id: 'strategic', label: '策略性', low: '直觉驱动', high: '深谋远虑' },
      { id: 'emotional', label: '情绪化', low: '极度理性', high: '情绪驱动' },
    ],

    analyze(behaviors) {
      // behaviors: [{ text, dimension, direction (-1 to 1) }]
      const scores = {};
      for (const dim of this.dimensions) {
        scores[dim.id] = 50; // 默认中位
      }

      for (const b of behaviors) {
        if (scores[b.dimension] !== undefined) {
          scores[b.dimension] = Math.max(0, Math.min(100,
            scores[b.dimension] + b.direction * 20
          ));
        }
      }

      return {
        scores,
        dimensions: this.dimensions,
        summary: this._generateSummary(scores),
      };
    },

    _generateSummary(scores) {
      const traits = [];
      if (scores.power_seeking > 70) traits.push('权力驱动型——ta的大部分行为都可以从"控制"的角度理解');
      if (scores.empathy < 30) traits.push('低共情——不要指望ta会主动理解你的感受');
      if (scores.strategic > 70) traits.push('高度策略性——ta的每个"无意之举"大概率都是有意为之');
      if (scores.authenticity < 30) traits.push('高度表演性——区分ta说了什么和ta做了什么');
      if (scores.emotional > 70) traits.push('情绪驱动——ta的决定更多由感受而非逻辑驱动');
      if (scores.risk_tolerance > 70) traits.push('高风险偏好——ta可能做出你意料之外的事');

      return traits.length > 0 ? traits.join('。') + '。' : '特征不够明显，需要更多行为数据。';
    },
  },

  /**
   * 关系动态分析器
   */
  relationshipDynamics: {
    analyze(relationship) {
      // relationship: { type, history_length, trust_level, power_balance, recent_events }
      const insights = [];

      if (relationship.trust_level === 'low' && relationship.history_length > 5) {
        insights.push('长期关系中的低信任度是一个严重信号——说明信任已经被反复消耗过。修复需要的不是一次道歉，而是持续的、可验证的行为改变。');
      }

      if (relationship.power_balance === 'asymmetric') {
        insights.push('权力不对等的关系中，弱势方的"自愿"往往不是真正的自愿。评估一个决定时，问自己："如果我有完全相同的权力，我还会这样选吗？"');
      }

      if (relationship.recent_events && relationship.recent_events.includes('conflict')) {
        insights.push('冲突后的冷静期比道歉更重要。在情绪高涨时做的修复尝试，往往会被解读为"操纵"而非"真诚"。');
      }

      return insights;
    },
  },

  /**
   * 决策分析器
   */
  decisionAnalysis: {
    analyze(decision) {
      // decision: { options, time_pressure, reversibility, information_completeness }
      const insights = [];

      if (decision.time_pressure === 'high') {
        insights.push('时间压力是理性决策的最大敌人。在高压下，大脑会切换到"直觉模式"——快速但容易出错。如果可能，哪怕多给自己10分钟，效果都会不同。');
      }

      if (decision.reversibility === 'low') {
        insights.push('不可逆决策需要更谨慎，但"过度谨慎"本身也是一种决策偏差。问自己：如果我不做这个决定，一年后我会后悔吗？');
      }

      if (decision.information_completeness === 'low') {
        insights.push('信息不完整时，不要追求"最优解"，而是追求"最不差的解"。在不确定性中，保守策略的期望值往往高于激进策略。');
      }

      return insights;
    },
  },
};


// ============================================================
//  导出
// ============================================================

window.AnalysisEngine = AnalysisEngine;
window.AnalysisFrameworks = Frameworks;
window.AnalysisAnalyzers = Analyzers;
