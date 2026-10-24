# AI Threat Analyzer: feature guide

The AI Threat Analyzer lets players paste any email or text message and get an instant threat assessment. It shows a 0 to 100 threat score, a risk level with a Halloween theme, the threat type, every indicator it found (with the matching text highlighted), an explanation of why the message was flagged, and what to do next. It also keeps an analysis history, offers Clear, Save report and Copy report buttons, and unlocks the **Cyber Detective** achievement on the first analysis.

It looks and feels like an AI assistant, but it is a **deterministic rule-based engine**. There's no model and no API, and nothing leaves the browser. The same input always gives the same score, it runs instantly, and it works offline. This is also how real email filters score spam.

The feature is an add-on. It renders into one new screen container. No existing game system is rebuilt.

---

## 1. Feature architecture

```
 ┌──────────────── Game (existing) ────────────────┐
 │ Title / HUD button "🔍 AI Threat Analyzer"      │
 │   └─► openAnalyzer() ─► show("s-analyzer")      │
 │ unlock("cyber-detective") ◄──────────────┐      │
 └──────────────────────────────────────────┼──────┘
                                            │ onEvent("analyzer:first")
 ┌──────────── threatAnalyzer.js (screen) ──┴──────────────────────────┐
 │ textarea ─► Analyze Threat ─► scanning animation ─► report view     │
 │ history (localStorage) · Clear · Save report (.txt) · Copy report   │
 └───────────────┬─────────────────────────────────────────────────────┘
                 │ ThreatEngine.analyze(text)   (pure function, no DOM)
 ┌───────────────▼────────── threatEngine.js ──────────────────────────┐
 │ 1. parse   : headers (From, Reply-To, Subject, Attachment), links,  │
 │              [text](url) pairs, file names                          │
 │ 2. detect  : sender · language · credentials · financial · links ·  │
 │              attachments · manipulation · writing                   │
 │ 3. score   : sum per category, capped per category, then floors for │
 │              critical signals, capped at 100                        │
 │ 4. classify: risk level + threat type + matching boss               │
 │ 5. explain : "Why this was flagged", what to do, reassuring signs   │
 └───────────────┬─────────────────────────────────────────────────────┘
                 │ reads
          threatRules.js  (all phrases, points, domains, levels, advice)
```

The scoring rules are pure data in `threatRules.js`, so a teammate can tune points, add phrases or add trusted domains without touching any logic.

---

## 2. New files

| File | Purpose |
| --- | --- |
| `js/analyzer/threatRules.js` | Every rule: categories and caps, risk levels, phrase patterns with points and teaching text, brand domains, free-mail providers, link shorteners, risky TLDs and file types, advice per threat type, and the boss each threat type maps to (`window.THREAT_RULES`) |
| `js/analyzer/threatEngine.js` | The scoring engine: `ThreatEngine.analyze(text)` returns a full report. No DOM, so it also runs in Node for tests |
| `js/analyzer/threatAnalyzer.js` | The screen component: `ThreatAnalyzer.mount(container, options)` |
| `css/threat-analyzer.css` | Styles, scoped under `.ta`, using the game's color and font tokens when present |
| `analyzer-demo.html` | Optional standalone preview of the screen. Not needed in production |

---

## 3. Existing files that need modification

| File | Change |
| --- | --- |
| `index.html` `<head>` | Add the `css/threat-analyzer.css` link |
| `index.html` before the game `<script>` | Add the three analyzer scripts (rules, engine, screen), in that order |
| `index.html` inside `#app` | Add one empty `<section id="s-analyzer">` screen |
| `index.html` title screen / HUD | Add the "🔍 AI Threat Analyzer" button(s) |
| Game script, `SCREENS` array | Add `"s-analyzer"` |
| Game script, `ACH` array | Add the Cyber Detective achievement |
| Game script, `unlock()` | One guard so achievements can unlock outside a level run: `if (run) run.newAch.push(id);` |
| Game script, wiring | `openAnalyzer()` / `closeAnalyzer()` and the button listener (about 10 lines) |

