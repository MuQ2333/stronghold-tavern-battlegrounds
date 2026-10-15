# 署名与来源 · PROVENANCE

> 原作者与兼容改写者**分开列出，不抹掉任何一方**。原件未署名的一律写**「原件未署名」**，不代填；
> 许可照实抄自包内 `pack.json` 的 `license` 字段，未改动。

## 包

| 项 | 值 |
|---|---|
| 包 id | `dmg-board` |
| 版本 | `1.0.0` |
| 名称 | 伤害看板（结算页） |
| 目录名 = 包 id | 是 |
| 顶层目录 | `dmg-board/` |

## 原作者

`jingjiangze` —— 见包内 `pack.json` 的 `author` 字段，以及包内 `README.md` 的源码链接
（`https://github.com/jingjiangze/Stronghold-Protocol-Forge`，分支 `feat/stardust-mods`）。

## 许可

`GPL-3.0-or-later`（包内 `pack.json.license` 原文）。包内 `README.md` 末尾另写「本包不含任何游戏素材」。

## 兼容改写者

`Mo233`

## 来源

站点投稿 **`760d36fca90d`**，原件 zip 大小 **13914 字节**，
sha256 `d5e0896e694db54fc2b6fd56d390c32ff9a128ba9cc67ed72130979e30c0ac17`
（源文件只读，未改动一个字节）。

## 改了什么

**原件一个字节都没改。** 本次只补了本文件（`PROVENANCE.md`）。逐文件 sha256 见下表，改动前 = 改动后。

之所以**不需要**兼容改写，是这条包用的**本来就是我们的通道**，两处关键点都在引擎这一版里核对过：

1. **挂载点是合法槽位**：`pack.json.client.panels[0].slot = "screen.result.footer"` ——
   `public/js/ui/extensions.js:74`（`MOD_PANEL_SLOTS`）与 `:100`（`MOD_PANEL_CREATED`）都列了它，
   容器由注册点按需创建。
2. **读的是引擎自己的结算**：`client/board.js:175` 用 `ctx.net.on('m.result', …)` 订阅。
   `m.result` 是 `shared/protocol.js:758` 的 S2C 白名单成员，而面板订阅**引擎类型**是原本就允许的
   （`public/js/ui/extensions.js:641-656`：引擎类型照旧原样透传；只有包自己的通道名才需要
   `client.panels[].messages` 声明）。所以这一条**不是「绕过接口」，正是「走接口」** ——
   数由服务端算好（`server/match/results.js`），面板只读不重算、不猜测、不碰对局。
3. **可见性判据**：`client/board.js:83-89` 的 `visibleOn` 读页面自己的 `.screen.result` / `.st`，
   不新造状态层。

## 自带素材来源

**没有任何素材。** 包内 5 个文件：`pack.json`、`README.md`、`client/board.js`、`client/board.css`、
`test/board.test.mjs` —— 全是代码与文档，无图片 / 音频 / 字体 / 解包数据。

## 校验用哈希（改动前 / 改动后）

| 文件 | 改动前 sha256（= 原件） | 改动后 sha256 |
|---|---|---|
| `pack.json` | `ac51123d0b7142085d63a0da3d8b697143d91ffb8d1747e8c83a67e6ea6ec95a` | 同左（未改） |
| `README.md` | `cf59d3ba40e33941407117a257190b8cf8e979f2bb1efe289d7b76050607b73f` | 同左（未改） |
| `client/board.js` | `883cd50176d943d3d13a39bea5c1f36e53a3f99c9a319648f3b0edbe12f97ec3` | 同左（未改） |
| `client/board.css` | `a00c3d295f78d94d6751525e8dfdb94fcf325f6cfae293c44175dc43d26b4c84` | 同左（未改） |
| `test/board.test.mjs` | `49a5d89b43e1ac6ddee8ed8badfc2aa16ad311169b47bb91dd0a9a297835b274` | 同左（未改） |

`PROVENANCE.md` 是本次新增 =
`ff40cceb86e17c67411808e444ae016a37936f8db6fe31a935eebfb880b703f2`（3321 B），不参与上表。
包自带 9 条测试本次本地实跑：`tests 9 / pass 9 / fail 0`。

本成品：`760d36fca90d-dmg-board.zip`（6 个条目，顶层目录 `dmg-board/`，一包一 zip）。**字节数与 sha256 记在交付索引**
`../CHECKSUMS.txt`（与其余统一交付物同一份清单）。这里刻意不写它：包内文本一变，包含它的那个 zip 的摘要
就跟着变，写进包里必然自相矛盾。
sha256 `5a010547b972f60bdecd8c45593a5adf5dbfdf41515ba3be2a3277eba2179f08`（6 个条目，顶层目录 `dmg-board/`）。
