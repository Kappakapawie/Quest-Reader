# Quest Reader

A desktop app that watches your screen, spots quest text (for example a quest
dialog in a game), and reads it out loud in the voice you pick.

## Use it

```bash
npm install
npm start
```

1. Pick a narrator: **Woman**, **Man** or **Old man**. Press **Test** to hear it.
   Each one also has a dropdown if you want a different voice from your computer.
2. Press **Start watching screen**, then open a quest in your game.
3. When enough text appears and stays on screen, it's read aloud once.
   **Read again** repeats it, **Stop talking** stops it.

Settings let you pick which screen to watch, how often to check, and how many
words count as a quest.

## Voices

Voices are free and come from your operating system, so what you hear
depends on what's installed. The app picks the most human-sounding one for
each narrator. The old man is a male voice made deeper and slower; on a Mac
it uses the built-in "Grandpa" voice when it's there.

To get better-sounding voices:

- **macOS:** System Settings → Accessibility → Spoken Content → System voice →
  Manage Voices. Download "Premium" or "Enhanced" English voices (e.g. Ava,
  Zoe, Evan, Nathan).
- **Windows:** the built-in voices (David, Zira, Mark) sound robotic. Windows
  11's newer "natural" voices aren't visible to apps by default; the
  open-source NaturalVoiceSAPIAdapter tool makes them available.
- **Linux:** needs `speech-dispatcher`; voices are basic.

## Notes

- Screen reading (OCR) runs on your computer. No screenshots leave your machine.
- On macOS, allow screen recording for the app when asked
  (System Settings → Privacy & Security → Screen Recording).
- Only English text is detected for now.