---

## 4. HTML components

### Added to `index.html`

```html
<!-- in <head>, after the existing stylesheet -->
<link rel="stylesheet" href="css/threat-analyzer.css">

<!-- inside #app, next to the other screens -->
<section id="s-analyzer" class="screen" hidden aria-label="AI Threat Analyzer"></section>

<!-- title screen, in .cta-row -->
<button class="btn btn-ghost" id="btn-analyzer" type="button">🔍 AI Threat Analyzer</button>

<!-- HUD, in .hud-actions (optional second entry point) -->
<button class="icon-btn" id="btn-hud-analyzer" type="button" aria-label="AI Threat Analyzer">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.39-1.42 1.42-5.39-5.39A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>
</button>

<!-- before the game's own <script> -->
<script src="js/analyzer/threatRules.js"></script>
<script src="js/analyzer/threatEngine.js"></script>
<script src="js/analyzer/threatAnalyzer.js"></script>
```

### Generated by `ThreatAnalyzer.mount()` (for reference)

```
section.ta
├── header.ta-head        sigil · "Cyber Defense Academy · Threat Lab" · h2 "AI Threat Analyzer" · description · Back
├── div.ta-grid
│   ├── div.ta-panel.ta-in    label · textarea#ta-input · character count · sample chips
│   │                         · error line · [Analyze Threat] [Clear analyzer] · privacy note
│   └── div.ta-panel.ta-out   empty state  →  scanning (radar, progress, 7 stages)  →  report:
│        ├── .ta-verdict      animated score gauge · risk badge · themed headline · threat type · boss line
│        ├── Threat indicators found (n)   ✓ label · category · +points · evidence · explanation
│        ├── Why this was flagged          explanation paragraph
│        ├── Reassuring signs              (low scores only)
│        ├── What to do                    3 steps for the threat type
│        ├── Scanned message               the pasted text with each match highlighted by category
│        └── [Save report] [Copy report] [Analyze another] · status · engine footnote
└── div.ta-panel.ta-history   last 10 analyses (score, title, level, type, time) · Clear history
```

---

## 5. CSS styling

All styles are in `css/threat-analyzer.css` and scoped under `.ta`, so they can't affect existing screens. It reuses your game tokens (`--pumpkin`, `--haze`, `--cyber`, `--crypt`, `--display`, `--mono`, and so on), with its own fallbacks so it also works standalone.

| Risk level | Score | Color | Themed headline | Icon |
| --- | --- | --- | --- | --- |
| Safe | 0–24 | Green | All Quiet in the Inbox | Candle |
| Low Risk | 25–49 | Yellow | Minor Ghost Activity | Ghost |
| Suspicious | 50–74 | Orange | Count Phishula Detected | Fangs |
| High Risk | 75–100 | Red (plus an alarm pulse) | Lord Ransomwrath Alert | Skull |

Each indicator category has its own highlight color: sender orange, language yellow, credentials red, financial green, links cyan, attachments violet, manipulation pink, writing grey. The same colors mark the matches in the scanned message. It respects `prefers-reduced-motion` and stacks to one column under 900 px.

---

## 6. JavaScript threat scoring engine

### How a score is built

1. **Parse.** Read the `From`, `Reply-To`, `Subject` and `Attachment` lines when present (pasting without headers works too, and text messages are fine). Collect every link, markdown-style `[text](url)` pair and file name.
2. **Detect.** Run every rule and record each hit with its evidence and position.
3. **Score.** Add up points per category, cap each category, add the categories together, apply floors, then cap the total at 100.
4. **Classify.** Assign the risk level by score and the threat type by which categories dominate.

