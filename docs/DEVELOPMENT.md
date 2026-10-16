# 源码与版本维护

## 目录职责

| 路径 | 用途 |
| --- | --- |
| `mod/payload/` | 按原游戏路径镜像的新增、替换源码及回归测试 |
| `mod/install-manifest.json` | 模组版本、游戏版本、固定上游提交，以及每个安装文件的before/after SHA-256 |
| `mod/asset-manifest.json` | 完整包应包含的图片与原声路径、SHA-256；清单入Git，素材不入Git |
| `mod/compatibility.json` | 上游、默认开关、源补丁哈希和覆盖文件 |
| `mod/changes.patch` | 相对固定上游的源补丁，不含游戏美术或录音 |
| `scripts/install.mjs` | 校验、备份、安装及卸载实现 |
| `install.mjs` | 根目录稳定入口，供Windows、Linux脚本和已有命令使用 |
| `scripts/check-package.mjs` | 发布内容与文档检查 |
| `scripts/verify-package.mjs` | 干净上游归档的补丁安装及反向恢复 |
| `scripts/package.py` | 按明确清单构建同一份GitHub／网盘完整ZIP |

不要在本仓库根目录执行游戏的npm命令。游戏测试在匹配的完整上游副本中执行。

## 当前基线

模组0.2.0适配上游0.3.0，固定提交c24e17eec3af1e6dedfa9935a6d15245cf2f4586。个人服务器兼容版不是本仓库的发布基线，不要用它的整文件替换本版UI或宿主代码。

## 修改与验证

1. 在独立的匹配游戏副本中修改和测试，遵循该副本的AGENTS.md与上游规范。
2. 将确认的新增／替换文件同步到`mod/payload/`。修改同一源码时同步安装清单的哈希及源补丁；新增文件也必须列入清单。文件删除尚不是本安装器的发布格式。
3. 同步功能文档、`CHANGELOG.md`、`docs/VALIDATION.md`。不要把旧版本的通过记录写成本次全部通过。
4. 运行仓库清单检查及补丁验证，随后在干净副本验证导入、重复导入、卸载恢复、重装和冲突拒绝。
5. 按[打包步骤](../CONTRIBUTING.md#制作完整-zip)生成Full.zip，GitHub和网盘使用相同文件与校验和。

玩法测试、golden、lint、types、i18n等命令以匹配上游的CONTRIBUTING.md为准。界面修改补充桌面与手机横屏截图和点击检查；浏览器模拟不代替真机异形屏、系统栏及全屏行为测试。

## 公开文件边界

Git保存源码、必要文档、安装入口、清单和补丁。完整ZIP另外带清单中的模组素材。构建目录、依赖、缓存、用户数据、密钥、其他模组及个人开服脚本不进入本项目发布包。
