/* Haunted Inbox: game.js
 * Everything the player sees and touches: screens, rendering each email,
 * buttons and keyboard controls, sound effects, toasts and the results page.
 * Rules live in scoring.js; the email bank lives in questions.js.
 */
(function (HI) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const RUN = HI.RUN, LIVES = HI.LIVES, TIER = HI.TIER_NAMES;

  /* SVG path data for badge seals and hearts. */
  const ICONS = {
    ghost: "M12 2a8 8 0 0 0-8 8v12l3-2 2.5 2 2.5-2 2.5 2 2.5-2 3 2V10a8 8 0 0 0-8-8zM9 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
    shield: "M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5z",
    flame: "M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-3 2-4.5 2-7 1.5 1 2.5 2.5 2.5 4 1-2 1.5-5 .5-8z",
    star: "M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z",
    bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
    moon: "M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5z",
    heart: "M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z",
    eye: "M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
  };

  /* ---------------- helpers ---------------- */
  const $ = (id) => document.getElementById(id);
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svgIcon(d) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d); p.setAttribute("fill", "currentColor"); p.setAttribute("fill-rule", "evenodd");
    s.append(p);
    return s;
  }
  const fmt = (n) => n.toLocaleString("en-US");
  const isNarrow = () => window.matchMedia("(max-width: 900px)").matches;

  let EMAILS = [];          // filled from data/emails.json at startup
  let profile = HI.loadProfile();
  let S = null;             // state of the current investigation

  /* ---------------- sound ----------------
   * Sound effects are MP3 files in assets/sounds/. Swap any file for your own
   * sound (keep the same name) and the game will play it. */
  const SOUND_FILES = {
    good: "assets/sounds/correct.mp3",   // correct answer
    bad: "assets/sounds/wrong.mp3",      // wrong answer
    badge: "assets/sounds/badge.mp3",    // achievement unlocked
    tier: "assets/sounds/tier-up.mp3"    // difficulty tier goes up
  };
  const VOLUME = 0.8;
  let muted = false;
  const sounds = {};
  for (const [key, src] of Object.entries(SOUND_FILES)) {
    const a = new Audio(src);
    a.preload = "auto";
    sounds[key] = a;
  }
  function play(key) {
    if (muted || !sounds[key]) return;
    try {
      // Clone so the same sound can overlap itself if triggered quickly.
      const a = sounds[key].cloneNode();
      a.volume = VOLUME;
      const p = a.play();
      if (p && p.catch) p.catch(() => {}); // ignore autoplay blocks / missing files
    } catch (e) {}
  }
  /* ---------------- background music ----------------
   * One looping MP3 per difficulty tier, in assets/sounds/. When the tier
   * changes the game crossfades to that tier's track. The on/off choice is
   * remembered. Loops are decoded with the Web Audio API so they repeat
   * without a gap (an <audio loop> element leaves a small pause with MP3s). */
  let actx = null, musicOn = true;
  try { musicOn = localStorage.getItem("hauntedInbox:music") !== "off"; } catch (e) {}
  function getCtx() {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) { actx = null; }
    return actx;
  }

  const MUSIC_FILES = {
    1: "assets/sounds/music-trick.mp3",      // Tier 1 · Trick
    2: "assets/sounds/music-treat.mp3",      // Tier 2 · Treat (a little faster, extra sparkle)
    3: "assets/sounds/music-nightmare.mp3"   // Tier 3 · Nightmare (fastest, adds a theremin)
  };
  const MUSIC_VOLUME = 0.45;  // kept under the sound effects
  const FADE = 1.5;           // seconds to crossfade between tiers

  const music = (() => {
    const loading = {};
    let bus = null, cur = null, playing = false, tier = 1;
    function load(n) {
      if (!loading[n]) {
        loading[n] = fetch(MUSIC_FILES[n])
          .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
          .then((data) => new Promise((res, rej) => actx.decodeAudioData(data, res, rej)))
          .catch((e) => { loading[n] = null; throw e; });
      }
      return loading[n];
    }
    function fadeOut(track, secs) {
      if (!track) return;
      try {
        const t = actx.currentTime;
        track.gain.gain.cancelScheduledValues(t);
        track.gain.gain.setValueAtTime(track.gain.gain.value, t);
        track.gain.gain.linearRampToValueAtTime(0.0001, t + secs);
        track.src.stop(t + secs + 0.05);
      } catch (e) {}
    }
    function playTier(n) {
      if (!playing || (cur && cur.tier === n)) return;
      load(n).then((buffer) => {
        if (!playing || tier !== n || (cur && cur.tier === n)) return; // something changed while loading
        const t = actx.currentTime, src = actx.createBufferSource(), gain = actx.createGain();
        src.buffer = buffer; src.loop = true;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(1, t + FADE);
        src.connect(gain).connect(bus);
        src.start(t);
        fadeOut(cur, FADE);
        cur = { src, gain, tier: n };
      }).catch(() => {}); // missing file or opened from disk: just stay silent
    }
    return {
      get playing() { return playing; },
      start() {
        if (playing) return;
        const ctx = getCtx(); if (!ctx) return;
        if (!bus) { bus = ctx.createGain(); bus.gain.value = MUSIC_VOLUME; bus.connect(ctx.destination); }
        playing = true;
        playTier(tier);
        [1, 2, 3].forEach((n) => load(n).catch(() => {})); // warm up the other tiers
      },
      stop() {
        if (!playing) return;
        playing = false;
        fadeOut(cur, 0.6); cur = null;
      },
      setTier(n) { tier = n; playTier(n); }
    };
  })();
  const NOTE = "M12 3v10.55A4 4 0 1 0 14 17V7h4V3z";
  function syncMusic() { if (musicOn && !muted) music.start(); else music.stop(); renderMusic(); }
  function renderMusic() {
    const b = $("music"); b.textContent = ""; b.append(svgIcon(NOTE)); b.classList.toggle("off", !musicOn);
    b.setAttribute("aria-pressed", String(musicOn)); b.setAttribute("aria-label", musicOn ? "Turn music off" : "Turn music on");
    const l = $("music-landing"); l.textContent = ""; l.append(svgIcon(NOTE), document.createTextNode(musicOn && music.playing ? "Music playing" : musicOn ? "Play music" : "Music off"));
    l.setAttribute("aria-pressed", String(musicOn && music.playing));
  }
  function toggleMusic(forceOn) {
    musicOn = forceOn === true ? true : !musicOn;
    if (musicOn && muted) { muted = false; renderMute(); }
    try { localStorage.setItem("hauntedInbox:music", musicOn ? "on" : "off"); } catch (e) {}
    syncMusic();
  }

  const sfx = {
    good: () => play("good"),
    bad: () => play("bad"),
    badge: () => play("badge"),
    tier: () => play("tier")
  };
  function renderMute() {
    const b = $("mute"); b.textContent = "";
    b.append(svgIcon(muted ? "M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6" : "M4 9h4l5-4v14l-5-4H4zM16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13"));
    const p = b.querySelector("path");
    p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor"); p.setAttribute("stroke-width", "2"); p.setAttribute("stroke-linecap", "round");
    b.setAttribute("aria-pressed", String(muted));
    b.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
  }

  /* ---------------- screens ---------------- */
  function show(id) {
    ["landing", "game", "results"].forEach((s) => {
      const n = $(s); n.hidden = s !== id;
      if (s === id) { n.classList.remove("screen"); void n.offsetWidth; n.classList.add("screen"); }
    });
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
  function renderRecords() {
    const r = $("records"); r.textContent = "";
    [["Best score", fmt(profile.best)], ["Investigations", profile.games], ["Badges", Object.keys(profile.badges).length + " / " + HI.ACHIEVEMENTS.length]]
      .forEach(([k, v]) => { const d = el("div", "record"); d.append(el("small", null, k), el("strong", null, String(v))); r.append(d); });
  }

  /* ---------------- game ---------------- */
  function startGame() {
    if (!EMAILS.length) return;
    S = HI.newState();
    music.setTier(1); syncMusic();
    renderHearts(); updateHUD();
    show("game");
    loadEmail();
  }

  function renderHearts(breakIndex = -1) {
    const h = $("hearts"); h.textContent = "";
    for (let i = 0; i < LIVES; i++) {
      const s = svgIcon(ICONS.heart);
      if (i >= S.hearts) s.classList.add("lost");
      if (i === breakIndex) s.classList.add("breaking");
      h.append(s);
    }
    h.setAttribute("aria-label", S.hearts + " of " + LIVES + " hearts left");
  }

  function updateHUD(pop) {
    const sc = $("score"); sc.textContent = fmt(S.score);
    if (pop) { sc.classList.remove("score-pop"); void sc.offsetWidth; sc.classList.add("score-pop"); }
    $("streak").textContent = S.streak;
    const shown = Math.min(S.answered + (S.locked ? 0 : 1), RUN);
    $("progress-label").textContent = "Email " + shown + " of " + RUN;
    $("bar-fill").style.width = (S.answered / RUN * 100) + "%";
    $("bar").setAttribute("aria-valuenow", S.answered);
    const tp = $("tier-pill"); tp.dataset.tier = S.tier; tp.textContent = "Tier " + S.tier + " · " + TIER[S.tier];
  }

  /* Body paragraphs can contain {link0} placeholders and a {qr} line. Links
   * are buttons that only reveal their destination; they never navigate. */
  function fillBody(container, e) {
    e.body.forEach((para) => {
      if (para === "{qr}") {
        const q = el("div", "qr"); q.setAttribute("role", "img"); q.setAttribute("aria-label", "QR code");
        container.append(q); return;
      }
      const p = el("p");
      para.split(/(\{link\d\})/).forEach((part) => {
        const m = part.match(/^\{link(\d)\}$/);
        if (m) {
          const L = e.links[+m[1]];
          const a = el("button", "mlink flaggable", L.text); a.type = "button"; a.id = "f-link" + m[1];
          const reveal = () => { const sb = $("statusbar"); sb.textContent = "Link goes to: "; sb.append(el("b", null, L.href)); };
          a.addEventListener("mouseenter", reveal);
          a.addEventListener("focus", reveal);
          a.addEventListener("click", () => { reveal(); $("statusbar").append(document.createTextNode("  (links are disabled during the investigation)")); });
          p.append(a);
        } else if (part) p.append(document.createTextNode(part));
      });
      container.append(p);
    });
  }

  function loadEmail() {
    const e = HI.pickEmail(EMAILS, S.tier, S.used);
    if (!e) return endGame();
    S.current = e; S.used.add(e.id); S.locked = false;

    $("f-from").textContent = "";
    $("f-from").append(el("span", "sname", e.from[0] + " "), el("span", "addr", "<" + e.from[1] + ">"));
    $("row-replyTo").hidden = !e.replyTo;
    $("f-replyTo").textContent = "";
    if (e.replyTo) $("f-replyTo").append(el("span", "addr", e.replyTo));
    $("f-date").textContent = e.date;
    $("f-subject").textContent = e.subject;
    const body = $("f-body"); body.textContent = ""; fillBody(body, e);

    const at = $("f-attach"); at.textContent = "";
    (e.attach || []).forEach((f, i) => {
      const c = el("span", "att flaggable"); c.id = "f-attach" + i;
      c.append(svgIcon("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 0v6h6"), el("span", null, f.name), el("small", null, f.size));
      at.append(c);
    });
    at.hidden = !(e.attach && e.attach.length);
    $("statusbar").textContent = (e.links && e.links.length) ? "Hover or tap a link to see where it really goes." : "No links in this message.";

    const w = $("mailwin"); w.classList.remove("in", "shake", "glow", "redglow"); void w.offsetWidth; w.classList.add("in");
    $("btn-safe").disabled = false; $("btn-sus").disabled = false;
    $("verdicts").hidden = false; $("next-row").hidden = true;
    $("feedback").hidden = true; $("checklist-panel").hidden = false;
    updateHUD();
    S.shownAt = performance.now();
  }

  function answer(guessPhish) {
    if (!S || S.locked || !S.current) return;
    S.locked = true;
    const e = S.current;
    const r = HI.scoreAnswer(S, e, guessPhish, performance.now() - S.shownAt);
    music.setTier(S.tier);

    $("btn-safe").disabled = true; $("btn-sus").disabled = true;
    const w = $("mailwin"); w.classList.remove("in"); void w.offsetWidth;
    w.classList.add(r.correct ? "glow" : "redglow");
    if (!r.correct) w.classList.add("shake");
    renderHearts(r.broke); updateHUD(r.correct);
    r.correct ? sfx.good() : sfx.bad();
    markCues(e);
    showFeedback(e, r);

    HI.badgesAfterAnswer(S).forEach(earn);
    if (r.tierUp) setTimeout(() => tierBanner("The haunting intensifies", "Tier " + S.tier + " · " + TIER[S.tier]), 450);

    $("verdicts").hidden = true; $("next-row").hidden = false;
    $("btn-next").firstChild.textContent = HI.isOver(S) ? "See results " : "Next email ";
    $("btn-next").focus({ preventScroll: true });
  }

  /* Highlight each part of the email a cue refers to, with a numbered marker. */
  function markCues(e) {
    const cls = e.phish ? "flagged-bad" : "flagged-good", mcls = e.phish ? "bad" : "good";
    e.cues.forEach(([t], i) => {
      const id = t === "link0" ? "f-link0" : t === "attach0" ? "f-attach0" : "f-" + t;
      const node = $(id); if (!node) return;
      node.classList.add(cls);
      let box = node.querySelector(":scope > .markers");
      if (!box) { box = el("span", "markers"); node.append(box); }
      box.append(el("span", "marker " + mcls, String(i + 1)));
    });
  }

  function showFeedback(e, d) {
    const f = $("feedback"); f.textContent = "";
    const head = el("div", "fb-head");
    head.append(el("h3", "fb-title " + (d.correct ? "ok" : "no"), d.correct ? "Correct call" : "Wrong call"));
    head.append(el("span", "fb-points", d.correct ? "+" + fmt(d.pts) : "−1 heart"));
    head.querySelector("h3").style.cssText = "font-family:var(--body);letter-spacing:0;text-transform:none;font-size:22px;margin:0";
    f.append(head);
    f.append(el("p", "fb-truth", e.phish ? "This email was a phish." : "This email was safe."));

    const ch = el("div", "chips");
    if (d.correct) ch.append(el("span", "chip", "Base " + d.base), el("span", "chip", "Streak ×" + d.mult), el("span", "chip", "Speed +" + d.speed), el("span", "chip", (d.ms / 1000).toFixed(1) + "s"));
    else ch.append(el("span", "chip", e.phish ? "You trusted a phish" : "False alarm on safe mail"));
    f.append(ch);

    f.append(el("p", "lesson", e.lesson));
    const t = el("h3", null, e.phish ? "Red flags" : "Why it is safe"); t.style.marginTop = "4px"; f.append(t);
    const ul = el("ul", "cues");
    e.cues.forEach(([target, text], i) => {
      const li = el("li");
      li.append(el("span", "marker " + (e.phish ? "bad" : "good"), String(i + 1)));
      const s = el("span"); s.append(el("em", null, HI.TARGET_LABEL[target]), document.createTextNode(text));
      li.append(s); ul.append(li);
    });
    f.append(ul);
    $("checklist-panel").hidden = true; f.hidden = false;
    if (isNarrow()) setTimeout(() => f.scrollIntoView({ behavior: "smooth", block: "nearest" }), 250);
  }

  function next() {
    if (!S || !S.locked) return;
    if (HI.isOver(S)) return endGame();
    loadEmail();
    if (isNarrow()) $("mailwin").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------- achievements ---------------- */
  function earn(id) {
    if (S.earned.includes(id)) return;
    const first = !profile.badges[id];
    S.earned.push(id);
    if (first) {
      profile.badges[id] = Date.now(); HI.saveProfile(profile);
      toast(HI.ACHIEVEMENTS.find((a) => a.id === id));
    }
  }
  function toast(a) {
    sfx.badge();
    const t = el("div", "toast"), seal = el("div", "seal"), txt = el("div");
    seal.append(svgIcon(ICONS[a.icon]));
    txt.append(el("small", null, "Badge unlocked"), el("strong", null, a.name));
    t.append(seal, txt); $("toasts").append(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 450); }, 3200);
  }
  function tierBanner(big, small) {
    sfx.tier();
    const b = el("div", "tier-banner");
    b.append(document.createTextNode(big), el("small", null, small));
    document.body.append(b);
    setTimeout(() => b.remove(), 2300);
  }

  /* ---------------- end + results ---------------- */
  function endGame() {
    const completed = HI.isCompleted(S);
    music.setTier(1);
    HI.badgesAtEnd(S, completed).forEach(earn);
    const prevBest = profile.best;
    profile.games++; profile.best = Math.max(profile.best, S.score); HI.saveProfile(profile);
    renderResults(completed, S.score > prevBest && S.score > 0);
    show("results");
  }

  function renderResults(completed, newBest) {
    const acc = HI.accuracy(S);
    $("r-score").textContent = fmt(S.score);
    const nb = $("r-newbest"); nb.textContent = "";
    if (newBest) nb.append(el("span", "newbest", "New best score"));
    const rank = HI.rankFor(acc, completed);
    $("r-rank").textContent = rank.name; $("r-rank-desc").textContent = rank.desc;
    $("r-reason").textContent = completed ? "You sorted all " + RUN + " emails before midnight." : "Your hearts ran out after " + S.answered + " emails.";
    $("r-acc").textContent = acc + "%";
    $("r-acc-detail").textContent = S.correct + " of " + S.answered + " calls correct";
    const ring = $("ring"); ring.style.strokeDashoffset = "263.9";
    requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = String(263.9 * (1 - acc / 100)); }));
    $("r-streak").textContent = S.bestStreak;
    $("r-tier").textContent = S.maxTier; $("r-tier-name").textContent = TIER[S.maxTier];
    $("r-fn").textContent = S.fn; $("r-fp").textContent = S.fp;

    const bg = $("r-badges"); bg.textContent = "";
    HI.ACHIEVEMENTS.forEach((a, i) => {
      const thisRun = S.earned.includes(a.id), ever = !!profile.badges[a.id];
      const b = el("div", "badge" + (thisRun ? " fresh" : "") + (!ever ? " locked" : ""));
      const seal = el("div", "seal" + (!ever ? " locked" : thisRun ? "" : " past"));
      seal.append(svgIcon(ICONS[a.icon]));
      if (thisRun) seal.style.animationDelay = (i * 0.08) + "s";
      const txt = el("div");
      if (thisRun) txt.append(el("em", null, "Earned this run")); else if (ever) txt.append(el("em", null, "Earned before"));
      txt.append(el("strong", null, a.name), el("span", null, a.desc));
      b.append(seal, txt); bg.append(b);
    });

    const rv = $("r-review"); rv.textContent = "";
    S.answers.forEach((r) => {
      const row = el("div", "rv");
      row.append(el("span", "mk " + (r.correct ? "ok" : "no"), r.correct ? "✓" : "✕"));
      const s = el("span", "subj", r.e.subject); s.title = r.e.subject; row.append(s);
      row.append(el("span", "call", "You: " + (r.guessPhish ? "Suspicious" : "Safe") + " · Truth: " + (r.e.phish ? "Phish" : "Safe")));
      rv.append(row);
    });
  }

  /* ---------------- wiring ---------------- */
  function buildChecklist() {
    const ul = $("checklist");
    HI.CHECKLIST.forEach(([b, t]) => {
      const li = el("li"), s = el("span");
      s.append(el("b", null, b + ". "), document.createTextNode(t));
      li.append(svgIcon("M11 4a7 7 0 1 0 4.9 12l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"), s);
      ul.append(li);
    });
  }
  function goHome() { renderRecords(); show("landing"); }

  function showLoadError(err) {
    const box = $("load-error");
    box.textContent = "";
    const fromDisk = location.protocol === "file:";
    box.append(el("strong", null, "The haunted mail could not be delivered. "));
    if (fromDisk) {
      box.append(document.createTextNode("Browsers block loading data/emails.json from a file opened directly. Run a local server in this folder, e.g. "));
      box.append(el("code", null, "python3 -m http.server"));
      box.append(document.createTextNode(", then open http://localhost:8000."));
    } else {
      box.append(document.createTextNode("(" + err.message + ")"));
    }
    box.hidden = false;
    $("begin").disabled = true;
  }

  $("begin").addEventListener("click", startGame);
  $("again").addEventListener("click", startGame);
  $("to-start").addEventListener("click", goHome);
  $("home-link").addEventListener("click", goHome);
  $("home-link-2").addEventListener("click", goHome);
  $("btn-safe").addEventListener("click", () => answer(false));
  $("btn-sus").addEventListener("click", () => answer(true));
  $("btn-next").addEventListener("click", next);
  $("mute").addEventListener("click", () => { muted = !muted; renderMute(); syncMusic(); });
  $("music").addEventListener("click", () => toggleMusic());
  $("music-landing").addEventListener("click", () => toggleMusic(musicOn && !music.playing ? true : undefined));
  document.addEventListener("visibilitychange", () => { try { if (!actx) return; document.hidden ? actx.suspend() : actx.resume(); } catch (e) {} });
  document.addEventListener("keydown", (ev) => {
    if (!S || $("game").hidden || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.key === "ArrowLeft" && !S.locked) { ev.preventDefault(); answer(false); }
    else if (ev.key === "ArrowRight" && !S.locked) { ev.preventDefault(); answer(true); }
    else if (ev.key === "Enter" && S.locked && document.activeElement !== $("btn-next")) { ev.preventDefault(); next(); }
  });

  buildChecklist(); renderMute(); renderMusic(); renderRecords();
  HI.loadEmails("data/emails.json")
    .then((list) => { EMAILS = list; })
    .catch(showLoadError);
})(window.HauntedInbox);
