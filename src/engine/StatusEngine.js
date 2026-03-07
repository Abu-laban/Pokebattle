// ══════════════════════════════════════════
// StatusEngine — class-based status effects
// Static utility class (no state of its own)
// ══════════════════════════════════════════
import { MOVE_EFFECTS }  from '../data/moveEffects.js';

export const STATUS_AR = {
  SLP: '😴 نائم', PAR: '⚡ مشلول', BRN: '🔥 محترق',
  PSN: '☠️ مسموم', FRZ: '❄️ مجمّد', CNF: '😵 مرتبك',
};

export const STAT_AR = {
  atk: 'هجوم', def: 'دفاع', spatk: 'هجوم خاص', spdef: 'دفاع خاص', spd: 'سرعة',
};

export class StatusEngine {
  // ── Ability-based immunity ────────────────────────────────────────────────
  static abilityBlocks(member, type) {
    const ab = member.ability;
    if (!ab) return false;
    if (type === 'PSN' && (ab.id === 'IMMUNITY' || ab.id === 'POISON_HEAL')) return true;
    if (type === 'SLP' && ab.id === 'INSOMNIA')   return true;
    if (type === 'PAR' && ab.id === 'LIMBER')      return true;
    if (type === 'BRN' && ab.id === 'WATER_VEIL')  return true;
    if (type === 'FRZ' && ab.id === 'MAGMA_ARMOR') return true;
    if (type === 'CNF' && (ab.id === 'INNER_FOCUS' || ab.id === 'OBLIVIOUS')) return true;
    if (type === 'FRZ' && member.poke.types.includes('ICE')) return true;
    return false;
  }

  // ── Try to apply a status condition ──────────────────────────────────────
  // Returns true if applied
  static apply(member, type, addLog) {
    if (!member.isAlive)           return false;
    if (member.hasStatus(type))    return false;
    if (StatusEngine.abilityBlocks(member, type)) {
      addLog?.(`🛡️ ${member.poke.name} محصّن بقدرته!`, 'sys');
      return false;
    }
    // BRN cures FRZ
    if (type === 'BRN' && member.hasStatus('FRZ')) member.removeStatus('FRZ');

    const turns = type === 'SLP' ? 1 + Math.floor(Math.random() * 3) : 0;
    member.addStatus(type, { turns });
    addLog?.(`${STATUS_AR[type]} أصاب ${member.poke.name}!`, 'sys');
    return true;
  }

  // ── Apply a move's effect (stat stage / status / weather) ────────────────
  // Returns true if handled
  static applyMoveEffect(moveName, attacker, target, addLog, setWeather) {
    const eff = MOVE_EFFECTS[moveName];
    if (!eff) return false;

    if (eff.weather) { setWeather?.(eff.weather); return true; }

    const subject = eff.target === 'self' ? attacker : (target ?? attacker);
    if (!subject) return false;

    if (eff.status) StatusEngine.apply(subject, eff.status, addLog);

    const applyStage = (stat, delta) => {
      const diff = subject.changeStage(stat, delta);
      if (diff === 0) addLog?.(`✨ ${subject.poke.name}: ${STAT_AR[stat]} عند الحد!`, 'sys');
      else {
        const arrow = diff > 0 ? '▲' : '▼';
        addLog?.(`✨ ${subject.poke.name} ${arrow} ${STAT_AR[stat]} ${diff > 0 ? '+' : ''}${diff}`, 'sys');
      }
    };

    if (eff.stat)  applyStage(eff.stat,  eff.st);
    if (eff.stat2) applyStage(eff.stat2, eff.st2);
    if (eff.stat3) applyStage(eff.stat3, eff.st3);
    return true;
  }

