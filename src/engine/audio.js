// ══════════════════════════════════════════
// Audio / SFX Engine (Web Audio API)
// ══════════════════════════════════════════

let ctx = null;
let bgmSource = null;
let bgmGain   = null;
let bgmActive = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, type, duration, vol = 0.15, delay = 0) {
  const c   = getCtx();
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.connect(g); g.connect(c.destination);
  osc.type      = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  g.gain.setValueAtTime(vol, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration + 0.05);
}

function chord(freqs, type, duration, vol = 0.1, delay = 0) {
  freqs.forEach(f => tone(f, type, duration, vol, delay));
}

// ── Procedural BGM ──
function createBGM(bpm, notes) {
  const c      = getCtx();
  const gain   = c.createGain();
  gain.gain.value = 0.07;
  gain.connect(c.destination);

  const beat = 60 / bpm;
  let t = c.currentTime + 0.1;

  function scheduleLoop() {
    notes.forEach(([freq, dur, offset]) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.connect(g); g.connect(gain);
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.6, t + offset * beat);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset * beat + dur * beat);
      osc.start(t + offset * beat);
      osc.stop(t + offset * beat + dur * beat + 0.02);
    });
    t += notes.reduce((max, [,,o]) => Math.max(max, o), 0) * beat + beat;
  }

  return { gain, scheduleLoop };
}

// ── SFX API ──
export const SFX = {
  select()        { tone(880, 'sine', 0.08, 0.12); tone(1320, 'sine', 0.08, 0.12, 0.07); },
  hit()           { tone(220, 'sawtooth', 0.12, 0.18); },
  superEffective(){ chord([440, 554, 659], 'square', 0.2, 0.12); tone(880, 'sine', 0.15, 0.1, 0.1); },
  notEffective()  { tone(180, 'triangle', 0.18, 0.12); tone(140, 'triangle', 0.14, 0.1, 0.1); },
  immune()        { tone(200, 'triangle', 0.22, 0.1); },
  fire()          { [480, 520, 560, 600].forEach((f, i) => tone(f + Math.random() * 40, 'sawtooth', 0.08, 0.08, i * 0.03)); },
  water()         { [600, 750, 900].forEach((f, i) => tone(f, 'sine', 0.1, 0.09, i * 0.04)); },
  electric()      { [1200, 1500, 1800].forEach((f, i) => tone(f, 'square', 0.06, 0.1, i * 0.02)); tone(300, 'sawtooth', 0.14, 0.08, 0.05); },
  psychic()       { [660, 880, 1100].forEach((f, i) => tone(f, 'sine', 0.15, 0.08, i * 0.05)); },
  ghost()         { [150, 200, 250].forEach((f, i) => tone(f, 'sawtooth', 0.2, 0.07, i * 0.06)); },
  grass()         { [440, 550, 660].forEach((f, i) => tone(f, 'triangle', 0.12, 0.09, i * 0.04)); },
  dragon()        { [80, 100, 120].forEach((f, i) => tone(f, 'sawtooth', 0.25, 0.1, i * 0.07)); },
  ice()           { [800, 1000, 1200, 1500].forEach((f, i) => tone(f, 'sine', 0.08, 0.07, i * 0.03)); },
  fight()         { tone(80, 'sawtooth', 0.15, 0.2); tone(160, 'square', 0.1, 0.15, 0.05); },
  poison()        { [200, 240].forEach((f, i) => tone(f, 'sawtooth', 0.18, 0.1, i * 0.06)); },
  normal()        { tone(440, 'sine', 0.1, 0.12); },

  victory() {
    const v = [[523,.15,0],[659,.15,.2],[784,.15,.4],[1047,.3,.6]];
    v.forEach(([f, d, o]) => tone(f, 'square', d, 0.1, o));
  },
  defeat() {
    [440, 370, 294, 220].forEach((f, i) => tone(f, 'triangle', 0.3, 0.1, i * 0.2));
  },

  playBattleBGM() {
    this.stopBGM();
    bgmActive = 'battle';
    const NOTES = [
      [330,.5,0],[392,.5,1],[440,.5,2],[494,.5,3],
      [523,.5,4],[494,.5,5],[440,.5,6],[392,.5,7],
    ];
    const { gain, scheduleLoop } = createBGM(160, NOTES);
    bgmGain = gain;
    let count = 0;
    function loop() {
      if (bgmActive !== 'battle') return;
      scheduleLoop();
      if (++count < 999) setTimeout(loop, (60 / 160) * 1000);
    }
    loop();
  },

  playSelectBGM() {
    this.stopBGM();
    bgmActive = 'select';
    const NOTES = [
      [261,.5,0],[294,.5,1],[330,.5,2],[349,.5,3],
      [392,.5,4],[349,.5,5],[330,.5,6],[294,.5,7],
    ];
    const { gain, scheduleLoop } = createBGM(100, NOTES);
    bgmGain = gain;
    let count = 0;
    function loop() {
      if (bgmActive !== 'select') return;
      scheduleLoop();
      if (++count < 999) setTimeout(loop, (60 / 100) * 1000 * 8);
    }
    loop();
  },

  stopBGM() {
    bgmActive = null;
    if (bgmGain) {
      try { bgmGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.3); }
      catch (e) { /* ignore */ }
      bgmGain = null;
    }
  },
};

export function playTypeSound(type) {
  const map = {
    FIRE: 'fire', WATER: 'water', ELECTRIC: 'electric', PSYCHIC: 'psychic',
    GHOST: 'ghost', GRASS: 'grass', DRAGON: 'dragon', ICE: 'ice',
    FIGHTING: 'fight', POISON: 'poison',
    BUG: 'normal', NORMAL: 'normal', ROCK: 'fight', GROUND: 'fight',
    FLYING: 'normal', STEEL: 'normal', DARK: 'ghost', FAIRY: 'psychic',
  };
  const fn = map[type] || 'normal';
  SFX[fn]?.();
}
