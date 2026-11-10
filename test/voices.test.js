'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { guessGender, rankVoices, speechSettings } = require('../src/renderer/voices');

const v = (name, lang = 'en-US') => ({ name, lang });
const WINDOWS = [v('Microsoft David - English (United States)'), v('Microsoft Zira - English (United States)'),
  v('Microsoft Mark - English (United States)'), v('Microsoft Aria Online (Natural) - English (United States)'),
  v('Microsoft Guy Online (Natural) - English (United States)'), v('Microsoft Hortense - French (France)', 'fr-FR')];
const MAC = [v('Samantha'), v('Daniel', 'en-GB'), v('Grandpa (English (US))'), v('Grandma (English (US))'),
  v('Ava (Premium)'), v('Bad News')];

test('guessGender reads common voice names', () => {
  assert.strictEqual(guessGender(v('Google UK English Female')), 'female');
  assert.strictEqual(guessGender(v('Google UK English Male')), 'male');
  assert.strictEqual(guessGender(v('Microsoft Zira - English (United States)')), 'female');
  assert.strictEqual(guessGender(v('Grandpa (English (US))')), 'male');
});

test('picks natural voices of the right gender on Windows', () => {
  assert.match(rankVoices(WINDOWS, 'woman', 'en-US')[0].name, /Aria Online \(Natural\)/);
  assert.match(rankVoices(WINDOWS, 'man', 'en-US')[0].name, /Guy Online \(Natural\)/);
  assert.ok(!rankVoices(WINDOWS, 'man', 'en-US').some((x) => x.lang === 'fr-FR'), 'other languages left out');
});

test('old man is a deeper, slower male voice', () => {
  const s = speechSettings(WINDOWS, 'oldMan', 'en-US');
  assert.match(s.voice.name, /Guy/);
  assert.ok(s.pitch < 1 && s.rate < 1);
});

test('old man uses macOS Grandpa with a lighter effect', () => {
  const s = speechSettings(MAC, 'oldMan', 'en-US');
  assert.match(s.voice.name, /Grandpa/);
  assert.ok(s.pitch > 0.6);
  assert.match(speechSettings(MAC, 'woman', 'en-US').voice.name, /Ava \(Premium\)/);
});

test('user choice overrides the automatic pick', () => {
  const s = speechSettings(WINDOWS, 'man', 'en-US', 'Microsoft David - English (United States)');
  assert.match(s.voice.name, /David/);
});
