# 安装与使用

适配原版卫戍协议 **0.2.6**，需要 **Node.js 22+**。先确认原游戏能够正常启动，再停止服务并导入模组。安装工具不需要 Git，不会自动拉取上游、安装依赖、修改端口或结束进程。

下载 Releases 中的 **Tavern-Battlegrounds-0.1.1-Full.zip**，完整解压到游戏目录以外。Windows 和 Linux 使用同一份 ZIP，内含模组图片及鲍勃原声；原游戏及其原生素材需自行准备。GitHub 自动提供的 Source code ZIP 不含这些模组素材。

## Windows

双击解压目录中的 **Import.cmd**，粘贴游戏目录并回车。选择含 package.json、server、public 的目录。

也可在命令提示符中运行：

~~~bat
Import.cmd "D:\Games\Stronghold-Protocol"
~~~

看到“导入完成”后，沿用原来的启动方式。玩家连接服务器地址即可，不需要每人再安装一份模组。

## Linux

解压后，在模组包目录运行：

~~~bash
bash install.sh "/srv/Stronghold-Protocol"
~~~

路径可替换成自己的游戏目录。脚本使用当前 PATH 中的 node；如果通过 mise 等运行时管理器开服，先进入相应 Node 环境再运行。使用与游戏文件相同的用户安装，避免生成无法访问的文件。

无交互的面板或终端必须在命令后写明路径。安装脚本不会执行 sudo、修改全局权限或重置仓库。

## 开服与连接

安装成功后，**继续使用原有启动命令**。模组不会把服务端限定在本机，也不要求固定端口。

没有自定义启动器时，可以在游戏目录直接启动。例如 Linux：

~~~bash
cd /srv/Stronghold-Protocol
HOST=0.0.0.0 PORT=3000 node server/index.js
~~~

Windows 命令提示符：

~~~bat
cd /d "D:\Games\Stronghold-Protocol"
set HOST=0.0.0.0
set PORT=3000
node server/index.js
~~~

面板开服应使用面板分配的内部端口；外部连接端口可能不同。朋友通过服务器地址访问，局域网使用主机的局域网 IP，公网部署还需按上游说明配置端口映射或反向代理。模组安装器不会自动修改防火墙。

已有 systemd、Docker 或面板启动流程时，保留原有环境变量和启动命令，只在停服后向实际游戏目录导入。Docker 应将模组装进镜像或持久化目录，避免重建容器后丢失。

原有 Start-TavernBundle.cmd 是本机测试快捷入口，默认 127.0.0.1:3013；对外开服请采用上面的原启动方式和实际端口配置。

## 使用

房主在开局前分别开启或关闭酒馆法术、英雄策略；鲍勃由玩家独立开关，点击头像可以屏蔽语音。更新后刷新游戏页面，必要时强制刷新以加载新脚本。

此发布包仅包含酒馆模组，不包含第三方多人房间、聊天或伤害统计。

## 校验

安装后，可在模组包目录执行：

~~~bash
node install.mjs --check "/srv/Stronghold-Protocol"
~~~

Windows 同样可用，改成自己的路径。校验会检查安装记录中的源码及新增素材是否完整，不会写入游戏文件。

## 卸载与升级

先停服，再执行对应命令：

~~~bat
Uninstall.cmd "D:\Games\Stronghold-Protocol"
~~~

~~~bash
bash uninstall.sh "/srv/Stronghold-Protocol"
~~~

原文件保存在游戏目录的 **.tavern-mod-backup**。卸载恢复原文件并移除本次新增文件，备份保留。安装后的文件如果被其他修改覆盖，卸载会停止并指出路径，避免丢失改动。

升级模组时，先用旧版工具卸载，再安装新版。升级原游戏前也应先卸载，确认新版模组适配后再导入。请保留下载包和备份目录。

## 安装失败

- **版本或文件不一致**：使用适配的原版 0.2.6。即使版本号相同，其他分支或模组修改过相同文件也可能冲突；脚本不会强行覆盖。
- **已安装其他版本**：先卸载旧版，不能直接叠装。
- **Node 找不到或版本太低**：检查 node --version，确保运行脚本的环境能找到 Node.js 22+。
- **图片或语音缺失**：确认使用 Full.zip，而不是 GitHub 自动打包的源码 ZIP。
- **远程连接失败**：核对监听地址、实际端口及部署平台的映射，不能用朋友设备上的 127.0.0.1 连接主机。

更多原版部署说明见 [上游 DEPLOY.md](https://github.com/sganggs/Stronghold-Protocol/blob/master/docs/DEPLOY.md)。
