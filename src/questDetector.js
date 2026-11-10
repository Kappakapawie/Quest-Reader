'use strict';

// Turns raw OCR text from a screenshot into "quest text" worth reading aloud,
// and decides when that text is new enough to read.
// Pure functions only, so they can be unit-tested without Electron.

const DEFAULTS = {
  minWords: 25, // fewer words than this is UI noise, not a quest
  minLineWords: 3, // lines shorter than this are menus/buttons/labels
  minLetterRatio: 0.7, // share of a line's characters that must be letters/punctuation
  stableSimilarity: 0.8, // same text seen twice in a row = dialog finished appearing
  repeatSimilarity: 0.6, // this similar to something already read = don't read again
};

function words(text) {
  return (text.toLowerCase().match(/[a-z']+/g) || []).filter((w) => w.length > 1);
}

// Keep only lines that look like sentences. Drops HUD numbers, menu items,
// OCR garbage from icons, etc.
function cleanOcrText(raw, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const kept = [];
  for (const line of String(raw || '').split(/\r?\n/)) {
    const trimmed = line.replace(/\s+/g, ' ').trim();
    if (!trimmed) continue;
    const lineWords = trimmed.split(' ').filter((w) => /[A-Za-z]{2,}/.test(w));
    if (lineWords.length < o.minLineWords) continue;
    const nonSpace = trimmed.replace(/\s/g, '');
    const good = (nonSpace.match(/[A-Za-z.,;:!?'"\-()’]/g) || []).length;
    if (good / nonSpace.length < o.minLetterRatio) continue;
    kept.push(trimmed);
  }
  // Join wrapped lines into flowing text so speech doesn't pause at every line.
  return kept
    .join(' ')
    .replace(/(\w)- (\w)/g, '$1$2') // re-join hyphenated line breaks
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / (A.size + B.size - shared);
}

function looksLikeQuest(text, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  return words(text).length >= o.minWords;
}

// Stateful wrapper: feed it every OCR result; it returns text to speak
// (or null) once a quest has appeared, settled, and hasn't been read yet.
class QuestTracker {
  constructor(opts = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.previous = '';
    this.recentlyRead = [];
  }

  setOptions(opts) {
    Object.assign(this.opts, opts);
  }

  reset() {
    this.previous = '';
    this.recentlyRead = [];
  }

  push(rawOcrText) {
    const text = cleanOcrText(rawOcrText, this.opts);
    const prev = this.previous;
    this.previous = text;

    if (!looksLikeQuest(text, this.opts)) return null;
    // Wait for two matching captures so we don't read a half-drawn dialog.
    if (similarity(text, prev) < this.opts.stableSimilarity) return null;
    if (this.recentlyRead.some((r) => similarity(text, r) >= this.opts.repeatSimilarity)) return null;

    this.recentlyRead.push(text);
    if (this.recentlyRead.length > 10) this.recentlyRead.shift();
    return text;
  }
}

module.exports = { DEFAULTS, cleanOcrText, similarity, looksLikeQuest, QuestTracker, words };
