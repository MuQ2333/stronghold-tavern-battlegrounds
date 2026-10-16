# 反馈与开发

## 反馈问题

欢迎在 [Issues](https://github.com/MuQ2333/stronghold-tavern-battlegrounds/issues) 反馈。请提供：模组与原游戏版本、人数与模式、相关策略和法术、复现步骤、预期与实际结果。UI问题请注明设备、浏览器、屏幕尺寸、页面缩放比例和是否全屏，并附截图。

## 修改源码

本仓库是模组安装包源码，不是完整游戏，不能在仓库根目录直接 `npm start`。

`mod/payload/` 按原游戏路径保存新增或替换文件。安装器依据 `mod/install-manifest.json` 校验原文件和发布文件后安装；它不会自动合并其他模组。运行与测试需要匹配的原版游戏副本，流程和边界见[开发说明](docs/DEVELOPMENT.md)。

源码沿用上游规则：不手改游戏的 `data/*.json`；确定性战斗代码不使用时钟、`Math.random`或Node专用API；界面文本同步四语言；玩法与文档保持一致。原生战斗基准只有在明确的玩法改动需要时才更新，并说明变化原因。

## 发布前检查

```bash
node scripts/check-package.mjs
node scripts/verify-package.mjs "/path/to/pristine-upstream-git"
```

第一条检查清单、补丁哈希与公开文档链接。第二条需要本地Git，检查源补丁在固定原版归档上应用及反向恢复。

## 制作完整 ZIP

开发打包还需要 Python 3；普通安装只需要 Node.js。

本地已有 `mod/assets/` 时：

```bash
python scripts/package.py
```

从单独素材目录打包：

```bash
python scripts/package.py --assets-from "/path/to/mod/assets" --output "./dist"
```

输出同名 Full.zip 和 SHA256SUMS.txt。工具按清单验证全部源码与素材，缺失或哈希不符会停止；不会把整个工作目录、缓存或个人开服脚本装进ZIP。网盘与GitHub Release使用这同一份ZIP，避免两份内容分叉。

图片和录音不提交到Git，`mod/assets/` 已忽略；清单只记录路径和哈希。请保留素材来源及原许可，代码许可不授权商业使用游戏素材。
