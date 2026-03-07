// ══════════════════════════════════════════
// useBattleEngine — battle execution using class-based objects
// Fixes:
//   1. Poison/burn death: card disappears + win check after status damage
//   2. ULT persists across tower battles (consumeUlt only resets on use)
//   3. Full class-based: BattleMember, BattleField, DamageEngine, StatusEngine
// ══════════════════════════════════════════
import { useCallback }       from 'react';
import { useBattleStore }    from '../store/battleStore.js';
import { useProgressStore }  from '../store/progressStore.js';
import { BattleMember }      from './BattleMember.js';
import { BattleField }       from './BattleField.js';
import { Weather }           from './Weather.js';
import { DamageEngine }      from './DamageEngine.js';
import { StatusEngine }      from './StatusEngine.js';
import { MOVE_SECONDARY }    from '../data/moveSecondary.js';
import { MOVE_EFFECTS }      from '../data/moveEffects.js';
import { SFX, playTypeSound } from './audio.js';

function hydrateTeam(plains) {
  return (plains || []).map(p => BattleMember.fromPlain(p));
}

function commitField(store, pField, eField, myTeam, enTeam) {
  store.setMyTeam(myTeam.map(m => m.toPlain()));
  store.setEnTeam(enTeam.map(m => m.toPlain()));
  store.setPField([...pField.toSlots()]);
  store.setEField([...eField.toSlots()]);
}

