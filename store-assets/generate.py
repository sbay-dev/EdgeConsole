#!/usr/bin/env python3
"""Generate Microsoft Edge Add-ons store assets for sbay-dev · Edge Console."""
import os, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import arabic_reshaper
from bidi.algorithm import get_display

OUT = Path(__file__).parent
random.seed(7)

# ----- palette (matches docs/assets/style.css) -----
BG       = (7, 9, 15)
BG2      = (10, 14, 26)
SURFACE  = (18, 24, 40)
TEXT     = (231, 236, 245)
DIM      = (149, 160, 184)
MUTE     = (107, 119, 148)
A1       = (122, 246, 255)   # cyan
A2       = (124, 92, 255)    # purple
A3       = (255, 122, 184)   # pink
OK       = (74, 222, 128)
WARN     = (251, 191, 36)
ERR      = (255, 95, 86)

FONT_DIRS = [
    "/data/data/com.termux/files/usr/share/fonts/TTF",
    "/data/data/com.termux/files/usr/share/fonts",
    "/system/fonts",
]

def find_font(*names):
    for d in FONT_DIRS:
        if not os.path.isdir(d): continue
        for root, _, files in os.walk(d):
            for f in files:
                low = f.lower()
                for n in names:
                    if n.lower() in low:
                        return os.path.join(root, f)
    return None

# Latin
F_BOLD   = find_font("DejaVuSans-Bold.ttf")
F_REG    = find_font("DejaVuSans.ttf")
F_MONO   = find_font("DejaVuSansMono.ttf")
# Arabic (Noto Naskh on Android)
F_AR_BOLD = find_font("NotoNaskhArabic-Bold.ttf", "NotoNaskhArabicUI-Bold.ttf", "NotoKufiArabic-Bold.ttf")
F_AR_REG  = find_font("NotoNaskhArabic-Regular.ttf", "NotoNaskhArabicUI-Regular.ttf")
print("fonts:", F_BOLD, F_AR_BOLD)

def font(path, size):
    try:    return ImageFont.truetype(path or "DejaVuSans.ttf", size)
    except: return ImageFont.load_default()

def ar(text):
    """Reshape + bidi-reorder Arabic for PIL rendering."""
    return get_display(arabic_reshaper.reshape(text))

# ----- helpers -----
def lerp(a, b, t):  return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))

def aurora_bg(w, h, intensity=1.0):
    """Generate a dark base with soft radial gradients (aurora)."""
    arr = np.zeros((h, w, 3), dtype=np.float32)
    arr[..., 0] = BG[0]; arr[..., 1] = BG[1]; arr[..., 2] = BG[2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    blobs = [
        (0.20*w, 0.30*h, 0.55*min(w,h), A2, 0.55*intensity),
        (0.80*w, 0.20*h, 0.45*min(w,h), A1, 0.40*intensity),
        (0.60*w, 0.85*h, 0.50*min(w,h), A3, 0.30*intensity),
    ]
    for cx, cy, r, col, a in blobs:
        d = np.sqrt((xx-cx)**2 + (yy-cy)**2) / r
        m = np.clip(1.0 - d, 0.0, 1.0) ** 2
        for i in range(3):
            arr[..., i] = arr[..., i]*(1-m*a) + col[i]*(m*a)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return img.filter(ImageFilter.GaussianBlur(radius=max(2, int(min(w,h)*0.012))))

def grid_overlay(img, gap=48, alpha=8):
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(0, w, gap):  d.line([(x, 0), (x, h)], fill=(255, 255, 255, alpha))
    for y in range(0, h, gap):  d.line([(0, y), (w, y)], fill=(255, 255, 255, alpha))
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def gradient_text(text, fnt, size_xy, colors=(A1, A2, A3)):
    """Render text masked over a horizontal 3-stop gradient."""
    w, h = size_xy
    grad = Image.new("RGB", (w, h))
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for x in range(w):
        t = x / max(1, w-1)
        if t < 0.5: c = lerp(colors[0], colors[1], t*2)
        else:        c = lerp(colors[1], colors[2], (t-0.5)*2)
        arr[:, x, :] = c
    grad = Image.fromarray(arr)
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.text((0, 0), text, font=fnt, fill=255)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out

def text_size(d, txt, fnt):
    bbox = d.textbbox((0,0), txt, font=fnt)
    return bbox[2]-bbox[0], bbox[3]-bbox[1], bbox[0], bbox[1]

def draw_alpha_rect(canvas, box, radius=0, fill=None, outline=None, width=1):
    """Properly alpha-composite a (rounded) rect with translucent fill onto an RGBA canvas."""
    x0, y0, x1, y1 = [int(v) for v in box]
    w, h = x1 - x0, y1 - y0
    if w <= 0 or h <= 0: return
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    if radius:
        ld.rounded_rectangle([0, 0, w-1, h-1], radius=radius, fill=fill, outline=outline, width=width)
    else:
        ld.rectangle([0, 0, w-1, h-1], fill=fill, outline=outline, width=width)
    canvas.alpha_composite(layer, (x0, y0))

def gradient_rect(size, colors=(A1, A2, A3)):
    w, h = size
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for x in range(w):
        t = x / max(1, w-1)
        if t < 0.5: c = lerp(colors[0], colors[1], t*2)
        else:        c = lerp(colors[1], colors[2], (t-0.5)*2)
        arr[:, x, :] = c
    return Image.fromarray(arr).convert("RGBA")

def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0,0,size[0]-1,size[1]-1], radius=radius, fill=255)
    return m

