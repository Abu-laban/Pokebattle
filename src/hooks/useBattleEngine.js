// ══════════════════════════════════════════
// useBattleEngine — Core battle execution hook
// Handles: attack flow, AI, end-of-turn, win/loss
// ══════════════════════════════════════════
import { useCallback } from 'react';
import { useBattleStore }   from '../store/battleStore.js';
import { useProgressStore } from '../store/progressStore.js';
import { calcDmg, getEffectiveness, getMvCat } from '../engine/damage.js';
import { addStatus, applyMoveEffect, applyEndTurnStatus,
         checkTurnStatus, STATUS_AR } from '../engine/status.js';
import { MOVE_SECONDARY } from '../data/moveSecondary.js';
import { getPokeAbility } from '../data/abilities.js';
import { MOVE_EFFECTS }   from '../data/moveEffects.js';
import { SFX, playTypeSound } from '../engine/audio.js';

export function useBattleEngine() {
  const store    = useBattleStore();
  const progress = useProgressStore();

  // ── helpers ──────────────────────────────────────────────────────────────
  const log = useCallback((text, cls) => store.addLog(text, cls), [store]);

  const syncTeams = useCallback((myTeam, enTeam) => {
    store.setMyTeam([...myTeam]);
    store.setEnTeam([...enTeam]);
  }, [store]);

  // ── Execute one player attack ─────────────────────────────────────────────
  const executePlayerHit = useCallback((fieldPos, callback) => {
    const s      = useBattleStore.getState();
    const myTeam = [...s.myTeam];
    const enTeam = [...s.enTeam];
    const pField = [...s.pField];
    const eField = [...s.eField];

    const atkIdx = pField[fieldPos];
    if (atkIdx === null) { callback?.(); return; }
    const attacker = myTeam[atkIdx];
    if (!attacker || attacker.fainted) { callback?.(); return; }

    const moveIdx = s.pendingMoves[fieldPos];
    if (moveIdx === null || moveIdx === undefined) { callback?.(); return; }

    const mv  = attacker.poke.moves[moveIdx];
    if (!mv)  { callback?.(); return; }

    // Status check (SLP/FRZ/PAR/CNF)
    const blocked = checkTurnStatus(attacker, log);
    myTeam[atkIdx] = attacker;
    if (blocked) { syncTeams(myTeam, enTeam); callback?.(); return; }

    // Ult cost check
    if (mv.u && attacker.ult < 100) { log(`${attacker.poke.name}: ULT غير جاهز!`, 'sys'); callback?.(); return; }

    // Target
    const targetFieldPos = s.pendingTargets[fieldPos] ?? 0;
    const targetIdx      = eField[targetFieldPos];
    if (targetIdx === null) { callback?.(); return; }
    const target = enTeam[targetIdx];
    if (!target || target.fainted) { callback?.(); return; }

    // Check if status move
    const eff = MOVE_EFFECTS[mv.n];
    if (eff) {
      // Weather or stat/status move
      applyMoveEffect(mv.n, attacker, target, log,
        (type) => store.setWeather(type)
      );
      myTeam[atkIdx] = attacker;
      enTeam[targetIdx] = target;
      syncTeams(myTeam, enTeam);
      callback?.();
      return;
    }

    // Offensive move
    SFX[mv.t?.toLowerCase()]?.() || SFX.hit?.();
    playTypeSound(mv.t);

    // Fire thaws ice
    if (mv.t === 'FIRE' && target.statuses?.['FRZ']) {
      delete target.statuses['FRZ'];
      log(`🔥 الهجوم الناري أذاب تجميد ${target.poke.name}!`, 'sys');
    }

    const weather = useBattleStore.getState().weather.type;
    const { dmg, mult, stab, weatherMult, abilityMult } = calcDmg(mv, attacker, target, weather);

    // Absorb abilities: Water Absorb / Volt Absorb / SAP_SIPPER heal instead of damage
    const dAb = getPokeAbility(target.poke.id);
    if (mult === 0 && dAb &&
        ['WATER_ABSORB','VOLT_ABSORB','SAP_SIPPER','FLASH_FIRE','LEVITATE'].includes(dAb.id)) {
      const heal = Math.min(Math.floor(target.poke.hp * 0.25), target.poke.hp - target.hp);
      if (heal > 0) {
        target.hp = Math.min(target.poke.hp, target.hp + heal);
        log(dAb.icon + ' ' + target.poke.name + ': قدرة ' + dAb.name + ' امتصت الهجوم! (+' + heal + 'HP)', 'heal');
      }
      myTeam[atkIdx] = attacker;
      enTeam[targetIdx] = target;
      store.setPField([...pField]);
      store.setEField([...eField]);
      syncTeams(myTeam, enTeam);
      callback?.();
      return;
    }

    target.hp = Math.max(0, target.hp - dmg);

    const mvCat = getMvCat(mv.n, mv.t);
    if (mvCat === 'physical') target._lastPhysDmgReceived = dmg;
    else if (mvCat === 'special') target._lastSpecDmgReceived = dmg;

    if (mv.u) attacker.ult = 0;
    else attacker.ult = Math.min(100, attacker.ult + 20);

    const effTxt = mult === 0 ? ' مناعة!' : mult >= 2 ? ' فعّال جداً!' : mult <= 0.5 ? ' غير فعّال...' : '';
    log(`⚔ ${attacker.poke.name}→${target.poke.name}: ${mv.n}! (-${dmg}HP)${effTxt}${stab > 1 ? ' [STAB]' : ''}`, 'player-atk');

    if (mult >= 2) progress.recordSuperEff?.();

    // Secondary effect
    const sec = MOVE_SECONDARY[mv.n];
    if (sec && Math.random() < sec.chance) addStatus(target, sec.status, log);

    // Target fainted?
    if (target.hp <= 0) {
      target.fainted = true;
      log(`💀 ${target.poke.name} سقط!`, 'death');
      // Destiny Bond
      if (attacker._destinyBond) {
        attacker._destinyBond = false;
        attacker.fainted = true; attacker.hp = 0;
        log(`💀 ${attacker.poke.name} سقط أيضاً! (DESTINY BOND)`, 'death');
        pField[fieldPos] = null;
      }
      eField[targetFieldPos] = null;
      const activeE   = eField.filter(x => x !== null);
      const nextE     = enTeam.findIndex((t, i) => !t.fainted && !activeE.includes(i));
      if (nextE !== -1) { eField[targetFieldPos] = nextE; log(`🔄 ${enTeam[nextE].poke.name} يدخل!`, 'sys'); }
    }

    myTeam[atkIdx]     = attacker;
    enTeam[targetIdx]  = target;
    store.setPField([...pField]);
    store.setEField([...eField]);
    syncTeams(myTeam, enTeam);

    if (enTeam.every(t => t.fainted)) { callback?.('win'); return; }
    if (myTeam.every(t => t.fainted)) { callback?.('lose'); return; }
    callback?.();
  }, [store, progress, log, syncTeams]);

  // ── Execute one enemy hit ─────────────────────────────────────────────────
  const executeEnemyHit = useCallback((fieldPos, callback) => {
    const s      = useBattleStore.getState();
    const myTeam = [...s.myTeam];
    const enTeam = [...s.enTeam];
    const pField = [...s.pField];
    const eField = [...s.eField];

    const atkIdx = eField[fieldPos];
    if (atkIdx === null) { callback?.(); return; }
    const attacker = enTeam[atkIdx];
    if (!attacker || attacker.fainted) { callback?.(); return; }

    // AI: pick a random move
    const moves    = attacker.poke.moves || [];
    const mv       = moves[Math.floor(Math.random() * moves.length)];
    if (!mv) { callback?.(); return; }

    // Status check
    const blocked = checkTurnStatus(attacker, log);
    enTeam[atkIdx] = attacker;
    if (blocked) { syncTeams(myTeam, enTeam); callback?.(); return; }

    // Pick target — prefer alive player
    const alivePField = pField.filter(fi => fi !== null && !myTeam[fi]?.fainted);
    if (!alivePField.length) { callback?.(); return; }
    const targetFieldPos = alivePField[Math.floor(Math.random() * alivePField.length)];
    const targetIdx      = pField[targetFieldPos];
    const target         = myTeam[targetIdx];
    if (!target || target.fainted) { callback?.(); return; }

    // Status/weather move
    const eff = MOVE_EFFECTS[mv.n];
    if (eff) {
      applyMoveEffect(mv.n, attacker, target, log, (type) => store.setWeather(type));
      enTeam[atkIdx] = attacker;
      myTeam[targetIdx] = target;
      syncTeams(myTeam, enTeam);
      callback?.();
      return;
    }

    // Offensive
    playTypeSound(mv.t);
    if (mv.t === 'FIRE' && target.statuses?.['FRZ']) {
      delete target.statuses['FRZ'];
      log(`🔥 الهجوم الناري أذاب تجميد ${target.poke.name}!`, 'sys');
    }

    const weather = useBattleStore.getState().weather.type;
    const { dmg, mult, stab } = calcDmg(mv, attacker, target, weather);
    target.hp = Math.max(0, target.hp - dmg);

    const mvCat = getMvCat(mv.n, mv.t);
    if (mvCat === 'physical') target._lastPhysDmgReceived = dmg;
    else if (mvCat === 'special') target._lastSpecDmgReceived = dmg;

    if (mv.u) attacker.ult = 0; else attacker.ult = Math.min(100, attacker.ult + 20);

    const effTxt = mult === 0 ? ' مناعة!' : mult >= 2 ? ' فعّال جداً!' : mult <= 0.5 ? ' غير فعّال...' : '';
    log(`💥 ${attacker.poke.name}→${target.poke.name}: ${mv.n}! (-${dmg}HP)${effTxt}${stab > 1 ? ' [STAB]' : ''}`, 'enemy-atk');

    const sec = MOVE_SECONDARY[mv.n];
    if (sec && Math.random() < sec.chance) addStatus(target, sec.status, log);

    if (target.hp <= 0) {
      target.fainted = true;
      log(`💀 ${target.poke.name} سقط!`, 'death');
      // Destiny Bond
      if (target._destinyBond) {
        target._destinyBond = false;
        attacker.fainted = true; attacker.hp = 0;
        log(`💀 ${attacker.poke.name} سقط أيضاً! (DESTINY BOND)`, 'death');
      }
      pField[targetFieldPos] = null;
      const activeP = pField.filter(x => x !== null);
      const nextP   = myTeam.findIndex((t, i) => !t.fainted && !activeP.includes(i));
      if (nextP !== -1) { pField[targetFieldPos] = nextP; log(`🔄 ${myTeam[nextP].poke.name} يدخل!`, 'sys'); }
    }

    enTeam[atkIdx]    = attacker;
    myTeam[targetIdx] = target;
    store.setPField([...pField]);
    store.setEField([...eField]);
    syncTeams(myTeam, enTeam);

    if (myTeam.every(t => t.fainted)) { callback?.('lose'); return; }
    if (enTeam.every(t => t.fainted)) { callback?.('win');  return; }
    callback?.();
  }, [store, log, syncTeams]);

  // ── Full dual turn (player → enemy) ──────────────────────────────────────
  const executeDualTurn = useCallback(() => {
    const s = useBattleStore.getState();
    if (!s.active) return;

    store.setPTurn(false);

    // Speed-based order
    const getSpd = (team, field, fi) => {
      const idx = field[fi];
      if (idx === null) return 0;
      const t = team[idx];
      return t && !t.fainted ? (t.poke.stats?.spd ?? 80) : 0;
    };
    const spd0 = getSpd(s.myTeam, s.pField, 0);
    const spd1 = getSpd(s.myTeam, s.pField, 1);
    const [first, second] = spd0 >= spd1 ? [0, 1] : [1, 0];

    executePlayerHit(first, (r0) => {
      if (r0 === 'win') { setTimeout(() => endBattleResult(true),  800); return; }
      if (r0 === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }

      setTimeout(() => {
        executePlayerHit(second, (r1) => {
          if (r1 === 'win') { setTimeout(() => endBattleResult(true),  800); return; }
          if (r1 === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }

          // End-of-player-turn: enemy attacks
          store.addLog('💀 دور العدو...', 'sys');
          store.setPTurn(false);

          setTimeout(() => {
            executeEnemyHit(0, (re0) => {
              if (re0 === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }
              if (re0 === 'win')  { setTimeout(() => endBattleResult(true),  800); return; }

              setTimeout(() => {
                executeEnemyHit(1, (re1) => {
                  if (re1 === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }
                  if (re1 === 'win')  { setTimeout(() => endBattleResult(true),  800); return; }
                  doEndOfTurn();
                });
              }, 500);
            });
          }, 600);
        });
      }, 500);
    });
  }, [executePlayerHit, executeEnemyHit, store]);

  // ── Tower: player hits, then enemy ───────────────────────────────────────
  const executeTowerTurn = useCallback((moveIdx) => {
    const s = useBattleStore.getState();
    if (!s.active) return;
    store.setPendingMove(0, moveIdx);
    store.setPendingTarget(0, 0);
    store.setPTurn(false);

    executePlayerHit(0, (r) => {
      if (r === 'win')  { handleTowerWin();  return; }
      if (r === 'lose') { handleTowerLose(); return; }
      setTimeout(() => {
        executeEnemyHit(0, (re) => {
          if (re === 'lose') { handleTowerLose(); return; }
          if (re === 'win')  { handleTowerWin();  return; }
          doEndOfTurn();
          setTimeout(() => store.setPTurn(true), 200);
        });
      }, 500);
    });
  }, [executePlayerHit, executeEnemyHit, store]);

  // ── End of turn: status + weather damage ────────────────────────────────
  function doEndOfTurn() {
    const s = useBattleStore.getState();
    const myTeam = [...s.myTeam];
    const enTeam = [...s.enTeam];
    const weather = s.weather.type;

    [...myTeam, ...enTeam].forEach(m => {
      if (m && !m.fainted) applyEndTurnStatus(m, weather, log);
    });

    store.setMyTeam([...myTeam]);
    store.setEnTeam([...enTeam]);
    store.doTickWeather();

    // Reset pending
    store.setPendingMove(0, null);
    store.setPendingMove(1, null);
    store.setPendingTarget(0, null);
    store.setPendingTarget(1, null);
  }

  // ── Win / Loss ────────────────────────────────────────────────────────────
  function endBattleResult(won) {
    const s = useBattleStore.getState();
    SFX.stopBGM();
    setTimeout(() => won ? SFX.victory?.() : SFX.defeat?.(), 200);

    if (won) {
      const xp = 30 + s.towerStreak * 5;
      progress.gainXP(xp);
      progress.recordWin();
    } else {
      progress.recordLoss();
    }

    store.setActive(false);
    store.setResultData({
      type:  'battle',
      won,
      xp:    won ? 30 : 0,
      enemy: s.enTeam.find(t => !t.fainted)?.poke || s.enTeam[0]?.poke,
    });
    store.showOverlay('Result');
  }

  function handleTowerWin() {
    // Snapshot BEFORE any setState — avoids race condition with async state
    const snap = useBattleStore.getState();
    const fieldIdx     = snap.pField[0] ?? 0;
    const activeMember = snap.myTeam[fieldIdx];
    const towerIdx     = snap.towerIdx;

    // Persist HP + ULT using the already-synced myTeam snapshot
    const savedHp  = activeMember?.hp  ?? snap.towerTeam[towerIdx]?.hp  ?? 0;
    const savedUlt = activeMember?.ult ?? snap.towerTeam[towerIdx]?.ult ?? 0;

    useBattleStore.setState(s2 => ({
      towerStreak: s2.towerStreak + 1,
      active: false,
      towerTeam: s2.towerTeam.map((t, i) =>
        i === towerIdx
          ? { ...t, hp: savedHp, ult: savedUlt }   // ULT persists between tower battles
          : t
      ),
    }));

    const newStreak = useBattleStore.getState().towerStreak;
    progress.gainXP(20 + newStreak * 3);
    log(`🏆 انتصرت! سلسلة: ${newStreak}`, 'sys');
    SFX.stopBGM();
    SFX.victory?.();
    setTimeout(() => useBattleStore.getState().startNextTowerBattle(), 1800);
  }

  function handleTowerLose() {
    const s = useBattleStore.getState();
    const streak = s.towerStreak;
    progress.setTowerResult(streak);
    progress.gainXP(streak * 5);
    store.endTowerRun();
  }

  return { executeDualTurn, executeTowerTurn };
}
