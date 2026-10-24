# Haunted Inbox: Cyber Defense Academy · Presentation Notes

Talking points for a 5–7 minute demo. Times are approximate.

**Before you present:** open <https://pariswright.github.io/Haunted-Inbox/>, turn **Judge Mode on**, leave **Music** and **Sound** on, and have a second tab ready with the **AI Threat Analyzer**.

---

## 1. The hook (30 s)

- Open on the title screen with the music playing.
- "Phishing is still how most attacks begin. One click on the wrong link can hand over a password, lock up files with ransomware, or send money to a scammer."
- "Stark State's networks are cursed. Haunted Inbox is a Halloween game where students join the Cyber Defense Academy, cross five haunted regions, and defeat the monsters behind real cyber attacks."

## 2. The problem (45 s)

- Most security training is a slideshow people click through without reading.
- People learn faster when they **make a decision, get immediate feedback, and see why**.
- Students are a real target: fake financial aid, student portal logins, package texts, job offers and "IT support" calls. Every challenge in the game is a Stark State-style scenario.

## 3. Live demo (2–3 min)

1. **Story Mode.** Click **Begin**. Show a few lines of the opening scene with **Dr. Ada Lantern**, **SENTRY** (the Academy's AI) and **Maya Ortiz**, then skip.
2. **World map.** Five regions, each teaching a different attack. Point out the campus infection meter and the boss waiting at the end of each region.
3. **One or two challenges in Region 1 (Haunted Inbox).**
   - Show a **Verdict** (Safe or Suspicious) and a **Link X-ray** (hover to see where a link really goes).
   - Make a call and show the feedback: red flags highlighted on the message, a lesson, and a **real-world tip**.
4. **Boss battle.** With Judge Mode on, click **Skip to boss** to fight **Count Phishula**. Play **indicator cards** for the threats you can see in the attack. A wrong card lets the boss strike back, and three hits in a row land a **critical**.
5. **The finale (optional, if time).** In Region 5 the last boss, **Lord Ransomwrath**, ends with an **incident-response showdown**: play the right response actions in the right order.
6. **AI Threat Analyzer.** Paste a real-looking scam (or click a sample). It returns a 0–100 threat score, names the "monster" behind it, and lists every warning sign. "It runs entirely in the browser, so nothing you paste is sent anywhere."

> Demo tips: Judge Mode unlocks every region and adds "Skip to boss". Press **Esc** to skip a story scene.

## 4. What it teaches (45 s)

| Region | Attack | Boss |
|---|---|---|
| 1. Haunted Inbox | Phishing emails | Count Phishula |
| 2. Dark Web Woods | Social engineering | Hexa the Manipulator |
| 3. Malware Marsh | Malware and unsafe downloads | Malware Maximus |
| 4. Phantom Signal Tower | Text scams and mobile security | Specter Scamshade |
| 5. Crypt of Compromise | Spear phishing, business email compromise, ransomware | Lord Ransomwrath |

- **30 challenges** in six formats: Verdict, Flag Hunt, Link X-ray, Scenario, Thread (chat conversations) and Triage (files and permissions).
- Safe examples are mixed in, because flagging everything is also a mistake.

**The one habit to remember:** *Don't trust the message. Go to the site or the person through a channel you already know.*

## 5. How it's built (1 min)

- One `index.html` file: plain **HTML, CSS and JavaScript**, no frameworks or build tools, hosted free on **GitHub Pages**.
- **All artwork is original SVG**, and the **music and sound effects are generated live** with the Web Audio API. The soundtrack intensifies in boss battles.
- **Progression:** XP, six ranks (Cyber Rookie to Campus Defender), HP, up to 3 stars per region and 24 achievements, all saved in the browser.
- **AI Threat Analyzer:** a rule-based detector that scores a message from 0–100 using phishing indicators like password requests, lookalike domains and pressure language.
- **Built with AI assistance:** we designed the game, the scenarios and the art direction, and used Claude to help write the code.
- Works on phones, supports the keyboard, and respects reduced-motion settings.

## 6. Wrap-up (30 s)

- Next steps: more scenarios written by students, a class leaderboard for instructors, and Spanish and other translations.
- Invite the judges to play on their phones with the link or a QR code to it, and point out the irony: **check where a QR code goes before you scan it.**

---

## Likely questions

**Are the links real?** No. Every person, company, domain and phone number in the challenges is fictional, and links in the game never open.

**Is the "AI" analyzer really AI?** It's a rule-based detector that runs in the browser. It looks for the same red flags the game teaches and explains each one.

**How long does a full playthrough take?** About 30–45 minutes for all five regions. Judge Mode gets you to any boss in under a minute.

**How do you add a challenge?** Each challenge is a data object in the `CONTENT` section of `index.html`, with the message, its red flags, a lesson and a tip.

**Why a game instead of a training video?** Every decision gets instant feedback that shows exactly what you missed, and the boss battles make players apply what they learned.
