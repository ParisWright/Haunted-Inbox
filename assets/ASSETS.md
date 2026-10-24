# Haunted Inbox: Asset Pack

Every asset used to build Haunted Inbox. All artwork is original SVG drawn for the game, and all music and sound effects are original, generated with the Web Audio API. Nothing here is stock or licensed from someone else, except the fonts noted below.

## 01-logos
| File | What it is |
| --- | --- |
| `haunted-inbox-mark.svg` / `-512.png` / `-1024.png` | The mailbox-ghost logo mark (transparent PNGs) |
| `haunted-inbox-logo-dark-bg.svg` | Full logo with wordmark, for dark backgrounds |
| `haunted-inbox-logo-light-bg.svg` | Full logo with wordmark, for light backgrounds |
| `haunted-inbox-ghost.svg` / `-512.png` | The floating background ghost |

The wordmark uses the Pirata One font. Install it from Google Fonts to edit the logo in design tools.

## 02-characters
SVG and 512 px transparent PNG portraits of the full cast:

| Character | Role |
| --- | --- |
| `lantern` | Dr. Ada Lantern, Director of the Cyber Defense Academy (mentor) |
| `sentry` | S.E.N.T.R.Y., the campus security AI |
| `maya` | Maya Ortiz, a Stark State student |
| `phishula` | Count Phishula, Region 1 boss (phishing) |
| `hexa` | Hexa the Manipulator, Region 2 boss (social engineering) |
| `maximus` | Malware Maximus, Region 3 boss (malware) |
| `scamshade` | Specter Scamshade, Region 4 boss (smishing) |
| `ransomwrath` | Lord Ransomwrath, final boss (ransomware) |

## 03-icons
- `ui-and-regions/`: all 27 game icons as SVG and 512 px PNG (pumpkin orange). These include the region icons (envelope, tree, drop, tower, castle), HUD and button icons, and the lock and skull markers.
- `achievement-seals/`: all 24 achievement badges as they appear in the game, named by achievement id (for example, `phishing-slayer.png` or `legendary.png`).

## 04-backgrounds
- `site/`: the main night-sky background (1080p, 1440p, phone portrait, and a plain sky without the moon and ghosts).
- `story-backdrops/`: the 7 Campus Story Mode scenes at 1920×1080 (campus at night, inbox, woods, marsh, tower, crypt, sunrise), plus each scene's skyline silhouette as an SVG.
- `map/`: the world map as SVG and a 2× PNG.

## 05-audio
| File | Use |
| --- | --- |
| `01-music-tier1-trick.mp3` | Calm theme (title, map, regions, results) |
| `02-music-tier2-treat.mp3` | Faster theme (boss battles) |
| `03-music-tier3-nightmare.mp3` | Final-phase theme with theremin |
| `04-sfx-correct.mp3` … `07-sfx-tier-up.mp3` | Correct, wrong, achievement and level-up sounds |

The music files loop seamlessly. `wav/` holds lossless masters of every sound.

## 06-fonts
JetBrains Mono (Regular and Bold), with its Open Font License. The game also uses **Pirata One** (logo and headings) and **Manrope** (body text). Both are free under the Open Font License; download them from fonts.google.com.

## 07-source
- `index.html`: the complete game in a single file, ready for GitHub Pages.
- `src/`: the same code split into readable pieces:
  - `content.js` holds all 30 challenges and 5 bosses.
  - `game.js` is the game engine.
  - `extra.css` holds the full-campaign styles.
  - `story/` is Campus Story Mode.
  - `analyzer/` is the AI Threat Analyzer.
- `README.md`, `LICENSE` (MIT) and `.gitignore` for the repo.

## 08-docs
- `STORY_MODE.md`: Campus Story Mode architecture, data structures and integration guide.
- `ANALYZER.md`: AI Threat Analyzer architecture, scoring rules and integration guide.

---
All people, companies, domains and phone numbers in the game content are fictional. Team 4 or Legion of Bozo's · Stark State College Halloween Hackathon 2026.
