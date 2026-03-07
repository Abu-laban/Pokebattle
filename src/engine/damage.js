// ══════════════════════════════════════════
// Damage Calculation Engine
// ══════════════════════════════════════════
import { TYPE_CHART } from '../data/typeChart.js';
import { POKE_STATS } from '../data/pokeStats.js';
import { SPECIAL_TYPES, STATUS_MOVE_NAMES } from '../data/moves.js';

export function stageMult(stage) {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

export function getEffectiveness(moveType, defenderTypes) {
  let mult = 1;
  defenderTypes.forEach(dt => {
    const row = TYPE_CHART[moveType];
    if (row && row[dt] !== undefined) mult *= row[dt];
  });
  return mult;
}

export function getEffLabel(mult) {
  if (mult === 0)   return { text: 'مناعة تامة! 🛡️',       cls: 'eff-immune',  color: '#90A4AE' };
  if (mult >= 4)    return { text: 'فعّال جداً جداً! ✨✨', cls: 'eff-super2', color: '#FF1744' };
  if (mult >= 2)    return { text: 'فعّال جداً! ✨',        cls: 'eff-super',  color: '#FF6B35' };
  if (mult <= 0.25) return { text: 'غير فعّال أبداً... 💤',cls: 'eff-weak2',  color: '#78909C' };
  if (mult <= 0.5)  return { text: 'غير فعّال... 💤',      cls: 'eff-weak',   color: '#9E9E9E' };
  return null;
}

export function getEffStats(member) {
  const base = POKE_STATS[member.poke.id] || { a: 80, d: 80, sa: 80, sd: 80, sp: 80 };
  const st   = member.stages   || { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0 };
  const sts  = member.statuses || {};
  const brnMult = sts['BRN'] ? 0.5 : 1;
  const parMult = sts['PAR'] ? 0.5 : 1;
  return {
    atk:   Math.max(1, Math.round(base.a  * stageMult(st.atk   || 0) * brnMult)),
    def:   Math.max(1, Math.round(base.d  * stageMult(st.def   || 0))),
    spatk: Math.max(1, Math.round(base.sa * stageMult(st.spatk || 0))),
    spdef: Math.max(1, Math.round(base.sd * stageMult(st.spdef || 0))),
    spd:   Math.max(1, Math.round(base.sp * stageMult(st.spd   || 0) * parMult)),
  };
}

export function getMvCat(moveName, moveType) {
  if (STATUS_MOVE_NAMES.has(moveName)) return 'status';
  if (SPECIAL_TYPES.has(moveType))     return 'special';
  return 'physical';
}

// level is passed in to avoid circular store dependency
export function calcDmg(mv, attacker, defender, weather = null, level = 1) {
  const cat     = getMvCat(mv.n, mv.t);
  const aStats  = getEffStats(attacker);
  const dStats  = getEffStats(defender);
  const atkStat = cat === 'special' ? aStats.spatk : aStats.atk;
  const defStat = cat === 'special' ? dStats.spdef : dStats.def;
  const ratio   = Math.min(4, Math.max(0.25, atkStat / Math.max(defStat, 20)));
  const mult    = getEffectiveness(mv.t, defender.poke.types);
  const stab    = attacker.poke.types.includes(mv.t) ? 1.5 : 1;
  const lvlBonus = 1 + (level - 1) * 0.02;
  const random  = 0.85 + Math.random() * 0.2;

  let weatherMult = 1;
  if (weather) {
    if      (weather === 'SUN'  && mv.t === 'FIRE')  weatherMult = 1.5;
    else if (weather === 'SUN'  && mv.t === 'WATER') weatherMult = 0.5;
    else if (weather === 'RAIN' && mv.t === 'WATER') weatherMult = 1.5;
    else if (weather === 'RAIN' && mv.t === 'FIRE')  weatherMult = 0.5;
  }

  const dmg = Math.max(1, Math.round(mv.p / 4.5 * ratio * mult * stab * weatherMult * lvlBonus * random));
  return { dmg, mult, stab, weatherMult };
}
