# PokéBattle React ⚔️

لعبة معارك البوكيمون — مبنية بـ React + Vite + Zustand

## 🚀 تشغيل سريع

```bash
cd pokebattle
npm install
npm run dev
```

ثم افتح: **http://localhost:3000**

---

## 🗂️ هيكل المشروع

```
pokebattle/
├── index.html              # Vite entry
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx            # React root
    ├── App.jsx             # Main app + routing
    │
    ├── data/               # ── Static game data (JSON-style JS) ──
    │   ├── dex.js          # 894 Pokémon (Gen 1-7 + forms/megas)
    │   ├── typeChart.js    # 18×18 type effectiveness table
    │   ├── pokeStats.js    # Base stats (ATK/DEF/SPATK/SPDEF/SPD)
    │   ├── moveEffects.js  # Status & stat-change move effects
    │   ├── moveSecondary.js# Secondary effects (burn/par/frz chances)
    │   ├── moves.js        # Move category sets (STATUS_MOVE_NAMES etc.)
    │   └── spriteData.js   # Showdown sprite name overrides
    │
    ├── engine/             # ── Pure game logic (no React) ──
    │   ├── damage.js       # calcDmg, getEffStats, stageMult
    │   ├── status.js       # addStatus, checkTurnStatus, applyEndTurn
    │   ├── weather.js      # setWeather, tickWeather, WEATHER_INFO
    │   ├── sprites.js      # Sprite URL chain + fallback loader
    │   └── audio.js        # Web Audio API SFX + BGM
    │
    ├── store/              # ── Zustand state ──
    │   ├── battleStore.js  # All battle state + actions
    │   └── progressStore.js# Level/XP/wins (localStorage persist)
    │
    ├── hooks/
    │   └── useBattleEngine.js  # Attack flow, AI, win/loss logic
    │
    ├── components/
    │   ├── UI/             # Reusable primitives
    │   │   ├── PokeSprite  # Animated sprite with fallback chain
    │   │   ├── HPBar       # Color-coded health bar
    │   │   └── TypeBadge   # Colored type pill
    │   │
    │   ├── Selection/      # Team selection screen
    │   │   └── SelectionScreen
    │   │
    │   ├── Battle/         # Battle screen
    │   │   ├── BattleScreen    # Main layout
    │   │   ├── FighterCard     # Individual HUD panel
    │   │   ├── MoveGrid        # Tower move buttons
    │   │   ├── DualMovePanel   # 2v2 move selection
    │   │   ├── WeatherBar      # Weather display + particles
    │   │   └── BattleLog       # Scrolling battle messages
    │   │
    │   ├── Tower/
    │   │   └── TowerScreen     # Tower team builder
    │   │
    │   └── Overlays/
    │       └── ResultOverlay   # Win/lose/tower-end screen
    │
    └── styles/
        └── globals.css     # CSS variables, body, stars, animations
```

---

## 🎮 ميزات اللعبة

| الميزة | الوصف |
|--------|-------|
| **894 بوكيمون** | Gen 1-7 مع الأشكال والميغا |
| **2v2 معارك** | اختر هجوماً لكل بوكيمون، ثم انهِ الدور |
| **برج المعارك** | سلسلة بدون توقف حتى السقوط |
| **نظام الطقس** | ☀️ شمس / 🌧️ مطر / 🏜️ عاصفة / ❄️ بَرَد |
| **الحالات** | نوم / شلل / حرق / سم / تجميد / ارتباك |
| **STAB + Effectiveness** | حسابات نوع حقيقية |
| **تأثيرات ثانوية** | BRN/PAR/FRZ/PSN بنسب احتمالية |
| **ULT system** | كل بوكيمون له هجوم نهائي |
| **التقدم** | مستوى + XP + إنجازات (localStorage) |

---

## 🛠️ متطلبات التشغيل

- **Node.js** 18+
- **npm** 9+

---

## 📦 المكتبات

- **React 18** — UI
- **Vite 6** — Build tool
- **Zustand 5** — State management
- **Web Audio API** — SFX/BGM إجرائية (لا ملفات صوتية)
