#!/usr/bin/env bash
set -Eeuo pipefail

# Simpfun: upload/extract the server package to /home/container/tavern-mod.
# Keep the original Stronghold-Protocol directory as a rollback copy.
ROOT="${SERVER_ROOT:-/home/container}"
BUNDLE="${MOD_BUNDLE:-$ROOT/tavern-mod}"
ORIGINAL="${ORIGINAL_GAME:-$ROOT/Stronghold-Protocol}"
ACTION="${1:-start}"
UPSTREAM_COMMIT="488db49f11daf862b67ce26fa4cf89aa6cba2466"
VERSION="0.2.0-compat.1"
GAME="${MOD_GAME:-$ROOT/tavern-instances/$VERSION}"

die() { printf '\n[酒馆模组] %s\n' "$*" >&2; exit 1; }
trap 'printf "\n[酒馆模组] 第 %s 行执行失败；原服目录未覆盖。请保存上方错误信息。\n" "$LINENO" >&2' ERR
[[ "$ACTION" == start || "$ACTION" == check || "$ACTION" == uninstall ]] || die '参数只接受 start / check / uninstall'
[[ -f "$BUNDLE/install.mjs" && -f "$BUNDLE/install-manifest.json" ]] || die "未找到导入包：请将服务端 ZIP 解压到 $BUNDLE（这一层应直接包含 install.mjs）。"
if command -v mise >/dev/null 2>&1; then
  NODE=(mise exec node@22.14.0 --)
else
  command -v node >/dev/null 2>&1 || die '需要 Node.js 22+ 或 mise。'
  NODE=()
fi
"${NODE[@]}" node -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' || die 'Node.js 版本低于 22。'
[[ "$GAME" != "$ROOT" && "$GAME" != "$ORIGINAL" && "$GAME" != / ]] || die 'MOD_GAME 必须是独立的测试目录，不能指向原服或容器根目录。'

if [[ "$ACTION" == uninstall ]]; then
  [[ -d "$GAME" ]] || die '测试服尚未创建。'
  "${NODE[@]}" node "$BUNDLE/install.mjs" "$GAME" --uninstall
  exit
fi

if [[ ! -d "$GAME" ]]; then
  command -v git >/dev/null 2>&1 || die '首次准备需要 Git；请通过面板安装 Git。'
  mkdir -p "$(dirname "$GAME")"
  git clone --no-checkout https://github.com/sganggs/Stronghold-Protocol.git "$GAME"
fi
[[ -d "$GAME/.git" ]] || die '测试目录不是本脚本创建的 Git 副本，停止以免覆盖文件。'
if [[ ! -f "$GAME/package.json" ]]; then
  git -C "$GAME" checkout --detach "$UPSTREAM_COMMIT"
fi
[[ "$(git -C "$GAME" rev-parse HEAD)" == "$UPSTREAM_COMMIT" ]] || die '测试目录基线不同，请使用新的 MOD_GAME 路径。'

# Copy reusable art only on first setup. Do not carry the old fork's code, data or moderation patches over.
if [[ ! -d "$GAME/public/assets" && -d "$ORIGINAL/public/assets" ]]; then
  mkdir -p "$GAME/public"
  cp -a "$ORIGINAL/public/assets" "$GAME/public/assets"
fi
"${NODE[@]}" node "$BUNDLE/install.mjs" "$GAME"
"${NODE[@]}" node "$BUNDLE/check-install.mjs" "$GAME"
cd "$GAME"
if [[ ! -d node_modules/ws || ! -f public/vendor/preact.module.js ]]; then
  "${NODE[@]}" npm ci --omit=dev
fi
if [[ ! -f .tavern-mod-backup/setup-complete ]]; then
  "${NODE[@]}" node tools/setup.mjs --quiet -y
  touch .tavern-mod-backup/setup-complete
fi
if [[ "$ACTION" == check ]]; then
  "${NODE[@]}" node "$BUNDLE/check-install.mjs" "$GAME"
  exit
fi

# The panel's internal listening port may differ from the public port 25342.
export PORT="${PORT:-${SERVER_PORT:-3000}}"
export HOST="${HOST:-0.0.0.0}"
printf '\n[酒馆模组] 版本 %s，监听 %s:%s\n' "$VERSION" "$HOST" "$PORT"
printf '[酒馆模组] 房主可分别设置法术、英雄与多人容量；鲍勃、聊天和伤害看板为玩家独立开关。\n'
printf '[酒馆模组] 停服请使用面板停止按钮；本脚本不会强杀其他 Node 进程。\n'
exec "${NODE[@]}" node server/index.js
