#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERE"

DIST="$HERE/extension-dist"
rm -rf "$DIST"
mkdir -p "$DIST"

echo "→ Building runtime (WasmMvcRuntime)…"
dotnet publish src/Sbay.DevTools.Runtime -c Release -m:1 -nologo -o "$DIST/runtime-publish" >/dev/null

echo "→ Building extension shell (Vite)…"
( cd src/Sbay.DevTools.Extension && npm run build >/dev/null )

echo "→ Assembling MV3 bundle…"
cp -r src/Sbay.DevTools.Extension/dist/. "$DIST/"
mkdir -p "$DIST/runtime"
if [ -d "$DIST/runtime-publish/wwwroot" ]; then
  cp -r "$DIST/runtime-publish/wwwroot/." "$DIST/runtime/"
else
  cp -r "$DIST/runtime-publish/." "$DIST/runtime/"
fi
rm -rf "$DIST/runtime-publish"

echo "→ Pruning non-shipping artifacts…"
# duplicate html files left at root by vite-plugin-static-copy
rm -f "$DIST/devtools.html" "$DIST/host.html"
# source maps (not consumed by the extension store)
find "$DIST" -type f -name '*.map' -delete
# pre-compressed siblings (.br/.gz) — not served from chrome-extension://
find "$DIST/runtime" -type f \( -name '*.br' -o -name '*.gz' \) -delete

VERSION="$(node -p "require('./src/Sbay.DevTools.Extension/public/manifest.json').version")"
OUT="$HERE/sbay-dev-extension-v${VERSION}.zip"
rm -f "$OUT"
( cd "$DIST" && zip -qr "$OUT" . )
SIZE=$(du -h "$OUT" | cut -f1)
COUNT=$(unzip -l "$OUT" | tail -1 | awk '{print $2}')
echo "✓ Packed: $OUT  (${SIZE}, ${COUNT} files)"
