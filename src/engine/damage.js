// ══════════════════════════════════════════
// Damage Calculation Engine
// ══════════════════════════════════════════
import { TYPE_CHART } from '../data/typeChart.js';
import { POKE_STATS } from '../data/pokeStats.js';
import { SPECIAL_TYPES, STATUS_MOVE_NAMES } from '../data/moves.js';
import { getPokeAbility, classifyPoke, POKE_CLASSES } from '../data/abilities.js';

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
  if (mult === 0)   return { text: 'مناعة تامة! 🛡️',        cls: 'eff-immune',  color: '#90A4AE' };
  if (mult >= 4)    return { text: 'فعّال جداً جداً! ✨✨',  cls: 'eff-super2', color: '#FF1744' };
  if (mult >= 2)    return { text: 'فعّال جداً! ✨',         cls: 'eff-super',  color: '#FF6B35' };
  if (mult <= 0.25) return { text: 'غير فعّال أبداً... 💤', cls: 'eff-weak2',  color: '#78909C' };
  if (mult <= 0.5)  return { text: 'غير فعّال... 💤',       cls: 'eff-weak',   color: '#9E9E9E' };
  return null;
}

export function getEffStats(member) {
  const base = POKE_STATS[member.poke.id] || { a: 80, d: 80, sa: 80, sd: 80, sp: 80 };
  const st   = member.stages   || { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0 };
  const sts  = member.statuses || {};

  // Ability modifiers on stats
  const ability    = getPokeAbility(member.poke.id);
  const brnMult    = sts['BRN'] ? 0.5 : 1;
  const parMult    = sts['PAR'] ? 0.5 : 1;
  const hasStatus  = Object.keys(sts).length > 0;

  // GUTS: +50% ATK when statused
  const gutsMult   = (ability?.id === 'GUTS' && hasStatus) ? 1.5 : 1;
  // MARVEL_SCALE: +50% DEF when statused
  const mrvlMult   = (ability?.id === 'MARVEL_SCALE' && hasStatus) ? 1.5 : 1;
  // HUGE_POWER / PURE_POWER: ×2 effective ATK
  const hugeMult   = (ability?.id === 'HUGE_POWER' || ability?.id === 'PURE_POWER') ? 2 : 1;

  return {
    atk:   Math.max(1, Math.round(base.a  * stageMult(st.atk   || 0) * brnMult * gutsMult * hugeMult)),
    def:   Math.max(1, Math.round(base.d  * stageMult(st.def   || 0) * mrvlMult)),
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

// ── Main damage calculator ───────────────────────────────────────────────────
export function calcDmg(mv, attacker, defender, weather = null, level = 1) {
  const cat       = getMvCat(mv.n, mv.t);
  const aStats    = getEffStats(attacker);
  const dStats    = getEffStats(defender);
  const atkStat   = cat === 'special' ? aStats.spatk : aStats.atk;
  const defStat   = cat === 'special' ? dStats.spdef : dStats.def;
  const ratio     = Math.min(4, Math.max(0.25, atkStat / Math.max(defStat, 20)));
  let   mult      = getEffectiveness(mv.t, defender.poke.types);
  const stab      = attacker.poke.types.includes(mv.t) ? 1.5 : 1;
  const lvlBonus  = 1 + (level - 1) * 0.02;
  const random    = 0.85 + Math.random() * 0.2;

  // ── Attacker ability boosts ──────────────────────────────────────────────
  const aAbility  = getPokeAbility(attacker.poke.id);
  let abilityMult = 1;

  if (aAbility) {
    const hpPct = attacker.hp / attacker.poke.hp;
    // Starter ability triggers
    if (aAbility.id === 'BLAZE'    && hpPct <= 0.33 && mv.t === 'FIRE')    abilityMult = 1.5;
    if (aAbility.id === 'TORRENT'  && hpPct <= 0.33 && mv.t === 'WATER')   abilityMult = 1.5;
    if (aAbility.id === 'OVERGROW' && hpPct <= 0.33 && mv.t === 'GRASS')   abilityMult = 1.5;
    if (aAbility.id === 'SWARM'    && hpPct <= 0.33 && mv.t === 'BUG')     abilityMult = 1.5;
    // Technician: moves ≤ 60 power get ×1.5
    if (aAbility.id === 'TECHNICIAN' && mv.p <= 60 && mv.p > 0)            abilityMult = 1.5;
  }

  // ── Defender ability reductions ──────────────────────────────────────────
  const dAbility  = getPokeAbility(defender.poke.id);
  let defAbilMult = 1;

  if (dAbility) {
    // Levitate: immune to Ground
    if (dAbility.id === 'LEVITATE'     && mv.t === 'GROUND') mult = 0;
    // Flash Fire: immune to Fire
    if (dAbility.id === 'FLASH_FIRE'   && mv.t === 'FIRE')   mult = 0;
    // Water Absorb: immune to Water
    if (dAbility.id === 'WATER_ABSORB' && mv.t === 'WATER')  mult = 0;
    // Volt Absorb: immune to Electric
    if (dAbility.id === 'VOLT_ABSORB'  && mv.t === 'ELECTRIC') mult = 0;
    // SAP_SIPPER: immune to Grass
    if (dAbility.id === 'SAP_SIPPER'   && mv.t === 'GRASS')  mult = 0;
    // THICK_FAT: halves Fire & Ice
    if (dAbility.id === 'THICK_FAT' && (mv.t === 'FIRE' || mv.t === 'ICE')) defAbilMult = 0.5;
    // FILTER / SOLID_ROCK: reduce super-effective by 25%
    if ((dAbility.id === 'FILTER' || dAbility.id === 'SOLID_ROCK') && mult >= 2) defAbilMult = 0.75;
  }

  // ── Weather modifier ─────────────────────────────────────────────────────
  let weatherMult = 1;
  if (weather) {
    if      (weather === 'SUN'  && mv.t === 'FIRE')  weatherMult = 1.5;
    else if (weather === 'SUN'  && mv.t === 'WATER') weatherMult = 0.5;
    else if (weather === 'RAIN' && mv.t === 'WATER') weatherMult = 1.5;
    else if (weather === 'RAIN' && mv.t === 'FIRE')  weatherMult = 0.5;
  }

  const dmg = mult === 0 ? 0 : Math.max(1, Math.round(
    mv.p / 4.5 * ratio * mult * stab * weatherMult * abilityMult * defAbilMult * lvlBonus * random
  ));

  return { dmg, mult, stab, weatherMult, abilityMult };
}

// ── Class helper (used in UI) ─────────────────────────────────────────────────
export function getPokeClass(pokeId, stats) {
  if (!stats) return POKE_CLASSES.BALANCED;
  const bst = (stats.a || 0) + (stats.d || 0) + (stats.sa || 0) +
              (stats.sd || 0) + (stats.sp || 0) + (stats.h || 0);
  return classifyPoke(pokeId, stats, bst);
}
