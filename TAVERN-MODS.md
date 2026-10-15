# 卫戍协议酒馆战旗整合模组

基于固定原版 0.2.6；独立于 Forge 和血魔包。玩法逻辑由宿主执行，以房间为单位选择；无需修改服务端环境变量。

## 开关

房间界面默认开启酒馆法术、酒馆英雄策略。房主在开局前可分别关闭，状态同步到全部成员；修改会取消其他玩家的准备状态。开始后拒绝改动，下一局可重设。鲍勃的开关保存在各自浏览器，本机默认开启，不影响玩法和随机数，也不改变队友的偏好。

英雄策略关闭时不注入新增策略；只关闭法术时隐藏依赖法术的四名英雄。法术全关恢复原生装备分类。库存、锁定手牌、价格、奖励选择和战斗回传使用同一宿主接口。锁定卡占普通手牌，可在手牌内换位，不可部署、使用、出售、销毁或合成；英雄锁定卡的获得时效果在解锁时触发。

`mods/hero-strategies/bands.json` 是从独立英雄包复制的内容源，`tools/sync-tavern-heroes.mjs` 生成共享目录，不修改 `data/*.json`。技能宿主与本版法术目录整合，霍利戴、泰兰、尤格萨隆、展翅使用同一法术筛选；尤格萨隆的自动施放不临时扩充手牌，也不绕过目标或单回合施放限制。普通玩家消息不能请求内部自动施放路径。

身份揭晓的原生策略池按用户Excel的33/7决定。英雄0.1.10已同步，另加阮大师，共30位。身份揭晓永久替换、阮大师每回合二选一临时替换共用事件宿主，但使用不同候选池；逐英雄政策、条件及未获原版资料确认的[ASSUMED]点见[HERO-POWER-POOLS.md](HERO-POWER-POOLS.md)。

## 鲍勃：全部使用原句与原声

用户最终确认“不改台词，都用原声”。保留审核表65条启用、15条排除，第34条仍禁用。启用台词的字幕恢复原句，保留随从、指挥官及炉石人物地名；本地已有63条原始录音已接入播放清单。第7、36条原始文件本地未找到，暂不播放。

AI样音仅保留为历史试听，不进入游戏，不再批量生成或微调。审核决定和原声安装清单保存在外层bob-shopkeeper目录，用户Excel未改写。

事件、概率与限频详见[鲍勃实装](BOB.md)。语音沿用voice/master音量，干员语音优先；点击鲍勃可屏蔽，教学提示可单独关闭。重连不补播，退出对局取消播放；所有音频仅在忽略目录public/assets/bob中，源补丁不包含游戏素材。

## 智慧球复核

当前 9 类结果：复制阵容、传说、金色、三连、种族、高本、清一色、功能、全法术。已删除圣盾和属性增幅。复制阵容可借用装备／法术位，整排最大为最高等级商店全部商品格数（当前7），超出随机取舍；传说取六星角色，不受当前商店等级限制。其他细节见 [SPELLS.md](SPELLS.md)。

库存仍沿用卫戍协议购买时记账；酒馆战棋展示即占池和特殊复制的缺货例外尚未复刻。此项不是完成声明。

## 兼容边界

已覆盖本整合版的三个独立开关和英雄／法术交互。其他作者尚未提供的模组不能宣称兼容；收到后核查协议、商店槽位、价格／奖励、库存、策略数据、准备／战斗事件、素材和界面插入点。不要整文件覆盖其他模组修改。源补丁安装检查应拒绝冲突；美术和生成语音只留在忽略的 `public/assets/`。

Bob squelch menu (2026-10-15, user request): clicking the bartender portrait opens an anchored bubble with Squelch Bob / Unsquelch. Squelching cancels current and pending narration, clears its caption and suppresses future cues, while retaining a dimmed portrait and leaving the module and other game voices enabled. Preference is browser-local. Outside click / Escape closes the bubble; keyboard activation, focus restoration and narrow bounds are covered.

英雄技能悬浮提示改用干员详情样式：复用技能图标、名称、费用、富文本效果和滚动正文，不再弹出浏览器原生纯文本框。鼠标可移入说明卡继续阅读，移出后收起；键盘聚焦同样可查看，Esc关闭。查看不会发动技能，原有点击发动、选目标、右键及触屏长按交互保留。

2026-10-15 follow-up: remove the independent Amiya assistant. Global spells can use any normal battlefield cell; Support requires empty ground; targeted spells still require a real operator and show spell-specific hints. Galewing’s three routes use the dispatch-center choice row without hand-space checks or payment on opening. Mod HUD geometry follows the rem scale at browser-zoom-equivalent CSS viewports. Purchase-growth badges show only +n. Sylvanas battle reports now retain heroDeaths; fewer than three distinct eligible deaths offer the available one or two identities.

2026-10-15 Bob implementation: install 48 reviewed unchanged Chinese original recordings across 18 cue groups; exclude row 34 and all generated samples. The user rejected v3 as incoherent; 17 adapted lines remain pending. The presentation-only director observes confirmed private views, distinguishes operator purchase tiers from equipment/spells, detects operator sales/promotions and available merges, and gives battle feedback on return to prep (first perfect defense, subsequent perfect defense, three-round streak or leaks). Only completed observed normal rounds qualify. New-game welcome is observed across the game-screen router; mounting/reconnecting does not replay history. Idle speech requires 25 quiet seconds, at least 15 remaining seconds (or untimed prep), no ready/pause/hidden state, once per round; first-round teaching is independently switchable. A bounded phase-local queue gives major events priority, waits for operator speech, cancels on phase change, mute, disable, hidden tab or unmount, and uses voice/master volume. Cue mapping and thresholds are explicit adaptations of the reviewed workbook, not claims about unpublished Hearthstone trigger code.

2026-10-15 final voice policy (explicit user confirmation): use original Chinese wording and recordings only. Retain the 65 enabled / 15 excluded script decisions and row 34 exclusion. Restore all adapted wording to the corresponding original, including Hearthstone names and minion terminology. 60 enabled recordings are installed; original files for rows 2, 6, 7, 36, 44 are unavailable locally and remain unplayed. No AI sample is enabled; generated lines and model fine-tuning are no longer pending release work. Existing probabilities, cooldowns, phase mapping and squelch behavior remain. Strategy-selection recording joins its existing strategy cue.

2026-10-15 original-audio recovery: a full scan of 413 local zhCN audio bundles recovered rows 2, 6 and 44 under AudioClip IDs without the old a/b suffix. Original WAVs and transcripts match the reviewed lines; generation-plan audioId records the explicit aliases. The installer preserves script IDs and reads the actual audioId. 63 originals now play; rows 7 and 36 remain unavailable in the scanned client. Row 34 remains excluded. No synthetic or unrelated replacement audio.
