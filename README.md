# sbay-dev — Edge Mobile DevTools Extension

> Microsoft Edge Add-on (Manifest V3) جلب أدوات مطوّر سطح المكتب الكاملة إلى Edge على الأجهزة المحمولة كبيرة الشاشة (Galaxy Fold 6+، Tablet/iPad)، مبني فوق [WasmMvcRuntime](https://github.com/sbay-dev/WasmMvcRuntime) ومتكامل أصيلاً مع `gh copilot cli`.

| المكوّن | الوصف |
|---------|------|
| `src/Sbay.DevTools.Runtime` | تطبيق MVC على WASM (C# / Razor / EF Core / SignalR) — منطق ولوحات DevTools |
| `src/Sbay.DevTools.Extension` | غلاف الإضافة MV3 (TypeScript) — `chrome.debugger` ↔ CDP ↔ SignalR |
| `src/Sbay.DevTools.Bridge` | Daemon لـ Copilot CLI (Native Messaging Host) — تسليم الأخطاء الزمن الحقيقي |

## البدء السريع

```bash
# 1) بناء طبقة runtime (WASM)
dotnet restore
dotnet build src/Sbay.DevTools.Runtime

# 2) بناء غلاف الإضافة
cd src/Sbay.DevTools.Extension
npm install
npm run build

# 3) تعبئة الإضافة
cd ../..
./tools/pack-extension.sh
```

## الوثائق

- [docs/architecture.md](docs/architecture.md) — معمارية الطبقات وتدفّق الرسائل
- [docs/copilot-protocol.md](docs/copilot-protocol.md) — بروتوكول JSON-RPC مع Copilot CLI
- [docs/chromium-parity.md](docs/chromium-parity.md) — design tokens ومطابقة DevTools

## الترخيص

MIT © sbay-dev
