/* =====================================================================
   app.js — التبويبات، التقدّم، الوضع الليلي، القائمة الجانبية
   JavaScript خالص بلا مكتبات. كل شيء يُحفظ في localStorage.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- بيانات المادة (مصدر واحد) ---------- */
  const COURSE = {
    title: "بناء ونشر المواقع بالذكاء الاصطناعي",
    lessons: [
      { n: 1,  title: "أنواع المواقع",                        desc: "ثابت أم ديناميكي؟ من يحتاج ماذا ولماذا، وأول موقع تنشره بنفسك.", tag: null,        ladder: 1, ready: true },
      { n: 2,  title: "بطاقتي الشخصية / السيرة الرقمية",       desc: "لماذا رابط بدل PDF؟ وتشريح الملفات الثلاثة.",                   tag: "مشروع 1",  ladder: 2, ready: true },
      { n: 3,  title: "موقع نشاط تجاري",                     desc: "فن كتابة الأمر، الهوية البصرية، RTL والجوال.",                  tag: "مشروع 2",  ladder: 0, ready: true },
      { n: 4,  title: "معرض أعمال",                          desc: "الصور والنصوص بالذكاء الاصطناعي، وتنظيم الملفات والمسارات.",   tag: "مشروع 3",  ladder: 0, ready: true },
      { n: 5,  title: "موقع العروض التقديمية",                desc: "الموقع بديلًا لملف العرض: شرائح وتنقّل ورابط يفتح على أي جهاز.", tag: "مشروع 4",  ladder: 0, ready: true },
      { n: 6,  title: "رفع المواقع (1): Git و GitHub",        desc: "وداعًا «نسخة نهائية 2». المستودع، commit، ثم GitHub Pages.",   tag: null,        ladder: 3, ready: true },
      { n: 7,  title: "رفع المواقع (2): الدومين والاستضافة",  desc: "كيف يصل المتصفح للموقع؟ DNS ولوحة الاستضافة و SSL.",           tag: null,        ladder: 4, ready: true },
      { n: 8,  title: "الفرق بين المواقع والتطبيقات",         desc: "متى يكفيك موقع ومتى تحتاج مختصًا. معرفة لاتخاذ القرار.",       tag: "قرار",     ladder: 0, ready: true },
      { n: 9,  title: "موقع باسمي: الدومين الخاص",            desc: "شراء الدومين وربطه، Cloudflare، وأساسيات SEO.",                tag: null,        ladder: 5, ready: true },
      { n: 10, title: "المشروع الختامي",                      desc: "من الفكرة إلى الإطلاق، ثم العرض أمام المجموعة.",              tag: "مشروع 5",  ladder: 0, ready: true }
    ],
    ladder: [
      { n: 1, name: "رابط الأداة",     lesson: 1 },
      { n: 2, name: "Netlify Drop",    lesson: 2 },
      { n: 3, name: "GitHub Pages",    lesson: 6 },
      { n: 4, name: "استضافة + دومين", lesson: 7 },
      { n: 5, name: "Cloudflare",      lesson: 9 }
    ]
  };

  /* =====================================================================
     جدول فتح الدروس — المكان الوحيد الذي تعدّله
     ---------------------------------------------------------------------
     FIRST_UNLOCK : تاريخ فتح الدرس الأول (سنة، شهر، يوم). الشهر يبدأ من 1.
                    اجعله يوم الاثنين الذي يسبق المحاضرة الأولى.
     EVERY_DAYS   : كل كم يوم يُفتح الدرس التالي. 7 = أسبوعيًا.
     UNLOCK_ALL   : اجعله true لفتح كل الدروس فورًا (المراجعة قبل الاختبار).
     UNLOCK_UP_TO : افتح حتى هذا الرقم يدويًا مهما كان التاريخ. 0 = تجاهله.
     SHIFT        : تأخير أو تقديم درس بعينه بعدد أيام، عند تأجيل محاضرة.
                    مثال: { 4: 7 } يؤخّر الدرس الرابع أسبوعًا وما بعده يبقى كما هو.
     ===================================================================== */
  const SCHEDULE = {
    FIRST_UNLOCK: [2026, 9, 14],
    EVERY_DAYS: 7,
    UNLOCK_ALL: false,
    UNLOCK_UP_TO: 0,
    SHIFT: {}
  };

  const ROOT = document.documentElement.dataset.root || "./";
  const KEY = "bnm-progress-v1";
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- حساب الفتح ---------- */
  // تاريخ فتح الدرس رقم n، بمنتصف ليل التوقيت المحلي
  function unlockDate(n) {
    const [y, m, d] = SCHEDULE.FIRST_UNLOCK;
    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    dt.setDate(dt.getDate() + (n - 1) * SCHEDULE.EVERY_DAYS + (Number(SCHEDULE.SHIFT[n]) || 0));
    return dt;
  }
  function isUnlocked(n) {
    if (SCHEDULE.UNLOCK_ALL) return true;
    if (n <= (Number(SCHEDULE.UNLOCK_UP_TO) || 0)) return true;
    return Date.now() >= unlockDate(n).getTime();
  }
  // «الاثنين 14 سبتمبر» بالأرقام اللاتينية لتبقى مقروءة كبقية أرقام الموقع
  const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  function formatDate(dt) {
    return DAY_NAMES[dt.getDay()] + " " + dt.getDate() + " " + MONTH_NAMES[dt.getMonth()];
  }
  function nextUnlockLesson() {
    return COURSE.lessons.find((l) => !isUnlocked(l.n)) || null;
  }

  /* ---------- التخزين ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { lessons: {} }; }
    catch (e) { return { lessons: {} }; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* وضع خاص أو مساحة ممتلئة */ }
  }
  function lessonState(n) {
    const s = load();
    return s.lessons[n] || {};
  }
  function updateLesson(n, patch) {
    const s = load();
    s.lessons[n] = Object.assign({}, s.lessons[n] || {}, patch);
    save(s);
    refreshProgress();
    return s.lessons[n];
  }
  function completedCount() {
    const s = load();
    return COURSE.lessons.filter((l) => s.lessons[l.n] && s.lessons[l.n].done).length;
  }
  function percent() {
    return Math.round((completedCount() / COURSE.lessons.length) * 100);
  }

  /* ---------- الوضع الليلي ---------- */
  function initTheme() {
    const btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("bnm-theme", next); } catch (e) {}
      btn.setAttribute("aria-label", next === "dark" ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي");
    });
  }

  /* ---------- القائمة على الجوال ---------- */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- حلقة التقدّم وشريط التقدّم ---------- */
  function refreshProgress() {
    const p = percent();
    document.querySelectorAll(".ring").forEach((r) => {
      r.style.setProperty("--p", p);
      const label = r.querySelector("span");
      if (label) label.textContent = p + "%";
      r.setAttribute("aria-label", "نسبة الإنجاز " + p + "%");
      r.setAttribute("title", completedCount() + " من " + COURSE.lessons.length + " دروس");
    });
    document.querySelectorAll("[data-progress-bar]").forEach((b) => { b.style.width = p + "%"; });
    document.querySelectorAll("[data-progress-text]").forEach((t) => { t.textContent = completedCount() + " / " + COURSE.lessons.length; });
    document.querySelectorAll("[data-progress-percent]").forEach((t) => { t.textContent = p + "%"; });
    const s = load();
    document.querySelectorAll("[data-lesson-row]").forEach((row) => {
      const n = Number(row.dataset.lessonRow);
      const st = s.lessons[n];
      const open = isUnlocked(n);
      row.classList.toggle("is-done", !!(st && st.done && open));
      row.classList.toggle("is-locked", !open);
      if (!open) {
        // الصف المحجوب لا يُنقر ولا يُصل إليه بلوحة المفاتيح
        row.setAttribute("aria-disabled", "true");
        row.setAttribute("tabindex", "-1");
        row.setAttribute("title", "يُفتح " + formatDate(unlockDate(n)));
      } else {
        row.removeAttribute("aria-disabled");
        row.removeAttribute("tabindex");
        row.removeAttribute("title");
      }
      const badge = row.querySelector("[data-status]");
      if (badge) {
        if (!open) {
          badge.className = "badge badge-locked";
          badge.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg> يُفتح ' + formatDate(unlockDate(n));
        } else if (st && st.done) {
          badge.className = "badge badge-done";
          badge.innerHTML = typeof st.score === "number" ? "مكتمل · <bdi class=\"num-ltr\">" + st.score + "/10</bdi>" : "مكتمل";
        } else {
          badge.className = "badge";
          badge.textContent = "متاح";
        }
      }
    });
    document.querySelectorAll("[data-side-check]").forEach((c) => {
      const n = Number(c.dataset.sideCheck);
      c.hidden = !(s.lessons[n] && s.lessons[n].done && isUnlocked(n));
    });
    refreshLadder();
    refreshNextUnlockNote();
    refreshHeroCta();
  }

  function refreshLadder() {
    const s = load();
    document.querySelectorAll(".ladder .step").forEach((step) => {
      const lesson = Number(step.dataset.lesson);
      const done = s.lessons[lesson] && s.lessons[lesson].done;
      step.classList.toggle("is-done", !!done);
    });
    const firstOpen = COURSE.ladder.find((l) => !(s.lessons[l.lesson] && s.lessons[l.lesson].done));
    document.querySelectorAll(".ladder .step").forEach((step) => {
      step.classList.toggle("is-current", !!firstOpen && Number(step.dataset.lesson) === firstOpen.lesson);
    });
    const count = document.querySelector("[data-ladder-count]");
    if (count) count.textContent = COURSE.ladder.filter((l) => s.lessons[l.lesson] && s.lessons[l.lesson].done).length + " / 5";
  }

  /* ---------- الشريط الجانبي في صفحة الدرس ---------- */
  function renderSidebar(current) {
    const list = document.querySelector("[data-side-list]");
    if (!list) return;
    // على الحاسب القائمة مفتوحة دائمًا، وعلى الجوال تُطوى
    const details = list.closest("details");
    if (details) {
      const mq = matchMedia("(min-width: 1024px)");
      const sync = () => { details.open = mq.matches; };
      sync();
      mq.addEventListener("change", sync);
    }
    list.innerHTML = COURSE.lessons.map((l) => {
      const open = isUnlocked(l.n);
      const check = `<svg class="check" data-side-check="${l.n}" hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8.5l3 3 7-7"/></svg>`;
      const lock = `<svg class="lock" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>`;
      const inner = `<span class="n">${pad(l.n)}</span><span>${l.title}</span>${open ? check : lock}`;
      return open
        ? `<li><a href="${ROOT}lessons/lesson-${pad(l.n)}.html" ${l.n === current ? 'aria-current="page"' : ""}>${inner}</a></li>`
        : `<li><span class="is-locked" aria-disabled="true" title="يُفتح ${formatDate(unlockDate(l.n))}">${inner}</span></li>`;
    }).join("");
  }

  /* ---------- زر البداية في الرئيسية: يشير إلى أول درس متاح ---------- */
  function refreshHeroCta() {
    const cta = document.querySelector("[data-start-cta]");
    if (!cta) return;
    const s = load();
    const open = COURSE.lessons.filter((l) => isUnlocked(l.n));
    if (!open.length) {
      const first = COURSE.lessons[0];
      cta.setAttribute("aria-disabled", "true");
      cta.setAttribute("href", "#lessons");
      cta.textContent = "تبدأ المادة " + formatDate(unlockDate(first.n));
      return;
    }
    // أول درس متاح لم يكتمل، وإلا آخر درس متاح
    const target = open.find((l) => !(s.lessons[l.n] && s.lessons[l.n].done)) || open[open.length - 1];
    cta.removeAttribute("aria-disabled");
    cta.setAttribute("href", "lessons/lesson-" + pad(target.n) + ".html");
    cta.textContent = (target.n === 1 && !(s.lessons[1] && s.lessons[1].done))
      ? "ابدأ الدرس الأول"
      : "تابع الدرس " + pad(target.n);
  }

  /* ---------- سطر «الدرس القادم يُفتح ...» ---------- */
  function refreshNextUnlockNote() {
    const el = document.querySelector("[data-next-unlock]");
    if (!el) return;
    const next = nextUnlockLesson();
    if (!next) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = 'الدرس القادم <strong>' + pad(next.n) + " · " + next.title +
      "</strong> يُفتح " + formatDate(unlockDate(next.n)) + ".";
  }

  /* ---------- جدول المواعيد في صفحة «عن المادة» ---------- */
  function renderSchedule() {
    const body = document.querySelector("[data-schedule]");
    if (!body) return;
    body.innerHTML = COURSE.lessons.map((l) => {
      const u = unlockDate(l.n);
      const lec = new Date(u); lec.setDate(lec.getDate() + 1);
      const open = isUnlocked(l.n);
      return `<tr class="${open ? "" : "is-locked"}">
        <td><span class="num-ltr">${pad(l.n)}</span></td>
        <td>${l.title}</td>
        <td>${formatDate(u)}</td>
        <td>${formatDate(lec)}</td>
        <td>${open ? '<span class="badge badge-done">مفتوح</span>' : '<span class="badge badge-locked">محجوب</span>'}</td>
      </tr>`;
    }).join("");
  }

  /* ---------- حجب صفحة الدرس نفسها ---------- */
  function gateLessonPage(current) {
    document.documentElement.classList.remove("gate-pending");
    if (!current || isUnlocked(current)) return false;
    const lesson = COURSE.lessons.find((l) => l.n === current);
    const layout = document.querySelector(".lesson-layout");
    if (!layout) return true;
    layout.classList.add("is-gated");
    layout.innerHTML = `
      <div class="locked-screen">
        <svg class="locked-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
        <h1>الدرس <span class="num-ltr">${pad(current)}</span> لم يُفتح بعد</h1>
        <p class="locked-title">${lesson ? lesson.title : ""}</p>
        <p>يُفتح هذا الدرس <strong>${formatDate(unlockDate(current))}</strong>، قبل المحاضرة بيوم. الدروس تُفتح واحدًا كل أسبوع لتسير المجموعة معًا.</p>
        <div class="locked-actions">
          <a class="btn" href="${ROOT}index.html#lessons">الدروس المتاحة الآن</a>
          <a class="btn btn-ghost" href="${ROOT}pages/about.html#schedule">جدول المواعيد كاملًا</a>
        </div>
      </div>`;
    document.title = "الدرس " + pad(current) + " · يُفتح " + formatDate(unlockDate(current));
    return true;
  }

  function renderLessonNav(current) {
    const nav = document.querySelector("[data-lesson-nav]");
    if (!nav) return;
    const prev = COURSE.lessons.find((l) => l.n === current - 1);
    const next = COURSE.lessons.find((l) => l.n === current + 1);
    const link = (l, cls, label) => {
      if (!l) return `<a class="${cls}" aria-disabled="true" href="#"><small>${label}</small><strong>—</strong></a>`;
      if (!isUnlocked(l.n)) return `<a class="${cls}" aria-disabled="true" href="#"><small>${label}</small><strong>${pad(l.n)} · ${l.title}</strong><small>يُفتح ${formatDate(unlockDate(l.n))}</small></a>`;
      return `<a class="${cls}" href="${ROOT}lessons/lesson-${pad(l.n)}.html"><small>${label}</small><strong>${pad(l.n)} · ${l.title}</strong></a>`;
    };
    nav.innerHTML = link(prev, "prev", "الدرس السابق") + link(next, "next", "الدرس التالي");
    if (!next) {
      nav.lastElementChild.outerHTML = `<a class="next" href="${ROOT}index.html"><small>انتهت الدروس</small><strong>العودة إلى الرئيسية</strong></a>`;
    }
  }

  /* ---------- التبويبات ---------- */
  function initTabs(current) {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    let indicator = tablist.querySelector(".tab-indicator");
    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "tab-indicator";
      indicator.setAttribute("aria-hidden", "true");
      tablist.appendChild(indicator);
    }

    function moveIndicator(tab) {
      indicator.style.width = tab.offsetWidth + "px";
      indicator.style.transform = "translateX(" + tab.offsetLeft + "px)";
    }

    function activate(tab, opts) {
      tabs.forEach((t, i) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      moveIndicator(tab);
      if (opts && opts.focus) tab.focus();
      if (current) updateLesson(current, { tab: tab.dataset.tab });
      if (opts && opts.hash) history.replaceState(null, "", "#" + tab.dataset.tab);
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab, { hash: true }));
      tab.addEventListener("keydown", (e) => {
        const i = tabs.indexOf(tab);
        let target = null;
        // في RTL السهم الأيسر يتقدّم والأيمن يرجع
        if (e.key === "ArrowLeft") target = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowRight") target = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") target = tabs[0];
        if (e.key === "End") target = tabs[tabs.length - 1];
        if (target) { e.preventDefault(); activate(target, { focus: true, hash: true }); }
      });
    });

    // التبويب المبدئي: من الرابط، ثم من الذاكرة، ثم الأول
    const fromHash = location.hash.replace("#", "");
    const remembered = current ? lessonState(current).tab : null;
    const initial = tabs.find((t) => t.dataset.tab === fromHash) || tabs.find((t) => t.dataset.tab === remembered) || tabs[0];
    activate(initial);
    window.addEventListener("resize", () => moveIndicator(tabs.find((t) => t.getAttribute("aria-selected") === "true")));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(tabs.find((t) => t.getAttribute("aria-selected") === "true")));

    // روابط داخلية تفتح تبويبًا معيّنًا
    document.querySelectorAll("[data-open-tab]").forEach((el) => {
      el.addEventListener("click", (e) => {
        const t = tabs.find((x) => x.dataset.tab === el.dataset.openTab);
        if (t) { e.preventDefault(); activate(t, { hash: true }); t.scrollIntoView({ block: "nearest" }); }
      });
    });
  }

  /* ---------- زر إكمال الدرس ---------- */
  function initComplete(current) {
    const bar = document.querySelector("[data-complete]");
    if (!bar || !current) return;
    const btn = bar.querySelector("button");
    const text = bar.querySelector("p");
    function paint() {
      const st = lessonState(current);
      bar.classList.toggle("is-done", !!st.done);
      if (st.done) {
        text.innerHTML = "أكملت هذا الدرس" + (typeof st.score === "number" ? " · نتيجة الاختبار <bdi class=\"num-ltr\">" + st.score + "/10</bdi>" : "") + ".";
        btn.textContent = "إلغاء الإكمال";
        btn.className = "btn btn-subtle";
      } else {
        text.textContent = "أنهيت المحتوى والتدريب والاختبار؟ علّم الدرس كمكتمل ليظهر في تقدّمك.";
        btn.textContent = "تعليم الدرس كمكتمل";
        btn.className = "btn";
      }
    }
    btn.addEventListener("click", () => {
      const st = lessonState(current);
      updateLesson(current, { done: !st.done, doneAt: !st.done ? Date.now() : null });
      paint();
      toast(!st.done ? "أُضيف الدرس إلى تقدّمك" : "أُزيل الدرس من تقدّمك");
    });
    paint();
  }

  /* ---------- رسالة عابرة ---------- */
  let toastTimer;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 2400);
  }

  /* ---------- إعادة ضبط التقدّم (صفحة عن المادة) ---------- */
  function initReset() {
    const btn = document.querySelector("[data-reset-progress]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (confirm("سيُمسح تقدّمك ودرجاتك من هذا الجهاز. متأكد؟")) {
        try { localStorage.removeItem(KEY); } catch (e) {}
        refreshProgress();
        toast("تم مسح التقدّم");
      }
    });
  }

  /* ---------- التشغيل ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const current = Number(document.body.dataset.lesson) || null;
    initTheme();
    initNav();
    // الحجب أولًا: إن كان الدرس مغلقًا فلا داعي لبناء تبويباته واختباره
    if (gateLessonPage(current)) { refreshProgress(); return; }
    renderSidebar(current);
    renderLessonNav(current);
    initTabs(current);
    initComplete(current);
    initReset();
    renderSchedule();
    refreshProgress();
  });

  // واجهة صغيرة لمحرك الاختبارات
  window.BNM = { COURSE, lessonState, updateLesson, toast, refreshProgress, pad, ROOT, isUnlocked, unlockDate, formatDate, SCHEDULE };
})();
