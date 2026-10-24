# Campus Story Mode: feature guide

Campus Story Mode adds a narrative layer to Haunted Inbox: an opening cinematic, chapter introductions, boss introduction dialogue, boss defeat scenes, transitions between levels, and a final "Campus Saved" cinematic. Story is shown in dialogue boxes with typewriter text, character portraits, and a skip button. A campus infection meter drops from 100% to 0% as the player clears each region, so the player feels the campus being won back.

The feature is an add-on. It draws its own full-screen overlay, so **no existing screen, game logic, boss battle, achievement or UI is regenerated**. The game only calls `StoryMode.trigger()` at five moments and waits for the returned Promise.

---

## 1. Feature architecture

```
 Game code (unchanged logic)                 Campus Story Mode (new)
 ───────────────────────────                 ─────────────────────────────────────────
 Begin pressed ──────────► trigger("game:start")            ┌───────────────────────┐
 Region entered ─────────► trigger("region:enter", {region})│ storyMode.js (engine) │
 Boss about to start ────► trigger("boss:enter", {boss})    │  - picks matching     │
 Boss defeated ──────────► trigger("boss:defeated", {boss}) │    scenes by trigger  │
 Final boss defeated ────► trigger("campaign:complete")     │  - queues + plays     │
        ▲                                                   │  - overlay UI         │
        │  Promise resolves when the player                 │  - typewriter, skip   │
        │  finishes or skips                                │  - saves seen/watched │
        └───────────────────────────────────────────────────└──────────┬────────────┘
                                                                       │ reads
 onEvent(type, detail) ◄── story:start / story:line /        storyScript.js (scenes)
                          story:end / story:music            storyCharacters.js (cast,
   (game reacts: music tier, Lore Keeper achievement)        portraits, backdrops)
                                                             story-mode.css (overlay)
```

**How it works**

- **Data-driven:** every scene lives in `storyScript.js` with a `trigger` (event + optional region or boss). Writing new story never touches the engine.
- **Event in, Promise out:** `trigger()` finds every scene for that event, sorts them by `order` (so a defeat scene runs before its transition), plays them back to back, and resolves. With nothing to play, it resolves immediately, so the game flow never stalls.
- **Self-contained overlay:** `.sm-root` is a fixed full-screen layer at z-index 95. While it's open, it captures the keyboard (Enter or Space to advance, Esc to skip), so game shortcuts can't fire underneath.
- **Its own save:** progress is kept in `localStorage["hauntedInbox:story"]` (seen and watched scene ids, the Story Mode on/off setting, text speed). The game's save format doesn't change.
- **Hooks out:** `onEvent` reports what's happening, so the game can switch music or unlock achievements without the engine knowing anything about them.
- **Accessible:** a `role="dialog"` overlay, `aria-live` text, keyboard-only play, focus returned to the game afterward, and `prefers-reduced-motion` honored (instant text, no flashes or shakes).

---

## 2. New files

| File | Purpose |
| --- | --- |
| `js/story/storyMode.js` | The engine: overlay UI, typewriter, scene queue, triggers, persistence, public API (`window.StoryMode`) |
| `js/story/storyScript.js` | All 21 scenes as data (`window.STORY_SCRIPT`) |
| `js/story/storyCharacters.js` | The cast (`window.STORY_CHARACTERS`), 8 original SVG portraits (`window.STORY_PORTRAITS`) and 7 backdrops (`window.STORY_SETS`) |
| `css/story-mode.css` | Overlay styles, all scoped under `.sm-root` |
| `story-demo.html` | Optional test bench that plays any scene and logs the events. Not needed in production |

They're plain scripts (not ES modules) on purpose: they work from `file://`, on GitHub Pages, and inside a single-file build.

---

## 3. Existing files that must be modified

Only the game's HTML and the game script change, and only at these points:

| File | Change |
| --- | --- |
| `index.html` `<head>` | Add one `<link>` for `css/story-mode.css` |
| `index.html` before the game's own `<script>` | Add three `<script src>` tags (characters, script, engine), in that order |
| Game script, startup | One `StoryMode.init({...})` call |
| Game script, Begin button | Wrap the jump to the map in `trigger("game:start")` |
| Game script, entering a region | Wrap the region start in `trigger("region:enter")` |
| Game script, before a boss battle | Wrap `startBattle` in `trigger("boss:enter")` |
| Game script, boss victory | Replace the old victory scene call with `trigger("boss:defeated")` |
| Game script, after the final boss | Add `trigger("campaign:complete")` before the ending screen |
| Title settings panel (optional) | A "Story Mode" toggle wired to `StoryMode.setEnabled()` |
| Old story code (optional cleanup) | The previous `STORY` object, `playScene()` and the `#s-story` screen are no longer called and can be deleted |

