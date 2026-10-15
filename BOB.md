# 鲍勃实装与语音来源

用户最终确认“不改台词，都用原声”。保留65条启用、15条排除及第34条禁用；字幕恢复原句，保留随从、指挥官及炉石人物地名。现有63条对应原声已接入，第7、36条原始文件在本地尚未找到，暂不播放。AI样音保留为历史试听文件，不加入游戏；不再继续生成或微调。

## 触发

| 时机 | 本版处理 |
| --- | --- |
| 选择策略 | 观察到进入策略选择阶段时使用对应原声；重连不补播 |
| 本局开场 | 观察到协议启动时播放一次；初次挂载和重连不补播 |
| 购买干员 | 服务端确认成功后，按1—2、3—4、5—6阶选对应原声；装备和法术不触发招募台词 |
| 出售、主动刷新、冻结、升级 | 确认状态变化后抽签；失败操作、解冻和自然刷新不触发 |
| 晋升 | 干员晋升计数增加时优先于购买反馈 |
| 可晋升提示 | 现有未锁定普通干员加商品可完成晋升，资金和整备区允许购买；同一目标每回合最多尝试一次 |
| 普通战斗开始 | 播放进入战斗台词，取消上一阶段剩余台词 |
| 返回休整期 | 已完整观察本轮普通战斗才评价；首次无漏怪、后续无漏怪、连续三轮无漏怪、漏怪分别选词 |
| 闲聊 | 25秒没有输入或购买等操作；未准备、未暂停、页面可见，且剩余至少15秒或不限时；每回合最多尝试一次 |
| 新手提示 | 首回合10秒未购买时尝试一次；头像菜单可独立关闭 |

淘汰、最终结果、联防、领袖战等类别暂时没有审核通过且可用的对应录音时保持安静，不拿其他类别的台词替代。

## 播放频率

日常操作并非每次触发。BOB_SPEECH_POLICY 配置购买20%、出售20%、刷新10%、冻结30%、升级60%、闲聊和可晋升提示40%；战斗开始60%、休整50%、胜负反馈70%、连胜80%、晋升100%。普通操作语音共享8秒播放冷却，连续3秒内不重复抽签，刷新语音另有20秒冷却。不设置每回合总句数上限；刷新抽签未命中后，后续操作仍可尝试。每个事件只抽一次，未命中不排队补播。

**[ASSUMED]** 上述概率、冷却和次数是本模组的适配参数，不是已经验证的酒馆战棋原版常数。公开资料可核对事件类别，但未提供精确概率：

- [暴雪酒馆战棋玩法介绍](https://hearthstone.blizzard.com/en-us/news/23156373)：招募／战斗循环与交易操作。
- [鲍勃台词目录](https://hearthstone.wiki.gg/wiki/Battlegrounds/Bartender_Bob)：不同事件的台词类别。具体中文文本和启用决定以用户返回的审核表为准。

播放队列只保留当前阶段的一条待播信息，最多等待8秒；优先级高的事件可替换低优先级事件。干员语音优先。屏蔽、关闭模组、隐藏页面和退出对局会取消语音；沿用游戏语音音量和总静音。音频加载失败会清除字幕，不挂住队列。随机抽签仅用于本地表现，不消耗玩法随机数。

## 安装与验证

`node tools/install-bob-voices.mjs <generation-plan.json> <原始WAV目录>` 校验审核状态、台词未改动和WAV头，再写入忽略目录 `public/assets/bob/voices/`，生成播放清单。源补丁不包含游戏录音。

`test/bobShopkeeper.test.js` 覆盖审核排除、成功操作分类、战况、闲聊和概率限频；`test/bobNarrator.test.js` 覆盖混音、抢占和取消；`test/ui/bob-voice.e2e.test.js` 使用真实Web Audio解码播放原声并检查屏蔽及切换阶段；原有整合界面测试继续检查桌面／窄屏菜单与开关。

2026-10-15 original-audio recovery: a full scan of 413 local zhCN audio bundles recovered rows 2, 6 and 44 under AudioClip IDs without the old a/b suffix. Original WAVs and transcripts match the reviewed lines; generation-plan audioId records the explicit aliases. The installer preserves script IDs and reads the actual audioId. 63 originals now play; rows 7 and 36 remain unavailable in the scanned client. Row 34 remains excluded. No synthetic or unrelated replacement audio.

2026-10-15 phase narration: welcome, prep, combat and prep battle-outcome cues bypass playback and attempt cooldowns; their existing probabilities remain unchanged. An accepted new queued cue immediately cancels the current narrator and caption. Operator voice priority and mute remain respected.
