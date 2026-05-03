// sbay-dev landing — language toggle, animated grid background, code typewriter
(() => {
  'use strict';

  // ---------- i18n ----------
  const I18N = {
    'brand.tag':   { ar: 'Edge Console · مطورو المستقبل',         en: 'Edge Console · Future Developers' },
    'nav.features':{ ar: 'المزايا',                                 en: 'Features' },
    'nav.arch':    { ar: 'المعمارية',                               en: 'Architecture' },
    'nav.roadmap': { ar: 'خارطة الطريق',                            en: 'Roadmap' },
    'nav.install': { ar: 'التثبيت',                                 en: 'Install' },

    'hero.status':  { ar: 'v1.0.0 · الكونسول جاهز',                 en: 'v1.0.0 · Console is ready' },
    'hero.platform':{ ar: 'Microsoft Edge · MV3 · WebAssembly',     en: 'Microsoft Edge · MV3 · WebAssembly' },
    'hero.title1':  { ar: 'أدوات المطوّرين',                         en: 'Desktop-grade' },
    'hero.title2':  { ar: 'من مستوى الحاسوب',                        en: 'developer tools' },
    'hero.title3':  { ar: 'على هاتفك',                              en: 'on your phone' },
    'hero.sub':     {
      ar: 'Edge Console أداةُ تطويرٍ موسّعةٌ تعمل ضمن متصفّح Microsoft Edge، صنعتها <b>sbay-dev — مطورو المستقبل</b>. تمنحك تجربةَ DevTools كاملةً على الشاشات الكبيرة المحمولة، مع جسرٍ أصليٍّ إلى <code>gh copilot cli</code> عبر بروتوكول MCP.',
      en: 'Edge Console is a Microsoft Edge extension built by <b>sbay-dev — Future Developers</b>. It delivers a full DevTools experience on large-screen mobile devices, with a native bridge to <code>gh copilot cli</code> over the MCP protocol.'
    },
    'hero.cta1': { ar: 'حمّل الإصدار الأول', en: 'Get the first release' },
    'hero.cta2': { ar: 'طريقة التثبيت',      en: 'Installation guide' },
    'hero.m1':   { ar: 'تبعيّات في الواجهة',  en: 'UI dependencies' },
    'hero.m2':   { ar: 'معمارية الإضافة',     en: 'Extension model' },
    'hero.m3':   { ar: 'جسر Copilot أصلي',    en: 'Native Copilot bridge' },
    'hero.m4':   { ar: 'واجهة C# / Razor',    en: 'C# / Razor UI' },

    'features.eye':   { ar: 'المزايا',                                 en: 'Features' },
    'features.title': { ar: 'واجهةٌ من زمنٍ آخَر، تعمل اليوم',          en: 'A future-grade UI, shipping today' },
    'features.sub':   { ar: 'كلّ مكوّنٍ صُمِّم ليبدو كأنّه قادمٌ من نسخة Edge المستقبليّة — بأدوات مطوّرٍ كاملةٍ على الشاشات اللوحيّة المحمولة.',
                        en: 'Every component is designed to feel like a glimpse from a future build of Edge — a complete DevTools experience on large-screen mobile devices.' },

    'f.console.t':  { ar: 'كونسول كامل', en: 'Full Console' },
    'f.console.d':  { ar: 'يلتقط <code>console.*</code> والاستثناءات وفشل الشبكة عبر CDP، مع تلوينٍ ومرشّحاتٍ ومستوياتٍ احترافية.',
                      en: 'Captures <code>console.*</code>, exceptions and network failures via CDP — with rich syntax colouring, filters and log levels.' },
    'f.pofs.t':     { ar: 'شجرة Pofs', en: 'Pofs Tree' },
    'f.pofs.d':     { ar: 'استعراضٌ كاملٌ لملفّات الموقع الفعّال وملفّات WasmMvc (OPFS · IndexedDB · SQLite) كشجرةِ مجلّدات، مع زرّ تحميل لكلّ عقدة.',
                      en: 'Browse all files used by the active site and by WasmMvc (OPFS · IndexedDB · SQLite) as a directory tree, with a download button on every node.' },
    'f.network.t':  { ar: 'الشبكة', en: 'Network' },
    'f.network.d':  { ar: 'مراقبةٌ مباشرةٌ للطلبات، توقيتاتٌ، رؤوسٌ، وحمولاتٌ — كلّها قابلةٌ للنقل إلى Copilot كسياقٍ بضغطة.',
                      en: 'Live request monitoring — timing, headers and payloads — all forwardable to Copilot as context with one click.' },
    'f.elements.t': { ar: 'العناصر', en: 'Elements' },
    'f.elements.d': { ar: 'شجرة DOM حيّة، تعديلٌ آنيٌّ للأنماط، ومحرّك styles باللمس — مهيّأٌ للشاشات الكبيرة.',
                      en: 'Live DOM tree, real-time style editing, and a touch-friendly styles editor tuned for large screens.' },
    'f.copilot.t':  { ar: 'جسر Copilot عبر MCP', en: 'Copilot bridge over MCP' },
    'f.copilot.d':  { ar: 'خادم MCP أصليٌّ يبثّ الأحداث إلى <code>gh copilot cli</code> ليصبح المساعدُ مدركًا لحالة الصفحة وأخطائها لحظةً بلحظة.',
                      en: 'A native MCP server streams events to <code>gh copilot cli</code> so the assistant is aware of the page state and errors in real time.' },
    'f.wasm.t':     { ar: 'واجهة WasmMvc', en: 'WasmMvc UI' },
    'f.wasm.d':     { ar: 'واجهةُ DevTools نفسُها مكتوبةٌ بـ C# / Razor فوق <code>NetWasmMvc.SDK</code> — أداءٌ أصليٌّ وتشغيلٌ آمنٌ في sandbox.',
                      en: 'The DevTools UI itself is written in C# / Razor on top of <code>NetWasmMvc.SDK</code> — native-grade performance, sandboxed execution.' },

    'status.shipping': { ar: 'متاح الآن',     en: 'shipping' },
    'status.soon':     { ar: 'قريبًا · v1.1', en: 'coming · v1.1' },
    'status.planned':  { ar: 'على الخارطة',   en: 'planned' },

    'arch.eye':   { ar: 'المعمارية', en: 'Architecture' },
    'arch.title': { ar: 'ثلاث طبقات · غير معتمدةٍ على السحابة', en: 'Three layers · cloud-free' },
    'arch.sub':   { ar: 'إضافة MV3 ↔ جسر MCP محلّيّ ↔ واجهة WasmMvc. كلّ شيءٍ يجري على جهازك.',
                    en: 'MV3 extension ↔ local MCP bridge ↔ WasmMvc UI. Everything runs on your device.' },
    'arch.l1':  { ar: 'المتصفّح · MV3', en: 'Browser · MV3' },
    'arch.l1a': { ar: 'Service Worker', en: 'Service worker' },
    'arch.l1b': { ar: 'صفحة DevTools',  en: 'DevTools page' },
    'arch.l1c': { ar: 'عميل CDP',       en: 'CDP debugger client' },
    'arch.l2':  { ar: 'الواجهة · WASM', en: 'UI · WASM' },
    'arch.l3':  { ar: 'الجسر · MCP',    en: 'Bridge · MCP' },
    'arch.cn1': { ar: 'CDP / postMessage', en: 'CDP / postMessage' },
    'arch.cn2': { ar: 'Native Messaging / WS', en: 'Native Messaging / WS' },

    'rm.eye':   { ar: 'خارطة الطريق', en: 'Roadmap' },
    'rm.title': { ar: 'من الكونسول إلى DevTools كاملة', en: 'From Console to full DevTools' },
    'rm.v1':    { ar: 'الكونسول', en: 'Console' },
    'rm.v1d':   { ar: 'إصدارٌ أوّلٌ بكونسول كامل + جسر MCP لـ Copilot.',
                  en: 'First release: full console + the Copilot MCP bridge.' },
    'rm.v11':   { ar: 'شجرة Pofs', en: 'Pofs Tree' },
    'rm.v11d':  { ar: 'تبويبٌ يستعرض ملفّات الموقع الفعّال وملفّات WasmMvc، مع زرّ تحميلٍ يقرأ ويُنزّل ما يَختاره المطوّر.',
                  en: 'A tab that browses files of the active site and of WasmMvc, with a download button that reads and saves whatever the developer picks.' },
    'rm.v12':   { ar: 'الشبكة والعناصر', en: 'Network & Elements' },
    'rm.v12d':  { ar: 'لوحَتَا Network وElements بأسلوب Chromium DevTools كاملًا.',
                  en: 'Full Chromium-grade Network and Elements panels.' },
    'rm.v2':    { ar: 'المصادر والأداء', en: 'Sources & Performance' },
    'rm.v2d':   { ar: 'Sources مع نقاط توقّفٍ، وتحليلٌ للأداء وتطبيقٌ تخزينيّ.',
                  en: 'Sources with breakpoints, a performance profiler and an Application panel.' },

    'ins.eye':  { ar: 'التثبيت', en: 'Install' },
    'ins.title':{ ar: 'ثلاث خطواتٍ لتشغيلها', en: 'Three steps to run it' },
    'ins.s1t':  { ar: 'حمّل الحزمة', en: 'Download the bundle' },
    'ins.s1d':  { ar: 'نزّل <code>sbay-dev-extension-v1.0.0.zip</code> من صفحة الإصدارات وفُكّ ضغطه.',
                  en: 'Grab <code>sbay-dev-extension-v1.0.0.zip</code> from the Releases page and unzip it.' },
    'ins.s2t':  { ar: 'حمّل في Edge', en: 'Load in Edge' },
    'ins.s2d':  { ar: 'افتح <code>edge://extensions</code>، فعّل وضع المطوّر، ثم <i>«تحميل غير مضغوط»</i> وأشّر إلى المجلد.',
                  en: 'Open <code>edge://extensions</code>, enable Developer mode, click <i>Load unpacked</i>, and pick the folder.' },
    'ins.s3t':  { ar: 'شغّل الجسر', en: 'Run the bridge' },
    'ins.s3d':  { ar: 'في الطرفيّة شغّل <code>sbay-devtools-bridge --ws-only</code> ثم افتح DevTools واختر تبويب <b>sbay-dev</b>.',
                  en: 'In a terminal run <code>sbay-devtools-bridge --ws-only</code>, then open DevTools and switch to the <b>sbay-dev</b> tab.' },

    'cta.title':  { ar: 'صُنع بفخرٍ في المنطقة العربيّة', en: 'Proudly built in the Arab region' },
    'cta.sub':    { ar: 'sbay-dev · مطوّرو المستقبل — نبني أدواتٍ تجعل المتصفّحَ مساحةَ عملٍ كاملةٍ على الأجهزة المحمولة.',
                    en: 'sbay-dev · Future Developers — building tools that turn the browser into a full workspace on mobile.' },
    'cta.gh':     { ar: 'المستودع على GitHub', en: 'Repository on GitHub' },
    'cta.issues': { ar: 'شارك ملاحظاتك', en: 'Send feedback' },

    'foot.arch':    { ar: 'المعمارية', en: 'Architecture' },
    'foot.proto':   { ar: 'بروتوكول Copilot', en: 'Copilot protocol' },
    'foot.privacy': { ar: 'سياسة الخصوصيّة', en: 'Privacy policy' },
    'foot.tag':     { ar: 'مطوّرو المستقبل', en: 'Future Developers' },

    // ----- privacy page -----
    'p.title1':  { ar: 'سياسة', en: 'Privacy' },
    'p.title2':  { ar: 'الخصوصيّة', en: 'Policy' },
    'p.updated': { ar: 'آخر تحديث: ٣ مايو ٢٠٢٦', en: 'Last updated: 3 May 2026' },
    'p.toc1': { ar: 'الملخّص',           en: 'Summary' },
    'p.toc2': { ar: 'ما نجمعه',          en: 'What we collect' },
    'p.toc3': { ar: 'الأذونات',          en: 'Permissions' },
    'p.toc4': { ar: 'تكامل Copilot',     en: 'Copilot integration' },
    'p.toc5': { ar: 'المشاركة مع الغير', en: 'Third parties' },
    'p.toc6': { ar: 'حقوقك',             en: 'Your rights' },
    'p.toc7': { ar: 'التواصل',           en: 'Contact' },

    'p.h1': { ar: 'الملخّص', en: 'Summary' },
    'p.p1': {
      ar: 'إضافة <b>sbay-dev · Edge Console</b> أداةُ تطويرٍ تعمل بالكامل على جهازك. لا نُشغّل خوادمَ خلفيّةً، ولا نُرسل بياناتِ تصفّحك إلى أيّ طرفٍ ثالث، ولا نستخدم أنظمةَ تحليلٍ أو إعلاناتٍ أو متعقّبات.',
      en: 'The <b>sbay-dev · Edge Console</b> extension is a developer tool that runs entirely on your device. We operate no backend servers, send no browsing data to any third party, and use no analytics, advertising or tracking systems.'
    },
    'p.p1b': {
      ar: 'كلّ ما تلتقطه الإضافة من معلوماتٍ هندسيّةٍ (سجلّات الكونسول، أحداث الشبكة، عناصر DOM، ملفّات الموقع) يبقى محلّيًّا في متصفّحك أو يُمرَّر — باختيارك — إلى أداتك المحلّيّة <code>gh copilot cli</code> عبر جسرِ MCP.',
      en: 'All engineering data the extension captures (console logs, network events, DOM elements, site files) stays local to your browser, or is forwarded — at your discretion — to your local <code>gh copilot cli</code> tool over the MCP bridge.'
    },

    'p.h2': { ar: 'ما نجمعه (وما لا نجمعه)', en: 'What we collect (and what we do not)' },
    'p.p2a': { ar: 'تعمل الإضافة على بياناتٍ مؤقّتةٍ ضمن ذاكرة المتصفّح فقط، وتشمل:',
               en: 'The extension processes ephemeral data inside the browser memory only, including:' },
    'p.li1': { ar: 'سجلّات الكونسول والاستثناءات للصفحة الفعّالة عند فتح DevTools.',
               en: 'Console logs and exceptions of the active page while DevTools is open.' },
    'p.li2': { ar: 'أحداث الشبكة (URL، رؤوس، توقيتات، رموز الحالة) من تبويبك الحاليّ.',
               en: 'Network events (URL, headers, timing, status codes) from your current tab.' },
    'p.li3': { ar: 'لقطاتٌ من شجرة DOM والأنماط عند طلبك صراحةً.',
               en: 'Snapshots of the DOM tree and styles when you explicitly request them.' },
    'p.li4': { ar: 'قائمةُ ملفّات الموقع الفعّال وقواعد البيانات الخاصّة بـ WasmMvc (في الإصدارات اللاحقة).',
               en: 'A list of files of the active site and WasmMvc-owned databases (in later versions).' },
    'p.p2b': { ar: '<b>لا نجمع</b>: كلمات المرور، رؤوس الاستيثاق، الكوكيز، البيانات الشخصيّة، السجلّات الجغرافيّة، أو أيّ معرّفٍ يُحدّد هويّتك. كلّ ما سبق يبقى محلّيًّا ولا يُرسَل إلى مُلّاك الإضافة.',
               en: '<b>We do not collect</b>: passwords, authorization headers, cookies, personal data, geolocation logs, or any identifier that identifies you. Everything above stays local and is never sent to the extension authors.' },

    'p.h3': { ar: 'الأذونات وسبب طلبها', en: 'Permissions and why we request them' },
    'p.li5': { ar: '<code>debugger</code> · للوصول إلى Chrome DevTools Protocol وقراءة أحداث الكونسول والشبكة.',
               en: '<code>debugger</code> · to access the Chrome DevTools Protocol and read console / network events.' },
    'p.li6': { ar: '<code>storage</code> · لحفظ تفضيلاتك المحلّيّة (السمة، حالة المرشّحات).',
               en: '<code>storage</code> · to persist your local preferences (theme, filter state).' },
    'p.li7': { ar: '<code>scripting</code> + <code>activeTab</code> · لحقن الواجهة المضمّنة عند طلبها فقط.',
               en: '<code>scripting</code> + <code>activeTab</code> · to inject the embedded UI only when you ask for it.' },
    'p.li8': { ar: '<code>nativeMessaging</code> · للتواصل مع جسر <code>sbay-devtools-bridge</code> الذي يعمل على جهازك.',
               en: '<code>nativeMessaging</code> · to talk to the <code>sbay-devtools-bridge</code> running on your machine.' },
    'p.li9': { ar: '<code>host_permissions: &lt;all_urls&gt;</code> · لأنّ DevTools تحتاج التوصيل بأيّ موقع تعمل عليه أنت.',
               en: '<code>host_permissions: &lt;all_urls&gt;</code> · because DevTools must attach to whatever site you are debugging.' },

    'p.h4': { ar: 'تكامل GitHub Copilot عبر MCP', en: 'GitHub Copilot integration over MCP' },
    'p.p4a': { ar: 'حين تُفعّل جسرَ Copilot، يَصِل خادم MCP المحلّيّ (يعمل على جهازك) بـ <code>gh copilot cli</code>. عند هذه النقطة، ما تطلبه أنت من Copilot قد يُرسَل إلى GitHub وفقًا لسياسة Copilot الخاصّة بك. <b>الإضافة لا ترسل أيّ شيءٍ إلى GitHub بشكلٍ مباشر.</b>',
               en: 'When you enable the Copilot bridge, the local MCP server (running on your device) connects to <code>gh copilot cli</code>. At that point, the prompts you send to Copilot may be forwarded to GitHub according to your own Copilot policy. <b>The extension never sends anything to GitHub directly.</b>' },
    'p.p4b': { ar: 'يمكنك تعطيلُ الجسر في أيّ وقتٍ بإيقاف العمليّة المحلّيّة، وستستمرّ بقيّةُ الأدوات بالعمل.',
               en: 'You can disable the bridge any time by stopping the local process; the rest of the tooling will keep working.' },

    'p.h5': { ar: 'المشاركة مع أطرافٍ ثالثة', en: 'Sharing with third parties' },
    'p.p5':  { ar: 'لا نبيع، لا نؤجّر، ولا نشارك بياناتك. لا تتصل الإضافة بأيّ خدمةٍ خارجيّةٍ تابعةٍ لنا. الاتصالات الوحيدة الخارجة هي تلك التي يبدؤها <code>gh copilot cli</code> بناءً على طلبك أنت.',
               en: 'We do not sell, rent, or share your data. The extension never contacts any external service operated by us. The only outbound connections are those initiated by <code>gh copilot cli</code> at your own request.' },

    'p.h6': { ar: 'حقوقك', en: 'Your rights' },
    'p.p6':  { ar: 'بما أنّنا لا نخزّن بياناتك على خوادمنا، فإنّ التحكّم الكامل بيدك: تعطيل الإضافة، إزالتها، أو مسح تخزينها المحلّيّ من <code>edge://extensions</code> يحذف كلّ شيءٍ فورًا.',
               en: 'Because we store none of your data on our servers, you are in full control: disabling, removing, or clearing the extension’s local storage from <code>edge://extensions</code> erases everything immediately.' },

    'p.h7': { ar: 'التواصل', en: 'Contact' },
    'p.p7':  { ar: 'لأيّ سؤالٍ يخصّ الخصوصيّة، افتح بطاقةً عامّةً على المستودع: <a class="link" href="https://github.com/sbay-dev/EdgeConsole/issues">github.com/sbay-dev/EdgeConsole/issues</a>.',
               en: 'For any privacy-related question, please open a public issue: <a class="link" href="https://github.com/sbay-dev/EdgeConsole/issues">github.com/sbay-dev/EdgeConsole/issues</a>.' }
  };

  const STORAGE_KEY = 'sbay-lang';

  function applyLang(lang) {
    const html = document.documentElement;
    html.lang = lang === 'ar' ? 'ar' : 'en';
    html.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    html.dataset.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const tr = I18N[key];
      if (tr && tr[lang]) el.innerHTML = tr[lang];
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }

  function initLang() {
    let lang;
    try { lang = localStorage.getItem(STORAGE_KEY); } catch {}
    if (!lang) {
      const nav = (navigator.language || 'ar').toLowerCase();
      lang = nav.startsWith('ar') ? 'ar' : 'en';
    }
    applyLang(lang);
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.addEventListener('click', () => {
      const cur = document.documentElement.dataset.lang;
      applyLang(cur === 'ar' ? 'en' : 'ar');
    });
  }

  // ---------- background grid ----------
  function initGrid() {
    const c = document.getElementById('bg-grid');
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, dpr;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.width  = innerWidth  * dpr;
      h = c.height = innerHeight * dpr;
      c.style.width  = innerWidth  + 'px';
      c.style.height = innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    const dots = [];
    const COUNT = 60;
    for (let i = 0; i < COUNT; i++) {
      dots.push({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - .5) * 0.0006,
        vy: (Math.random() - .5) * 0.0006,
        r: 0.6 + Math.random() * 1.2
      });
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);

      // grid
      const gap = 48 * dpr;
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += gap) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += gap) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // dots & connections
      ctx.fillStyle = 'rgba(122,246,255,0.55)';
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > 1) d.vx *= -1;
        if (d.y < 0 || d.y > 1) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, d.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dx = (a.x - b.x), dy = (a.y - b.y);
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 0.012) {
            const alpha = (1 - dist2 / 0.012) * 0.18;
            ctx.strokeStyle = `rgba(124,92,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) tick();
    else { ctx.fillStyle = 'rgba(122,246,255,0.4)'; for (const d of dots) ctx.fillRect(d.x*w, d.y*h, 2, 2); }
  }

  // ---------- typewriter for hero code block ----------
  function initTypewriter() {
    const el = document.querySelector('.codetype');
    if (!el) return;
    const text = el.getAttribute('data-text') || '';
    el.textContent = '';
    let i = 0;
    const step = () => {
      if (i >= text.length) {
        // blink caret forever
        let on = true;
        setInterval(() => {
          on = !on;
          if (el.textContent.endsWith('▍')) el.textContent = el.textContent.slice(0, -1) + (on ? '▍' : ' ');
          else el.textContent = el.textContent + (on ? '▍' : ' ');
        }, 500);
        return;
      }
      el.textContent += text[i++];
      const delay = text[i - 1] === '\n' ? 80 : (12 + Math.random() * 22);
      setTimeout(step, delay);
    };
    setTimeout(step, 500);
  }

  // ---------- reveal on scroll ----------
  function initReveal() {
    const els = document.querySelectorAll('.card, .step, .timeline li, .arch-col, .section-head');
    if (!('IntersectionObserver' in window)) return;
    els.forEach(e => { e.style.opacity = '0'; e.style.transform = 'translateY(14px)'; e.style.transition = 'opacity .6s ease, transform .6s ease'; });
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) {
        en.target.style.opacity = '1';
        en.target.style.transform = '';
        io.unobserve(en.target);
      }
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLang();
    initGrid();
    initTypewriter();
    initReveal();
  });
})();
