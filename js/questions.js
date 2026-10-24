/* Haunted Inbox: questions.js
 * The question bank. Loads the emails from data/emails.json and picks which
 * email the player sees next, based on their current difficulty tier.
 *
 * Everything is attached to one shared namespace, window.HauntedInbox (HI),
 * so the three scripts can share code without a build step.
 */
(function (HI) {
  "use strict";

  /* Tier number -> name shown in the HUD. */
  HI.TIER_NAMES = { 1: "Trick", 2: "Treat", 3: "Nightmare" };

  /* Which part of the email each red flag ("cue") points at. */
  HI.TARGET_LABEL = {
    from: "Sender",
    replyTo: "Reply-To",
    subject: "Subject",
    body: "Message body",
    link0: "Link",
    attach0: "Attachment"
  };

  /* The six-point inspection checklist in the side panel. */
  HI.CHECKLIST = [
    ["Sender address", "Is the domain exactly right, letter by letter?"],
    ["Reply-To", "Do replies go somewhere other than the sender?"],
    ["Links", "Hover. Does the real destination match the text?"],
    ["Attachments", "Watch for double extensions and odd file types."],
    ["Pressure", "Deadlines, secrecy, threats or prizes?"],
    ["The ask", "Passwords, payment, gift cards or bank changes?"]
  ];

  /* Fisher-Yates shuffle; returns a new array. */
  HI.shuffle = function (arr) {
    const r = arr.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };

  /* Fetch the email bank. Needs the page to be served over http(s):
   * browsers block fetch() for pages opened straight from disk (file://). */
  HI.loadEmails = async function (url) {
    const res = await fetch(url || "data/emails.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Could not load emails (HTTP " + res.status + ")");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("emails.json must be a non-empty array");
    return data;
  };

  /* Pick an unused email, preferring the player's current tier and falling
   * back to the nearest tiers if that pool is empty. Returns null when every
   * email has been used. */
  HI.pickEmail = function (emails, tier, used) {
    const order = [tier, tier - 1, tier + 1, tier - 2, tier + 2].filter((t) => t >= 1 && t <= 3);
    for (const t of order) {
      const pool = emails.filter((e) => e.tier === t && !used.has(e.id));
      if (pool.length) return HI.shuffle(pool)[0];
    }
    return null;
  };
})(window.HauntedInbox = window.HauntedInbox || {});
