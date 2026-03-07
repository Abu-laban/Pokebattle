// ══════════════════════════════════════════
// Status Effects Engine
// ══════════════════════════════════════════
import { MOVE_EFFECTS } from '../data/moveEffects.js';
import { getPokeAbility } from '../data/abilities.js';

export const STATUS_AR = {
  SLP: '😴 نائم', PAR: '⚡ مشلول', BRN: '🔥 محترق',
  PSN: '☠️ مسموم', FRZ: '❄️ مجمّد', CNF: '😵 مرتبك',
};

export const STAT_AR = {
  atk: 'هجوم', def: 'دفاع', spatk: 'هجوم خاص', spdef: 'دفاع خاص', spd: 'سرعة',
};

// ── Ability-based status immunity check ──────────────────────────────────────
function abilityBlocksStatus(member, statusType) {
  const ab = getPokeAbility(member.poke.id);
  if (!ab) return false;
  if (statusType === 'PSN'  && (ab.id === 'IMMUNITY' || ab.id === 'POISON_HEAL'))        return true;
  if (statusType === 'SLP'  && ab.id === 'INSOMNIA')                                      return true;
  if (statusType === 'PAR'  && ab.id === 'LIMBER')                                        return true;
  if (statusType === 'BRN'  && ab.id === 'WATER_VEIL')                                   return true;
  if (statusType === 'FRZ'  && ab.id === 'MAGMA_ARMOR')                                  return true;
  if (statusType === 'CNF'  && (ab.id === 'INNER_FOCUS' || ab.id === 'OBLIVIOUS'))       return true;
  if (statusType === 'FRZ'  && member.poke.types.includes('ICE'))                         return true;
  return false;
}

export function addStatus(member, statusType, addLog) {
  if (!member || member.fainted) return false;
  if (!member.statuses) member.statuses = {};
  if (member.statuses[statusType]) return false;
  if (abilityBlocksStatus(member, statusType)) {
    addLog?.(`🛡️ ${member.poke.name} محصّن بقدرته!`, 'sys');
    return false;
  }
  if (statusType === 'BRN' && member.statuses['FRZ']) delete member.statuses['FRZ'];
  const turns = statusType === 'SLP' ? 1 + Math.floor(Math.random() * 3) : 0;
  member.statuses[statusType] = { turns };
  addLog?.(`${STATUS_AR[statusType] || statusType} أصاب ${member.poke.name}!`, 'sys');
  return true;
}

export function applyMoveEffect(moveName, attacker, target, addLog, setWeather) {
  const eff = MOVE_EFFECTS[moveName];
  if (!eff) return false;
  if (eff.weather) { setWeather?.(eff.weather); return true; }
  if (!attacker.stages)   attacker.stages   = { atk:0, def:0, spatk:0, spdef:0, spd:0 };
  if (!attacker.statuses) attacker.statuses = {};
  const subject = eff.target === 'self' ? attacker : (target || attacker);
  if (!subject.stages)   subject.stages   = { atk:0, def:0, spatk:0, spdef:0, spd:0 };
  if (!subject.statuses) subject.statuses = {};
  if (eff.status) addStatus(subject, eff.status, addLog);
  function applyStage(stat, delta) {
    const cur     = subject.stages[stat] || 0;
    const clamped = Math.max(-6, Math.min(6, cur + delta));
    subject.stages[stat] = clamped;
    const diff  = clamped - cur;
    const arrow = delta > 0 ? '▲' : '▼';
    if (diff === 0) addLog?.(`✨ ${subject.poke.name}: ${STAT_AR[stat]} عند الحد!`, 'sys');
    else            addLog?.(`✨ ${subject.poke.name} ${arrow} ${STAT_AR[stat]} ${diff > 0 ? '+' : ''}${diff}`, 'sys');
  }
  if (eff.stat)  applyStage(eff.stat,  eff.st);
  if (eff.stat2) applyStage(eff.stat2, eff.st2);
  if (eff.stat3) applyStage(eff.stat3, eff.st3);
  return true;
}

// ── On-enter ability effects (called when switching in) ──────────────────────
export function applyOnEnterAbility(member, opponent, addLog) {
  const ab = getPokeAbility(member.poke.id);
  if (!ab) return;
  if (!member.stages)   member.stages   = { atk:0, def:0, spatk:0, spdef:0, spd:0 };
  if (!opponent.stages) opponent.stages = { atk:0, def:0, spatk:0, spdef:0, spd:0 };

  if (ab.id === 'INTIMIDATE' && opponent) {
    opponent.stages.atk = Math.max(-6, (opponent.stages.atk || 0) - 1);
    addLog?.(`😤 ${member.poke.name}: التخويف! ${opponent.poke.name} ▼ هجوم -1`, 'sys');
  }
  if (ab.id === 'DOWNLOAD' && opponent) {
    const def  = opponent.stages.def   || 0;
    const spdef= opponent.stages.spdef || 0;
    const stat = spdef <= def ? 'spatk' : 'atk';
    member.stages[stat] = Math.min(6, (member.stages[stat] || 0) + 1);
    addLog?.(`📡 ${member.poke.name}: التحميل! ▲ ${STAT_AR[stat]} +1`, 'sys');
  }
}

