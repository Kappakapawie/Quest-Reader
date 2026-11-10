// Picks the most human-sounding voice the computer has for each character
// (woman, man, old man). Uses the free voices built into the operating system
// via the Web Speech API, so there's no account or cost.
//
// Works as a plain <script> in the app (window.QuestVoices) and as a
// CommonJS module in tests.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuestVoices = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // How each character sounds. pitch/rate are applied on top of the chosen
  // voice; the old man is a male voice made deeper and slower.
  const CHARACTERS = {
    woman: { label: 'Woman', gender: 'female', pitch: 1.0, rate: 1.0, preferred: [] },
    man: { label: 'Man', gender: 'male', pitch: 1.0, rate: 1.0, preferred: [] },
    oldMan: {
      label: 'Old man',
      gender: 'male',
      pitch: 0.6,
      rate: 0.82,
      // Voices that already sound older; if one is used we soften the effect.
      preferred: ['grandpa', 'ralph', 'arthur', 'daniel', 'george', 'guy', 'reed', 'rocko', 'gordon'],
      naturallyOld: ['grandpa', 'ralph'],
    },
  };

  const FEMALE_NAMES = [
    'female', 'woman', 'zira', 'jenny', 'aria', 'ava', 'emma', 'michelle', 'ana', 'sara', 'nancy',
    'jane', 'amber', 'ashley', 'cora', 'elizabeth', 'monica', 'libby', 'sonia', 'maisie', 'hazel',
    'susan', 'heera', 'neerja', 'natasha', 'clara', 'catherine', 'linda', 'samantha', 'karen',
    'moira', 'tessa', 'victoria', 'allison', 'serena', 'fiona', 'kate', 'joanna', 'salli',
    'kimberly', 'ivy', 'kendra', 'nicky', 'kathy', 'vicki', 'shelley', 'sandy', 'flo', 'grandma',
    'zoe', 'yuna', 'molly', 'emily', 'olivia', 'sonia', 'veena', 'agnes', 'princess', 'mia',
  ];
  const MALE_NAMES = [
    'male', 'david', 'mark', 'guy', 'george', 'ryan', 'thomas', 'daniel', 'alex', 'fred', 'ralph',
    'arthur', 'aaron', 'tom', 'oliver', 'gordon', 'lee', 'rishi', 'christopher', 'eric', 'roger',
    'steffan', 'andrew', 'brian', 'davis', 'tony', 'jason', 'matthew', 'joey', 'justin', 'russell',
    'liam', 'william', 'james', 'reed', 'rocko', 'eddy', 'grandpa', 'prabhat', 'ravi', 'evan',
    'nathan', 'jacques', 'bruce', 'junior', 'albert', 'conrad', 'connor', 'mitchell', 'noah',
  ];

  function nameTokens(voice) {
    return String(voice.name || '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  }

  // 'female' | 'male' | 'unknown'. Browsers don't report gender, so we
  // recognise common voice names on Windows, macOS, Chrome and Linux.
  function guessGender(voice) {
    const tokens = nameTokens(voice);
    // Check explicit words first: "Google UK English Female" contains "english".
    if (tokens.includes('female')) return 'female';
    if (tokens.includes('male')) return 'male';
    if (tokens.some((t) => FEMALE_NAMES.includes(t))) return 'female';
    if (tokens.some((t) => MALE_NAMES.includes(t))) return 'male';
    return 'unknown';
  }

  // Higher = more human-like. Neural/"natural" voices beat the old robotic ones.
  function naturalness(voice) {
    const n = String(voice.name || '').toLowerCase();
    let score = 0;
    if (/natural|neural/.test(n)) score += 6;
    if (/premium/.test(n)) score += 5;
    if (/enhanced/.test(n)) score += 4;
    if (/online/.test(n)) score += 2;
    if (/google/.test(n)) score += 2;
    if (/espeak|festival|mbrola|robot|whisper|zarvox|trinoids|bells|bahh|boing|bubbles|cellos|wobble|jester|organ|superstar|bad news|good news/.test(n)) score -= 6;
    return score;
  }

  function langScore(voice, preferredLang) {
    const lang = String(voice.lang || '').toLowerCase().replace('_', '-');
    const want = String(preferredLang || 'en-US').toLowerCase();
    if (lang === want) return 3;
    if (lang.split('-')[0] === want.split('-')[0]) return 2;
    return 0;
  }

  function scoreFor(voice, characterId, preferredLang) {
    const c = CHARACTERS[characterId];
    const gender = guessGender(voice);
    let score = naturalness(voice) + langScore(voice, preferredLang) * 2;
    if (gender === c.gender) score += 10;
    else if (gender !== 'unknown') score -= 10;
    const tokens = nameTokens(voice);
    const idx = c.preferred.findIndex((p) => tokens.includes(p));
    if (idx !== -1) score += 3 - idx * 0.1;
    return score;
  }

  // Voices for a character, best first. Only voices in the user's language
  // family are offered so the reader doesn't read English with a French accent.
  function rankVoices(voices, characterId, preferredLang) {
    const family = String(preferredLang || 'en').toLowerCase().split('-')[0];
    const sameLang = voices.filter((v) => String(v.lang || '').toLowerCase().startsWith(family));
    const pool = sameLang.length ? sameLang : voices;
    return pool
      .map((v) => ({ voice: v, score: scoreFor(v, characterId, preferredLang) }))
      .sort((a, b) => b.score - a.score || String(a.voice.name).localeCompare(String(b.voice.name)))
      .map((x) => x.voice);
  }

  // Final speaking settings for a character. `chosenVoiceName` is the user's
  // pick from the dropdown, or empty for "best available".
  function speechSettings(voices, characterId, preferredLang, chosenVoiceName) {
    const c = CHARACTERS[characterId];
    const ranked = rankVoices(voices, characterId, preferredLang);
    const voice = (chosenVoiceName && voices.find((v) => v.name === chosenVoiceName)) || ranked[0] || null;
    let { pitch, rate } = c;
    // A voice that already sounds old needs less pitch drop, or it gets silly.
    if (voice && c.naturallyOld && c.naturallyOld.some((p) => nameTokens(voice).includes(p))) {
      pitch = 0.9;
      rate = 0.9;
    }
    return { voice, pitch, rate };
  }

  return { CHARACTERS, guessGender, naturalness, rankVoices, speechSettings };
});
