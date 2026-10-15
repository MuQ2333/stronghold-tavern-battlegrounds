# 卫戍协议：酒馆战棋整合模组

给原版网页卫戍协议增加酒馆法术、30 位英雄策略和鲍勃中文原声。法术与英雄由房主开局前设置，鲍勃由玩家独立开关。

**适配原版 0.2.6。当前兼容测试版：0.2.0-compat.1。**

## 下载与安装

- **服务器开服**：下载 Releases 的 Server ZIP，按[开服说明](docs/SERVER.md)上传并运行 start.sh。支持面板端口配置，使用独立目录，保留旧服回退。
- **本机导入**：在已能运行的原版游戏副本上执行 Import.cmd；卸载用 Uninstall.cmd。见[安装说明](docs/INSTALL.md)。
- **玩家加入**：使用浏览器访问房主地址，无需每个玩家单独安装服务端模组。
- **安卓项目**：Paper-Yuan 分支另行检测中，尚未提供安卓 APK 或承诺应用内导入兼容。

源码下载不包含图片与录音。试玩请使用 Release 附件；本包不是完整游戏。

## 共用模组

本测试版加入独立的多人容量、结算伤害看板和聊天气泡兼容接入。多人可选 4/8/12 席；伤害看板和聊天各自开关，不绑定酒馆功能。具体来源、修改与限制见[兼容说明](docs/COMPATIBILITY.md)。

本地组合测试通过不等于所有部署环境兼容。当前仍需要实际服务器验收；第三方其他模组未逐一测试。

## 反馈

请提供版本、房间人数、策略及法术、复现步骤和日志或录像。平衡性仍在试玩调整中。

## 项目结构

- docs/：安装、开服、兼容说明。
- payload/：相对固定上游修改／新增的源码和测试。
- install.mjs、install-manifest.json：文件校验、备份与卸载。
- start.sh：Linux／开服面板入口。
- changes.patch：开发者使用的完整源补丁。

## 来源与许可

原项目：[sganggs/Stronghold-Protocol](https://github.com/sganggs/Stronghold-Protocol)。多人扩展来源：[secret-c/stronghold-protocol-plugins](https://github.com/secret-c/stronghold-protocol-plugins)。聊天及伤害看板的原作者、许可证与来源保留在各独立包和兼容说明中。

非官方、非商业同人作品。源码按 GPL-3.0-or-later 提供；明日方舟及酒馆战棋素材归各自权利人所有，不适用代码许可证。不得收费或用于其他商业变现。
