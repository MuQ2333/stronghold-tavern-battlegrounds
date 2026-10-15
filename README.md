# 卫戍协议：酒馆战棋整合模组

卫戍协议与酒馆战棋的同人玩法整合，当前为 **0.1.0 试玩版**，适配原版卫戍协议 **0.2.6**（`488db49f11daf862b67ce26fa4cf89aa6cba2466`）。

- 酒馆法术：独立法术槽、法术预览、智慧球、身份揭晓等；无目标法术可拖至战场格子使用。
- 英雄策略：整合 0.1.10 策略包并适配法术，含阮大师，共 30 位英雄策略及主动技能界面。
- 商店老板鲍勃：63 条审核通过的中文原声、事件触发、头像屏蔽开关。第 34 条禁用，第 7、36 条录音缺失暂不播放。

**下载试玩请使用 Releases 中的 Windows ZIP。** 源码下载不含游戏图片和语音。安装前先准备可正常运行的原版游戏，双击 `Import.cmd` 即可导入；完整步骤与卸载方式见 [安装说明](INSTALL.md)。

法术及英雄由房主开局前选择，鲍勃由每位玩家独立控制，默认均开启。当前不支持直接导入 Forge 或叠加独立策略／法术包，其他作者模组的兼容性尚未逐一验证。

## 文件结构

| 路径 | 用途 |
| --- | --- |
| `Import.cmd` / `Uninstall.cmd` | Windows 安装、卸载入口 |
| `install.mjs` / `install-manifest.json` | 校验、冲突检测、备份与恢复 |
| `payload/` | 修改后的源文件、测试与开发文档 |
| `changes.patch` | 固定上游提交的完整源补丁 |
| `BOB.md` / `HERO-POWER-POOLS.md` | 语音触发、英雄技能池说明 |
| `assets/` | 仅存在于 Windows 发行 ZIP，素材不进入 Git |

## 已知范围

试玩版的平衡与测试仍有限。智慧球库存仍使用卫戍协议购买时记账，尚未复刻酒馆战棋展示占池及特殊复制缺货例外；部分英雄池规则为明确标注的适配假设。当前没有饰品、黑赐、畸变或时空扭曲。

补丁已验证能在固定上游安装并反向恢复。既有 287 个原生战斗基准保持一致；最近鲍勃修改通过 40 项针对性及文档检查、2 项真实音频浏览器检查。未宣称完整 CI 全绿，详情见 `compatibility.json`。安装工具另有独立的导入、重复导入、冲突拒绝和卸载恢复验证。

反馈请附：模组版本、游戏版本、所选策略、涉及法术、操作步骤，以及截图或录像。

## 来源与许可

- 原版网页项目：[sganggs/Stronghold-Protocol](https://github.com/sganggs/Stronghold-Protocol)，GPL-3.0-or-later。
- Forge 扩展框架参考：[XiaMo233M/Stronghold-Protocol-Forge](https://github.com/XiaMo233M/Stronghold-Protocol-Forge)。本包基于原版适配，不需要 Forge。
- 英雄策略来自本项目独立 `hero-strategies` 0.1.10 开发线，快照记录位于 `payload/mods/hero-strategies/source-snapshot.json`。
- 明日方舟图片及角色内容归原权利人所有；酒馆战棋图片、角色及中文原声归 Blizzard 等原权利人所有。图片参考 HearthstoneJSON、PRTS；录音为已核对原句的游戏原声。

非官方、非商业同人项目，不代表鹰角或 Blizzard。源码按随附 GPL 许可证提供；该许可证不授予游戏美术或录音的所有权。禁止将本项目用于广告、收费或其他商业变现。
