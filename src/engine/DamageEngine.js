// ══════════════════════════════════════════
// DamageEngine — class-based damage calculator
// ══════════════════════════════════════════
import { TYPE_CHART }  from '../data/typeChart.js';
import { SPECIAL_TYPES, STATUS_MOVE_NAMES } from '../data/moves.js';

export class DamageEngine {
  // ── Move category ──────────────────────────────────────────────────────────
  static category(moveName, moveType) {
    if (STATUS_MOVE_NAMES.has(moveName)) return 'status';
    if (SPECIAL_TYPES.has(moveType))     return 'special';
    return 'physical';
  }

  // ── Type effectiveness ─────────────────────────────────────────────────────
  static effectiveness(moveType, defenderTypes) {
    let mult = 1;
    defenderTypes.forEach(dt => {
      const row = TYPE_CHART[moveType];
      if (row && row[dt] !== undefined) mult *= row[dt];
    });
    return mult;
  }

  // ── Effectiveness badge ────────────────────────────────────────────────────
  static effBadge(mult) {
    if (mult === 0)   return { text: 'مناعة تامة! 🛡️',        cls: 'eff-immune', color: '#90A4AE' };
    if (mult >= 4)    return { text: 'فعّال جداً جداً! ✨✨',  cls: 'eff-super2', color: '#FF1744' };
    if (mult >= 2)    return { text: 'فعّال جداً! ✨',         cls: 'eff-super',  color: '#FF6B35' };
    if (mult <= 0.25) return { text: 'غير فعّال أبداً... 💤', cls: 'eff-weak2',  color: '#78909C' };
    if (mult <= 0.5)  return { text: 'غير فعّال... 💤',       cls: 'eff-weak',   color: '#9E9E9E' };
    return null;
  }

  /**
   * Calculate damage for a move
   *
   * @param {object}      mv       - Move data { n, t, p, u }
   * @param {BattleMember} attacker
   * @param {BattleMember} defender
   * @param {Weather|null} weather
   * @param {number}       level   - Player level (default 1)
   *
   * @returns {{ dmg, mult, stab, weatherMult, abilityMult, blocked }}
   */
  static calc(mv, attacker, defender, weather = null, level = 1) {
    const cat      = DamageEngine.category(mv.n, mv.t);
    const aStats   = attacker.effStats;
    const dStats   = defender.effStats;

    const atkStat  = cat === 'special' ? aStats.spatk : aStats.atk;
    const defStat  = cat === 'special' ? dStats.spdef : dStats.def;
    const ratio    = Math.min(4, Math.max(0.25, atkStat / Math.max(defStat, 20)));

    let   mult     = DamageEngine.effectiveness(mv.t, defender.poke.types);
    const stab     = attacker.poke.types.includes(mv.t) ? 1.5 : 1;
    const lvlBonus = 1 + (level - 1) * 0.02;
    const random   = 0.85 + Math.random() * 0.2;

    // ── Attacker ability boosts ──────────────────────────────────────────
    const aAb     = attacker.ability;
    let   abilityMult = 1;

    if (aAb) {
      const hpPct = attacker.hpPercent;
      if (aAb.id === 'BLAZE'       && hpPct <= 0.33 && mv.t === 'FIRE')    abilityMult = 1.5;
      if (aAb.id === 'TORRENT'     && hpPct <= 0.33 && mv.t === 'WATER')   abilityMult = 1.5;
      if (aAb.id === 'OVERGROW'    && hpPct <= 0.33 && mv.t === 'GRASS')   abilityMult = 1.5;
      if (aAb.id === 'SWARM'       && hpPct <= 0.33 && mv.t === 'BUG')     abilityMult = 1.5;
      if (aAb.id === 'TECHNICIAN'  && mv.p <= 60 && mv.p > 0)              abilityMult = 1.5;
    }

    // ── Defender ability damage modification ─────────────────────────────
    const dAb         = defender.ability;
    let   defAbilMult = 1;
    let   absorbed    = false;

    if (dAb) {
      // Full immunity / absorb
      if (dAb.id === 'LEVITATE'      && mv.t === 'GROUND')   { mult = 0; absorbed = true; }
      if (dAb.id === 'FLASH_FIRE'    && mv.t === 'FIRE')     { mult = 0; absorbed = true; }
      if (dAb.id === 'WATER_ABSORB'  && mv.t === 'WATER')    { mult = 0; absorbed = true; }
      if (dAb.id === 'VOLT_ABSORB'   && mv.t === 'ELECTRIC') { mult = 0; absorbed = true; }
      if (dAb.id === 'SAP_SIPPER'    && mv.t === 'GRASS')    { mult = 0; absorbed = true; }

      // Partial reduction
      if (dAb.id === 'THICK_FAT' && (mv.t === 'FIRE' || mv.t === 'ICE')) defAbilMult = 0.5;
      if ((dAb.id === 'FILTER' || dAb.id === 'SOLID_ROCK') && mult >= 2)  defAbilMult = 0.75;
    }

    // ── Weather multiplier ───────────────────────────────────────────────
    const weatherMult = weather?.moveMult(mv.t) ?? 1;

    // ── Final damage ─────────────────────────────────────────────────────
    const dmg = mult === 0 ? 0 : Math.max(1, Math.round(
      mv.p / 4.5 * ratio * mult * stab * weatherMult * abilityMult * defAbilMult * lvlBonus * random
    ));

    return { dmg, mult, stab, weatherMult, abilityMult, absorbed };
  }
}
