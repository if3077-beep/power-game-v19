# 渠道调性轴 · 重复游玩惊喜系统设计

- **日期**: 2026-07-30
- **作者**: 协同设计（用户 + 助手）
- **状态**: Draft（待用户审阅）
- **关联文件**: `M6-Mechanics.js`, `M3-Engine.js`, `M1-CSS.css`, `M4~M12-Data-*.js`, `evo-lite.js`, 新增 `M13-ChannelTint.js`

---

## 1. 背景与目标

### 1.1 问题陈述
当前游戏已有较丰富的重复游玩机制（残卷碎片、跨道路回响、textVariants 随机变体、结局分支），但存在三类"惊喜缺口"：

1. **textVariants 是纯随机**（[M6:1530-1533](file:///workspace/M6-Mechanics.js#L1530)），不响应玩家行为——玩两遍就能摸清边界，"换档玩感觉不一样"的惊喜不存在。
2. **跨道路回响失效**：`historyFlags` 在每次 `startGame` 被 `resetFlags()` 清空（[M6:1372](file:///workspace/M6-Mechanics.js#L1372)），`CrossPathGenerator` 的跨局回响设计意图无法实现。
3. **地基 bug**：主场景 `makeChoice` 不应用正 `channelEffect`（[M6:2536](file:///workspace/M6-Mechanics.js#L2536) 只走 `loseChannel`），导致"渠道"事实上只下行不上行——任何基于渠道的调性系统都会因此跛脚。

### 1.2 目标
建立**渠道调性轴**：同一章回，因玩家累积的 `state.channels` 数值不同，渲染出不同味道的文本/旁白/视觉调性。全 8 道路覆盖，性价比优先（一处引擎改动带全局生效）。

### 1.3 非目标
- 不引入 NG+ 元进度系统（跨局累积仅限修复 `historyFlags` 持久化，不新建元进度层）
- 不重写结局判定逻辑（调性轴只影响"过程文本"，不改结局分流）
- 不新增大量数据文本（L3 染色旁白每道路仅 2 段 ≤30 字，共 16 段）

---

## 2. 设计原则

1. **接通已有管道，不另起炉灶**：复用 `state.channels`、`scene.textVariants`、`scene.narratorVariants`、`scene-tone-X` CSS 体系。
2. **先修地基，再上特性**：bug 修复（0a/0b/0c）是特性的前置依赖。
3. **一处改动，全局生效**：L1/L2 改引擎选择逻辑，8 道路数据文件零改动。
4. **避免互斥覆盖**：applyHistoryEffects 的追加文本走独立字段，不进 textVariants 随机池。
5. **YAGNI**：不做渠道门控微事件（L4 推后），不做跨局元进度。

---

## 3. 架构概览

```
玩家选择 choice
  ├─ channelEffect > 0  ─→  state.channels += effect (clamp [0,8])   [0a 修复]
  ├─ channelEffect < 0  ─→  loseChannel()  (现有)
  └─ channelEffect = 0  ─→  无变化

renderScene(scene)
  ├─ maybeTriggerFragment()  (现有, 不动)
  ├─ applyHistoryEffects(rawScene)
  │    └─ 追加文本写入 scene._appendedText (新字段, 不污染 text)   [0b 修复]
  ├─ 选 textVariant (按渠道档)                                        [L1]
  │    ├─ channels ≤ 1  → variants[0]
  │    ├─ channels ≥ 6  → variants[末]
  │    └─ 中间档         → scene.text
  ├─ 选 narratorVariant (按渠道档)                                    [L2]
  │    ├─ channels ≤ 1  → variants[0]
  │    ├─ channels ≥ 6  → variants[末]
  │    └─ 中间档         → 30% 随机 (现有)
  ├─ 注入渠道染色旁白 (按渠道档, 从 M13-ChannelTint.js 取)            [L3]
  ├─ 渲染: scene.text + _appendedText + 染色旁白
  └─ setSceneTone() (现有, 不动)

startGame() / resetGameState()
  ├─ 从 localStorage 恢复跨局 historyFlags                            [0c 修复]
  └─ ...其余不变
```

---

## 4. 详细设计

### 4.1 阶段 0：地基修复（前置必做）

#### 4.1.1 [0a] 主场景 makeChoice 补正 channelEffect 分支

**位置**: [M6-Mechanics.js:2515-2536](file:///workspace/M6-Mechanics.js#L2515) 主场景 makeChoice

**现状**:
```js
if (!state.isHidden) {
  addDebt(choice.debtPhrase, choice.debtCategory, state.currentScene);
  if (choice.channelEffect < 0) loseChannel(choice.debtPhrase);  // 仅处理负数
}
```

**改为**:
```js
if (!state.isHidden) {
  addDebt(choice.debtPhrase, choice.debtCategory, state.currentScene);
  if (choice.channelEffect < 0) {
    loseChannel(choice.debtPhrase);
  } else if (choice.channelEffect > 0) {
    state.channels = Math.max(0, Math.min(8, state.channels + choice.channelEffect));
    renderChannels();
  }
}
```

**理由**: 与事件场景（[M6:5636](file:///workspace/M6-Mechanics.js#L5636)、[M6:6130](file:///workspace/M6-Mechanics.js#L6130)）的 clamp 范围对齐到 [0,8]，使渠道能上行下行，调性轴完整。

**风险**: 现有数据文件的 `channelEffect` 数值是基于"只扣不加"假设设计的。补正后，原本标 `channelEffect: 1` 的"守义"选择会真正加渠道。**这是预期行为**（守义应得渠道回报），但需在实施时抽样检查几条道路的 choice 数据，确认没有意外失衡（例如某道路全是 +1 会导致 channels 恒满档）。

**缓解**: 实施计划含"渠道数值平衡检查"任务，抽样 3-5 个场景跑通读测试。

#### 4.1.2 [0b] applyHistoryEffects 追加文本走独立字段

**位置**: [M6-Mechanics.js:469-542](file:///workspace/M6-Mechanics.js#L469) applyHistoryEffects + [M6-Mechanics.js:1527-1533](file:///workspace/M6-Mechanics.js#L1527) renderScene 调用点

**现状**: applyHistoryEffects 用 `modified.text += '\n\n...'` 追加文本，renderScene 再把含追加文本的 `scene.text` 与 `textVariants` 一起随机抽，导致 50% 概率丢失历史联动文本。

**改为**:
- applyHistoryEffects 不再 `modified.text +=`，改写入 `modified._appendedText`（新字段，字符串）
- renderScene 在选完 textVariant 后，把 `_appendedText` 拼到最终渲染文本末尾：
  ```js
  const finalText = scene.text + (scene._appendedText ? '\n\n' + scene._appendedText : '');
  ```
- 渲染层（narrative-core.js 或直接 innerHTML 赋值处）改为读 `finalText`

**理由**: 历史联动文本与变体文本正交——变体是"同一场景的不同味道"，追加是"上一选择在本场景的回响"，两者都应保留，不应互斥。

**兼容性**: `applyHistoryEffects` 当前只覆盖 whitehouse/ming 两条道路（调研发现），改动不影响其他道路。

#### 4.1.3 [0c] historyFlags 跨局持久化

**位置**: [M6-Mechanics.js:461-466](file:///workspace/M6-Mechanics.js#L461) historyFlags API + [M6:1372](file:///workspace/M6-Mechanics.js#L1372) startGame resetFlags 调用点

**现状**: `historyFlags = {}` 模块级变量，`resetFlags()` 每次清空，跨局丢失。

**改为**:
```js
const CROSS_PLAY_FLAGS_KEY = 'pg_crossPlayFlags_v1';
let historyFlags = loadCrossPlayFlags();

function loadCrossPlayFlags() {
  try {
    const raw = localStorage.getItem(CROSS_PLAY_FLAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function persistCrossPlayFlags() {
  try { localStorage.setItem(CROSS_PLAY_FLAGS_KEY, JSON.stringify(historyFlags)); }
  catch { /* 配额满或禁用, 静默降级 */ }
}
function setFlag(key, value) {
  historyFlags[key] = value;
  persistCrossPlayFlags();
}
function resetFlags() {
  // 跨局保留设计: 本函数不再清空 historyFlags。
  // 保留签名仅为兼容现有调用点(startGame 的调用已删除, 见 4.1.3)。
  // 误调用时打警告, 防止将来有人以为它能清空。
  console.warn('[historyFlags] resetFlags() is a no-op (cross-play persistence). Use clearCrossPlayFlags() for manual wipe.');
}
function clearCrossPlayFlags() {
  historyFlags = {};
  persistCrossPlayFlags();
}
```

**`resetFlags()` 在 startGame 的调用点处理**:
- [M6:1372](file:///workspace/M6-Mechanics.js#L1372) 的 `resetFlags()` 调用**删除**（跨局 flag 不应被清空）
- 若将来需要"开新档清空一切"，提供手动入口（如设置页按钮），不在 startGame 自动清

**理由**: `CrossPathGenerator` 设计意图就是跨道路回响（在 A 道路做的选择影响 B 道路），但 `resetFlags` 每局清空使其失效。修复后，玩家打通 A 道路后再玩 B 道路，会看到 A 的回响——这是高性价比的跨局惊喜。

**风险**: localStorage 可能在隐私模式下禁用，已用 try/catch 静默降级（功能不崩，只是不持久）。

**容量**: historyFlags 的 key 是 `choice.historyFlag` 字符串（如 `wh_chose_public_op`），单局可能积累 5-15 个 key，跨局叠加一年也就几百个，远低于 localStorage 5MB 上限。

---

### 4.2 阶段 L1：textVariants 渠道门控

**位置**: [M6-Mechanics.js:1530-1533](file:///workspace/M6-Mechanics.js#L1530)

**现状**:
```js
if (scene.textVariants && scene.textVariants.length > 0) {
  const allTexts = [scene.text, ...scene.textVariants];
  scene.text = allTexts[Math.floor(Math.random() * allTexts.length)];
}
```

**改为**:
```js
if (scene.textVariants && scene.textVariants.length > 0) {
  const ch = state.channels;
  let picked = scene.text; // 默认中档
  if (ch <= 1 && scene.textVariants.length >= 1) {
    picked = scene.textVariants[0];                              // 孤冷档
  } else if (ch >= 6 && scene.textVariants.length >= 2) {
    picked = scene.textVariants[scene.textVariants.length - 1];  // 壮烈档
  }
  // 中档(2-5) 或 variant 不足 → 保留默认 scene.text
  scene.text = picked;
}
```

**档位阈值理由**:
- `≤ 1`：调研确认渠道危机触发阈值就在 `channels <= 1`（[M6:2680](file:///workspace/M6-Mechanics.js#L2680) `state.channels <= 1 ? 0.6`），与"孤冷/危险"语义一致
- `≥ 6`：channels clamp 上限是 8（校准+事件），主场景补正后也能上行，6 是"明显高但不极端"的阈值，留出 7/8 的余量避免恒满档
- 中档 2-5：保留默认 text，让多数游玩走"原版"体验，惊喜来自"换档"

**variant 索引约定**:
- 现有数据约定 `textVariants[0]` 偏冷峻/代价感、`textVariants[末]` 偏壮烈/共鸣感——这是**现有数据的隐含模式**，本设计把它**显式化**为约定
- 实施时需抽样核验 8 道路的 variant 顺序是否符合此约定，不符合的个别 variant 在数据文件里调整顺序（不改文本，只调位置）

**全道路覆盖验证**: 调研显示 8 道路均有 textVariants（仙剑14、非洲/3077各10、大明/白宫9、AI8、混沌3、韩国2）。韩国只有 2 个 variant，符合"低/高"两档；混沌 3 个，符合"低/中/高"——本设计的"中档走默认 text"在混沌道路会与 variants[1] 略有差异，可接受。

---

### 4.3 阶段 L2：narratorVariants 渠道门控

**位置**: [M6-Mechanics.js:1535-1537](file:///workspace/M6-Mechanics.js#L1535)

**现状**:
```js
if (scene.narratorVariants && scene.narratorVariants.length > 0 && Math.random() < 0.3) {
  scene.narrator = scene.narratorVariants[Math.floor(Math.random() * scene.narratorVariants.length)];
}
```

**改为**:
```js
if (scene.narratorVariants && scene.narratorVariants.length > 0) {
  const ch = state.channels;
  if (ch <= 1 && scene.narratorVariants.length >= 1) {
    scene.narrator = scene.narratorVariants[0];                              // 孤冷档强制
  } else if (ch >= 6 && scene.narratorVariants.length >= 2) {
    scene.narrator = scene.narratorVariants[scene.narratorVariants.length - 1]; // 壮烈档强制
  } else if (Math.random() < 0.3) {
    scene.narrator = scene.narratorVariants[Math.floor(Math.random() * scene.narratorVariants.length)]; // 中档保留30%随机
  }
}
```

**理由**: narrator 是"判定理念"旁白，低档时应强制冷峻版（强化孤冷感），高档时强制壮烈版（强化共鸣感），中档保留原有 30% 随机惊喜。

---

### 4.4 阶段 L3：渠道染色旁白（新文件 M13-ChannelTint.js）

**新增文件**: `/workspace/M13-ChannelTint.js`

**结构**:
```js
// M13: 渠道调性染色旁白 —— 按渠道档在场景顶部注入 ≤30 字氛围短句
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
  cyber: {   // 注: 3077 道路 key 为 'cyber'(见 M9-Data-3077.js / M6 recordLabels)
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
```

**调用点**: renderScene 在渲染场景顶部（章节标题之后、scene.text 之前）注入。
渲染节点需在实施时核实（spec 阶段未读取 narrative-core.js 的具体 DOM 结构），伪代码：
```js
const tint = getChannelTint(state.scenario, state.channels);
if (tint) {
  // 实施时核实: 找到章节标题与 scene.text 之间的渲染节点, 注入 <p class="channel-tint">
  // 候选: narrative-core.js 的场景渲染函数, 或 renderScene 里直接 innerHTML 拼接处
  const tintEl = document.createElement('p');
  tintEl.className = 'channel-tint';
  tintEl.textContent = tint;
  // 插入到章节标题元素之后、场景正文元素之前
}
```

**CSS（M1-CSS.css 追加）**:
```css
.channel-tint{
  font-style:italic;
  color:var(--text-dim, #8a8a8a);
  opacity:0.7;
  letter-spacing:0.04em;
  margin:0.4em 0 0.8em;
  border-left:2px solid rgba(201,169,110,0.3);
  padding-left:0.8em;
}
```

**文本量**: 8 道路 × 2 段 = 16 段，每段 ≤30 字，总计约 400 字。集中在一个文件，便于维护与调整。

**语义约束**: 染色旁白是"氛围层"，不携带选择/后果/debt，纯渲染，不进 state。低档与高档的旁白在语义上应与该道路的世界观契合（仙剑讲剑、白宫讲情报、大明讲官场等）。

---

## 5. 数据流

### 5.1 单场景渲染流程（修订后）

```
renderScene(sceneIdx)
  ├─ maybeTriggerFragment() → 命中则 return
  ├─ setSceneTone('normal')
  ├─ rawScene = scenarios[scenario].scenes[sceneIdx]
  ├─ scene = applyHistoryEffects(rawScene, scenario)
  │    └─ 写入 scene._appendedText (不污染 scene.text)        [0b]
  ├─ textVariant 选择(按渠道档)                                 [L1]
  │    └─ scene.text = picked variant 或 默认
  ├─ narratorVariant 选择(按渠道档)                             [L2]
  │    └─ scene.narrator = picked variant 或 原值或30%随机
  ├─ 渲染章节标题
  ├─ 渲染渠道染色旁白(若渠道档命中)                             [L3]
  │    └─ <p class="channel-tint">...</p>
  ├─ 渲染 scene.text + _appendedText                            [0b]
  ├─ 渲染 scene.narrator
  ├─ 渲染 choices
  └─ 章节色调 chap-X (现有, 不动)
```

### 5.2 渠道数值生命周期（修订后）

```
startGame()
  ├─ state.channels = 5 (默认) 或 5 + chBonus (校准)
  └─ 范围 [5, 8]

主场景 makeChoice(choice)
  ├─ choice.channelEffect < 0 → loseChannel() → channels-- (下限0)
  ├─ choice.channelEffect > 0 → channels += effect (clamp [0,8])  [0a 新增]
  └─ choice.channelEffect = 0 → 无变化

事件场景(奇遇/危机/圆满/校准/支线) makeChoice(choice)
  └─ 现有逻辑, clamp [0,5] 或 [0,8] (不统一, 但不在本设计范围)

渠道危机触发判定
  └─ channels <= 1 → 60% 触发危机 (现有, 不动)

调性档判定
  ├─ channels <= 1 → 孤冷档(L1/L2/L3 强制冷峻)
  ├─ channels >= 6 → 壮烈档(L1/L2/L3 强制壮烈)
  └─ 2-5         → 中档(默认文本, L2 保留30%随机)
```

---

## 6. 错误处理

| 场景 | 处理 |
|---|---|
| `localStorage` 禁用/配额满 | try/catch 静默降级，`historyFlags` 退回内存态（跨局失效但不崩） |
| `textVariants` 为空或长度不足 | 退回默认 `scene.text`（已在 L1 逻辑里处理） |
| `narratorVariants` 为空或长度不足 | 退回原 `scene.narrator`（已在 L2 逻辑里处理） |
| `ChannelTint[scenarioKey]` 不存在 | `getChannelTint` 返回 null，不注入染色（已在 L3 逻辑里处理） |
| `applyHistoryEffects` 对某道路无分支 | `scene._appendedText` 为 undefined，拼接时跳过（已在 0b 逻辑里处理） |
| 主场景 choice 无 `channelEffect` 字段 | `choice.channelEffect` 为 undefined，`< 0` / `> 0` 均 false，走"无变化"分支（安全） |

---

## 7. 测试策略

### 7.1 单元验证（手动，无测试框架）
- L1：构造一个 channels=1 的 state，断言 `scene.text === scene.textVariants[0]`
- L1：构造 channels=6，断言 `scene.text === variants[末]`
- L1：构造 channels=3，断言 `scene.text === scene.text`（默认）
- L2：同上三档对 narrator 断言
- L3：`getChannelTint('xianjian', 1)` 返回低档文本；`getChannelTint('xianjian', 6)` 返回高档文本；`getChannelTint('xianjian', 3)` 返回 null
- 0a：choice.channelEffect=1 时，调用后 `state.channels` 增加
- 0b：applyHistoryEffects 后 `scene._appendedText` 有值且 `scene.text` 未被追加污染
- 0c：setFlag 后刷新页面（模拟跨局），historyFlags 仍存在

### 7.2 浏览器手测（每道路）
- 玩仙剑道路，刻意做扣渠道选择 → 第二章后 channels ≤ 1 → 观察第三章 text 是否为 variants[0]、narrator 是否为冷峻版、是否有染色旁白
- 玩仙剑道路，刻意做加渠道选择（依赖 0a）→ 第六章后 channels ≥ 6 → 观察第七章 text/narrator/染色是否为壮烈版
- 玩白宫道路打通 → 玩大明道路 → 观察是否出现 CrossPathGenerator 跨道路回响事件（验证 0c）

### 7.3 渠道数值平衡检查
- 通读 8 道路数据文件，统计每道路每场景的 choice.channelEffect 分布
- 检查是否存在"全 +1"或"全 -1"的极端场景（会导致恒满档或恒空档）
- 必要时在数据文件调整个别 choice 的 channelEffect 数值（不改文本）

---

## 8. 实施顺序与依赖

```
[0a] 补正 channelEffect 分支   ─┐
[0b] applyHistoryEffects 独立字段 ─┼─ 无相互依赖, 可并行
[0c] historyFlags 跨局持久化    ─┘

[L1] textVariants 渠道门控     ── 依赖 [0a](高档可达) + [0b](不被覆盖)
[L2] narratorVariants 渠道门控 ── 依赖 [0a]
[L3] M13-ChannelTint.js + CSS  ── 依赖 [0a]

[平衡检查] ── 依赖 [0a][L1][L2][L3] 全部完成
[浏览器手测] ── 依赖全部完成
```

---

## 9. 范围外（明确不做）

- NG+ 元进度系统（跨局累积 channels/属性）
- 渠道门控微事件（原方案 L4，推后到下一轮）
- 跨局总真结局（需多局打通多道路才解锁）
- 结局判定逻辑改动
- applyHistoryEffects 扩展到其他 6 条道路（仅修 0b 的字段分离，不新增分支）
- channels clamp 范围统一化（0a 已对齐主场景到 [0,8]；事件场景的 [0,5] 与 [0,8] 并存现状不在本设计范围，保持原样）

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 0a 补正后渠道数值失衡（某道路恒满档） | 中 | 调性轴失效（恒高档） | 实施计划含"平衡检查"任务，必要时调数据 |
| 现有 textVariants 顺序不符合"低/高"约定 | 中 | L1 选错档 | 实施时抽样核验，不符合则调数据文件 variant 顺序（不改文本） |
| localStorage 跨域/隐私模式禁用 | 低 | 0c 退回内存态，跨局失效但不崩 | try/catch 静默降级 |
| 0b 改动影响 whitehouse/ming 现有联动 | 低 | 联动文本位置变化（从 text 内移到末尾） | 手测这两条道路的联动场景 |
| 用户不希望某些 choice 加渠道（设计原意是"守义不应得渠道"） | 低 | 语义变化 | 实施前抽样与用户确认 3-5 个典型 choice |

---

## 11. 开放问题（实施前需确认）

1. **textVariants 顺序约定核验**：需在实施时打开 8 个数据文件，逐一确认 variants[0] 偏冷峻、variants[末] 偏壮烈。若不符合，是调整 variant 顺序（不改文本）还是改 L1 的索引策略？（默认：调顺序）
2. **0a 的 choice 抽样确认**：补正前是否要与用户确认 3-5 个典型 choice 的 channelEffect 语义？（如"护下剑"channelEffect:1 是否应该加渠道）
3. **L3 渲染节点核实**：实施时需读 narrative-core.js 的场景渲染函数，确认 `.channel-tint` 元素插入到章节标题与 scene.text 之间的正确 DOM 节点（spec 阶段未读，伪代码待落实）

---

## 12. 验收标准

- [ ] 0a：主场景做 channelEffect>0 的选择后，state.channels 增加，renderChannels 反映变化
- [ ] 0b：applyHistoryEffects 追加的文本在 textVariants 命中时仍保留（渲染在 scene.text 末尾）
- [ ] 0c：打通 A 道路后刷新页面玩 B 道路，B 道路出现 A 的跨道路回响事件
- [ ] L1：channels≤1 时 scene.text 为 variants[0]；channels≥6 时为 variants[末]；中档为默认
- [ ] L2：同 L1 三档对 narrator 的断言
- [ ] L3：channels≤1 或 ≥6 时场景顶部出现染色旁白；中档不出现
- [ ] 8 道路均通过浏览器手测（低/高/中三档各跑一次关键场景）
- [ ] 无回归：现有残卷、结局判定、章节色调、渠道危机触发均正常
