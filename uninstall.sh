#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
command -v node >/dev/null 2>&1 || { printf '需要 Node.js 22 或以上，请先安装后重试。\n' >&2; exit 1; }
exec node "$SCRIPT_DIR/install.mjs" --uninstall "$@"
