// ============================================================
//  M13: 渠道调性染色旁白 —— 按渠道档在场景顶部注入 ≤30 字氛围短句
//  V21 R1 — 配合 L1/L2 渠道门控,强化"换档玩感觉不一样"的惊喜
// ============================================================

const ChannelTint = {
  whitehouse: {
    low:  '情报线沉默得像停电的深夜。',
    high: '六部门的电话同时在你的桌上响。'
  },
  ming: {
    low:  '县衙的更鼓敲得人心慌。',
    high: '京里的邸报一式三份送到你案头。'
  },
  ai: {
    low:  '协调官终端的指示灯,只剩一颗还亮。',
    high: '三十六个数据中心的绿灯同时跳了一下。'
  },
  africa: {
    low:  '草原的风停了,连兽群都不叫。',
    high: '地平线上同时升起七处篝火。'
  },
  xianjian: {
    low:  '魔剑在鞘里安静得不像话。',
    high: '六界的风都在替你压着剑。'
  },
  chaos: {
    low:  '裂隙的边缘,连时间都在犹豫。',
    high: '时空的断层同时向七个方向张开。'
  },
  korea: {
    low:  '首尔的地铁末班车,空得只剩你。',
    high: '江南三栋写字楼的灯,同时为你亮着。'
  },
  cyber: {
    low:  '脑机接口的信号,只剩底噪。',
    high: '十二个节点的带宽同时向你倾斜。'
  }
};

function getChannelTint(scenarioKey, channels) {
  const tints = ChannelTint[scenarioKey];
  if (!tints) return null;
  if (channels <= 1) return tints.low;
  if (channels >= 6) return tints.high;
  return null; // 中档不注入
}

// 暴露到全局(沿用项目现有模式)
if (typeof window !== 'undefined') {
  window.ChannelTint = ChannelTint;
  window.getChannelTint = getChannelTint;
}
