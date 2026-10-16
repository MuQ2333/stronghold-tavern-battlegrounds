# 安装与使用

模组 **0.2.3** 适配[原版卫戍协议 v0.3.0](https://github.com/sganggs/Stronghold-Protocol/tree/v0.3.0)，固定提交 `c24e17eec3af1e6dedfa9935a6d15245cf2f4586`。需要 Node.js 22+。

## 准备

1. 确认原游戏能够正常启动，再停止服务。
2. 从 [Release](https://github.com/MuQ2333/stronghold-tavern-battlegrounds/releases/tag/v0.2.3) 或网盘下载 **Tavern-Battlegrounds-0.2.3-Full.zip**。
3. 完整解压到游戏目录以外。选择模组包里的安装入口，指定含 `package.json`、`server`、`public` 的原游戏目录。

Windows 和 Linux 使用同一个完整 ZIP。它包含模组图片和鲍勃录音，原游戏及其原生素材需自行准备。不要只复制安装脚本，`mod/` 和 `scripts/` 必须一起保留。GitHub 的 Source code ZIP 不含游戏素材。

官方完整包和精简包不附带全部开发文档、测试。0.2.3自动安装只写入运行文件和模组素材；游戏目录中现有的开发文档、测试和维护工具保持不变，模组包内仍保留完整源码与补丁供审阅。运行文件的上游哈希校验不放宽。

## Windows

双击 **Import.cmd**，输入游戏目录并回车。也可以在命令提示符中运行：

```bat
Import.cmd "D:\Games\Stronghold-Protocol"
```

看到“导入完成”后，沿用原来的启动方式。

## Linux

在解压后的模组包目录执行：

```bash
bash install.sh "/srv/Stronghold-Protocol"
```

请使用与游戏文件相同的用户安装。脚本使用当前 PATH 中的 `node`，无交互的面板必须在命令后提供游戏路径。安装器不需要 Git，不会自动下载上游或安装游戏依赖。

## 开服与连接

安装后继续使用原有开服方式。模组不更改监听地址、端口、防火墙或面板配置。没有自定义启动方式时，可在游戏目录运行以下示例，并使用自己的实际端口：

Linux：

```bash
HOST=0.0.0.0 PORT=3000 node server/index.js
```

Windows 命令提示符：

```bat
set HOST=0.0.0.0
set PORT=3000
node server/index.js
```

面板开服使用平台分配的内部端口，外部连接端口可能不同。局域网使用主机的局域网 IP；公网部署按平台或[上游部署说明](https://github.com/sganggs/Stronghold-Protocol/blob/v0.3.0/docs/DEPLOY.md)配置。Docker 应将模组装入镜像或持久化目录，避免容器重建后丢失。

玩家直接访问服务器网页即可，无需每位玩家另装一份。更新后刷新网页，必要时强制刷新。

## 功能开关

房主开局前分别设置酒馆法术、英雄策略，默认开启；鲍勃默认关闭，由玩家独立开启。开启后点击头像可屏蔽语音。详见[功能说明](docs/FEATURES.md)。

## 安装校验

在模组包目录运行：

```bash
node install.mjs --check "/srv/Stronghold-Protocol"
```

Windows 同样可以使用，替换成自己的游戏路径。校验只读，不会修改游戏文件。

下载包旁的 `SHA256SUMS.txt` 用于检查 ZIP 是否完整：

```powershell
Get-FileHash -Algorithm SHA256 .\Tavern-Battlegrounds-0.2.3-Full.zip
```

```bash
sha256sum -c SHA256SUMS.txt
```

两种命令按自己的系统选择。

## 卸载与升级

先停服，再在模组包目录执行：

```bat
Uninstall.cmd "D:\Games\Stronghold-Protocol"
```

```bash
bash uninstall.sh "/srv/Stronghold-Protocol"
```

安装前原文件保存在游戏目录的 `.tavern-mod-backup`。卸载会恢复原文件并移除本次新增文件，备份保留。若安装后文件又被其他修改覆盖，卸载会停止并指出路径，避免丢失后续改动。

升级模组时，先用旧版工具卸载，再安装新版。0.2.3安装器也可按旧安装记录完整卸载0.2.2，包括恢复旧版改写的文档；若旧文档安装后被另行编辑，仍会安全停止，不覆盖后改内容。升级游戏前也应先卸载模组。从0.1.x升级到本版时，卸载旧模组后将原游戏更新到匹配的0.3.0，再导入本版。请保留旧包与备份。

## 常见问题

| 提示或现象 | 处理 |
| --- | --- |
| 旧版报 `docs/ARCHITECTURE.md` 等开发文档／测试文件不一致 | 使用0.2.3完整模组包重试；旧提示发生在预检阶段，未导入成功时无需卸载或重装原游戏 |
| 版本或运行文件与适配上游不一致 | 使用上述固定原版版本；其他分支或修改过同一文件的模组需要合并适配 |
| 已安装其他版本 | 先用旧版安装器卸载，不能直接叠装 |
| 找不到 Node | 检查 `node --version`，确保安装脚本运行环境能够找到 Node.js 22+ |
| 模组素材缺失或损坏 | 使用 Full.zip 并完整解压，不使用 Source code ZIP |
| 手机或另一台电脑连不上 | 核对监听地址、实际端口及平台映射；对方设备上的127.0.0.1不指向服务器 |

提交问题时请附版本与完整错误信息，并按[反馈要求](CONTRIBUTING.md#反馈问题)提供复现步骤。
