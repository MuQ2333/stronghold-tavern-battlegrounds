# 卫戍协议：酒馆战棋模组

把酒馆法术、英雄技能和酒馆老板鲍勃加入网页游戏《卫戍协议：盟约》。这是一个非官方、非商业的同人模组。

**[下载完整安装包](https://github.com/MuQ2333/stronghold-tavern-battlegrounds/releases/tag/v0.2.2)** · **[使用说明](使用说明.txt)** · **[安装与卸载](INSTALL.md)** · **[更新记录](CHANGELOG.md)** · **[反馈问题](https://github.com/MuQ2333/stronghold-tavern-battlegrounds/issues)**

## 模组内容

| 功能 | 内容 |
| --- | --- |
| 酒馆法术 | 独立法术槽、按等阶筛选的法术预览，包含智慧球、身份揭晓、支援等法术 |
| 英雄策略 | 贸易大王、阮大师、苔丝等共30位英雄策略，以及主动技能按钮 |
| 酒馆老板鲍勃 | 中文原声、回合与操作语音、点击头像屏蔽；默认关闭 |

法术和英雄策略默认开启，由房主在开局前分别设置。鲍勃由每位玩家独立开关，偏好保存在自己的浏览器中。

## 版本要求

| 模组版本 | 适配游戏 | 环境 |
| --- | --- | --- |
| 0.2.2 | [原版卫戍协议 v0.3.0](https://github.com/sganggs/Stronghold-Protocol/tree/v0.3.0) | Node.js 22+；Windows / Linux |

先准备能够正常启动的原版游戏，再导入本模组。本包包含模组图片和录音，原游戏及其原生素材需自行准备。

本仓库发布基础酒馆模组。视频中的个人整合测试服可能还包含聊天、名片和额外界面等功能，这些扩展不包含在本发布包中。其他上游分支、第三方模组和安卓应用需要另行适配。

## 快速安装

1. 下载 **`Tavern-Battlegrounds-0.2.2-Full.zip`**，完整解压到游戏目录以外。
2. 停止游戏服务，运行对应安装入口并指定游戏目录：

| 系统 | 安装 | 卸载 |
| --- | --- | --- |
| Windows | 双击 `Import.cmd`，输入游戏目录 | 双击 `Uninstall.cmd` |
| Linux | `bash install.sh "/srv/Stronghold-Protocol"` | `bash uninstall.sh "/srv/Stronghold-Protocol"` |

3. 安装完成后，沿用原来的开服方式。玩家访问服务器网页即可使用。

**请选择 Full.zip。** GitHub 自动生成的 `Source code (zip)` / `Download ZIP` 是源码，不含图片和录音。网盘分发也使用同一份 Full.zip，可通过随包的 SHA-256 校验。

从旧版本升级、面板开服、安装校验及常见问题见[安装说明](INSTALL.md)。

## 使用与反馈

- [功能与开关](docs/FEATURES.md)
- [法术操作说明](docs/SPELLS.md)
- [鲍勃语音说明](docs/BOB.md)
- [身份揭晓与阮大师技能池](docs/HERO-POWER-POOLS.md)

目前为测试版本。反馈请附模组版本、游戏版本、人数与模式、策略和法术、复现步骤，以及截图或录像。

## 项目结构

```text
├─ 使用说明.txt                      解压后先看这里
├─ README.md / INSTALL.md / CHANGELOG.md
├─ Import.cmd / Uninstall.cmd       Windows 安装、卸载入口
├─ install.sh / uninstall.sh        Linux 安装、卸载入口
├─ install.mjs                      通用命令入口
├─ docs/                            功能、技能池、验证与开发说明
├─ scripts/                         安装实现、校验与打包工具
└─ mod/
   ├─ payload/                     模组源码，按游戏原目录排列
   ├─ install-manifest.json         安装前后文件哈希
   ├─ asset-manifest.json           图片、录音清单与哈希
   ├─ compatibility.json           版本与固定上游信息
   ├─ changes.patch                相对原版的源补丁
   └─ assets/                      模组素材，仅完整安装包提供
```

开发与打包见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 来源与许可

原项目：[sganggs/Stronghold-Protocol](https://github.com/sganggs/Stronghold-Protocol)。模组源码按 [GPL-3.0-or-later](LICENSE) 提供。明日方舟与酒馆战棋素材归各自权利人所有，不适用代码许可证。本项目不用于商业用途。
