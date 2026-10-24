/* Haunted Inbox: scoring.js
 * Game rules with no DOM code: run length, hearts, points, tier changes,
 * achievements, ranks and the saved player profile (best score, badges).
 */
(function (HI) {
  "use strict";

  HI.RUN = 12;   // emails per investigation
  HI.LIVES = 3;  // hearts
  const STORE_KEY = "hauntedInbox:v1";

  HI.ACHIEVEMENTS = [
    { id: "first", name: "First Fright", desc: "Finish your first investigation", icon: "ghost" },
    { id: "streak5", name: "Ghostbuster", desc: "5 correct calls in a row", icon: "shield" },
    { id: "streak10", name: "Exorcist", desc: "10 correct calls in a row", icon: "flame" },
    { id: "flawless", name: "Flawless Séance", desc: "Finish all 12 with no mistakes", icon: "star" },
    { id: "speed", name: "Speed Demon", desc: "3 correct calls under 5 seconds each", icon: "bolt" },
    { id: "nightmare", name: "Nightmare Survivor", desc: "Reach the Nightmare tier", icon: "moon" },
    { id: "souls", name: "Soul Collector", desc: "Score 3,000 points in one run", icon: "heart" },
    { id: "calm", name: "Calm Nerves", desc: "Finish all 12 with no false alarms", icon: "eye" }
  ];

  HI.RANKS = [
    { min: 95, name: "Phish Exorcist", desc: "Nothing gets past you. The SOC can finally go home before midnight." },
    { min: 80, name: "SOC Night Watch", desc: "Sharp instincts with only a scratch or two. You would make a fine blue teamer." },
    { min: 60, name: "Ghost Hunter", desc: "You can spot the obvious specters. The lookalikes still slip by sometimes." },
    { min: 40, name: "Apprentice Medium", desc: "You sense something is wrong but not always what. Review the red flags below." },
    { min: 0, name: "Lost Soul", desc: "The inbox claimed you this time. Read the case review and try again." }
  ];

  /* Fresh state for one investigation. */
  HI.newState = function () {
    return {
      tier: 1, maxTier: 1, hearts: HI.LIVES, score: 0,
      streak: 0, bestStreak: 0,
      climb: 0,   // correct answers since the last tier change
      miss: 0,    // wrong answers since the last tier change
      answered: 0, correct: 0,
      fp: 0,      // false positives: safe mail flagged as suspicious
      fn: 0,      // false negatives: phish trusted as safe
      fast: 0,    // correct answers made in under 5 seconds
      used: new Set(), current: null, shownAt: 0,
      answers: [], earned: [], locked: false
    };
  };

  /* Apply one answer to the state and return what happened.
   *   Points = tier x 100, x1.5 at a 3-streak, x2 at a 5-streak,
   *   + up to 50 speed bonus (full under 8 s, none after 20 s).
   *   3 correct in a row moves up a tier; 2 misses move down one. */
  HI.scoreAnswer = function (S, email, guessPhish, ms) {
    const correct = guessPhish === email.phish;
    const prevTier = S.tier;
    let pts = 0, base = 0, mult = 1, speed = 0, broke = -1;

    if (correct) {
      S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak);
      S.correct++; S.climb++; S.miss = 0;
      base = email.tier * 100;
      mult = S.streak >= 5 ? 2 : S.streak >= 3 ? 1.5 : 1;
      speed = ms <= 8000 ? 50 : ms >= 20000 ? 0 : Math.round(50 * (20000 - ms) / 12000);
      pts = Math.round(base * mult) + speed;
      if (ms < 5000) S.fast++;
      if (S.climb >= 3 && S.tier < 3) { S.tier++; S.climb = 0; }
    } else {
      S.streak = 0; S.climb = 0; S.miss++;
      broke = S.hearts - 1; S.hearts--;
      if (guessPhish) S.fp++; else S.fn++;
      if (S.miss >= 2 && S.tier > 1) { S.tier--; S.miss = 0; }
    }

    S.maxTier = Math.max(S.maxTier, S.tier);
    S.score += pts; S.answered++;
    S.answers.push({ e: email, guessPhish, correct, pts, ms });
    return { correct, pts, base, mult, speed, ms, broke, tierUp: S.tier > prevTier };
  };

  /* Achievement ids unlocked by the state right after an answer. */
  HI.badgesAfterAnswer = function (S) {
    const ids = [];
    if (S.streak >= 5) ids.push("streak5");
    if (S.streak >= 10) ids.push("streak10");
    if (S.fast >= 3) ids.push("speed");
    if (S.tier === 3) ids.push("nightmare");
    return ids;
  };

  /* Achievement ids unlocked when the run ends. */
  HI.badgesAtEnd = function (S, completed) {
    const ids = ["first"];
    if (completed && S.correct === HI.RUN) ids.push("flawless");
    if (completed && S.fp === 0) ids.push("calm");
    if (S.score >= 3000) ids.push("souls");
    return ids;
  };

  HI.isOver = (S) => S.hearts <= 0 || S.answered >= HI.RUN;
  HI.isCompleted = (S) => S.answered >= HI.RUN && S.hearts > 0;
  HI.accuracy = (S) => (S.answered ? Math.round(S.correct / S.answered * 100) : 0);

  /* Rank by accuracy. A run that ended early can't rank above Ghost Hunter. */
  HI.rankFor = function (acc, completed) {
    let rank = HI.RANKS.find((r) => acc >= r.min);
    if (!completed && rank.min >= 80) rank = HI.RANKS[2];
    return rank;
  };

  /* Saved profile in localStorage; every access is guarded because storage
   * can be blocked (private windows, strict privacy settings). */
  HI.loadProfile = function () {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === "object") return { best: p.best || 0, games: p.games || 0, badges: p.badges || {} };
      }
    } catch (e) {}
    return { best: 0, games: 0, badges: {} };
  };
  HI.saveProfile = function (p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {}
  };
})(window.HauntedInbox = window.HauntedInbox || {});
