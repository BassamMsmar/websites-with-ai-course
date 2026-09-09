/* =====================================================================
   quiz.js — محرك الاختبارات
   يقرأ الأسئلة من window.QUIZ_DATA ويرسمها داخل #quiz.
   شكل السؤال: { scenario?, q, options: [..], answer: index, explain }
   ===================================================================== */
(function () {
  "use strict";

  const KEYS = ["أ", "ب", "ج", "د", "هـ"];

  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach((k) => {
      if (k === "class") e.className = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    if (html != null) e.innerHTML = html;
    return e;
  }

  function Quiz(root, data, lesson) {
    this.root = root;
    this.data = data;
    this.lesson = lesson;
    this.reset();
  }

  Quiz.prototype.reset = function () {
    this.i = 0;
    this.answers = new Array(this.data.length).fill(null);
    this.render();
  };

  Quiz.prototype.score = function () {
    return this.answers.filter((a, i) => a === this.data[i].answer).length;
  };

  Quiz.prototype.render = function () {
    const root = this.root;
    root.innerHTML = "";
    if (this.i >= this.data.length) return this.renderResult();

    const q = this.data[this.i];
    const answered = this.answers[this.i];

    const head = el("div", { class: "quiz-head" });
    head.appendChild(el("h2", { text: "اختبار الدرس", style: "margin:0;font-size:var(--t-lg)" }));
    head.appendChild(el("span", { class: "count", text: (this.i + 1) + " / " + this.data.length }));
    root.appendChild(head);

    const track = el("div", { class: "quiz-track", "aria-hidden": "true" });
    this.data.forEach((item, idx) => {
      const seg = el("i");
      if (this.answers[idx] !== null) seg.className = this.answers[idx] === item.answer ? "ok" : "bad";
      else if (idx === this.i) seg.className = "now";
      track.appendChild(seg);
    });
    root.appendChild(track);

    if (q.scenario) root.appendChild(el("div", { class: "q-scenario", text: q.scenario }));
    const qt = el("p", { class: "q-text", id: "q-text", text: q.q });
    root.appendChild(qt);

    const opts = el("div", { class: "q-options", role: "group", "aria-labelledby": "q-text" });
    q.options.forEach((opt, idx) => {
      const b = el("button", { class: "q-opt", type: "button" });
      b.appendChild(el("span", { class: "key", text: KEYS[idx], "aria-hidden": "true" }));
      b.appendChild(el("span", { text: opt }));
      if (answered !== null) {
        b.disabled = true;
        if (idx === q.answer) b.classList.add("is-correct");
        else if (idx === answered) b.classList.add("is-wrong");
        else b.classList.add("is-dim");
      } else {
        b.addEventListener("click", () => this.answer(idx));
      }
      opts.appendChild(b);
    });
    root.appendChild(opts);

    if (answered !== null) {
      const ok = answered === q.answer;
      const fb = el("div", { class: "q-feedback " + (ok ? "ok" : "bad"), role: "status" });
      fb.appendChild(el("strong", { text: ok ? "إجابة صحيحة" : "إجابة غير صحيحة · الصحيح: " + KEYS[q.answer] }));
      fb.appendChild(el("p", { text: q.explain }));
      root.appendChild(fb);

      const actions = el("div", { class: "q-actions" });
      const next = el("button", { class: "btn", type: "button", text: this.i === this.data.length - 1 ? "عرض النتيجة" : "السؤال التالي" });
      next.addEventListener("click", () => { this.i++; this.render(); this.root.scrollIntoView({ block: "start", behavior: "smooth" }); });
      actions.appendChild(next);
      root.appendChild(actions);
      next.focus({ preventScroll: true });
    } else {
      const first = opts.querySelector("button");
      if (first && this.i > 0) first.focus({ preventScroll: true });
    }
  };

  Quiz.prototype.answer = function (idx) {
    this.answers[this.i] = idx;
    this.render();
  };

  Quiz.prototype.renderResult = function () {
    const root = this.root;
    const s = this.score();
    const total = this.data.length;
    let msg;
    if (s === total) msg = "علامة كاملة. أنت جاهز للدرس التالي.";
    else if (s >= 8) msg = "ممتاز. راجع الأسئلة التي أخطأت فيها ثم انتقل للدرس التالي.";
    else if (s >= 6) msg = "جيد. أعد قراءة تبويب المحتوى للنقاط التي أخطأت فيها وحاول مرة أخرى.";
    else msg = "لا بأس. الاختبار للتعلّم لا للحكم. راجع الدرس وحاول من جديد.";

    if (window.BNM && this.lesson) {
      const prev = window.BNM.lessonState(this.lesson).score;
      window.BNM.updateLesson(this.lesson, { score: typeof prev === "number" ? Math.max(prev, s) : s, lastScore: s, attempts: (window.BNM.lessonState(this.lesson).attempts || 0) + 1 });
    }

    const box = el("div", { class: "q-result", role: "status" });
    box.appendChild(el("div", { class: "score" }, s + " <small>/ " + total + "</small>"));
    box.appendChild(el("p", { text: msg }));

    const actions = el("div", { class: "q-actions" });
    const again = el("button", { class: "btn btn-ghost", type: "button", text: "إعادة المحاولة" });
    again.addEventListener("click", () => this.reset());
    actions.appendChild(again);
    if (s >= 6) {
      const done = el("button", { class: "btn", type: "button", text: "تعليم الدرس كمكتمل" });
      done.addEventListener("click", () => {
        const bar = document.querySelector("[data-complete] button");
        const st = window.BNM.lessonState(this.lesson);
        if (bar && !st.done) bar.click(); else if (window.BNM) window.BNM.toast("الدرس مكتمل مسبقًا");
      });
      actions.appendChild(done);
    }
    box.appendChild(actions);

    const review = el("div", { class: "q-review" });
    review.appendChild(el("h3", { text: "مراجعة الإجابات", style: "font-size:var(--t-base)" }));
    const ol = el("ol");
    this.data.forEach((q, i) => {
      const ok = this.answers[i] === q.answer;
      const li = el("li", { class: ok ? "ok" : "bad" });
      li.innerHTML = "<strong>" + escapeHtml(q.q) + "</strong><br><span style=\"color:var(--muted)\">" +
        (ok ? "صحيح" : "إجابتك: " + escapeHtml(q.options[this.answers[i]]) + " · الصحيح: " + escapeHtml(q.options[q.answer])) + "</span>";
      ol.appendChild(li);
    });
    review.appendChild(ol);
    box.appendChild(review);
    root.appendChild(box);
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* نسخة للطباعة: الأسئلة بلا إجابات، للمذاكرة على الورق */
  function renderPrint(data) {
    const target = document.querySelector(".print-quiz");
    if (!target) return;
    target.innerHTML = "<ol>" + data.map((q) =>
      "<li><strong>" + escapeHtml(q.q) + "</strong><ol type=\"a\">" + q.options.map((o) => "<li>" + escapeHtml(o) + "</li>").join("") + "</ol></li>"
    ).join("") + "</ol>";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("quiz");
    if (!root) return;
    const data = window.QUIZ_DATA;
    const lesson = Number(document.body.dataset.lesson) || null;
    if (!Array.isArray(data) || data.length === 0) {
      root.innerHTML = '<div class="quiz-empty"><p style="margin:0"><strong>الاختبار قيد الإعداد.</strong><br>سيُضاف مع اكتمال محتوى هذا الدرس.</p></div>';
      return;
    }
    new Quiz(root, data, lesson);
    renderPrint(data);
  });
})();
