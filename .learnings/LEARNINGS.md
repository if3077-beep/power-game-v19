# 学习记录

## 静态页面部署
- **gh CLI 优先**：Windows 上 gh 可能已装但不在 PATH，路径 `C:/Program Files/GitHub CLI/gh.exe`。先 `gh auth status` 确认登录再部署
- **仓库名用 ASCII**：gh CLI 创建 repo 时中文名会被转义成乱码（如 `-`），用英文命名
- **GitHub Pages 启用**：`gh api repos/{owner}/{repo}/pages -X POST -F "source[branch]=main"` 即可，构建通常 10-20 秒
- **localtunnel 在中国不可用**，且有过路页（需输 IP 验证），不适合分享给中国用户
- **surge.sh 需要交互式注册**，无法在非交互 shell 中自动完成

## API 选型
- **PoetryDB 无中文内容**：只有英文诗，面向中文用户必须硬编码或用中文 API
- **Art Institute of Chicago API**：免认证、13 万件藏品、IIIF 图片、CORS 支持——做文化类项目的首选画作源
- **中文诗词 API 缺位**：没有靠谱的免费中文古诗词 API，硬编码 50+ 首经典作品更可靠、加载更快

## Python 工具部署
- **git clone 被墙**时，用 GitHub API 逐文件下载源码（`https://api.github.com/repos/{owner}/{repo}/contents/{path}`）
- **pip 依赖冲突不一定是 blocker**：TrendRadar 和 browser-use 的 mcp/requests/websockets 版本冲突不影响各自运行
- **轻量启动绕过脚手架**：不需要 setup 脚本、venv、uv——直接 `python -m mcp_server.server --transport http` 即可

## GitHub Pages 部署（2026-05-06 更新）
- **构建一直 errored 但 error.message 为 null**：不要反复重试，先查 `gh run view --log-failed` 看真实错误
- **"Runner of type hosted not acquired"**：GitHub Actions runner 排队超时，是 GitHub 基础设施问题，不是代码或配置问题。换时间重试或换部署平台
- **legacy build 和 workflow build 同时存在会冲突**：切换 build_type 时确保对应的分支/workflow 一致
- **gh-pages 分支用 force_orphan**：`peaceiris/actions-gh-pages` 加 `force_orphan: true` 避免历史冲突
- **部署调试不要反复触发构建**：每次 push 都会触发新 workflow，造成大量 queued run 堆积。先排查原因再操作
- **Pages 构建连续失败 3 次就换平台**：该账号 Pages 构建队列可能被阻塞，即使最简单的静态页面也超时。备选：Netlify（拖拽部署最快）、Vercel、Cloudflare Pages
- **验证顺序**：先用 `echo '<h1>ok</h1>' > index.html` 测试 Pages 是否可用，再部署复杂内容。避免在复杂项目上浪费时间排查基础设施问题
- **新建干净仓库不一定能解决**：如果问题是账号级别的 Pages 限流/阻塞，换仓库也没用

## 开发流程反思（2026-05-05）
- **HTML 结构要先和用户对齐**：我写的 index.html（多阶段切换式）被用户大幅重写为滚动叙事式。应该先问用户想要的页面结构再动手
- **不要在部署上死磕**：GitHub Pages 连续失败 10+ 次后应该立刻换平台（Netlify/Vercel/Surge），而不是反复尝试不同配置
- **文件变更要追踪**：用户修改了 index.html 和 styles.css，引入了新概念（命运河流 canvas、雷达图、决策矩阵、滚动叙事）。这些变更改变了整个页面架构
- **清理要及时**：部署过程中产生的临时文件（.playwright-mcp、未使用的 workflow、卡住的进程）应该在任务切换时立即清理

## CSS 技巧
- **水墨晕染效果**：`mask-image: radial-gradient(ellipse 78% 73% at 50% 50%, rgba(0,0,0,0.95) 28%, ... rgba(0,0,0,0) 100%)` 模拟画作边缘羽化
- **宣纸纹理**：SVG feTurbulence + 多层径向渐变叠加，配合低透明度
- **思源宋体 + 站酷小薇**：中文排版用 Noto Serif SC（正文）+ ZCOOL XiaoWei（标题）+ Ma Shan Zheng（书法字）

## MiroFish v9 开发反思（2026-05-05）

