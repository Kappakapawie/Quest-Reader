# CLAUDE.md

Shared memory for every Claude session working on **Quest-Reader**.
Read this file first. Update it before you finish any session where you
changed something future sessions should know about.

## Project status

- **State:** First working version (v0.1.0). Not yet run inside real
  Electron on a real desktop; logic is unit-tested and OCR was tested in Node.
- **Purpose (owner-confirmed):** Desktop app that takes screenshots, detects
  when there's enough text on screen to be a quest (e.g. a game quest
  dialog), and reads it aloud. User picks the narrator voice: woman, man or
  old man.
- **Tech stack:** Electron + tesseract.js (local OCR, English data bundled via
  `@tesseract.js-data/eng`) + the free OS voices via the Web Speech API
  (`speechSynthesis`). Owner chose free voices over paid TTS services.

## How to work in this repo

1. **Read this file first**, then skim `git log --oneline | head -30` to see
   recent work.
2. **Branches:** Work on the branch your session gives you. Never push to
   `main` or to anyone else's branch without explicit permission.
3. **Commits:** Write small, focused commits with clear messages that say
   what changed and why.
4. **Pull requests:** Only open one when the owner asks.
5. **Before you push:** Run the project's lint/test commands (listed below
   once they exist) and make sure they pass.
6. **Ask, don't guess:** If a product decision isn't recorded here, ask the
   owner instead of inventing one.
7. **Keep this file current:** When you add a stack, command, convention or
   important decision, write it here in the same commit.

## Architecture

- `src/main.js` – Electron main process. Captures the chosen screen with
  `desktopCapturer` every N seconds, runs OCR, feeds `QuestTracker`, sends
  found quests to the window over IPC (`quest-found`, `scan-status`).
- `src/questDetector.js` – pure logic: clean OCR text (drop HUD/menu lines),
  decide it's a quest (min word count), wait for two matching captures,
  don't re-read the last 10 quests.
- `src/preload.js` – `window.questReader` bridge (contextIsolation on).
- `src/renderer/` – the window. `voices.js` ranks OS voices per character
  (gender guessed from voice names, "Natural/Neural/Premium" scored higher;
  old man = male voice, pitch 0.6, rate 0.82). `app.js` speaks sentence by
  sentence and stores settings in localStorage.
- No external services; everything runs locally.

## Commands

```bash
npm install   # install dependencies
npm start     # run the app (Electron)
npm test      # unit tests (node:test, files in test/)
```

No linter/formatter set up yet.

## Conventions

- Code style: plain CommonJS JavaScript, no build step, 2-space indent,
  single quotes.
- Naming: camelCase files and functions.
- Tests: `test/*.test.js` with Node's built-in `node:test`. Keep logic in pure
  modules so it can be tested without Electron.

## Decisions log

Record important decisions here, newest first, so later sessions don't
reopen them.

| Date       | Decision                                    | Why                                   |
|------------|---------------------------------------------|---------------------------------------|
| 2026-11-10 | Pin `wasm-feature-detect` to 1.8.0 via `overrides` | 1.10.0 uses `import.source` syntax that Node 22 / Electron can't parse, which breaks tesseract.js |
| 2026-11-10 | Free OS voices (Web Speech API), not paid TTS | Owner's choice; no API key or cost |
| 2026-11-10 | Electron desktop app, quests found by OCR of screenshots | Owner's choice |
| 2026-11-10 | Created CLAUDE.md as shared session memory  | Owner asked for a handoff file for future sessions |

## Session handoff notes

Leave short notes for the next session: what you finished, what's half-done,
and any gotchas. Newest first. Delete notes once they're no longer relevant.

- **2026-11-10:** Built v0.1.0 with the voice picker (woman / man / old man).
  Electron's binary couldn't download in the cloud sandbox, so the app hasn't
  been launched in Electron yet; owner should run `npm start` and report
  back. Known gaps: the app's own window is on screen and gets OCR'd too
  (re-reads are prevented by the "already read" check); no capture-region
  picker; no installer/packaging yet. Windows' built-in voices sound robotic –
  see README for better ones.
