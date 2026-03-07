// ══════════════════════════════════════════
// Weather System Engine
// ══════════════════════════════════════════

export const WEATHER_DURATION = 5;

export const WEATHER_INFO = {
  SUN: {
    icon: '☀️',
    name: 'شمس حارقة',
    color: '#FF6B35',
    bg: 'rgba(255,107,53,.15)',
    borderColor: '#FF6B3566',
    bodyClass: 'weather-sun',
    onStart: '☀️ ارتفعت حرارة الشمس بشكل مفاجئ!',
  },
  RAIN: {
    icon: '🌧️',
    name: 'مطر غزير',
    color: '#4FC3F7',
    bg: 'rgba(79,195,247,.15)',
    borderColor: '#4FC3F766',
    bodyClass: 'weather-rain',
    onStart: '🌧️ بدأ المطر يتساقط بغزارة!',
  },
  SAND: {
    icon: '🏜️',
    name: 'عاصفة رملية',
    color: '#FFB74D',
    bg: 'rgba(255,183,77,.15)',
    borderColor: '#FFB74D66',
    bodyClass: 'weather-sand',
    onStart: '🏜️ انبعثت عاصفة رملية ضخمة!',
  },
  HAIL: {
    icon: '❄️',
    name: 'بَرَد',
    color: '#80DEEA',
    bg: 'rgba(128,222,234,.15)',
    borderColor: '#80DEEA66',
    bodyClass: 'weather-hail',
    onStart: '❄️ بدأ البَرَد يتساقط بلا هوادة!',
  },
};

// ── Create initial weather state ──
export function createWeather() {
  return { type: null, turns: 0 };
}

// ── Apply a new weather ──
export function setWeather(state, type) {
  if (!type || !WEATHER_INFO[type]) return { type: null, turns: 0 };
  return { type, turns: WEATHER_DURATION };
}

// ── Tick weather at end of turn, return { next, expired, message } ──
export function tickWeather(state) {
  if (!state.type) return { next: state, expired: false, message: null };
  const turns = state.turns - 1;
  if (turns <= 0) {
    const name = WEATHER_INFO[state.type]?.name || state.type;
    return {
      next: { type: null, turns: 0 },
      expired: true,
      message: `🌤️ انتهى ${name} وعاد الجو طبيعياً!`,
    };
  }
  return { next: { type: state.type, turns }, expired: false, message: null };
}

// ── Weather boost label ──
export function getWeatherBoostLabel(weatherType, moveType) {
  if (!weatherType) return null;
  if (weatherType === 'SUN'  && moveType === 'FIRE')  return { text: '☀️ دفع الشمس!',    cls: 'weather-sun-boost'  };
  if (weatherType === 'SUN'  && moveType === 'WATER') return { text: '☀️ ضعيف في الشمس', cls: 'weather-sun-weak'   };
  if (weatherType === 'RAIN' && moveType === 'WATER') return { text: '🌧️ دفع المطر!',    cls: 'weather-rain-boost' };
  if (weatherType === 'RAIN' && moveType === 'FIRE')  return { text: '🌧️ ضعيف في المطر', cls: 'weather-rain-weak'  };
  return null;
}
