/* Study engine: one question per screen, no back button, timing per step, submit to the collector.
   A step is {id, type, ...}. Types: info, radio, check, text, scale, expose, audio, timer, email. */
(function () {
  const cfg = window.STUDY_CONFIG || {};
  const COLLECT_URL = (cfg.collectUrl || "").trim();
  const PREVIEW = !COLLECT_URL;
  const qs = new URLSearchParams(location.search);

  function uid() { const a = new Uint8Array(8); crypto.getRandomValues(a); return Array.from(a, b => b.toString(16).padStart(2, "0")).join(""); }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    for (const kid of kids.flat()) if (kid != null) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return e;
  }

  async function send(rec) {
    try { localStorage.setItem("study-" + rec.study + "-" + rec.rid, JSON.stringify(rec)); } catch (e) {}
    if (PREVIEW) return { preview: true };
    try {
      if (/formspree\.io/.test(COLLECT_URL)) {
        // Formspree: flat JSON, CORS. Fine for a pilot (emails each response); use the Sheet for volume.
        const flat = {}; (function f(o, p) { for (const k in o) { const v = o[k], key = p ? p + "." + k : k; if (v && typeof v === "object" && !Array.isArray(v)) f(v, key); else flat[key] = Array.isArray(v) ? v.join("; ") : v; } })(rec, "");
        const r = await fetch(COLLECT_URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(flat) });
        return r.ok ? { ok: true } : { ok: false, error: "HTTP " + r.status };
      }
      // Google Apps Script web app: text/plain avoids a preflight; the response is opaque by design.
      await fetch(COLLECT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(rec) });
      return { ok: true };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  window.runStudy = function (def) {
    const root = document.getElementById("study");
    if (PREVIEW) {
      document.body.prepend(h("div", { id: "preview-bar" }, h("b", null, "Preview."), " Answers on this page are not being recorded yet."));
    }
    const record = {
      study: def.study, version: def.version || 1, rid: uid(), started: new Date().toISOString(),
      channel: qs.get("c") || "", cell: def.cell || "", cellForced: !!def.cellForced,
      answers: {}, timings: {}, flags: {},
      meta: { ua: navigator.userAgent.slice(0, 160), lang: navigator.language, w: innerWidth, h: innerHeight, preview: PREVIEW, ref: document.referrer.slice(0, 120) }
    };
    if (def.extra) Object.assign(record.answers, def.extra);
    const steps = def.steps.filter(s => s && !s.skip);
    const counted = steps.filter(s => s.type !== "info").length;
    let i = -1, t0 = 0;

    function next(value, flags) {
      if (i >= 0) {
        const s = steps[i];
        record.timings[s.id] = Date.now() - t0;
        if (value !== undefined) record.answers[s.id] = value;
        if (flags) Object.assign(record.flags, flags);
      }
      i++;
      if (i >= steps.length) return finish();
      show();
    }

    function frame(step, body, idx) {
      root.replaceChildren();
      const done = steps.slice(0, idx).filter(s => s.type !== "info").length;
      if (step.type !== "info" && step.type !== "expose") {
        root.append(h("p", { class: "count" }, `${done + 1} of ${counted}`));
        const bar = h("div", { class: "progress" }, h("div"));
        root.append(bar); requestAnimationFrame(() => bar.firstChild.style.width = ((done + 1) / counted * 100) + "%");
      }
      root.append(body);
      window.scrollTo(0, 0);
      const f = root.querySelector("textarea, input[type=text], input[type=email]");
      if (f && window.innerWidth > 640) f.focus();
    }

    function show() {
      const s = steps[i]; t0 = Date.now();
      const r = renderers[s.type];
      if (!r) { console.error("unknown step type", s); return next(); }
      frame(s, r(s), i);
    }

    const renderers = {
      info(s) {
        return h("div", null, h("h1", null, s.title), h("div", { html: s.body }),
          h("div", { class: "actions" }, h("button", { class: "btn", onclick: () => next() }, s.button || "Continue")));
      },
      radio(s) {
        let val = null; const err = h("p", { class: "err" });
        let opts = s.shuffle ? shuffle(s.options) : s.options.slice();
        if (s.last) opts = opts.filter(o => o !== s.last).concat([s.last]);
        const list = h("div", { class: "opts" }, opts.map(o => {
          const inp = h("input", { type: "radio", name: s.id, value: o });
          const lab = h("label", { class: "opt" }, inp, h("span", null, o));
          inp.addEventListener("change", () => { val = o; list.querySelectorAll(".opt").forEach(x => x.classList.remove("selected")); lab.classList.add("selected"); err.textContent = ""; });
          return lab;
        }));
        return h("div", null, h("h2", null, s.q), s.hint ? h("p", { class: "hint" }, s.hint) : null, list, err,
          h("div", { class: "actions" }, h("button", { class: "btn", onclick: () => { if (val == null) { err.textContent = "Pick one to continue."; return; } next(val); } }, "Continue")));
      },
      check(s) {
        const picked = new Set(); const err = h("p", { class: "err" });
        const opts = s.shuffle ? shuffle(s.options) : s.options.slice();
        const boxes = [];
        const list = h("div", { class: "opts" }, opts.map(o => {
          const inp = h("input", { type: "checkbox", value: o });
          const lab = h("label", { class: "opt" }, inp, h("span", null, o));
          inp.addEventListener("change", () => {
            if (inp.checked) { if (s.max && picked.size >= s.max) { inp.checked = false; err.textContent = `Up to ${s.max}.`; return; } picked.add(o); lab.classList.add("selected"); }
            else { picked.delete(o); lab.classList.remove("selected"); }
            err.textContent = "";
            boxes.forEach(b => { if (!b.inp.checked) b.lab.classList.toggle("disabled", !!s.max && picked.size >= s.max); });
          });
          boxes.push({ inp, lab }); return lab;
        }));
        return h("div", null, h("h2", null, s.q), s.hint ? h("p", { class: "hint" }, s.hint) : null, list, err,
          h("div", { class: "actions" }, h("button", { class: "btn", onclick: () => { if (s.required !== false && picked.size === 0) { err.textContent = "Pick at least one."; return; } next(opts.filter(o => picked.has(o))); } }, "Continue")));
      },
      text(s) {
        const err = h("p", { class: "err" });
        const inp = s.multiline === false ? h("input", { type: "text", placeholder: s.placeholder || "", autocomplete: "off", autocapitalize: s.caps || "sentences" })
          : h("textarea", { placeholder: s.placeholder || "", rows: s.rows || 3 });
        const go = () => { const v = inp.value.trim(); if (s.required !== false && !v) { err.textContent = "Type an answer to continue."; return; } next(v); };
        inp.addEventListener("keydown", e => { if (e.key === "Enter" && (s.multiline === false || e.metaKey || e.ctrlKey)) { e.preventDefault(); go(); } });
        return h("div", null, h("h2", null, s.q), s.hint ? h("p", { class: "hint" }, s.hint) : null, inp, err,
          h("div", { class: "actions" }, h("button", { class: "btn", onclick: go }, s.required === false ? "Continue" : "Continue"),
            s.required === false ? h("span", { class: "small" }, "Optional") : null));
      },
      scale(s) {
        let val = null; const err = h("p", { class: "err" });
        const btns = [1, 2, 3, 4, 5].map(n => h("button", { type: "button", onclick: (e) => { val = n; btns.forEach(b => b.classList.remove("selected")); e.currentTarget.classList.add("selected"); err.textContent = ""; } }, n));
        return h("div", null, h("h2", null, s.q), s.hint ? h("p", { class: "hint" }, s.hint) : null,
          h("div", { class: "scale" }, btns), h("div", { class: "scale-labels" }, h("span", null, "1 = " + s.low), h("span", null, "5 = " + s.high)), err,
          h("div", { class: "actions" }, h("button", { class: "btn", onclick: () => { if (val == null) { err.textContent = "Pick a number to continue."; return; } next(val); } }, "Continue")));
      },
      expose(s) {
        const secs = s.seconds || 5; const ring = h("div", { class: "ring" });
        const wrap = h("div", { class: "expose" }, h("p", { class: "hint" }, s.instruction), h("div", { class: "word" }, s.word), ring,
          h("p", { class: "small" }, `${secs} seconds`));
        const start = Date.now();
        const tick = setInterval(() => {
          const p = Math.min(1, (Date.now() - start) / (secs * 1000)); ring.style.setProperty("--p", (p * 100) + "%");
          if (p >= 1) { clearInterval(tick); next(s.word); }
        }, 50);
        return wrap;
      },
      image(s) {
        // Timed static capture: the standard five-second-test stimulus. Picks the mobile capture on narrow screens.
        const secs = s.seconds || 10; const mobile = innerWidth < 700 && s.srcMobile;
        const src = mobile ? s.srcMobile : s.src;
        const ring = h("div", { class: "ring", style: "margin:12px auto 0" });
        const img = h("img", { src, alt: "", style: "display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:8px;background:#000" });
        const wrap = h("div", { style: "text-align:center" }, h("p", { class: "hint" }, s.instruction), img, ring, h("p", { class: "small" }, `${secs} seconds`));
        let started = null;
        const begin = () => {
          if (started) return; started = Date.now();
          const tick = setInterval(() => {
            const p = Math.min(1, (Date.now() - started) / (secs * 1000)); ring.style.setProperty("--p", (p * 100) + "%");
            if (p >= 1) { clearInterval(tick); next(mobile ? "mobile" : "desktop", { exposureSeconds: secs }); }
          }, 50);
        };
        if (img.complete) begin(); else { img.addEventListener("load", begin); img.addEventListener("error", begin); setTimeout(begin, 4000); }
        return wrap;
      },
      audio(s) {
        let played = false, supported = ("speechSynthesis" in window) && ("SpeechSynthesisUtterance" in window);
        const err = h("p", { class: "err" });
        const inp = h("input", { type: "text", placeholder: "Type the name you heard", autocomplete: "off", autocapitalize: "characters", style: "display:none;margin-top:16px" });
        const btn = h("button", { class: "play", type: "button" }, "▶  Play the clip (once)");
        const after = h("div", { style: "display:none" }, h("p", { class: "hint", style: "margin-top:18px" }, s.after || "Now type the company name you heard."), inp);
        function speak() {
          if (played) return; played = true; btn.disabled = true; btn.textContent = "Playing…";
          const u = new SpeechSynthesisUtterance(s.say); u.rate = s.rate || 0.9; u.lang = s.lang || "en-US";
          const voices = speechSynthesis.getVoices(); const v = voices.find(x => /en[-_]US/i.test(x.lang) && /female|samantha|aria|jenny|google us/i.test(x.name)) || voices.find(x => /en[-_]US/i.test(x.lang));
          if (v) u.voice = v;
          u.onend = () => { btn.textContent = "Played"; after.style.display = ""; inp.style.display = ""; inp.focus(); };
          u.onerror = () => { supported = false; btn.textContent = "Clip unavailable"; after.style.display = ""; inp.style.display = ""; };
          speechSynthesis.cancel(); speechSynthesis.speak(u);
          setTimeout(() => { if (after.style.display === "none") { after.style.display = ""; inp.style.display = ""; } }, 6000);
        }
        btn.addEventListener("click", speak);
        if (!supported) { btn.disabled = true; btn.textContent = "Clip unavailable on this device"; after.style.display = ""; inp.style.display = ""; }
        return h("div", null, h("h2", null, s.q), h("p", { class: "hint" }, s.hint || "Turn your sound on. The clip plays once."), btn, after, err,
          h("div", { class: "actions" }, h("button", { class: "btn", onclick: () => {
            const v = inp.value.trim(); if (supported && !played) { err.textContent = "Play the clip first."; return; }
            if (!v && supported) { err.textContent = "Type what you heard to continue."; return; }
            next(v || "", { audioSupported: supported, audioPlayed: played }); } }, "Continue")));
      },
      timer(s) {
        const min = s.minSeconds || 45, total = s.seconds || 120; let opened = 0, started = null, timerId = null;
        const clock = h("div", { class: "big" }, fmt(total)); const err = h("p", { class: "err" });
        const doneBtn = h("button", { class: "btn", disabled: true, onclick: () => { clearInterval(timerId); next(Math.round((Date.now() - started) / 1000), { siteOpened: opened }); } }, s.doneLabel || "I'm done looking");
        const open = h("a", { class: "btn", href: s.url, target: "_blank", rel: "noopener", style: "text-decoration:none;display:inline-block" }, s.openLabel || "Open the website");
        open.addEventListener("click", () => {
          opened++;
          if (!started) {
            started = Date.now();
            timerId = setInterval(() => {
              const left = Math.max(0, total - Math.round((Date.now() - started) / 1000)); clock.textContent = fmt(left);
              if ((Date.now() - started) / 1000 >= min) doneBtn.disabled = false;
              if (left <= 0) { clearInterval(timerId); clock.textContent = "Time's up"; doneBtn.disabled = false; }
            }, 250);
          }
        });
        function fmt(n) { return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); }
        return h("div", null, h("h2", null, s.q), h("div", { html: s.body }), h("div", { class: "actions", style: "margin:18px 0" }, open), clock,
          h("p", { class: "hint" }, s.hint || `Come back to this tab when you're done, or when the clock runs out. The button below unlocks after ${min} seconds.`), err,
          h("div", { class: "actions" }, doneBtn));
      },
    };

    async function finish() {
      record.finished = new Date().toISOString();
      root.replaceChildren(h("h1", null, "Sending…"));
      const res = await send(record);
      const thanks = h("div", { class: "done" },
        h("h1", null, def.thanksTitle || "Thank you."),
        h("div", { html: def.thanks || "<p>That's everything.</p>" }),
        record.answers.email ? h("p", { class: "small" }, def.emailNote || "We'll be in touch once, tomorrow.") : null);
      root.replaceChildren(thanks);
      if (res.preview) {
        const pre = h("pre", { class: "json" }, JSON.stringify(record, null, 2));
        root.append(h("div", { style: "margin-top:24px" }, h("p", { class: "small" }, h("b", null, "Preview mode."), " Nothing was recorded. This is what a response looks like:"),
          h("button", { class: "btn secondary", onclick: () => navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(record, null, 2)) }, "Copy"), pre));
      } else if (!res.ok) {
        root.append(h("p", { class: "small" }, "Your answers were saved on this device but could not be sent (" + res.error + "). Please try again later."));
      }
      if (def.onFinish) def.onFinish(record, res);
    }

    renderers.email = function (s) {
      const inp = h("input", { type: "email", placeholder: "you@example.com", autocomplete: "email" }); const err = h("p", { class: "err" });
      return h("div", null, h("h2", null, s.q), h("p", { class: "hint" }, s.hint), inp, err,
        h("div", { class: "actions" }, h("button", { class: "btn", onclick: () => { const v = inp.value.trim(); if (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { err.textContent = "That doesn't look like an email. Leave it blank to skip."; return; } next(v); } }, s.button || "Finish"), h("span", { class: "small" }, "Optional")));
    };

    next();
  };

  window.studyUtil = { shuffle, uid, send, PREVIEW, qs };
})();
