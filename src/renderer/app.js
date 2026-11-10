'use strict';

// Window logic: the voice picker, speaking quests, and the watch controls.
(function () {
  const { CHARACTERS, rankVoices, speechSettings } = window.QuestVoices;
  const api = window.questReader;
  const synth = window.speechSynthesis;
  const lang = navigator.language || 'en-US';
  const $ = (id) => document.getElementById(id);

  const SAMPLE = 'Traveler, the old road north has gone quiet. Bring me three wolf pelts and I will reward you well.';
  const STORE_KEY = 'questReader.settings';

  const state = Object.assign(
    { character: 'woman', voiceNames: {}, intervalMs: 3000, minWords: 25, displayId: null, volume: 1 },
    load()
  );
  let voices = [];
  let lastQuest = '';
  let watching = false;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* not critical */ }
  }

  // ---- Speaking -----------------------------------------------------------

  // Long utterances get cut off by some engines, so speak sentence by sentence.
  function sentences(text) {
    return text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];
  }

  function speak(text, characterId = state.character) {
    synth.cancel();
    const { voice, pitch, rate } = speechSettings(voices, characterId, lang, state.voiceNames[characterId]);
    for (const part of sentences(text)) {
      const u = new SpeechSynthesisUtterance(part);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.pitch = pitch;
      u.rate = rate;
      u.volume = state.volume;
      synth.speak(u);
    }
  }

  // ---- Voice picker -------------------------------------------------------

  // "Microsoft Aria Online (Natural) - English (United States)" -> "Aria Online (Natural)"
  function shortName(v) {
    return v.name.replace(/^(Microsoft|Apple|Google)\s+/i, '').replace(/\s+-\s+.*$/, '');
  }

  function renderVoices() {
    const box = $('voices');
    box.textContent = '';
    const tpl = $('voice-card');
    for (const [id, c] of Object.entries(CHARACTERS)) {
      const card = tpl.content.firstElementChild.cloneNode(true);
      const radio = card.querySelector('input');
      const select = card.querySelector('select');
      card.querySelector('.name').textContent = c.label;
      radio.value = id;
      radio.checked = state.character === id;
      card.classList.toggle('selected', radio.checked);

      const ranked = rankVoices(voices, id, lang);
      const best = ranked[0];
      select.append(new Option(best ? `Best: ${shortName(best)}` : 'Default voice', ''));
      for (const v of ranked) select.append(new Option(`${shortName(v)} (${v.lang})`, v.name));
      select.value = ranked.some((v) => v.name === state.voiceNames[id]) ? state.voiceNames[id] : '';

      radio.addEventListener('change', () => {
        state.character = id;
        save();
        renderVoices();
      });
      select.addEventListener('change', () => {
        state.voiceNames[id] = select.value;
        save();
      });
      card.querySelector('.test').addEventListener('click', () => speak(SAMPLE, id));
      box.append(card);
    }
    if (!voices.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'No voices found on this computer yet. They may still be loading.';
      box.append(p);
    }
  }

  function loadVoices() {
    voices = synth.getVoices();
    renderVoices();
  }

  // ---- Watching the screen ------------------------------------------------

  function setStatus(text, cls = '') {
    const el = $('status');
    el.textContent = text;
    el.className = `status ${cls}`;
  }

  async function setWatching(on) {
    watching = on;
    if (on) await api.forgetReadQuests();
    await api.updateSettings({ watching: on });
    $('watch').textContent = on ? 'Stop watching' : 'Start watching screen';
    setStatus(on ? 'Watching for quests…' : 'Not watching', on ? 'on' : '');
  }

  api.onQuestFound((text) => {
    lastQuest = text;
    $('quest').textContent = text;
    $('again').disabled = false;
    speak(text);
  });

  api.onScanStatus((s) => {
    if (!watching) return;
    if (s.error) setStatus(`Problem reading screen: ${s.error}`, 'error');
    else setStatus(s.found ? 'Quest found – reading' : 'Watching for quests…', 'on');
  });

  $('watch').addEventListener('click', () => setWatching(!watching));
  $('again').addEventListener('click', () => lastQuest && speak(lastQuest));
  $('stop').addEventListener('click', () => synth.cancel());

  // ---- Settings -----------------------------------------------------------

  async function initSettings() {
    const displaySel = $('display');
    for (const d of await api.getDisplays()) displaySel.append(new Option(d.label, d.id));
    if (state.displayId && [...displaySel.options].some((o) => o.value === state.displayId)) {
      displaySel.value = state.displayId;
    }
    $('interval').value = String(state.intervalMs);
    $('minWords').value = String(state.minWords);
    $('volume').value = String(state.volume);

    displaySel.addEventListener('change', () => {
      state.displayId = displaySel.value;
      save();
      api.updateSettings({ displayId: state.displayId });
    });
    $('interval').addEventListener('change', (e) => {
      state.intervalMs = Number(e.target.value);
      save();
      api.updateSettings({ intervalMs: state.intervalMs });
    });
    $('minWords').addEventListener('change', (e) => {
      state.minWords = Math.max(5, Number(e.target.value) || 25);
      save();
      api.updateSettings({ minWords: state.minWords });
    });
    $('volume').addEventListener('input', (e) => {
      state.volume = Number(e.target.value);
      save();
    });

    await api.updateSettings({
      displayId: displaySel.value || null,
      intervalMs: state.intervalMs,
      minWords: state.minWords,
    });
  }

  synth.addEventListener('voiceschanged', loadVoices);
  loadVoices();
  initSettings();
})();
