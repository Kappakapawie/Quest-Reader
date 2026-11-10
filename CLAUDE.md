# CLAUDE.md

Shared memory for every Claude session working on **Quest-Reader**.
Read this file first. Update it before you finish any session where you
changed something future sessions should know about.

## Project status

- **State:** Brand new. The repository had no code when this file was created
  (2026-11-10). This file is the first commit.
- **Purpose:** _Not yet defined by the owner._ The name suggests a reader app
  for quests (e.g. interactive fiction / quest-style stories), but **don't
  assume this.** Ask the owner before you pick a direction.
- **Tech stack:** _Not chosen yet._ When it's decided, record it below under
  "Architecture" along with the commands to build, test and run.

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

_Empty until code exists._ Fill this in with:

- Directory layout and what each top-level folder holds
- Key modules/entry points
- Data model / storage
- External services or APIs

## Commands

_Empty until a stack is chosen._ Fill this in, for example:

```bash
# install dependencies
# run dev server
# run tests
# lint / format
```

## Conventions

- Code style: _to be decided, and enforced with a formatter/linter once chosen_
- Naming: _to be decided_
- Tests: _location and framework to be decided_

## Decisions log

Record important decisions here, newest first, so later sessions don't
reopen them.

| Date       | Decision                                    | Why                                   |
|------------|---------------------------------------------|---------------------------------------|
| 2026-11-10 | Created CLAUDE.md as shared session memory  | Owner asked for a handoff file for future sessions |

## Session handoff notes

Leave short notes for the next session: what you finished, what's half-done,
and any gotchas. Newest first. Delete notes once they're no longer relevant.

- **2026-11-10:** Repo initialized with this CLAUDE.md only. Next step: the
  owner decides the app's purpose and tech stack.