### 架构决策
- **滚动叙事 vs 阶段切换**：v8 用阶段切换（phase-based），v9 改为单页滚动 + IntersectionObserver 触发动画。滚动叙事更适合内容丰富的页面，但需要处理动态显示元素的观察时机
- **纯本地引擎**：移除 AI API 调用（callDeepSeek），所有推演在客户端完成。降低了复杂度，消除了 API key 泄露风险，加载速度更快
- **删除 emoji**：用户明确要求删除所有 emoji 代码。图标改为字母（Q/H/P），建议图标改为 2 字母大写缩写

### 技术坑点
- **IntersectionObserver 时序问题**：当结果区域从 `hidden` 变为 `visible` 时，已存在的 observer 可能不会重新触发。解决方案：在 `showResultsSection()` 中创建新的 observer 并 observe 所有 section；对统计计数器额外加 `setTimeout` 直接触发动画
- **`substring(0,3)` 截断问题**：engine.js 中 advice icon 用完整英文单词（'list'、'chat'），CSS 中 `advice-icon` 是 36px 方块。`substring(0,3)` 产生 'lis'、'cha' 这种无意义缩写。改为 `substring(0,2).toUpperCase()` 得到 'LI'、'CH'
- **Write 工具必须先 Read**：已有文件必须先 Read 才能 Write，否则报 "File has not been read yet"。从上一个会话延续时容易忘记这一点
- **node -e 构建 HTML 的转义问题**：用 `node -e` 内联 CSS/JS 到 HTML 时，模板字面量中的反引号和 `${}` 会被 shell 吃掉。解决方案：用 `fs.readFileSync` + 字符串拼接，避免模板字面量

### 文件依赖关系
- **data.js → engine.js → app.js**：全局变量通过 `window.*` 导出，app.js 的类通过全局变量访问数据。构建 standalone HTML 时脚本顺序不能变
- **audio.js 已废弃**：v9 移除了音效系统，但旧的 audio.js 文件仍留在目录中。index.html 不再引用它。部署前应该清理无用文件
- **styles.css 全局覆盖**：v9 的 styles.css 完全替换了 v8 的琥珀金主题。如果两个版本共存，需要确保 CSS 类名不冲突或各自独立

### 部署
- **GitHub Pages 仍然有问题**：status 为 "errored"，build_type 为 "legacy"。连续多次 push 导致大量 queued run 堆积。应该在首次失败后就排查 `gh run view --log-failed`，而不是反复重试
- **standalone HTML 是最佳分发方式**：单文件、无外部依赖、双击即可打开。对于不熟悉 GitHub Pages 的用户更友好

### 开发流程
- **先 Read 再 Write**：从上一个会话恢复时，先 Read 已有文件了解当前状态，再决定修改策略
- **测试要端到端**：用 Playwright 完整走一遍输入→推演→查看结果的流程，发现统计计数器不触发、图标截断等问题
- **不要假设用户的需求**：v8 被用户评价为"很一般没有创意"，v9 大刀阔斧重构为滚动叙事+暗色霓虹+Canvas 可视化。应该在动手前先确认用户对创意方向的预期

---

## 权力的游戏 v4 开发反思（2026-05-06）

### 做了什么
将 v3 的数值驱动游戏重构为 v4 的"人情债叙事系统"：
- 数值系统 → 人情债短语系统（无数字，每选一句墓志铭）
- 饥饿/食物 → 消息渠道（5条内线，失去即聋）
- 数值条件结局 → 债务分布+最后短语判定结局
- 首页书摘 → 移入选项下方灰色小字
- 弹窗失败 → 泛黄奏折飘出（可保存图片）
- 新增开局身份介绍屏幕
- 新增"权力回响"身份卡（Power Echo Card）
- 集成 AnalysisEngine 生成洞察

### 模块拆分策略
采用「先拆模块→再定接口→最后给核心代码」的流程：
- M1-CSS：完整样式（23KB）
- M2-HTML：六个屏幕的 DOM 骨架
- M3-Engine：粒子/光标/音频/状态/打字机/转场（8KB）
- M4-Data-WhiteHouse：白宫8场景×3-4选项（26KB）
- M5-Data-Ming：大明8场景×3-4选项（26KB）
- M6-Mechanics：人情债/消息渠道/结局/奏折/身份卡/图鉴（15KB）
- 最终 index.html 通过 `<script src>` 引用各模块

### 踩坑与教训