| Category | Cap | Example rules (points) |
| --- | --- | --- |
| Sender | 25 | Free email posing as an organization (20) · look-alike domain, e.g. `starkstate-mailservice.com`, `rnailvault.com`, `paypa1.com` (20) · display name impersonation (15) · Reply-To mismatch (15) · unusual TLD (10) |
| Language | 15 | Urgent action required (10) · account suspension threat (10) · countdown deadline / limited time (8) · act now (6) |
| Credentials | 25 | Password request (22) · codes, SSN, card or student ID (20) · verify your account (15) · log in to confirm (12) |
| Financial | 25 | Gift cards (20) · bank details change (20) · wire transfer (18) · crypto (18) · small release fee (14) · send the codes (10) · payment demand (8) · invoice (6) |
| Links | 25 | Raw IP address (20) · look-alike domain or brand used as a subdomain (20) · link text ≠ destination (20) · shortened link (15) · `@` trick or punycode (15) · risky TLD (10) · many domains (5) · http (5) · "click here" (5) |
| Attachments | 20 | Double extension such as `.pdf.exe` (20) · executable (20) · macro document `.docm` / `.xlsm` (15) · "enable macros" (15) · `.zip` / `.iso` (12) · `.html` (12) |
| Manipulation | 20 | Ransom or extortion (15) · secrecy (10) · too good to be true (10) · authority figure asking for money (8) · "I'm in meetings" (8) |
| Writing | 10 | Generic greeting (6) · misspellings (6, plus 2 per extra) |

**Floors** keep dangerous single signals from scoring low:
- An executable or double-extension attachment, or a ransom threat: at least 80.
- A login link to a raw IP address: at least 75.
- A business email compromise pattern, or free webmail posing as IT and asking you to log in: at least 60.
- A look-alike domain or mismatched link: at least 55.

**False positives are avoided** by ignoring negated phrases ("we will **never** ask for your password"), treating the real brand domains and your `trustedDomains` as legitimate, and listing "reassuring signs" on low scores.

**Threat types:** Credential Phishing, Business Email Compromise, Payment Fraud, Malware Delivery, Delivery Scam, Prize / Advance-Fee Scam, Ransomware / Extortion, Social Engineering, Suspicious Message, No Threat Detected. Each maps to a Haunted Inbox boss for the themed line (for example, Malware Delivery maps to Malware Maximus).

**Tested results** (the built-in samples plus extra cases):

| Message | Score | Level | Type |
| --- | --- | --- | --- |
| Student email deactivation phish | 81 | High Risk | Credential Phishing |
| PayPal look-alike with card request | 85 | High Risk | Credential Phishing |
| Invoice with `.pdf.exe` attachment | 80 | High Risk | Malware Delivery |
| Ransom note | 80 | High Risk | Ransomware / Extortion |
| CEO gift card request | 60 | Suspicious | Business Email Compromise |
| Gmail "IT Help Desk" quota scare | 60 | Suspicious | Credential Phishing |
| USPS fee text message | 55 | Suspicious | Delivery Scam |
| Pushy free-trial email | 30 | Low Risk | Suspicious Message |
| Real vendor invoice | 6 | Safe | No Threat Detected |
| Real financial aid notice, real PayPal receipt, real IT notice | 0 | Safe | No Threat Detected |

### Report object returned by `ThreatEngine.analyze(text)`

```js
{
  score: 81,
  level: { id: "high", label: "High Risk", theme: "Lord Ransomwrath Alert", icon: "skull", color: "#ff4f6a" },
  type: "Credential Phishing",
  monster: { id: "phishula", name: "Count Phishula", line: "Stealing logins is Count Phishula's signature move." },
  categories: { sender: 20, urgency: 15, credential: 15, financial: 0, links: 25, attachments: 0, manipulation: 0, writing: 6 },
  indicators: [ { category: "sender", id: "lookalike-sender", label: "Look-alike sender domain", points: 20,
                  evidence: "account-security@starkstate-mailservice.com", explain: "starkstate-mailservice.com borrows the name ..." } ],
  explanation: "This email uses a look-alike sender domain ..., creates urgency ..., requests sensitive information ...",
  recommendations: ["Don't click the link or enter any password.", "..."],
  positives: [],                       // reassuring signs, shown for scores under 50
  highlights: [ { start: 6, end: 50, category: "sender" } ],
  meta: { sender, senderName, replyTo, subject, links: [], attachments: [], characters, signalsChecked },
  engine: "Haunted Inbox rule engine v1.0", analyzedAt: "2026-10-24T19:49:00.000Z"
}
```

