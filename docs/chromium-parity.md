# Chromium DevTools parity

The aim is **visual indistinguishability** from desktop Chromium DevTools at typical reading sizes, plus full keyboard-shortcut compatibility.

## Design tokens

Located in `src/Sbay.DevTools.Runtime/wwwroot/css/devtools.css`. Token names align with Chromium's `devtools_app.css` (`--sb-*` prefix to avoid collision).

| Token | Purpose |
|-------|---------|
| `--sb-bg`, `--sb-bg-elev`, `--sb-bg-hover` | Surface elevation (matches `--sys-color-base-container-*`) |
| `--sb-fg`, `--sb-fg-muted` | Foreground levels |
| `--sb-border` | Hairlines |
| `--sb-accent` | Selected tab indicator, prompt marker |
| `--sb-error`, `--sb-warn`, `--sb-info`, `--sb-debug` | Console levels |
| `--sb-mono` | Console / Sources monospace stack |
| `--sb-row-h`, `--sb-fs` | Row height and base font size |

A light-theme override is provided via `prefers-color-scheme: light`.

## Keyboard shortcuts (parity targets)

| Shortcut | Action |
|----------|--------|
| `Esc` | Toggle drawer |
| `Ctrl+L` / `K` | Clear console |
| `Ctrl+\\` | Toggle pause on exceptions |
| `↑` / `↓` (in prompt) | Recall history |
| `Ctrl+F` | Filter |
| `Ctrl+Shift+P` | Command menu (planned) |

Implemented progressively per panel.

## Touch adaptations (Fold/Tablet)

- Minimum tap target: 32 px on toolbar buttons.
- Long-press in DOM tree → context menu (replaces right-click).
- Two-finger pinch in Sources → zoom code font.
- Bottom edge gesture reserved for Edge OS — DevTools UI keeps a 12 px safe margin.