// Returns true = blocked this turn
export function checkTurnStatus(attacker, addLog) {
  const sts  = attacker.statuses || {};
  const name = attacker.poke.name;
  if (sts['SLP']) {
    sts['SLP'].turns = (sts['SLP'].turns || 1) - 1;
    if (sts['SLP'].turns <= 0) { delete sts['SLP']; addLog?.(`☀️ ${name} استيقظ!`, 'sys'); }
    else { addLog?.(`😴 ${name} نائم!`, 'sys'); return true; }
  }
  if (sts['FRZ']) {
    sts['FRZ'].turns = (sts['FRZ'].turns || 0) + 1;
    if (sts['FRZ'].turns >= 3 || Math.random() < 0.2) {
      delete sts['FRZ']; addLog?.(`❄️ ${name} ذاب التجميد!`, 'sys');
    } else { addLog?.(`❄️ ${name} مجمّد!`, 'sys'); return true; }
  }
  if (sts['PAR']) {
    if (Math.random() < 0.5) { addLog?.(`⚡ ${name} مشلول تماماً!`, 'sys'); return true; }
  }
  if (sts['CNF']) {
    sts['CNF'].turns = (sts['CNF'].turns || 2) - 1;
    if (sts['CNF'].turns <= 0) { delete sts['CNF']; addLog?.(`😵 ${name} تعافى من الارتباك!`, 'sys'); }
    else if (Math.random() < 0.33) {
      const selfDmg = Math.max(1, Math.floor(attacker.poke.hp * 0.1));
      attacker.hp = Math.max(0, attacker.hp - selfDmg);
      addLog?.(`😵 ${name} مرتبك وضرب نفسه! (-${selfDmg}HP)`, 'dmg');
      return true;
    }
  }
  return false;
}

// ── End-of-turn: status + ability effects ────────────────────────────────────
export function applyEndTurnStatus(member, weather, addLog) {
  if (!member || member.fainted) return;

  const ab = getPokeAbility(member.poke.id);

  // MAGIC_GUARD: no passive damage at all
  if (ab?.id === 'MAGIC_GUARD') return;

  // SPEED_BOOST: +1 SPD each turn
  if (ab?.id === 'SPEED_BOOST') {
    if (!member.stages) member.stages = { atk:0, def:0, spatk:0, spdef:0, spd:0 };
    if ((member.stages.spd || 0) < 6) {
      member.stages.spd = (member.stages.spd || 0) + 1;
      addLog?.(`💨 ${member.poke.name}: تسريع! ▲ سرعة +1`, 'sys');
    }
  }

  // SHED_SKIN: 33% chance to cure status
  if (ab?.id === 'REGENERATOR' && Object.keys(member.statuses || {}).length > 0) {
    if (Math.random() < 0.33) {
      member.statuses = {};
      addLog?.(`🐍 ${member.poke.name}: تجديد الجلد أزال التأثير السلبي!`, 'sys');
    }
  }

  // BRN damage (skip if GUTS — guts benefits from burn but still takes damage in this impl)
  if (member.statuses?.['BRN']) {
    const dmg = Math.max(1, Math.floor(member.poke.hp * 0.05));
    member.hp = Math.max(0, member.hp - dmg);
    addLog?.(`🔥 ${member.poke.name}: حرق (-${dmg}HP)`, 'dmg');
    if (member.hp <= 0) { member.fainted = true; addLog?.(`💀 ${member.poke.name} سقط!`, 'death'); return; }
  }

  // PSN damage — POISON_HEAL heals instead
  if (member.statuses?.['PSN']) {
    const dmg = Math.max(1, Math.floor(member.poke.hp * 0.0625));
    if (ab?.id === 'POISON_HEAL') {
      const heal = Math.min(dmg, member.poke.hp - member.hp);
      member.hp = Math.min(member.poke.hp, member.hp + heal);
      addLog?.(`💜 ${member.poke.name}: شفاء السم (+${heal}HP)`, 'heal');
    } else {
      member.hp = Math.max(0, member.hp - dmg);
      addLog?.(`☠️ ${member.poke.name}: سم (-${dmg}HP)`, 'dmg');
      if (member.hp <= 0) { member.fainted = true; addLog?.(`💀 ${member.poke.name} سقط!`, 'death'); return; }
    }
  }

  // Weather damage (LEVITATE is immune to nothing weather-wise, but MAGIC_GUARD blocks above)
  if (weather === 'SAND' && !member.poke.types.some(t => ['ROCK','STEEL','GROUND'].includes(t))) {
    const dmg = Math.max(1, Math.floor(member.poke.hp * 0.0625));
    member.hp = Math.max(0, member.hp - dmg);
    addLog?.(`🏜️ ${member.poke.name}: عاصفة (-${dmg}HP)`, 'dmg');
    if (member.hp <= 0) { member.fainted = true; addLog?.(`💀 ${member.poke.name} سقط!`, 'death'); return; }
  }
  if (weather === 'HAIL' && !member.poke.types.includes('ICE')) {
    const dmg = Math.max(1, Math.floor(member.poke.hp * 0.0625));
    member.hp = Math.max(0, member.hp - dmg);
    addLog?.(`❄️ ${member.poke.name}: بَرَد (-${dmg}HP)`, 'dmg');
    if (member.hp <= 0) { member.fainted = true; addLog?.(`💀 ${member.poke.name} سقط!`, 'death'); return; }
  }
}

export function initMember(poke) {
  return {
    poke, hp: poke.hp, ult: 0, fainted: false,
    stages: { atk:0, def:0, spatk:0, spdef:0, spd:0 },
    statuses: {},
    _lastPhysDmgReceived: 0, _lastSpecDmgReceived: 0,
    _destinyBond: false,
  };
}
