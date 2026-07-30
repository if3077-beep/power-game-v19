# 渠道调性轴 · 重复游玩惊喜系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 3 个地基 bug（正 channelEffect 不生效 / historyFlags 跨局丢失 / applyHistoryEffects 与 textVariants 互斥覆盖）并建立渠道调性轴（textVariants/narratorVariants 按渠道档选择 + 染色旁白），全 8 道路覆盖。

**Architecture:** 引擎层集中在 M6-Mechanics.js 改 4 处（makeChoice 补正分支、applyHistoryEffects 独立字段、textVariants/narratorVariants 渠道门控、historyFlags localStorage 持久化）；新增 M13-ChannelTint.js 提供 8 道路染色旁白数据 + getter；M1-CSS.css 加 `.channel-tint` 样式；renderScene 注入染色 DOM 节点。8 道路数据文件零改动（除非平衡检查发现极端数值）。

**Tech Stack:** 原生 JS（无构建工具）、浏览器 localStorage、CSS 变量。无测试框架，采用浏览器手测 + node --check 语法校验。

**关联 Spec:** [docs/superpowers/specs/2026-07-30-channel-tone-axis-design.md](file:///workspace/docs/superpowers/specs/2026-07-30-channel-tone-axis-design.md)

---

## 文件结构

| 文件 | 责任 | 改动类型 |
|---|---|---|
| `M6-Mechanics.js` | 引擎核心：makeChoice、applyHistoryEffects、renderScene、historyFlags API | 修改 4 处 |
| `M13-ChannelTint.js` | 渠道染色旁白数据 + getter | 新建 |
| `M1-CSS.css` | `.channel-tint` 样式 | 追加 |
| `index.html` | 引入 M13 脚本 | 追加 1 行 |
| `M4~M12-Data-*.js` | 8 道路数据（仅在平衡检查发现极端时改 channelEffect 数值） | 可能微调 |

---

## Task 1: [0a] 主场景 makeChoice 补正 channelEffect 正数分支

**Files:**
- Modify: `M6-Mechanics.js:2530-2536`（主场景 makeChoice 的 channelEffect 处理块）

- [ ] **Step 1: 读取现状**

读取 `M6-Mechanics.js:2515-2540`，确认当前代码为：
```js
if (!state.isHidden) {
  addDebt(choice.debtPhrase, choice.debtCategory, state.currentScene);
  if (choice.channelEffect < 0) loseChannel(choice.debtPhrase);
}
```

- [ ] **Step 2: 修改为补正分支**

用 Edit 工具将上述块替换为：
```js
if (!state.isHidden) {
  addDebt(choice.debtPhrase, choice.debtCategory, state.currentScene);
  if (choice.channelEffect < 0) {
    loseChannel(choice.debtPhrase);
  } else if (choice.channelEffect > 0) {
    // V21: 补正正数分支——此前主场景只扣不加,导致渠道恒下行,调性轴无法上行
    state.channels = Math.max(0, Math.min(8, state.channels + choice.channelEffect));
    renderChannels();
  }
}
```

- [ ] **Step 3: 语法校验**

Run: `node --check M6-Mechanics.js`
Expected: 无输出（语法 OK）

- [ ] **Step 4: 提交**

```bash
git add M6-Mechanics.js
git -c user.name="if3077-beep" -c user.email="if3077-beep@users.noreply.github.com" commit -m "fix(mechanics): [0a] 主场景 makeChoice 补正 channelEffect 正数分支

此前主场景只处理负 channelEffect(走 loseChannel),正数被静默忽略,
导致渠道恒下行、调性轴无法上行。补正为对称分支,clamp [0,8],
与事件场景对齐。"
```

---

## Task 2: [0b] applyHistoryEffects 追加文本走独立字段

**Files:**
- Modify: `M6-Mechanics.js:469-542`（applyHistoryEffects 函数体）
- Modify: `M6-Mechanics.js:1527-1533`（renderScene 调用点 + textVariants 选择）
- Modify: `M6-Mechanics.js:1578-1602`（renderScene 渲染 sceneText）

- [ ] **Step 1: 读取 applyHistoryEffects 现状**

读取 `M6-Mechanics.js:469-542`，找出所有 `modified.text +=` 语句。预期在 whitehouse/ming 分支里有多处，形如：
```js
if (hasFlag('wh_chose_public_op') && modified.title === '媒体风暴') {
  modified.text += '\n\n你想起了上次因为民意而搁置情报的事...';
}
```

- [ ] **Step 2: 把所有 `modified.text +=` 改为 `modified._appendedText`**

用 Edit 工具（replace_all 无法用，需逐处 Edit）把每处：
```js
modified.text += '\n\n某文本';
```
改为：
```js
modified._appendedText = (modified._appendedText ? modified._appendedText + '\n\n' : '') + '某文本';
```

注意：保留每处的 `if` 条件与文本内容，只改赋值目标与拼接方式。

- [ ] **Step 3: 在 renderScene 选完 textVariant 后拼接 _appendedText**

读取 `M6-Mechanics.js:1527-1537`，当前为：
```js
const scene = applyHistoryEffects(rawScene, state.scenario);

// 随机文本变体（每次游玩不同）
if (scene.textVariants && scene.textVariants.length > 0) {
  const allTexts = [scene.text, ...scene.textVariants];
  scene.text = allTexts[Math.floor(Math.random() * allTexts.length)];
}
```

用 Edit 改为（注意：此处先只加 _appendedText 拼接，textVariants 选择逻辑留到 Task 4 的 L1 改）：
```js
const scene = applyHistoryEffects(rawScene, state.scenario);

// 随机文本变体（每次游玩不同）
if (scene.textVariants && scene.textVariants.length > 0) {
  const allTexts = [scene.text, ...scene.textVariants];
  scene.text = allTexts[Math.floor(Math.random() * allTexts.length)];
}

// V21 [0b]: applyHistoryEffects 的追加文本走独立字段,不进 textVariants 随机池
// 避免历史联动文本与变体文本互斥覆盖(此前 50% 概率丢失联动)
if (scene._appendedText) {
  scene.text = scene.text + '\n\n' + scene._appendedText;
}
```

- [ ] **Step 4: 语法校验**

Run: `node --check M6-Mechanics.js`
Expected: 无输出

- [ ] **Step 5: 浏览器手测 whitehouse 道路联动**

启动本地服务器（若未启动）：`python3 -m http.server 8000`
浏览器打开 `http://localhost:8000/`，选白宫道路：
- 第一章选"公开操作"类选项（设置 `wh_chose_public_op` flag）
- 进入"媒体风暴"场景，确认正文末尾出现"你想起了上次因为民意而搁置情报的事..."
- 反复刷新进入该场景多次，确认追加文本**每次都出现**（不再 50% 丢失）

- [ ] **Step 6: 提交**

```bash
git add M6-Mechanics.js
git -c user.name="if3077-beep" -c user.email="if3077-beep@users.noreply.github.com" commit -m "fix(mechanics): [0b] applyHistoryEffects 追加文本走独立字段

此前 modified.text += 追加的文本与 textVariants 一起进随机池,
50% 概率被变体覆盖丢失。改为写入 _appendedText 字段,renderScene
选完变体后拼接,确保历史联动文本始终保留。"
```

---

## Task 3: [0c] historyFlags 跨局持久化（localStorage）

**Files:**
- Modify: `M6-Mechanics.js:461-466`（historyFlags API 定义）
- Modify: `M6-Mechanics.js:1372`（startGame 里的 resetFlags 调用）

- [ ] **Step 1: 读取现状**

读取 `M6-Mechanics.js:461-466`：
```js
let historyFlags = {};
function setFlag(key, value) { historyFlags[key] = value; }
function hasFlag(key) { return !!historyFlags[key]; }
function getFlag(key) { return historyFlags[key]; }
function resetFlags() { historyFlags = {}; }
```

- [ ] **Step 2: 替换为 localStorage 持久化版本**

用 Edit 替换为：
```js
// V21 [0c]: historyFlags 跨局持久化——修复 CrossPathGenerator 跨道路回响失效
const CROSS_PLAY_FLAGS_KEY = 'pg_crossPlayFlags_v1';
let historyFlags = loadCrossPlayFlags();

function loadCrossPlayFlags() {
  try {
    const raw = localStorage.getItem(CROSS_PLAY_FLAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function persistCrossPlayFlags() {
  try { localStorage.setItem(CROSS_PLAY_FLAGS_KEY, JSON.stringify(historyFlags)); }
  catch (e) { /* 配额满或禁用, 静默降级为内存态 */ }
}
function setFlag(key, value) {
  historyFlags[key] = value;
  persistCrossPlayFlags();
}
function hasFlag(key) { return !!historyFlags[key]; }
function getFlag(key) { return historyFlags[key]; }
function resetFlags() {
  // 跨局保留设计: 不再清空。保留签名兼容现有调用点(startGame 的调用已删除)。
  // 误调用时打警告。
  console.warn('[historyFlags] resetFlags() is a no-op (cross-play persistence). Use clearCrossPlayFlags() for manual wipe.');
}
function clearCrossPlayFlags() {
  historyFlags = {};
  persistCrossPlayFlags();
}
```

- [ ] **Step 3: 删除 startGame 里的 resetFlags 调用**

读取 `M6-Mechanics.js:1370-1375`，找到 `resetFlags();` 调用（在 startGame 函数体开头附近）。

用 Edit 把 `resetFlags();` 这一行删除（保留前后行）。

- [ ] **Step 4: 语法校验**

Run: `node --check M6-Mechanics.js`
Expected: 无输出

- [ ] **Step 5: 浏览器手测跨局回响**

浏览器打开游戏：
- 玩白宫道路，第一章选设置 `wh_chose_public_op` 的选项
- 打通或退出，**刷新页面**
- 玩大明道路，进入场景后观察是否出现 CrossPathGenerator 跨道路回响事件（"来自远方的回响"类）
- 打开 DevTools Console，输入 `localStorage.getItem('pg_crossPlayFlags_v1')`，确认有 `wh_chose_public_op: true`

- [ ] **Step 6: 提交**

```bash
git add M6-Mechanics.js
git -c user.name="if3077-beep" -c user.email="if3077-beep@users.noreply.github.com" commit -m "fix(mechanics): [0c] historyFlags 跨局持久化(localStorage)

此前 resetFlags() 每局清空 historyFlags,导致 CrossPathGenerator
跨道路回响设计意图失效。改为 localStorage 持久化,startGame 不再
清空。resetFlags 保留签名但改 no-op+警告,新增 clearCrossPlayFlags
供手动清空。"
```

---

## Task 4: [L1] textVariants 按渠道档选择

**Files:**
- Modify: `M6-Mechanics.js:1530-1533`（textVariants 选择逻辑，注意 Task 2 已在此处加了 _appendedText 拼接，需保留）

- [ ] **Step 1: 读取现状（Task 2 后的状态）**

读取 `M6-Mechanics.js:1527-1540`，确认当前为：
```js
const scene = applyHistoryEffects(rawScene, state.scenario);

// 随机文本变体（每次游玩不同）
if (scene.textVariants && scene.textVariants.length > 0) {
  const allTexts = [scene.text, ...scene.textVariants];
  scene.text = allTexts[Math.floor(Math.random() * allTexts.length)];
}

// V21 [0b]: applyHistoryEffects 的追加文本走独立字段...
if (scene._appendedText) {
  scene.text = scene.text + '\n\n' + scene._appendedText;
}
```

- [ ] **Step 2: 替换 textVariants 选择逻辑为渠道门控**

用 Edit 把 `if (scene.textVariants && scene.textVariants.length > 0) { ... }` 块替换为：
```js
// V21 [L1]: textVariants 按渠道档选择——低档冷峻/高档壮烈/中档默认
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

保留紧随其后的 `_appendedText` 拼接块不动。

- [ ] **Step 3: 语法校验**

Run: `node --check M6-Mechanics.js`
Expected: 无输出

- [ ] **Step 4: 浏览器手测仙剑低档**

浏览器打开游戏，选仙剑道路：
- 刻意做扣渠道选择（第一章选"把剑还给唐门"channelEffect:-1，后续选负 channelEffect 选项）
- 进入第三章（锁妖塔崩塌），确认 scene.text 是 `textVariants[0]`（"塔崩那一刻,魔剑猛地出鞘..."），不是默认 text（"夜里你睡不着..."）
- 打开 DevTools Console，输入 `state.channels` 确认 ≤ 1

- [ ] **Step 5: 浏览器手测仙剑高档**

新开一局仙剑道路：
- 刻意做加渠道选择（第一章选"护下剑"channelEffect:1，依赖 Task 1 的 0a 修复，后续选正 channelEffect 选项）
- 进入后期场景（第五章或之后），当 `state.channels >= 6` 时，确认 scene.text 是 `textVariants[末]`
- 若整局渠道上不到 6，记录下来，留待 Task 7 平衡检查处理

- [ ] **Step 6: 提交**

```bash
git add M6-Mechanics.js
git -c user.name="if3077-beep" -c user.email="if3077-beep@users.noreply.github.com" commit -m "feat(mechanics): [L1] textVariants 按渠道档选择

此前 textVariants 是纯随机(含默认 text 一起抽),不响应玩家行为。
改为按 state.channels 档位选择: ≤1 取 variants[0](孤冷档),
≥6 取 variants[末](壮烈档), 中档保留默认 text。一处改动 8 道路全生效。"
```

---

## Task 5: [L2] narratorVariants 按渠道档选择

**Files:**
- Modify: `M6-Mechanics.js:1535-1537`（narratorVariants 选择逻辑）

- [ ] **Step 1: 读取现状**

读取 `M6-Mechanics.js:1535-1537`（Task 4 后行号可能下移几行，按内容定位）：
```js
// V14.3: narratorVariants 30%概率替换（判定理念不每次都出现）
if (scene.narratorVariants && scene.narratorVariants.length > 0 && Math.random() < 0.3) {
  scene.narrator = scene.narratorVariants[Math.floor(Math.random() * scene.narratorVariants.length)];
}
```

- [ ] **Step 2: 替换为渠道门控**

用 Edit 替换为：
```js
// V21 [L2]: narratorVariants 按渠道档选择——低/高档强制,中档保留30%随机
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

- [ ] **Step 3: 语法校验**

Run: `node --check M6-Mechanics.js`
Expected: 无输出

- [ ] **Step 4: 浏览器手测仙剑低/高档 narrator**

复用 Task 4 的两局存档思路：
- 低档局（channels ≤ 1）进入第三章，确认 narrator 是 `narratorVariants[0]`（"判定理念:这一章测的是..."）
- 高档局（channels ≥ 6）进入第三章，确认 narrator 是 `narratorVariants[末]`（"冒险札记:千年等成两个人..."）

- [ ] **Step 5: 提交**

```bash
git add M6-Mechanics.js
git -c user.name="if3077-beep" -c user.email="if3077-beep@users.noreply.github.com" commit -m "feat(mechanics): [L2] narratorVariants 按渠道档选择

此前 narratorVariants 30% 随机替换。改为低/高档强制选对应 variant,
中档保留 30% 随机。与 L1 同档位逻辑,强化调性轴一致性。"
```

---

## Task 6: [L3] 新建 M13-ChannelTint.js + CSS + 渲染注入

**Files:**
- Create: `M13-ChannelTint.js`
- Modify: `M1-CSS.css`（追加 `.channel-tint` 样式）
- Modify: `index.html`（引入 M13 脚本）
- Modify: `M6-Mechanics.js:1578-1583`（renderScene 的 container.innerHTML 结构）+ `M6-Mechanics.js:1598-1610`（渲染时序）

- [ ] **Step 1: 新建 M13-ChannelTint.js**

用 Write 工具创建 `/workspace/M13-ChannelTint.js`，内容：
```js
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
```

- [ ] **Step 2: 语法校验**

Run: `node --check M13-ChannelTint.js`
Expected: 无输出

- [ ] **Step 3: 在 index.html 引入 M13 脚本**

读取 `index.html`，找到 M12 脚本引入行（形如 `<script src="M12-Data-Xianjian.js"></script>`）。

用 Edit 在 M12 引入行之后追加：
```html
<script src="M13-ChannelTint.js"></script>
```

- [ ] **Step 4: 在 M1-CSS.css 追加 .channel-tint 样式**

读取 `M1-CSS.css` 末尾，用 Edit 在文件末尾追加：
```css

/* V21 [L3]: 渠道调性染色旁白 —— 低饱和度+斜体,氛围层 */
.channel-tint{
  font-style:italic;
  color:var(--text-dim, #8a8a8a);
  opacity:0.7;
  letter-spacing:0.04em;
  margin:0.4em 0 0.8em;
  border-left:2px solid rgba(201,169,110,0.3);
  padding-left:0.8em;
  font-size:0.85rem;
}
```

- [ ] **Step 5: 在 renderScene 的 container.innerHTML 加染色节点**

读取 `M6-Mechanics.js:1578-1583`（Task 5 后行号可能下移，按内容定位），当前为：
```js
container.innerHTML = `
  <div class="scene-chapter" id="sceneChapter">${scene.chapter} · ${scene.title}</div>
  <div class="scene-text" id="sceneText"></div>
  <div class="scene-narrator" id="sceneNarrator"></div>
  <div class="choices-container" id="choicesContainer"></div>
`;
```

用 Edit 改为（在 sceneChapter 与 sceneText 之间插入 sceneTint 节点）：
```js
container.innerHTML = `
  <div class="scene-chapter" id="sceneChapter">${scene.chapter} · ${scene.title}</div>
  <div class="channel-tint" id="sceneTint"></div>
  <div class="scene-text" id="sceneText"></div>
  <div class="scene-narrator" id="sceneNarrator"></div>
  <div class="choices-container" id="choicesContainer"></div>
`;
```

- [ ] **Step 6: 在渲染时序里填充 sceneTint 内容**

读取 `M6-Mechanics.js:1585-1610`（渲染时序代码），在 `const narratorEl = document.getElementById('sceneNarrator');` 之后，用 Edit 追加：
```js
const tintEl = document.getElementById('sceneTint');
```

然后在 `chapterEl` 入场动画的 setTimeout 块里（`setTimeout(() => { chapterEl.style.opacity = '1'; ... }, 100);`），用 Edit 在该 setTimeout 回调末尾追加：
```js
    // V21 [L3]: 渠道染色旁白注入(与章节标题同步入场)
    if (typeof getChannelTint === 'function') {
      const tint = getChannelTint(state.scenario, state.channels);
      if (tint && tintEl) {
        tintEl.textContent = tint;
        tintEl.style.opacity = '1';
        tintEl.style.transform = 'translateY(0)';
        tintEl.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      }
    }
```

- [ ] **Step 7: 语法校验**

Run: `node --check M6-Mechanics.js && node --check M13-ChannelTint.js`
Expected: 无输出

- [ ] **Step 8: 浏览器手测染色旁白**

浏览器打开游戏：
- 仙剑低档局（channels ≤ 1）：进入任意场景，确认章节标题下方出现斜体灰色旁白"魔剑在鞘里安静得不像话。"
- 仙剑高档局（channels ≥ 6）：确认出现"六界的风都在替你压着剑。"
- 中档局（channels 2-5）：确认不出现染色旁白（节点为空）
- 切换到白宫道路低档局：确认出现"情报线沉默得像停电的深夜。"（验证道路切换）

- [ ] **Step 9: 提交**

```bash
git add M13-ChannelTint.js M1-CSS.css index.html M6-Mechanics.js
git -c user.name="if3077-beep" -c user.email="if3077-beep@users.noreply.github.com" commit -m "feat(channel-tint): [L3] 新增渠道染色旁白(M13) + CSS + 渲染注入

新建 M13-ChannelTint.js,8 道路各 low/high 两段 ≤30 字氛围旁白。
renderScene 在章节标题与正文之间插入 .channel-tint 节点,按渠道档
(≤1/≥6)注入,中档不注入。CSS 给斜体+低饱和度+左侧描边。"
```

---

## Task 7: 渠道数值平衡检查 + textVariants 顺序核验

**Files:**
- 可能 Modify: `M4~M12-Data-*.js`（仅在发现极端数值或顺序不符时）

- [ ] **Step 1: 统计 8 道路 channelEffect 分布**

Run（在 /workspace 下）：
```bash
python3 -c "
import re, os
files = ['M4-Data-WhiteHouse.js','M5-Data-Ming.js','M7-Data-AI.js','M8-Data-Africa.js','M9-Data-3077.js','M10-Data-Korea.js','M11-Data-Chaos.js','M12-Data-Xianjian.js']
for f in files:
    src = open(f, encoding='utf-8').read()
    effs = [int(x) for x in re.findall(r'channelEffect:\s*(-?\d+)', src)]
    pos = sum(1 for e in effs if e > 0)
    neg = sum(1 for e in effs if e < 0)
    zero = sum(1 for e in effs if e == 0)
    print(f'{f}: total={len(effs)} pos={pos} neg={neg} zero={zero} min={min(effs)} max={max(effs)}')
"
```
Expected: 输出 8 行统计。检查是否有道路 `pos=0`（无法上行到高档）或 `neg=0`（无法下行到低档）。

- [ ] **Step 2: 抽样核验 textVariants 顺序约定**

Run：
```bash
python3 -c "
import re
files = ['M4-Data-WhiteHouse.js','M5-Data-Ming.js','M7-Data-AI.js','M8-Data-Africa.js','M9-Data-3077.js','M10-Data-Korea.js','M11-Data-Chaos.js','M12-Data-Xianjian.js']
for f in files:
    src = open(f, encoding='utf-8').read()
    # 抓每个 textVariants 块的第一个 variant
    matches = re.findall(r'textVariants:\s*\[\s*\'([^\']{0,60})', src)
    print(f'=== {f} (共{len(matches)}处 textVariants) ===')
    for i, m in enumerate(matches[:3]):  # 每文件只看前3个
        print(f'  [{i}] {m}...')
"
```
Expected: 输出每道路前 3 个 textVariants[0] 的开头。人工判断是否偏冷峻/代价感。若某道路明显不符，记录下来。

- [ ] **Step 3: 处理发现的极端数值（若有）**

根据 Step 1 结果：
- 若某道路 `pos=0`：在该道路数据文件里，找 1-2 个语义偏"守义/积极"的 choice，把 `channelEffect: 0` 改为 `channelEffect: 1`（用 Edit 工具，不改文本）
- 若某道路 `neg=0`：类似地，找 1-2 个语义偏"回避/妥协"的 choice，把 `channelEffect: 0` 改为 `channelEffect: -1`
- 若无极端：跳过本步

- [ ] **Step 4: 处理 textVariants 顺序不符（若有）**

根据 Step 2 结果：
- 若某道路 textVariants[0] 明显不偏冷峻（如偏壮烈）：在该数据文件里，用 Edit 把 textVariants 数组的元素顺序调整（把原本 [末] 的换到 [0]，不改文本内容）
- 若无不符：跳过本步

- [ ] **Step 5: 若有数据改动则提交**

仅当 Step 3/4 有改动时执行：
```bash
git add M*-Data-*.js
git -c user.name="if3077-beep" -c user.email="if3077-beep@users.noreply.github.com" commit -m "fix(data): 渠道数值平衡 + textVariants 顺序约定核验

- 平衡检查发现某道路 pos/neg=0,调整个别 choice 的 channelEffect
- 核验 textVariants[0] 偏冷峻/variants[末] 偏壮烈的约定,调整不符顺序"
```

---

## Task 8: 全道路浏览器手测 + 回归验证

**Files:** 无修改，仅测试

- [ ] **Step 1: 启动本地服务器**

Run: `python3 -m http.server 8000`（若已启动则跳过）
Expected: 服务在 8000 端口运行

- [ ] **Step 2: 8 道路低/中/高三档抽样手测**

对每条道路（whitehouse/ming/ai/africa/cyber/chaos/korea/xianjian）：
- 低档局：刻意扣渠道到 ≤1，进入中段场景，确认 textVariants[0] + narratorVariants[0] + 染色旁白 low 三者同时出现
- 中档局：正常玩到 channels 2-5，确认默认 text + 中档 narrator（30% 随机或原值）+ 无染色旁白
- 高档局：刻意加渠道到 ≥6（依赖 0a），确认 textVariants[末] + narratorVariants[末] + 染色旁白 high 三者同时出现

记录任何异常。

- [ ] **Step 3: 回归验证现有机制**

确认以下现有机制未受影响：
- 残卷碎片仍能触发（5% 概率，集齐 3 片解锁真结局）
- 结局判定正常（打通一局看到结局卡片）
- 章节色调 chap-X 仍正常切换（序章/中段/转折/高潮/终章颜色不同）
- 渠道危机触发正常（channels ≤ 1 时 60% 触发危机事件）
- whitehouse/ming 的 applyHistoryEffects 联动文本仍出现（Task 2 的 0b 修复后，位置在正文末尾）

- [ ] **Step 4: 跨局回响验证**

- 玩通白宫道路（设置若干 flag）
- 刷新页面
- 玩大明道路，确认出现 CrossPathGenerator 跨道路回响事件
- DevTools Console 检查 `localStorage.getItem('pg_crossPlayFlags_v1')` 有值

- [ ] **Step 5: 若有问题则修复并追加提交**

针对 Step 2-4 发现的问题，回到对应 Task 修复。若无问题，跳过。

---

## Task 9: 推送部署

**Files:** 无修改，仅 git 操作

- [ ] **Step 1: 确认本地提交历史**

Run: `git log --oneline -10`
Expected: 看到 0a/0b/0c/L1/L2/L3 等提交

- [ ] **Step 2: 推送 gh-pages**

Run: `git push origin gh-pages`
Expected: 推送成功。若提示鉴权失败，需用户手动配置 token 或在本地终端执行推送。

- [ ] **Step 3: 同步到 v7 仓库（若 v7 仓库存在）**

检查 v7 仓库路径是否存在（调研显示当前工作区无 v7 仓库）。若用户另有 v7 仓库本地路径，需在该仓库重复应用本计划的改动或 cherry-pick。本步骤需用户确认 v7 仓库位置后执行。

---

## 自审记录

**Spec 覆盖检查**：
- spec 4.1.1 [0a] → Task 1 ✓
- spec 4.1.2 [0b] → Task 2 ✓
- spec 4.1.3 [0c] → Task 3 ✓
- spec 4.2 L1 → Task 4 ✓
- spec 4.3 L2 → Task 5 ✓
- spec 4.4 L3 → Task 6 ✓
- spec 7.3 平衡检查 → Task 7 ✓
- spec 7.2 浏览器手测 → Task 8 ✓
- spec 11 开放问题 1（textVariants 顺序核验）→ Task 7 Step 2 ✓
- spec 11 开放问题 2（0a choice 抽样确认）→ Task 7 Step 1 的 pos/neg 统计间接覆盖 ✓
- spec 11 开放问题 3（L3 渲染节点核实）→ Task 6 Step 5/6 已落实具体 DOM 节点 `#sceneTint` ✓

**Placeholder 扫描**：无 TBD/TODO，每步都有具体代码或命令。

**类型一致性**：`getChannelTint(scenarioKey, channels)` 签名在 Task 6 定义与调用一致；`ChannelTint` 对象的 8 个 key 与 M6 recordLabels 中的 scenario key 一致（含 `cyber` 对应 3077 道路）。

**风险提示**：Task 4/5 的高档手测依赖 Task 1 的 0a 修复使渠道能上行到 ≥6。若 Task 7 平衡检查发现某道路正 channelEffect 不足，高档档位可能在该道路不可达——这是已知限制，Task 7 会尝试通过调整数据缓解。