  // ── Check turn-start status — returns true if attacker is blocked ────────
  static checkTurnBlock(member, addLog) {
    const name = member.poke.name;

    if (member.hasStatus('SLP')) {
      const data = member.statuses['SLP'];
      data.turns = (data.turns ?? 1) - 1;
      if (data.turns <= 0) { member.removeStatus('SLP'); addLog?.(`☀️ ${name} استيقظ!`, 'sys'); }
      else { addLog?.(`😴 ${name} نائم!`, 'sys'); return true; }
    }

    if (member.hasStatus('FRZ')) {
      const data = member.statuses['FRZ'];
      data.turns = (data.turns ?? 0) + 1;
      if (data.turns >= 3 || Math.random() < 0.2) {
        member.removeStatus('FRZ');
        addLog?.(`❄️ ${name} ذاب التجميد!`, 'sys');
      } else { addLog?.(`❄️ ${name} مجمّد!`, 'sys'); return true; }
    }

    if (member.hasStatus('PAR')) {
      if (Math.random() < 0.5) { addLog?.(`⚡ ${name} مشلول تماماً!`, 'sys'); return true; }
    }

    if (member.hasStatus('CNF')) {
      const data = member.statuses['CNF'];
      data.turns = (data.turns ?? 2) - 1;
      if (data.turns <= 0) {
        member.removeStatus('CNF');
        addLog?.(`😵 ${name} تعافى من الارتباك!`, 'sys');
      } else if (Math.random() < 0.33) {
        const selfDmg = Math.max(1, Math.floor(member.maxHp * 0.1));
        member.dealDamage(selfDmg);
        addLog?.(`😵 ${name} مرتبك وضرب نفسه! (-${selfDmg}HP)`, 'dmg');
        return true;
      }
    }

    return false;
  }

  // ── End-of-turn effects (BRN, PSN, speed boost, etc.) ────────────────────
  // Returns true if member fainted this tick
  static applyEndOfTurn(member, weather, addLog) {
    if (!member.isAlive) return false;

    const ab   = member.ability;
    const name = member.poke.name;

    // MAGIC_GUARD: blocks all passive damage
    if (ab?.id === 'MAGIC_GUARD') return false;

    // SPEED_BOOST: +1 SPD per turn
    if (ab?.id === 'SPEED_BOOST') {
      const diff = member.changeStage('spd', 1);
      if (diff > 0) addLog?.(`💨 ${name}: تسريع! ▲ سرعة +1`, 'sys');
    }

    // SHED_SKIN / REGENERATOR mapped: 33% chance to clear statuses
    if (ab?.id === 'REGENERATOR' && member.activeStatuses.length > 0) {
      if (Math.random() < 0.33) {
        member.clearAllStatus();
        addLog?.(`🐍 ${name}: قدرة تجديد الجلد أزالت التأثير السلبي!`, 'sys');
      }
    }

    // BURN damage
    if (member.hasStatus('BRN')) {
      const dmg = Math.max(1, Math.floor(member.maxHp * 0.05));
      const ko   = member.dealDamage(dmg);
      addLog?.(`🔥 ${name}: حرق (-${dmg}HP)`, 'dmg');
      if (ko) { addLog?.(`💀 ${name} سقط من الحرق!`, 'death'); return true; }
    }

    // POISON damage — POISON_HEAL heals instead
    if (member.hasStatus('PSN')) {
      const dmg = Math.max(1, Math.floor(member.maxHp * 0.0625));
      if (ab?.id === 'POISON_HEAL') {
        const healed = Math.min(dmg, member.maxHp - member.hp);
        member.healHp(healed);
        addLog?.(`💜 ${name}: شفاء السم (+${healed}HP)`, 'heal');
      } else {
        const ko = member.dealDamage(dmg);
        addLog?.(`☠️ ${name}: سم (-${dmg}HP)`, 'dmg');
        if (ko) { addLog?.(`💀 ${name} سقط من السم!`, 'death'); return true; }
      }
    }

    // Weather damage
    if (weather?.affectsMember(member)) {
      const dmg = Math.max(1, Math.floor(member.maxHp * 0.0625));
      const ko   = member.dealDamage(dmg);
      addLog?.(`${weather.icon} ${name}: ضرر الطقس (-${dmg}HP)`, 'dmg');
      if (ko) { addLog?.(`💀 ${name} سقط من الطقس!`, 'death'); return true; }
    }

    return false;
  }

  // ── On-enter ability effects ──────────────────────────────────────────────
  static applyOnEnter(member, opponent, addLog) {
    const ab = member.ability;
    if (!ab) return;

    if (ab.id === 'INTIMIDATE' && opponent?.isAlive) {
      const diff = opponent.changeStage('atk', -1);
      if (diff < 0) addLog?.(`😤 ${member.poke.name}: التخويف! ${opponent.poke.name} ▼ هجوم -1`, 'sys');
    }

    if (ab.id === 'DOWNLOAD' && opponent?.isAlive) {
      const stat = (opponent.effStats.spdef ?? 80) <= (opponent.effStats.def ?? 80) ? 'spatk' : 'atk';
      const diff = member.changeStage(stat, 1);
      if (diff > 0) addLog?.(`📡 ${member.poke.name}: التحميل! ▲ ${STAT_AR[stat]} +1`, 'sys');
    }
  }
}