# ===========================================================
# 1) LOGO 300x300
# ===========================================================
def make_logo(out=OUT/"logo-300.png", size=300):
    pad = int(size*0.05)
    bg = Image.new("RGBA", (size, size), (0,0,0,0))
    # gradient rounded square
    grad = gradient_rect((size, size))
    mask = rounded_mask((size, size), int(size*0.22))
    bg.paste(grad, (0,0), mask)

    d = ImageDraw.Draw(bg)
    # central monogram "s>"
    fs = int(size*0.62)
    fnt = font(F_BOLD, fs)
    txt = "s"
    tw, th, ox, oy = text_size(d, txt, fnt)
    cx = (size - tw)//2 - ox
    cy = (size - th)//2 - oy - int(size*0.04)
    # subtle shadow
    sh = Image.new("RGBA", (size, size), (0,0,0,0))
    ImageDraw.Draw(sh).text((cx+2, cy+3), txt, font=fnt, fill=(0,0,0,120))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=4))
    bg = Image.alpha_composite(bg, sh)
    d = ImageDraw.Draw(bg)
    d.text((cx, cy), txt, font=fnt, fill=BG)

    # chevron mark (>) bottom-right
    cs = int(size*0.22)
    cf = font(F_BOLD, cs)
    d.text((int(size*0.66), int(size*0.58)), ">", font=cf, fill=(BG[0], BG[1], BG[2], 240))

    bg.save(out, "PNG")
    print("✓", out, bg.size)

# ===========================================================
# Reusable: hero/window mock for promo tiles
# ===========================================================
def draw_chrome_window(canvas, x, y, w, h, title="console — sbay-dev"):
    win = Image.new("RGBA", (w, h), (0,0,0,0))
    d = ImageDraw.Draw(win)
    r = 18
    # body
    d.rounded_rectangle([0,0,w-1,h-1], radius=r, fill=(15, 19, 32, 235), outline=(255,255,255,30), width=1)
    # bar
    bar_h = 36
    d.rounded_rectangle([0,0,w-1,bar_h], radius=r, fill=(0,0,0,140))
    d.rectangle([0, bar_h-r, w-1, bar_h], fill=(0,0,0,140))
    # dots
    for i, col in enumerate([(255,95,86), (255,189,46), (39,201,63)]):
        cx = 16 + i*20
        d.ellipse([cx, 12, cx+12, 24], fill=col)
    # title
    fnt = font(F_MONO or F_REG, 12)
    tw,_,_,_ = text_size(d, title, fnt)
    d.text((w - tw - 16, 11), title, font=fnt, fill=MUTE)
    # paste onto canvas
    canvas.alpha_composite(win, (x, y))
    return bar_h