export function useBattleEngine() {
  const store    = useBattleStore();
  const progress = useProgressStore();
  const log = useCallback((text, cls) => store.addLog(text, cls), [store]);

  // ── ONE PLAYER HIT ────────────────────────────────────────────────────────
  const executePlayerHit = useCallback((fieldPos, callback) => {
    const s      = useBattleStore.getState();
    const myTeam = hydrateTeam(s.myTeam);
    const enTeam = hydrateTeam(s.enTeam);
    const pField = new BattleField(myTeam, s.pField);
    const eField = new BattleField(enTeam, s.eField);
    const weather = Weather.fromPlain(s.weather);

    const attacker = pField.memberAt(fieldPos);
    if (!attacker || !attacker.isAlive) { callback?.(); return; }

    const moveIdx = s.pendingMoves[fieldPos];
    if (moveIdx === null || moveIdx === undefined) { callback?.(); return; }
    const mv = attacker.poke.moves[moveIdx];
    if (!mv) { callback?.(); return; }

    const blocked = StatusEngine.checkTurnBlock(attacker, log);
    if (blocked) { commitField(store, pField, eField, myTeam, enTeam); callback?.(); return; }

    if (mv.u && !attacker.ultReady) {
      log(attacker.poke.name + ': ULT غير جاهز! (' + attacker.ult + '%)', 'sys');
      callback?.(); return;
    }

    const targetFieldPos = s.pendingTargets[fieldPos] ?? 0;
    const target = eField.memberAt(targetFieldPos);
    if (!target || !target.isAlive) { callback?.(); return; }

    // Status / weather move
    if (MOVE_EFFECTS[mv.n]) {
      StatusEngine.applyMoveEffect(mv.n, attacker, target, log, (type) => store.setWeather(type));
      if (mv.u) attacker.consumeUlt(); else attacker.chargeUlt(10);
      commitField(store, pField, eField, myTeam, enTeam);
      callback?.(); return;
    }

    // Offensive
    playTypeSound(mv.t);
    if (mv.t === 'FIRE' && target.hasStatus('FRZ')) {
      target.removeStatus('FRZ');
      log('🔥 الهجوم الناري أذاب تجميد ' + target.poke.name + '!', 'sys');
    }

    const { dmg, mult, stab, weatherMult, absorbed } = DamageEngine.calc(mv, attacker, target, weather);

    // Absorb ability
    if (absorbed) {
      const dAb  = target.ability;
      const healTypes = ['WATER_ABSORB','VOLT_ABSORB','SAP_SIPPER'];
      if (dAb && healTypes.includes(dAb.id)) {
        const healed = Math.min(Math.floor(target.maxHp * 0.25), target.maxHp - target.hp);
        if (healed > 0) target.healHp(healed);
        log((dAb.icon || '✨') + ' ' + target.poke.name + ': ' + dAb.name + ' امتصت الهجوم!' + (healed > 0 ? ' (+' + healed + 'HP)' : ''), 'heal');
      } else {
        log('🛡️ ' + target.poke.name + ': مناعة كاملة!', 'sys');
      }
      if (mv.u) attacker.consumeUlt(); else attacker.chargeUlt(10);
      commitField(store, pField, eField, myTeam, enTeam);
      callback?.(); return;
    }

    const cat = DamageEngine.category(mv.n, mv.t);
    if (cat === 'physical') target._lastPhysDmgReceived = dmg;
    else if (cat === 'special') target._lastSpecDmgReceived = dmg;
    target.dealDamage(dmg);

    if (mv.u) attacker.consumeUlt(); else attacker.chargeUlt(20);

    const effTxt = mult === 0 ? ' مناعة!' : mult >= 2 ? ' فعّال جداً!' : mult <= 0.5 ? ' غير فعّال...' : '';
    log('⚔ ' + attacker.poke.name + '→' + target.poke.name + ': ' + mv.n + '! (-' + dmg + 'HP)' + effTxt + (stab > 1 ? ' [STAB]' : ''), 'player-atk');

    if (mult >= 2) progress.recordSuperEff?.();

    const sec = MOVE_SECONDARY[mv.n];
    if (sec && Math.random() < sec.chance && target.isAlive) StatusEngine.apply(target, sec.status, log);

    if (!target.isAlive) {
      log('💀 ' + target.poke.name + ' سقط!', 'death');
      if (attacker._destinyBond) { attacker._destinyBond = false; attacker.forceKO(); log('💀 ' + attacker.poke.name + ' سقط أيضاً! (DESTINY BOND)', 'death'); }
      const evts = eField.processDeaths();
      evts.forEach(ev => log('🔄 ' + enTeam[ev.newIdx].poke.name + ' يدخل المعركة!', 'sys'));
    }

    commitField(store, pField, eField, myTeam, enTeam);
    if (eField.allFainted) { callback?.('win');  return; }
    if (pField.allFainted) { callback?.('lose'); return; }
    callback?.();
  }, [store, progress, log]);

  // ── ONE ENEMY HIT ─────────────────────────────────────────────────────────
  const executeEnemyHit = useCallback((fieldPos, callback) => {
    const s      = useBattleStore.getState();
    const myTeam = hydrateTeam(s.myTeam);
    const enTeam = hydrateTeam(s.enTeam);
    const pField = new BattleField(myTeam, s.pField);
    const eField = new BattleField(enTeam, s.eField);
    const weather = Weather.fromPlain(s.weather);

    const attacker = eField.memberAt(fieldPos);
    if (!attacker || !attacker.isAlive) { callback?.(); return; }

    const moves = attacker.poke.moves || [];
    const mv    = moves[Math.floor(Math.random() * moves.length)];
    if (!mv) { callback?.(); return; }

    const blocked = StatusEngine.checkTurnBlock(attacker, log);
    if (blocked) { commitField(store, pField, eField, myTeam, enTeam); callback?.(); return; }

    const alivePSlots = pField.toSlots().filter(i => i !== null && myTeam[i]?.isAlive);
    if (!alivePSlots.length) { callback?.(); return; }
    const targetIdx = alivePSlots[Math.floor(Math.random() * alivePSlots.length)];
    const target    = myTeam[targetIdx];
    if (!target || !target.isAlive) { callback?.(); return; }

    if (MOVE_EFFECTS[mv.n]) {
      StatusEngine.applyMoveEffect(mv.n, attacker, target, log, (type) => store.setWeather(type));
      if (mv.u) attacker.consumeUlt(); else attacker.chargeUlt(10);
      commitField(store, pField, eField, myTeam, enTeam);
      callback?.(); return;
    }

    playTypeSound(mv.t);
    if (mv.t === 'FIRE' && target.hasStatus('FRZ')) { target.removeStatus('FRZ'); }

    const { dmg, mult, stab, absorbed } = DamageEngine.calc(mv, attacker, target, weather);
    if (absorbed) { log('🛡️ ' + target.poke.name + ': مناعة كاملة!', 'sys'); if (mv.u) attacker.consumeUlt(); else attacker.chargeUlt(10); commitField(store, pField, eField, myTeam, enTeam); callback?.(); return; }

    const cat = DamageEngine.category(mv.n, mv.t);
    if (cat === 'physical') target._lastPhysDmgReceived = dmg;
    else if (cat === 'special') target._lastSpecDmgReceived = dmg;
    target.dealDamage(dmg);
    if (mv.u) attacker.consumeUlt(); else attacker.chargeUlt(20);

    const effTxt = mult >= 2 ? ' فعّال جداً!' : mult <= 0.5 ? ' غير فعّال...' : '';
    log('💥 ' + attacker.poke.name + '→' + target.poke.name + ': ' + mv.n + '! (-' + dmg + 'HP)' + effTxt, 'enemy-atk');

    const sec = MOVE_SECONDARY[mv.n];
    if (sec && Math.random() < sec.chance && target.isAlive) StatusEngine.apply(target, sec.status, log);

    if (!target.isAlive) {
      log('💀 ' + target.poke.name + ' سقط!', 'death');
      if (target._destinyBond) { target._destinyBond = false; attacker.forceKO(); eField.processDeaths(); }
      const evts = pField.processDeaths();
      evts.forEach(ev => log('🔄 ' + myTeam[ev.newIdx].poke.name + ' يدخل!', 'sys'));
    }

    commitField(store, pField, eField, myTeam, enTeam);
    if (pField.allFainted) { callback?.('lose'); return; }
    if (eField.allFainted) { callback?.('win');  return; }
    callback?.();
  }, [store, log]);

  // ── END OF TURN — fixed: checks win/lose after status damage ─────────────
  function doEndOfTurn(onDone) {
    const s      = useBattleStore.getState();
    const myTeam = hydrateTeam(s.myTeam);
    const enTeam = hydrateTeam(s.enTeam);
    const pField = new BattleField(myTeam, s.pField);
    const eField = new BattleField(enTeam, s.eField);
    const weather = Weather.fromPlain(s.weather);

    // Status + weather damage to all active members
    [...myTeam, ...enTeam].forEach(m => StatusEngine.applyEndOfTurn(m, weather, log));

    // Process deaths caused by status damage
    const eDeaths = eField.processDeaths();
    eDeaths.forEach(ev => { if (ev.newIdx !== null) log('🔄 ' + enTeam[ev.newIdx].poke.name + ' يدخل!', 'sys'); });

    const pDeaths = pField.processDeaths();
    pDeaths.forEach(ev => { if (ev.newIdx !== null) log('🔄 ' + myTeam[ev.newIdx].poke.name + ' يدخل!', 'sys'); });

    // Tick weather
    const expMsg = weather.tick();
    if (expMsg) log(expMsg, 'sys');

    // Commit all changes back to store
    store.setMyTeam(myTeam.map(m => m.toPlain()));
    store.setEnTeam(enTeam.map(m => m.toPlain()));
    store.setPField(pField.toSlots());
    store.setEField(eField.toSlots());
    useBattleStore.setState({ weather: weather.toPlain() });

    store.setPendingMove(0, null); store.setPendingMove(1, null);
    store.setPendingTarget(0, null); store.setPendingTarget(1, null);

    // Win/lose check AFTER status damage — this is the poison-death fix
    if (eField.allFainted) { onDone?.('win');  return; }
    if (pField.allFainted) { onDone?.('lose'); return; }
    onDone?.(null);
  }

  // ── WIN / LOSS ─────────────────────────────────────────────────────────────
  function endBattleResult(won) {
    const s = useBattleStore.getState();
    SFX.stopBGM();
    setTimeout(() => won ? SFX.victory?.() : SFX.defeat?.(), 200);
    if (won) { progress.gainXP(30 + (s.towerStreak ?? 0) * 5); progress.recordWin(); }
    else       progress.recordLoss();
    store.setActive(false);
    store.setResultData({ type: 'battle', won, xp: won ? 30 : 0, enemy: s.enTeam.find(t => !t.fainted)?.poke || s.enTeam[0]?.poke });
    store.showOverlay('Result');
  }

  // ── TOWER WIN — ULT persists! ──────────────────────────────────────────────
  function handleTowerWin() {
    const snap   = useBattleStore.getState();
    const fIdx   = snap.pField[0] ?? 0;
    const active = snap.myTeam[fIdx];  // read from committed store
    const tIdx   = snap.towerIdx;
    const savedHp  = active?.hp  ?? 0;
    const savedUlt = active?.ult ?? 0; // ULT value is preserved

    useBattleStore.setState(s2 => ({
      towerStreak: s2.towerStreak + 1,
      active: false,
      towerTeam: s2.towerTeam.map((t, i) =>
        i === tIdx ? { ...t, hp: savedHp, ult: savedUlt } : t
      ),
    }));

    const streak = useBattleStore.getState().towerStreak;
    progress.gainXP(20 + streak * 3);
    log('🏆 انتصرت! سلسلة: ' + streak, 'sys');
    SFX.stopBGM(); SFX.victory?.();
    setTimeout(() => useBattleStore.getState().startNextTowerBattle(), 1800);
  }

  function handleTowerLose() {
    const streak = useBattleStore.getState().towerStreak;
    progress.setTowerResult(streak);
    progress.gainXP(streak * 5);
    store.endTowerRun();
  }

  // ── DUAL TURN (2v2) ───────────────────────────────────────────────────────
  const executeDualTurn = useCallback(() => {
    const s = useBattleStore.getState();
    if (!s.active) return;
    store.setPTurn(false);

    const spd = (teamPlain, field, fi) => {
      const idx = field[fi];
      if (idx === null) return 0;
      const m = teamPlain[idx];
      return m && !m.fainted ? (BattleMember.fromPlain(m).effStats.spd) : 0;
    };
    const [first, second] = spd(s.myTeam, s.pField, 0) >= spd(s.myTeam, s.pField, 1) ? [0,1] : [1,0];

    executePlayerHit(first, (r0) => {
      if (r0 === 'win')  { setTimeout(() => endBattleResult(true),  800); return; }
      if (r0 === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }
      setTimeout(() => {
        executePlayerHit(second, (r1) => {
          if (r1 === 'win')  { setTimeout(() => endBattleResult(true),  800); return; }
          if (r1 === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }
          log('🔄 دور العدو...', 'sys');
          setTimeout(() => {
            executeEnemyHit(0, (re0) => {
              if (re0 === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }
              if (re0 === 'win')  { setTimeout(() => endBattleResult(true),  800); return; }
              setTimeout(() => {
                executeEnemyHit(1, (re1) => {
                  if (re1 === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }
                  if (re1 === 'win')  { setTimeout(() => endBattleResult(true),  800); return; }
                  doEndOfTurn((r) => {
                    if (r === 'win')  { setTimeout(() => endBattleResult(true),  800); return; }
                    if (r === 'lose') { setTimeout(() => endBattleResult(false), 800); return; }
                    setTimeout(() => store.setPTurn(true), 200);
                  });
                });
              }, 500);
            });
          }, 600);
        });
      }, 500);
    });
  }, [executePlayerHit, executeEnemyHit, store]);

  // ── TOWER TURN (1v1) ──────────────────────────────────────────────────────
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
          doEndOfTurn((r2) => {
            if (r2 === 'win')  { handleTowerWin();  return; }
            if (r2 === 'lose') { handleTowerLose(); return; }
            setTimeout(() => store.setPTurn(true), 200);
          });
        });
      }, 500);
    });
  }, [executePlayerHit, executeEnemyHit, store]);

  return { executeDualTurn, executeTowerTurn };
}
