# 卫戍协议：酒馆战棋模组

为原版网页卫戍协议增加酒馆法术、英雄策略和鲍勃。

## 内容

- **酒馆法术**：独立法术槽与法术预览，智慧球、身份揭晓等。
- **英雄策略**：包含贸易大王、阮大师、苔丝等，共 30 位英雄策略，并提供主动技能按钮。
- **鲍勃**：63 条中文原声，点击头像可以屏蔽。

法术与英雄策略由房主在开局前分别设置，鲍勃由每位玩家独立开关。

## 下载与安装

适配原版 **0.2.6**。从 [Releases](https://github.com/MuQ2333/stronghold-tavern-battlegrounds/releases/tag/v0.1.1) 下载 Full.zip 并解压。Windows 运行 Import.cmd；Linux 运行 bash install.sh <游戏目录>。卸载分别使用 Uninstall.cmd 或 uninstall.sh。安装后沿用原有开服方式。详细步骤见[安装说明](INSTALL.md)。

本仓库只发布酒馆战棋模组。第三方多人、聊天、伤害统计的兼容测试包及个人开服脚本不在这里发布。

源码不带游戏图片和录音，试玩请下载 Release 附件；模组需要已能正常运行的原版游戏。

## 反馈

目前为试玩版。反馈请附版本、策略与法术、复现步骤，以及截图或录像。

## 开发资料

- payload/：模组修改的源码与测试。
- changes.patch：相对固定上游提交的源补丁。
- install.mjs、install-manifest.json：安装校验、备份与恢复。
- BOB.md、HERO-POWER-POOLS.md：语音和技能池说明。

## 来源与许可

原项目：[sganggs/Stronghold-Protocol](https://github.com/sganggs/Stronghold-Protocol)。英雄策略基于本项目独立开发线 hero-strategies 0.1.10 整合适配。

非官方、非商业同人作品。源码按 GPL-3.0-or-later 提供。明日方舟与酒馆战棋素材归各自权利人所有，不适用代码许可证。