def draw_console_lines(canvas, x, y, w, h, scale=1.0):
    """Draw colored console-like log lines."""
    fnt_mono = font(F_MONO or F_REG, int(13*scale))
    fnt_bold = font(F_MONO or F_BOLD, int(13*scale))
    lines = [
        (MUTE, "$ gh copilot suggest 'why did my fetch fail?'"),
        (DIM,  "  ↳ MCP context: sbay-dev.console.captured (3 errors)"),
        (DIM,  "  ↳ resource: devtools://errors/recent"),
        ("", ""),
        (OK,   "✓ TypeError: Failed to fetch"),
        (TEXT, "  at api.ts:42  · CORS preflight blocked"),
        (WARN, "  ↳ origin https://app.example missing in"),
        (WARN, "    Access-Control-Allow-Origin"),
        ("", ""),
        (DIM,  "[network]  GET /api/users        200  ·  142ms"),
        (DIM,  "[network]  POST /api/auth        401  ·  88ms"),
        (ERR,  "[error]    Uncaught (in promise) at main.tsx:14"),
        (A1,   "[copilot]  context streamed → 3 events"),
    ]
    d = ImageDraw.Draw(canvas)
    line_h = int(20 * scale)
    cy = y
    for col, txt in lines:
        if not txt:
            cy += int(line_h*0.5); continue
        d.text((x, cy), txt, font=fnt_mono, fill=col if col else TEXT)
        cy += line_h
        if cy > y + h - line_h: break