1. **Task 工具断连**：mcp__tasks-mcp 在会话中途断开连接，导致任务计划丢失。教训：关键进度不要只存在任务工具里，同时写入文件或 memory
2. **Write 工具必须先 Read**：已有文件必须先 Read 才能 Write。从上一个会话延续时容易忘记
3. **大文件应该拆分写入**：单个 index.html 超过 1500 行时，Write 工具可能超时或上下文溢出。拆成多个模块文件用 script src 引用是更好的策略
4. **内容创作是最大瓶颈**：16个场景×3-4选项=约60个选项，每个需要：模糊选项文本、灰色书摘、人情债短语、债务分类、后果文本、分析标签。纯内容创作比代码编写耗时更多
5. **中断后恢复困难**：用户多次中断后，需要重新理解上下文。应该在关键节点写入中间产物到文件，而不是只在对话中输出
6. **CSS hidden 状态忘记添加 visible 类**：`.channels-bar` 默认 `opacity:0`，需要 `.visible` 类才能显示。`startGame()` 中调用了 `renderChannels()` 但忘记添加 `visible` 类。教训：CSS 用 class 控制可见性时，必须在显示逻辑中同步添加该 class
7. **数组索引映射反了**：`renderChannels()` 的状态文本数组 `['内线畅通','消息尚可',...]` 索引 0 对应最佳状态，但 `channels=5` 时 `Math.min(5,5)=5` 显示"彻底失聪"。正确做法是索引 0 = 最差，索引 5 = 最佳。教训：数组索引和语义值的映射方向要画图确认

### 架构决策
- **多文件 vs 单文件**：最终选择多文件（CSS/JS分离），因为单文件太大容易超时。index.html 只有 3.7KB，各模块独立维护
- **分析引擎集成方式**：运行时调用 AnalysisEngine.analyze()，失败时静默降级。不阻塞核心游戏流程
- **结局判定逻辑**：按优先级遍历 endings 数组，第一个满足条件的 ending 被选中。fallback 是最后一个 ending（"走钢丝"/"圆满"）

### 待完成
- [x] 将 v4-output 文件夹内容复制回 5.3 项目目录
- [x] 本地测试完整游戏流程（Playwright 端到端验证通过）
- [x] 验证 AnalysisEngine 集成是否正常（选择后正确显示洞察）
- [x] 部署到可访问的 URL（https://if3077-beep.github.io/power-game-survival/）
- [x] v4 升级：音频引擎 + 书摘位置 + 分析框架 + 事件联动 + 结局彩蛋
- [ ] 清理旧的 v3 文件和临时截图

---

## v4 升级反思（2026-05-06）

### 做了什么
基于用户反馈对 v4 进行全面升级：
1. **音频系统重写**：散装函数 → AudioEngine 类，分离 BGM/SFX 增益，不同路线不同主题曲
2. **书摘位置调整**：从选项按钮内移至场景底部，不再干扰选项阅读
3. **分析引擎扩展**：8 框架 → 23 框架，新增制度分析、叙事权、网络理论、信任动力学等
4. **事件联动系统**：historyFlags 追踪关键选择，前期决策影响后期场景文本
5. **结局彩蛋**：72 条随机文案（总统密档/万历帝朱批 + 幕僚日志/同僚日记）
6. **选项提示**：hover 显示 hint 文字，帮助玩家理解每个选择的深层含义

### 技术决策
- **AudioEngine vs 散装函数**：类结构更易维护，BGM/SFX 分离增益控制更精细
- **historyFlags vs 数值系统**：布尔标记比数值更轻量，不会影响结局判定逻辑
- **applyHistoryEffects 深拷贝**：避免修改原始数据，JSON.parse(JSON.stringify()) 简单可靠
- **彩蛋文案池**：每个结局 3 条随机文案，增加重玩价值

### 踩坑
- **transition 期间误触**：Playwright 测试时，transition overlay 淡出期间点击可能穿透到选项按钮。生产环境用户不会遇到（动画太快），但测试时需注意
- **browser session 断开**：Playwright MCP 的浏览器会话可能因超时断开，需要重新 navigate

### 参考版本的价值
`C:\Users\29343\Desktop\权力的游戏\` 的参考版本提供了：
- AudioEngine 的 BGM 音阶设计（tension: 半音阶、chinese: 五声调式）
- SocialScience 的 6 个社会学框架（差序格局、人情面子、影响力六原则等）
- 选项结构的 hint/analysis/effects 字段设计
- StatsEngine 的隐藏数值系统（本版本未采用，保留人情债+渠道的简洁设计）
