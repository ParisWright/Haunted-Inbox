# Haunted Inbox: Presentation Notes

Talking points for a 5–7 minute demo. Times are approximate.

---

## 1. The hook (30 s)

- Open on the landing screen.
- "Phishing is still how most attacks begin. A single click on the wrong email can lead to a stolen password, a ransomware infection or a fraudulent wire transfer."
- "Haunted Inbox turns spotting phishing into a quick Halloween game: 12 emails, 3 hearts, about 4 minutes."

## 2. The problem (45 s)

- Most security training is a slideshow people click through without reading.
- People learn faster when they **make a decision, get immediate feedback, and see why**.
- Real attacks aren't always obvious. The hard ones use lookalike domains, real services and real-sounding requests.

## 3. Live demo (2–3 min)

1. **Begin Investigation.** Point out the HUD: hearts, score, streak, tier.
2. **First email** (Tier 1). Walk through the inspection checklist on the right. Hover a link to show the real destination in the status bar.
3. **Make a call.** Show the feedback panel: the red flags get **numbered and highlighted on the email itself**, plus a one-line lesson.
4. **Show a safe email.** Stress that over-flagging is also a mistake: "Calm Nerves" is a badge for zero false alarms.
5. **Tier up.** After 3 correct, the banner appears ("The haunting intensifies") and the emails get harder:
   - `hoIlowcreek.com` with a capital I
   - `rnailvault.com`, where "rn" looks like "m"
   - A Reply-To that quietly sends your reply somewhere else
6. **Results screen.** Rank, accuracy, false negatives vs false positives, badges, and a case review of every email.

> Demo tip: use the keyboard (← / → / Enter) to keep it fast. Mute the sound if the room is quiet.

## 4. What it teaches (45 s)

Nine techniques across 18 emails:

- Urgency / threats
- Lookalike domains
- Mismatched link text vs destination
- Double-extension attachments (`.pdf.exe`)
- Spoofed sender with a redirected Reply-To
- Business email compromise (gift cards, bank-detail changes)
- CEO fraud
- Abuse of legitimate file-sharing services
- QR-code phishing ("quishing")

**The one habit to remember:** *Don't trust the email; go to the site or person through a channel you already know.*

## 5. How it's built (1 min)

- Plain **HTML, CSS and JavaScript**: no frameworks, no build step, hosted free on **GitHub Pages**.
- **Content is separated from code.** All emails live in `data/emails.json`, so adding a new scenario means editing data, not code.
- **Code is split by responsibility:**
  - `questions.js`: loads the question bank and picks emails by tier
  - `scoring.js`: game rules (points, streak multiplier, speed bonus, tier changes, badges, ranks)
  - `game.js`: everything on screen
- **Adaptive difficulty:** 3 right in a row → harder tier; 2 wrong → easier tier.
- **Saved progress:** best score and badges stored in the browser's `localStorage`.
- **Sound effects** are four small MP3 files in `assets/sounds/` (correct, wrong, badge, tier-up), mapped in one place in `game.js` so they're easy to swap.
- **Background music:** an original music-box soundtrack with one seamless MP3 loop per tier (`assets/sounds/music-*.mp3`). The game crossfades to a faster, spookier loop as the difficulty rises; Nightmare adds a theremin.
- **Accessibility:** full keyboard play, screen-reader labels, reduced-motion support, works on phones.

## 6. Wrap-up (30 s)

- Next steps: more emails, a timer mode, a team leaderboard, translations.
- Invite the audience to play: share the GitHub Pages link or a QR code to it (and make the point that **you should check where a QR code goes before scanning one**).

---

## Likely questions

**Are the links real?** No. Every company, person and domain is fictional, and links never navigate. Hovering only shows the destination.

**Why not just block phishing with filters?** Filters catch most of it, but attackers specifically design emails that slip through (real services, no links, QR codes). People are the last line of defense.

**How do you add questions?** Add an object to `data/emails.json` with the email content, the red flags (`cues`) and a lesson. The README documents the format.

**Why does it say it can't load when I double-click the file?** Browsers block reading local JSON files from `file://`. Use GitHub Pages or `python3 -m http.server`.
