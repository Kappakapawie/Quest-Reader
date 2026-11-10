'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { cleanOcrText, QuestTracker, similarity } = require('../src/questDetector');

const QUEST = `Wolves at the Gate
The wolves of Greywood have grown bold. Last night they took two of
our sheep and nearly took the shepherd's boy. Hunt them down and bring
back six pelts as proof. Do this and the village will not forget you.
Accept   Decline
HP 1450/1450  [=] 12:04`;

test('cleanOcrText keeps sentences and drops UI noise', () => {
  const text = cleanOcrText(QUEST);
  assert.match(text, /^Wolves at the Gate The wolves of Greywood/);
  assert.match(text, /will not forget you\.$/);
  assert.doesNotMatch(text, /Accept|1450|12:04/);
});

test('tracker waits for the quest to be stable, reads once, then ignores repeats', () => {
  const t = new QuestTracker();
  assert.strictEqual(t.push(QUEST), null, 'first sighting waits');
  assert.ok(t.push(QUEST), 'second matching sighting is read');
  assert.strictEqual(t.push(QUEST), null, 'not read again');
  assert.strictEqual(t.push('HP 1450 Mana 300'), null);
  assert.strictEqual(t.push(QUEST), null, 'still remembered after it disappears');
});

test('short text is not a quest', () => {
  const t = new QuestTracker();
  const short = 'Press E to open the door now please';
  t.push(short);
  assert.strictEqual(t.push(short), null);
});

test('similarity tolerates small OCR differences', () => {
  assert.ok(similarity(cleanOcrText(QUEST), cleanOcrText(QUEST.replace('sheep', 'shcep'))) > 0.8);
});