### Screen API (`window.ThreatAnalyzer`)

| Method | Use |
| --- | --- |
| `mount(container, { onEvent, onBack, storageKey, maxHistory })` | Render into a container. Safe to call again; it won't render twice |
| `analyze(text)` | Run an analysis programmatically |
| `clear()` / `clearHistory()` / `history()` / `count()` | Housekeeping |
| `reportText(report)` | The plain-text report used by Save and Copy |

Events sent to `onEvent(type, detail)`: `analyzer:analyzed {result, count}`, `analyzer:first {result}`, `analyzer:saved`, `analyzer:cleared`, `analyzer:back`.

History is stored in `localStorage["hauntedInbox:analyzer"]` (last 10 reports, without the pasted text). Clear history removes it.

---

## 7. Integration instructions (current Haunted Inbox build)

**Step 1.** Copy `css/threat-analyzer.css` and the `js/analyzer/` folder into the repo.

**Step 2.** Add the HTML from section 4 to `index.html`: the stylesheet link, the `#s-analyzer` section, the title button (and optionally the HUD button), and the three script tags before the game script.

**Step 3.** Register the screen. In the game script:

```js
const SCREENS = ["s-title", "s-story", "s-map", "s-region", "s-battle", "s-end", "s-gallery", "s-analyzer"];
```

**Step 4.** Add the achievement to the end of the `ACH` array:

```js
{ id: "cyber-detective", t: "Cyber Detective", req: "Analyze your first email in the AI Threat Analyzer", d: "Your first case file is open.", icon: "eye", live: true },
```

**Step 5.** Let achievements unlock outside a level. In `unlock()`, change `run.newAch.push(id);` to:

```js
if (run) run.newAch.push(id);
```

Without this guard, unlocking from the title screen (where no run exists yet) throws an error.

**Step 6.** Wire the screen. Add near the other listeners in the wiring section:

```js
let analyzerFrom = "s-title";
function openAnalyzer() {
  analyzerFrom = SCREENS.find((s) => !$(s).hidden) || "s-title";
  ThreatAnalyzer.mount($("s-analyzer"), {
    onBack: closeAnalyzer,
    onEvent: (type) => { if (type === "analyzer:first") unlock("cyber-detective"); }
  });
  show("s-analyzer", "analyzer");
}
function closeAnalyzer() {
  if (analyzerFrom === "s-title" || analyzerFrom === "s-analyzer") { renderTitle(); show("s-title"); }
  else if (analyzerFrom === "s-map") renderMap();
  else show(analyzerFrom);
}
$("btn-analyzer").addEventListener("click", openAnalyzer);
const hudAnalyzer = $("btn-hud-analyzer"); if (hudAnalyzer) hudAnalyzer.addEventListener("click", openAnalyzer);
```

**Step 7 (recommended).** Trust your college's real domains. In `threatRules.js`, add the domains your college actually sends from to `trustedDomains` (the file starts with `starkstate.edu` as a placeholder).

**Step 8 (optional).** Clear analyzer data with "Reset my progress". In the reset handler, add:

```js
try { localStorage.removeItem("hauntedInbox:analyzer"); } catch (e) {}
```

### Notes

- **Save report** downloads a `.txt` file. That works on GitHub Pages and locally. Inside Claude's artifact preview, downloads are blocked by the viewer, so **Copy report** is there as the reliable option; if the clipboard is blocked too, it selects the report text for manual copying.
- Typing in the analyzer never triggers game shortcuts (the textarea stops key events from reaching the game).
- To test the engine without a browser: `node -e 'require("./js/analyzer/threatRules.js"); console.log(require("./js/analyzer/threatEngine.js").analyze("Your account is suspended, verify now: http://bit.ly/x"))'`