---

## 4. Data structures

### Scene (`STORY_SCRIPT.scenes[id]`)

```js
"boss-phishula": {
  trigger: { event: "boss:enter", boss: "phishula" }, // required
  once: false,          // true = plays only the first time (opening, transitions)
  set: "inbox",         // backdrop: campus-night | inbox | woods | marsh | tower | crypt | sunrise
  music: "boss",        // calm | tense | boss | victory, sent to onEvent("story:music")
  letterbox: true,      // cinematic bars (default true)
  lines: [ /* Line objects */ ]
}
```

`trigger.event` is one of `game:start`, `region:enter` (with `region`), `boss:enter` (with `boss`), `boss:defeated` (with `boss` and `order`), or `campaign:complete`. When several scenes match one event, they play in ascending `order`.

### Line

```js
{ type: "say", who: "phishula", mood: "sneer", text: "Ah. A fresh recruit." }   // dialogue box + portrait
{ type: "narrate", text: "The inbox goes silent.", fx: "lightning" }            // centered cinematic caption
{ type: "alert", text: "Student email: RESTORED.", meter: 80, glitch: false }   // S.E.N.T.R.Y. terminal alert
{ type: "card", kicker: "Chapter 2", text: "Dark Web Woods", hold: 2400 }       // big title card, auto-advances
```

| Field | Values |
| --- | --- |
| `type` | `say` (default), `narrate`, `alert`, `card` |
| `who` | A key of `STORY_CHARACTERS` (`say` lines only) |
| `mood` | `sneer`, `angry`, `defeated`, `happy`, `worried`, `glitch`: portrait animation |
| `fx` | `lightning`, `shake`, `glitch`, or an array of them |
| `meter` | 0 to 100: shows and animates the campus infection meter |
| `set` / `music` | Change the backdrop or music mood mid-scene |
| `hold` | Milliseconds before auto-advancing (cards default to 2,800) |
| `tag` | Alert header text (default "S.E.N.T.R.Y. alert") |

### Character (`STORY_CHARACTERS[id]`)

```js
phishula: { name: "Count Phishula", title: "Lord of Stolen Logins", side: "right", color: "#ff7a1a", villain: true }
```

`side: "right"` puts the portrait and hero art on the right, which is used for villains. `color` tints the name, portrait frame and box border.

### Saved state (`localStorage["hauntedInbox:story"]`)

```json
{ "seen": ["opening", "intro-r1"], "watched": ["opening"], "enabled": true, "speed": "normal" }
```

`seen` means the scene was shown (watched or skipped); `watched` means it played to the end without a skip.

### Public API (`window.StoryMode`)