# ===========================================================
# 2) Small promotional tile 440x280
# ===========================================================
def make_small_tile(out=OUT/"tile-small-440x280.png"):
    W, H = 440, 280
    img = aurora_bg(W, H).convert("RGBA")
    img = grid_overlay(img, gap=40, alpha=6)
    d = ImageDraw.Draw(img)

    # logo small
    logo_sz = 64
    logo = Image.new("RGBA", (logo_sz, logo_sz), (0,0,0,0))
    g = gradient_rect((logo_sz, logo_sz))
    logo.paste(g, (0,0), rounded_mask((logo_sz, logo_sz), 16))
    ld = ImageDraw.Draw(logo)
    lf = font(F_BOLD, 44)
    tw,th,ox,oy = text_size(ld, "s", lf)
    ld.text(((logo_sz-tw)//2 - ox, (logo_sz-th)//2 - oy - 3), "s", font=lf, fill=BG)
    img.alpha_composite(logo, (28, 28))

    # brand
    d.text((104, 32), "sbay-dev", font=font(F_BOLD, 22), fill=TEXT)
    d.text((104, 60), "Future Developers", font=font(F_REG, 12), fill=DIM)
    # Arabic line on its own (right-aligned for natural RTL flow)
    ar_line = ar("مطورو المستقبل")
    afnt = font(F_AR_REG, 12)
    aw, ah, ax, ay = text_size(d, ar_line, afnt)
    d.text((W - 28 - aw - ax, 60), ar_line, font=afnt, fill=DIM)

    # title (bilingual stack)
    title_en = "Edge Console"
    fnt = font(F_BOLD, 44)
    tw,th,ox,oy = text_size(d, title_en, fnt)
    grad_t = gradient_text(title_en, fnt, (tw+8, th+12))
    img.alpha_composite(grad_t, (28, 110))

    d.text((28, 168), "Desktop-grade DevTools for Edge Mobile.", font=font(F_REG, 13), fill=DIM)
    ar_sub = ar("أدواتُ مطوّرٍ بمستوى الحاسوب على هاتفك.")
    afnt2 = font(F_AR_REG, 13)
    aw,_,ax,_ = text_size(d, ar_sub, afnt2)
    d.text((W - 28 - aw - ax, 188), ar_sub, font=afnt2, fill=DIM)

    # badge
    badge_x, badge_y = 28, 222
    btext = "v1.0 · Console + MCP Bridge"
    bfnt = font(F_MONO or F_REG, 11)
    bw, bh, bx, by = text_size(d, btext, bfnt)
    pad = 8
    draw_alpha_rect(img, [badge_x, badge_y, badge_x+bw+pad*2, badge_y+bh+pad*2],
                    radius=999, fill=(122,246,255,30), outline=(122,246,255,140), width=1)
    d.text((badge_x+pad-bx, badge_y+pad-by), btext, font=bfnt, fill=A1)

    img.save(out, "PNG")
    print("✓", out, img.size)

# ===========================================================
# 3) Large promotional tile 1400x560
# ===========================================================
def make_large_tile(out=OUT/"tile-large-1400x560.png"):
    W, H = 1400, 560
    img = aurora_bg(W, H).convert("RGBA")
    img = grid_overlay(img, gap=64, alpha=8)
    d = ImageDraw.Draw(img)

    # left text block
    left_x = 80
    # brand row
    logo_sz = 88
    logo = Image.new("RGBA", (logo_sz, logo_sz), (0,0,0,0))
    g = gradient_rect((logo_sz, logo_sz))
    logo.paste(g, (0,0), rounded_mask((logo_sz, logo_sz), 22))
    ld = ImageDraw.Draw(logo)
    lf = font(F_BOLD, 60)
    tw,th,ox,oy = text_size(ld, "s", lf)
    ld.text(((logo_sz-tw)//2 - ox, (logo_sz-th)//2 - oy - 4), "s", font=lf, fill=BG)
    img.alpha_composite(logo, (left_x, 70))

    d.text((left_x + logo_sz + 18, 80), "sbay-dev", font=font(F_BOLD, 30), fill=TEXT)
    d.text((left_x + logo_sz + 18, 118), "Future Developers", font=font(F_REG, 16), fill=DIM)
    ar_brand = ar("مطورو المستقبل")
    d.text((left_x + logo_sz + 18 + 170, 118), ar_brand, font=font(F_AR_REG, 16), fill=DIM)

    # main title gradient — sized to fit beside the right window
    title = "Edge Console"
    fnt = font(F_BOLD, 76)
    tw,th,_,_ = text_size(d, title, fnt)
    grad_t = gradient_text(title, fnt, (tw+12, th+24))
    img.alpha_composite(grad_t, (left_x, 200))

    # bilingual subtitle
    d.text((left_x, 304), "Desktop-grade DevTools for Microsoft Edge on mobile.",
           font=font(F_BOLD, 20), fill=TEXT)
    d.text((left_x, 338), "Native gh copilot cli (MCP) bridge built in.",
           font=font(F_REG, 17), fill=DIM)
    ar1 = ar("أدواتُ مطوّرٍ بمستوى الحاسوب على الأجهزة المحمولة،")
    ar2 = ar("مع تكاملٍ أصليٍّ عبر بروتوكول الحوار للمساعدات.")
    d.text((left_x, 380), ar1, font=font(F_AR_REG, 17), fill=DIM)
    d.text((left_x, 408), ar2, font=font(F_AR_REG, 17), fill=DIM)

    # feature chips
    chips = ["Console ✓", "MCP Bridge ✓", "Pofs Tree · soon", "WasmMvc UI"]
    cx, cy = left_x, 470
    cfnt = font(F_MONO or F_REG, 14)
    for label in chips:
        cw, ch, ox, oy = text_size(d, label, cfnt)
        pad_x, pad_y = 16, 10
        draw_alpha_rect(img, [cx, cy, cx+cw+pad_x*2, cy+ch+pad_y*2],
                        radius=999, fill=(255,255,255,40), outline=(255,255,255,140), width=1)
        d.text((cx+pad_x-ox, cy+pad_y-oy), label, font=cfnt, fill=TEXT)
        cx += cw + pad_x*2 + 12

    # right-side window mock
    win_w, win_h = 540, 380
    wx, wy = W - win_w - 70, (H - win_h)//2
    bar_h = draw_chrome_window(img, wx, wy, win_w, win_h, "console — sbay-dev · Edge Mobile DevTools")
    draw_console_lines(img, wx + 20, wy + bar_h + 18, win_w - 40, win_h - bar_h - 20, scale=1.0)

    img.save(out, "PNG")
    print("✓", out, img.size)

# ===========================================================
# 4) Screenshots 1280x800 (3 variants)
# ===========================================================
def make_screenshot_console(out=OUT/"screenshot-1-console-1280x800.png"):
    W, H = 1280, 800
    img = aurora_bg(W, H, intensity=0.7).convert("RGBA")
    img = grid_overlay(img, gap=48, alpha=8)
    d = ImageDraw.Draw(img)

    # browser frame
    fx, fy, fw, fh = 64, 52, W - 128, H - 104
    bar_h = draw_chrome_window(img, fx, fy, fw, fh, "https://app.example.com  ·  Edge Mobile  ·  DevTools")

    # devtools tabs strip
    tabs_y = fy + bar_h + 8
    tabs = [("Console", True), ("Pofs Tree", False), ("Network", False), ("Elements", False), ("Sources", False), ("Application", False), ("Copilot", False)]
    tx = fx + 20
    tfnt = font(F_BOLD, 14)
    for name, active in tabs:
        tw, th, ox, oy = text_size(d, name, tfnt)
        pad_x, pad_y = 14, 7
        if active:
            draw_alpha_rect(img, [tx, tabs_y, tx+tw+pad_x*2, tabs_y+th+pad_y*2],
                            radius=10, fill=(122,246,255,55), outline=(122,246,255,200), width=1)
            d.text((tx+pad_x-ox, tabs_y+pad_y-oy), name, font=tfnt, fill=A1)
        else:
            d.text((tx+pad_x-ox, tabs_y+pad_y-oy), name, font=tfnt, fill=DIM)
        tx += tw + pad_x*2 + 4

    # toolbar (filter icons)
    tool_y = tabs_y + 50
    tfnt2 = font(F_REG, 13)
    chips = [("All", True), ("Errors 3", False), ("Warnings 2", False), ("Info 14", False), ("Network 41", False)]
    cx = fx + 20
    for label, active in chips:
        cw, ch, ox, oy = text_size(d, label, tfnt2)
        pad_x, pad_y = 12, 6
        bg = (124,92,255,80) if active else (255,255,255,22)
        bd = (124,92,255,180) if active else (255,255,255,55)
        draw_alpha_rect(img, [cx, tool_y, cx+cw+pad_x*2, tool_y+ch+pad_y*2],
                        radius=999, fill=bg, outline=bd, width=1)
        d.text((cx+pad_x-ox, tool_y+pad_y-oy), label, font=tfnt2, fill=TEXT if active else DIM)
        cx += cw + pad_x*2 + 8

    # divider
    div_y = tool_y + 40
    d.line([(fx+12, div_y), (fx+fw-12, div_y)], fill=(255,255,255,20))

    # console content — richer than the small one
    fnt_m = font(F_MONO or F_REG, 14)
    fnt_b = font(F_MONO or F_BOLD, 14)
    rows = [
        (DIM,  "›", "console.log('Boot sequence', { build: 'wasm-mvc', mode: 'dev' })"),
        (TEXT, " ", "Boot sequence  { build: 'wasm-mvc', mode: 'dev' }"),
        (MUTE, "ⓘ", "[Network] GET /api/users           200  ·  142 ms  ·  4.1 KB"),
        (MUTE, "ⓘ", "[Network] GET /api/auth/session    304  ·  38 ms"),
        (WARN, "⚠", "[CSP] Refused to load script 'https://cdn.example' (script-src)"),
        (ERR,  "✕", "TypeError: Failed to fetch"),
        (DIM,  "  ", "    at fetchUsers (api.ts:42:9)"),
        (DIM,  "  ", "    at UsersPanel.render (panels/users.tsx:18:5)"),
        (MUTE, "ⓘ", "[CDP] Network.loadingFailed → forwarded to MCP bridge"),
        (A1,   "★", "[copilot] context: 3 errors · 41 network events · ready for prompt"),
        (DIM,  "›", "gh copilot suggest 'why is fetchUsers failing?'"),
        (TEXT, " ", "Copilot:  CORS preflight rejected; origin missing in"),
        (TEXT, " ", "          Access-Control-Allow-Origin. Add the header in"),
        (TEXT, " ", "          src/api/cors.ts and redeploy."),
        (OK,   "✓", "fix applied · suggested patch saved as patches/cors-fix.diff"),
    ]
    rx = fx + 20
    ry = div_y + 18
    for col, glyph, text in rows:
        d.text((rx, ry), glyph, font=fnt_b, fill=col)
        d.text((rx + 24, ry), text, font=fnt_m, fill=col if col in (ERR, WARN, A1, OK) else TEXT)
        ry += 26

    # status bar
    sb_y = fy + fh - 32
    d.line([(fx+12, sb_y), (fx+fw-12, sb_y)], fill=(255,255,255,18))
    sfnt = font(F_MONO or F_REG, 12)
    d.text((fx+20, sb_y+8), "● MCP bridge: connected  ·  ws://127.0.0.1:47823/sbay-dev", font=sfnt, fill=OK)
    d.text((fx+fw-220, sb_y+8), "v1.0.0  ·  build wasm-mvc",  font=sfnt, fill=MUTE)

    img.save(out, "PNG"); print("✓", out, img.size)

def make_screenshot_arch(out=OUT/"screenshot-2-architecture-1280x800.png"):
    W, H = 1280, 800
    img = aurora_bg(W, H, intensity=0.6).convert("RGBA")
    img = grid_overlay(img, gap=48, alpha=8)
    d = ImageDraw.Draw(img)

    # title centered
    title = "Architecture"
    fnt = font(F_BOLD, 44)
    tw, th, _, _ = text_size(d, title, fnt)
    grad_t = gradient_text(title, fnt, (tw+8, th+12))
    img.alpha_composite(grad_t, ((W-tw)//2, 80))
    sub = "Three layers · cloud-free · runs entirely on your device"
    sw, _, _, _ = text_size(d, sub, font(F_REG,18))
    d.text(((W - sw)//2, 150), sub, font=font(F_REG, 18), fill=DIM)
    ar_sub = ar("ثلاث طبقات، بلا سحابة، يعمل بالكامل على جهازك")
    asw, _, _, _ = text_size(d, ar_sub, font(F_AR_REG, 18))
    d.text(((W - asw)//2, 178), ar_sub, font=font(F_AR_REG, 18), fill=DIM)

    # three columns
    col_w, col_h = 320, 360
    gap = 60
    total = col_w*3 + gap*2
    sx = (W - total)//2
    sy = 250
    cols = [
        ("Browser · MV3", A1, ["Service Worker", "DevTools page", "CDP debugger client", "Native messaging"]),
        ("UI · WASM",     A2, ["WasmMvcRuntime",  "Razor + C#",     "Cepha App shell",     "Console panel"]),
        ("Bridge · MCP",  A3, ["sbay-devtools-bridge", "NLog → stderr", "stdio + WebSocket", "gh copilot cli"]),
    ]
    for i, (name, accent, items) in enumerate(cols):
        cx = sx + i*(col_w + gap)
        # card
        draw_alpha_rect(img, [cx, sy, cx+col_w, sy+col_h], radius=20,
                        fill=(255,255,255,22) if i!=1 else (124,92,255,70),
                        outline=(255,255,255,55) if i!=1 else (124,92,255,200), width=1)
        # accent dot
        d.ellipse([cx+24, sy+24, cx+40, sy+40], fill=accent)
        # tag
        d.text((cx+50, sy+22), name, font=font(F_BOLD, 18), fill=TEXT)
        # items
        iy = sy + 80
        for it in items:
            d.line([(cx+24, iy+22), (cx+col_w-24, iy+22)], fill=(255,255,255,18))
            d.text((cx+24, iy), it, font=font(F_REG, 16), fill=DIM)
            iy += 50

        # connector arrow to next col
        if i < 2:
            ax1 = cx + col_w + 8
            ax2 = cx + col_w + gap - 8
            ay  = sy + col_h//2
            d.line([(ax1, ay), (ax2, ay)], fill=(255,255,255,140), width=2)
            # arrow head
            d.polygon([(ax2, ay), (ax2-10, ay-7), (ax2-10, ay+7)], fill=(255,255,255,200))
            label = ["CDP / postMessage", "Native Msg / WS"][i]
            lw, lh, _, _ = text_size(d, label, font(F_MONO or F_REG, 12))
            d.text((ax1 + (ax2-ax1-lw)//2, ay-26), label, font=font(F_MONO or F_REG, 12), fill=MUTE)

    # bottom note
    note = "No cloud · no analytics · no third-party trackers"
    nfnt = font(F_BOLD, 18)
    nw, _, _, _ = text_size(d, note, nfnt)
    d.text(((W-nw)//2, sy+col_h+50), note, font=nfnt, fill=A1)
    note2 = ar("خصوصيّةٌ تامّة، كلّ شيءٍ يجري على جهازك")
    n2fnt = font(F_AR_REG, 16)
    n2w, _, _, _ = text_size(d, note2, n2fnt)
    d.text(((W-n2w)//2, sy+col_h+82), note2, font=n2fnt, fill=DIM)

    img.save(out, "PNG"); print("✓", out, img.size)

def make_screenshot_copilot(out=OUT/"screenshot-3-copilot-1280x800.png"):
    W, H = 1280, 800
    img = aurora_bg(W, H, intensity=0.7).convert("RGBA")
    img = grid_overlay(img, gap=48, alpha=8)
    d = ImageDraw.Draw(img)

    # split: left = devtools console, right = copilot conversation
    # title
    title = "Native Copilot Bridge"
    fnt = font(F_BOLD, 38)
    tw, th, _, _ = text_size(d, title, fnt)
    grad_t = gradient_text(title, fnt, (tw+8, th+12))
    img.alpha_composite(grad_t, (64, 50))
    d.text((64, 105), "Page state and errors stream into gh copilot cli over MCP — in real time.",
           font=font(F_REG, 16), fill=DIM)
    d.text((64, 130), ar("حالة الصفحة وأخطاؤها تتدفّق إلى المساعد عبر بروتوكول الحوار، لحظةً بلحظة."),
           font=font(F_AR_REG, 16), fill=DIM)

    # left window — DevTools events stream
    lw, lh = 560, 540
    lx, ly = 64, 180
    bar_h = draw_chrome_window(img, lx, ly, lw, lh, "DevTools  ·  events")
    fnt_m = font(F_MONO or F_REG, 13)
    rows = [
        (DIM,  "[12:01:04]"), (TEXT, " Runtime.consoleAPICalled  level=log"),
        (DIM,  "[12:01:06]"), (WARN, " Log.entryAdded            level=warning"),
        (DIM,  "[12:01:08]"), (ERR,  " Runtime.exceptionThrown   TypeError"),
        (DIM,  "[12:01:08]"), (MUTE, " → mcp publish: console.captured"),
        (DIM,  "[12:01:09]"), (MUTE, " → mcp publish: network.failed"),
        (DIM,  "[12:01:11]"), (A1,   " ★ copilot tool invoked: get_recent_errors"),
        (DIM,  "[12:01:11]"), (A1,   " ★ copilot resource read: devtools://errors/recent"),
    ]
    cy = ly + bar_h + 16
    for i in range(0, len(rows), 2):
        ts_col, ts_txt = rows[i]
        bd_col, bd_txt = rows[i+1]
        d.text((lx+18, cy), ts_txt, font=fnt_m, fill=ts_col)
        d.text((lx+108, cy), bd_txt, font=fnt_m, fill=bd_col)
        cy += 26

    # right window — Copilot terminal
    rx, ry = 700, 180
    rw, rh = 516, 540
    bar_h2 = draw_chrome_window(img, rx, ry, rw, rh, "$ gh copilot cli")
    cy = ry + bar_h2 + 16
    chat = [
        (A1,   "you ›", "why is fetchUsers failing on prod?"),
        (TEXT, "ai  ›", ""),
        (DIM,  "      ", "checking sbay-dev mcp resources…"),
        (DIM,  "      ", "found 3 console errors and 1 network failure."),
        (TEXT, "      ", ""),
        (TEXT, "      ", "TypeError: Failed to fetch"),
        (TEXT, "      ", "  caused by CORS preflight rejection."),
        (TEXT, "      ", "  origin https://app.example is not in"),
        (TEXT, "      ", "  Access-Control-Allow-Origin on /api/users."),
        (TEXT, "      ", ""),
        (OK,   "  fix ", "edit src/api/cors.ts:14"),
        (DIM,  "      ", "+ res.headers.set('Access-Control-Allow-Origin',"),
        (DIM,  "      ", "+   'https://app.example')"),
        (A1,   "you ›", "apply"),
        (OK,   "  ok  ", "patch written · 1 file changed."),
    ]
    fnt_b = font(F_MONO or F_BOLD, 13)
    for col, who, text in chat:
        d.text((rx+18, cy), who, font=fnt_b, fill=col)
        d.text((rx+78, cy), text, font=fnt_m, fill=col if col in (OK, A1) else TEXT)
        cy += 22

    # bridge arrow between the two windows
    ax1 = lx + lw - 6
    ax2 = rx + 6
    ay  = ly + lh//2
    d.line([(ax1, ay), (ax2, ay)], fill=(122,246,255,180), width=3)
    d.polygon([(ax2, ay), (ax2-12, ay-8), (ax2-12, ay+8)], fill=(122,246,255,220))
    label = "MCP"
    lw2, lh2, _, _ = text_size(d, label, font(F_MONO or F_BOLD, 16))
    d.text((ax1 + (ax2-ax1-lw2)//2, ay-30), label, font=font(F_MONO or F_BOLD, 16), fill=A1)

    img.save(out, "PNG"); print("✓", out, img.size)

# ===========================================================
# RUN
# ===========================================================
if __name__ == "__main__":
    make_logo()
    make_small_tile()
    make_large_tile()
    make_screenshot_console()
    make_screenshot_arch()
    make_screenshot_copilot()
    print("\nAll assets generated in", OUT)
