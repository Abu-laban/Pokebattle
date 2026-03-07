// ══════════════════════════════════════════
// Weather — class-based weather state
// ══════════════════════════════════════════

export const WEATHER_INFO = {
  SUN: {
    id: 'SUN', icon: '☀️', name: 'شمس حارقة', color: '#FF6B35',
    bg: 'rgba(255,107,53,.15)', borderColor: '#FF6B3566',
    bodyClass: 'weather-sun',
    onStart: '☀️ ارتفعت حرارة الشمس بشكل مفاجئ!',
    onEnd:   '🌤️ انتهت الشمس الحارقة!',
  },
  RAIN: {
    id: 'RAIN', icon: '🌧️', name: 'مطر غزير', color: '#4FC3F7',
    bg: 'rgba(79,195,247,.15)', borderColor: '#4FC3F766',
    bodyClass: 'weather-rain',
    onStart: '🌧️ بدأ المطر يتساقط بغزارة!',
    onEnd:   '🌤️ انتهى المطر الغزير!',
  },
  SAND: {
    id: 'SAND', icon: '🏜️', name: 'عاصفة رملية', color: '#FFB74D',
    bg: 'rgba(255,183,77,.15)', borderColor: '#FFB74D66',
    bodyClass: 'weather-sand',
    onStart: '🏜️ انبعثت عاصفة رملية ضخمة!',
    onEnd:   '🌤️ هدأت العاصفة الرملية!',
  },
  HAIL: {
    id: 'HAIL', icon: '❄️', name: 'بَرَد', color: '#80DEEA',
    bg: 'rgba(128,222,234,.15)', borderColor: '#80DEEA66',
    bodyClass: 'weather-hail',
    onStart: '❄️ بدأ البَرَد يتساقط بلا هوادة!',
    onEnd:   '🌤️ انتهى البَرَد!',
  },
};

const WEATHER_DURATION = 5;

export class Weather {
  constructor(type = null, turns = 0) {
    this.type  = type;
    this.turns = turns;
  }

  get active()  { return this.type !== null; }
  get info()    { return this.type ? WEATHER_INFO[this.type] : null; }
  get icon()    { return this.info?.icon  ?? ''; }
  get name()    { return this.info?.name  ?? ''; }
  get color()   { return this.info?.color ?? '#fff'; }

  // ── Apply a new weather type ───────────────────────────────────────────────
  set(type) {
    if (!type || !WEATHER_INFO[type]) {
      this.type  = null;
      this.turns = 0;
      return null;
    }
    const prev   = this.type;
    this.type    = type;
    this.turns   = WEATHER_DURATION;
    const msg    = prev === type
      ? `${this.icon} الطقس لا يزال ${this.name}!`
      : WEATHER_INFO[type].onStart;
    return msg;
  }

  // ── Tick at end of turn; returns expiry message or null ───────────────────
  tick() {
    if (!this.active) return null;
    this.turns--;
    if (this.turns <= 0) {
      const msg  = WEATHER_INFO[this.type]?.onEnd ?? '🌤️ عاد الجو طبيعياً!';
      this.type  = null;
      this.turns = 0;
      return msg;
    }
    return null;
  }

  // ── Damage multiplier for a given move type ───────────────────────────────
  moveMult(moveType) {
    if (!this.active) return 1;
    if (this.type === 'SUN'  && moveType === 'FIRE')  return 1.5;
    if (this.type === 'SUN'  && moveType === 'WATER') return 0.5;
    if (this.type === 'RAIN' && moveType === 'WATER') return 1.5;
    if (this.type === 'RAIN' && moveType === 'FIRE')  return 0.5;
    return 1;
  }

  // ── End-of-turn weather damage ────────────────────────────────────────────
  // Returns true if this member takes damage from current weather
  affectsMember(member) {
    if (!this.active) return false;
    if (this.type === 'SAND') {
      return !member.poke.types.some(t => ['ROCK','STEEL','GROUND'].includes(t));
    }
    if (this.type === 'HAIL') {
      return !member.poke.types.includes('ICE');
    }
    return false;
  }

  // ── Speed multiplier from weather abilities ───────────────────────────────
  speedMult(member) {
    const ab = member.ability;
    if (!ab || !this.active) return 1;
    if (this.type === 'RAIN' && ab.id === 'SWIFT_SWIM')  return 2;
    if (this.type === 'SUN'  && ab.id === 'CHLOROPHYLL') return 2;
    if (this.type === 'SAND' && ab.id === 'SAND_RUSH')   return 2;
    if (this.type === 'HAIL' && ab.id === 'SLUSH_RUSH')  return 2;
    return 1;
  }

  // ── Serialize / Deserialize ───────────────────────────────────────────────
  toPlain() { return { type: this.type, turns: this.turns }; }

  static fromPlain(plain) {
    return new Weather(plain?.type ?? null, plain?.turns ?? 0);
  }

  static none() { return new Weather(); }
}