| Method | Returns | Use |
| --- | --- | --- |
| `init(options)` | `StoryMode` | Once at startup. Options: `onEvent`, `audio`, `portraits`, `characters`, `sets`, `script`, `storageKey` |
| `trigger(event, ctx)` | `Promise<[{id, skipped}]>` | At each story moment; `ctx` is `{ region }` or `{ boss }`; add `replay: true` to ignore `once` |
| `play(id)` | `Promise` | Play one scene directly (for a "Replay story" menu) |
| `isPlaying()` | boolean | Guard game input if needed |
| `setEnabled(bool)` / `isEnabled()` | | The Story Mode toggle; when off, `trigger()` resolves immediately |
| `setSpeed("slow" \| "normal" \| "fast")` / `getSpeed()` | | Typewriter speed |
| `hasSeen(id)` / `hasWatched(id)` / `allWatched(ids?)` | boolean | Achievements such as Lore Keeper |
| `reset()` | | Clears seen and watched scenes (call it from the game's "Reset my progress") |

`onEvent(type, detail)` receives `story:start {id}`, `story:line {id, index, line}`, `story:music {mood, id}` and `story:end {id, skipped}`.

---

## 5. Implementation code

The complete code is in the four new files listed above. Nothing else needs to be generated.

---

## 6. Integration instructions

These steps use the function names in the current Haunted Inbox build. If your names differ, the hook points are the same five moments.

### Step 1: copy the files

```
your-repo/
├── index.html
├── css/story-mode.css
└── js/story/
    ├── storyCharacters.js
    ├── storyScript.js
    └── storyMode.js
```

### Step 2: load them in `index.html`

In `<head>`, after the existing stylesheet:

```html
<link rel="stylesheet" href="css/story-mode.css">
```

Just before the game's own `<script>` block:

```html
<script src="js/story/storyCharacters.js"></script>
<script src="js/story/storyScript.js"></script>
<script src="js/story/storyMode.js"></script>
```

### Step 3: initialize (game script, next to `renderTitle(); renderHUD(); show("s-title");`)

```js
StoryMode.init({
  // Reuse the game's own Phishula art so the portrait matches the battle screen exactly (optional).
  portraits: { phishula: ART.phishula },
  // Typewriter blip through the game's existing sound-effects helper; respects the game's mute setting.
  audio: { blip: () => tone([880], .02, "square", .012) },
  onEvent: (type, d) => {
    if (type === "story:music") music.setTier({ calm: 1, tense: 2, boss: 3, victory: 1 }[d.mood] || 1);
    if (type === "story:end" && StoryMode.allWatched(["opening", "intro-r1", "boss-phishula", "defeat-phishula", "to-r2"])) unlock("lore-keeper");
  }
});
```

For the full five-region campaign, call `StoryMode.allWatched()` with no argument to require every scene.

### Step 4: hook the five story moments

**a. Opening cinematic (Begin button).** Replace the existing Begin handler body:

```js
$("btn-begin").addEventListener("click", () => {
  syncMusic();
  StoryMode.trigger("game:start").then(renderMap);   // plays once, then goes straight to the map
});
```

**b. Level introduction (`enterRegion`).** Replace the `playScene("intro-r1", ...)` call:

```js
function enterRegion(regionId = "r1") {
  run = newRun(); music.setTier(1);
  StoryMode.trigger("region:enter", { region: regionId }).then(() => {
    show("s-region", "region"); loadChallenge(0);
  });
}
```

**c. Boss introduction (before the battle).** Add a wrapper and use it where the boss is entered from the region: in `regionDone()` and on the Judge Mode "Skip to boss" button. Leave the defeat screen's **Retry** calling `startBattle()` directly so the intro doesn't repeat.

```js
function enterBoss(bossId = "phishula") {
  StoryMode.trigger("boss:enter", { boss: bossId }).then(startBattle);
}
// in regionDone():            startBattle();  ->  enterBoss("phishula");
// in renderTrack(), Skip button: b.addEventListener("click", startBattle)  ->  b.addEventListener("click", () => enterBoss("phishula"));
```

The battle's own entrance animation (lightning plus the name card) still plays after the dialogue. That's intentional: dialogue first, then the monster arrives.

**d. Boss defeat + transition (`victory`).** Replace the line `setTimeout(() => playScene("victory-r1", renderEnd), 1400);` with:

```js
setTimeout(() => StoryMode.trigger("boss:defeated", { boss: "phishula" }).then(renderEnd), 1400);
```

This plays the defeat scene, then the transition to the next region (the transition only the first time).

**e. Final victory cinematic (after Lord Ransomwrath).** When the final boss exists, chain the finale before the ending screen:

```js
StoryMode.trigger("boss:defeated", { boss: "ransomwrath" })
  .then(() => StoryMode.trigger("campaign:complete"))
  .then(showCampusSavedEnding);
```

### Step 5 (optional): a Story Mode setting

In the title screen's settings panel, next to Judge Mode:

```html
<div class="switch"><div><b>Story Mode</b><span>Cinematics and dialogue between levels and bosses.</span></div>
<button class="toggle" id="tg-story" type="button" aria-pressed="true" aria-label="Story Mode"></button></div>
```

```js
const tgStory = $("tg-story");
tgStory.setAttribute("aria-pressed", String(StoryMode.isEnabled()));
tgStory.addEventListener("click", () => { StoryMode.setEnabled(!StoryMode.isEnabled()); tgStory.setAttribute("aria-pressed", String(StoryMode.isEnabled())); });
```

Also add `StoryMode.reset();` inside the existing "Reset my progress" handler so story progress resets with everything else.

### Step 6 (optional): remove the old story code

Once the hooks above are in, these are unused: the `STORY` object, `playScene`, `showLine`, `storyNext`, `endScene`, the `#s-story` section, the `Enter`-key branch for `s-story` in the keydown handler, and `save.seen`/`save.watched`. Removing them is safe but not required.

### Adding regions 2 to 5 later

Their scenes are already written. When a region is built, call `enterRegion("r2")`, `enterBoss("hexa")` and `trigger("boss:defeated", { boss: "hexa" })`. The boss ids are `phishula`, `hexa`, `maximus`, `scamshade` and `ransomwrath`.

### Testing

Open `story-demo.html` to play any scene, the whole campaign in order, or with Story Mode turned off. It logs every event the game would receive.
