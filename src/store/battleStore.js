// ══════════════════════════════════════════
// Battle State Store (Zustand)
// ══════════════════════════════════════════
import { create } from 'zustand';
import { DEX } from '../data/dex.js';
import { Weather, WEATHER_INFO } from '../engine/Weather.js';
import { BattleMember } from '../engine/BattleMember.js';
import { SFX } from '../engine/audio.js';

function addEntry(log, counter, text, cls) {
  const entry = { text, cls: cls || '', id: counter + 1 };
  const next  = log.length >= 120 ? [...log.slice(1), entry] : [...log, entry];
  return { log: next, logCounter: counter + 1 };
}

export const useBattleStore = create((set, get) => ({
  // ── Screen ──────────────────────────────────
  screen: 'selection',

  // ── Selection ───────────────────────────────
  selectedIds: [],
  currentGen: 'all',

  // ── Battle ──────────────────────────────────
  myTeam: [], enTeam: [],
  pField: [null, null], eField: [null, null],
  activeAtk: 0, active: false, pTurn: true,
  gameMode: 'normal', towerActive: false,

  // ── Tower ───────────────────────────────────
  towerTeam: [], towerIdx: 0, towerStreak: 0,

  // ── Pending moves ───────────────────────────
  pendingMoves:    [null, null],
  pendingTargets:  [null, null],
  pendingSwapOldIdx: [null, null],
  pendingAllyTargets: [null, null],
  awaitingTargetFor: null,
  awaitingAllyTargetFor: null,

  // ── Weather ─────────────────────────────────
  weather: new Weather().toPlain(),

  // ── Log ─────────────────────────────────────
  log: [], logCounter: 0,

  // ── Overlays ────────────────────────────────
  overlaySwap: false, overlayTowerFaint: false,
  overlayResult: false, overlayRetreat: false,
  resultData: null,

  // ════ ACTIONS ════════════════════════════════

  addLog(text, cls) {
    set(s => addEntry(s.log, s.logCounter, text, cls));
  },
  clearLog() { set({ log: [], logCounter: 0 }); },

  setScreen(screen)   { set({ screen }); },
  setGen(currentGen)  { set({ currentGen }); },
  setPTurn(pTurn)     { set({ pTurn }); },
  setActive(active)   { set({ active }); },
  setActiveAtk(activeAtk) { set({ activeAtk }); },

  toggleSelectPoke(id) {
    set(s => {
      const idx = s.selectedIds.indexOf(id);
      if (idx >= 0) return { selectedIds: s.selectedIds.filter(x => x !== id) };
      if (s.selectedIds.length >= 4) return {};
      return { selectedIds: [...s.selectedIds, id] };
    });
  },
  removeFromTeam(id) { set(s => ({ selectedIds: s.selectedIds.filter(x => x !== id) })); },

  // ── Weather ─────────────────────────────────
  setWeather(type) {
    set(s => {
      const w   = new Weather(s.weather.type, s.weather.turns);
      const msg = w.set(type);
      return { weather: w.toPlain(), ...(msg ? addEntry(s.log, s.logCounter, msg, 'sys') : {}) };
    });
  },
  doTickWeather() {
    set(s => {
      const { next, message } = tickWeather(s.weather);
      const updates = { weather: next };
      if (message) Object.assign(updates, addEntry(s.log, s.logCounter, message, 'sys'));
      return updates;
    });
  },
  resetWeather() { set({ weather: new Weather() }); },

  // ── Start normal battle ─────────────────────
  startBattle() {
    SFX.playBattleBGM();
    let ids = [...get().selectedIds];
    while (ids.length < 4) {
      const pool = DEX.filter(x => !ids.includes(x.id));
      ids.push(pool[Math.floor(Math.random() * pool.length)].id);
    }
    const myTeam = ids.map(id => BattleMember.fresh(DEX.find(x => x.id === id)).toPlain());
    const ePool  = DEX.filter(x => !myTeam.find(t => t.poke.id === x.id));
    const pool   = [...ePool];
    const enTeam = Array.from({ length: 4 }, () => {
      const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      return BattleMember.fresh(pick).toPlain();
    });
    const names  = myTeam.slice(0,2).map(t=>t.poke.name).join(' & ');
    const enames = enTeam.slice(0,2).map(t=>t.poke.name).join(' & ');
    set({
      myTeam, enTeam,
      pField: [0,1], eField: [0,1], activeAtk: 0,
      active: true, pTurn: true, screen: 'battle',
      gameMode: 'normal', towerActive: false,
      weather: new Weather().toPlain(),
      pendingMoves: [null,null], pendingTargets: [null,null],
      pendingSwapOldIdx: [null,null], pendingAllyTargets: [null,null],
      awaitingTargetFor: null, awaitingAllyTargetFor: null,
      overlayResult: false,
      log: [{ text: `⚔ ${names} vs ${enames}! المعركة 2v2 بدأت!`, cls:'sys', id:1 }],
      logCounter: 1,
    });
  },

  // ── Tower ────────────────────────────────────
  addTowerPoke(poke) {
    set(s => {
      if (s.towerTeam.length >= 6 || s.towerTeam.some(t => t.poke.id === poke.id)) return {};
      return { towerTeam: [...s.towerTeam, { poke, hp: poke.hp, maxHp: poke.hp, fainted: false, ult: 0 }] };
    });
  },
  removeTowerPoke(idx) {
    set(s => ({ towerTeam: s.towerTeam.filter((_,i) => i !== idx) }));
  },

  startTower() {
    set(s => ({
      towerStreak: 0, towerIdx: 0,
      towerTeam: s.towerTeam.map(t => ({ ...t, hp: t.maxHp, fainted: false, ult: 0 })),
      gameMode: 'tower', towerActive: true,
    }));
    get().startNextTowerBattle();
  },

  startNextTowerBattle() {
    const s = get();
    const idx = s.towerTeam.findIndex(t => !t.fainted);
    if (idx === -1) { get().endTowerRun(); return; }

    const player = s.towerTeam[idx].poke;
    const pool   = DEX.filter(x => !s.towerTeam.some(t => t.poke.id === x.id));
    const scaled = pool.filter(p => p.hp >= Math.min(80 + s.towerStreak * 8, 300));
    const src    = scaled.length ? scaled : pool;
    const enemy  = src[Math.floor(Math.random() * src.length)];

    SFX.playBattleBGM();

    const pm   = BattleMember.fresh(player, { hp: s.towerTeam[idx].hp, ult: s.towerTeam[idx].ult ?? 0 }).toPlain();
    const em   = BattleMember.fresh(enemy).toPlain();
    // Tower is 1v1 — fill rest as fainted placeholders
    const myT  = [pm, BattleMember.faintedPlaceholder(player).toPlain(), BattleMember.faintedPlaceholder(player).toPlain(), BattleMember.faintedPlaceholder(player).toPlain()];
    const enT  = [em, { ...BattleMember.fresh(enemy).toPlain(),  fainted: true }, { ...BattleMember.fresh(enemy).toPlain(),  fainted: true }, { ...BattleMember.fresh(enemy).toPlain(),  fainted: true }];

    const msg = `🏰 معركة ${s.towerStreak + 1} | ${player.name} vs ${enemy.name}!`;
    set(s2 => ({
      towerIdx: idx, myTeam: myT, enTeam: enT,
      pField: [0, null], eField: [0, null],
      activeAtk: 0, active: true, pTurn: true, screen: 'battle',
      weather: new Weather().toPlain(),
      overlayResult: false, overlayTowerFaint: false,
      ...addEntry(s2.log, s2.logCounter, msg, 'sys'),
    }));
  },

  endTowerRun() {
    SFX.stopBGM();
    setTimeout(() => SFX.defeat?.(), 300);
    set(s => ({
      towerActive: false, gameMode: 'normal', active: false,
      overlayResult: true,
      resultData: { type: 'tower', streak: s.towerStreak },
    }));
  },

  // ── Sync team member ─────────────────────────
  syncMember(team, idx, patch) {
    set(s => {
      const arr = [...s[team]];
      arr[idx]  = { ...arr[idx], ...patch };
      return { [team]: arr };
    });
  },

  setMyTeam(myTeam)  { set({ myTeam }); },
  setEnTeam(enTeam)  { set({ enTeam }); },
  setPField(pField)  { set({ pField }); },
  setEField(eField)  { set({ eField }); },

  setPendingMove(fi, mi)     { set(s => { const a=[...s.pendingMoves];    a[fi]=mi; return { pendingMoves: a };    }); },
  setPendingTarget(fi, ti)   { set(s => { const a=[...s.pendingTargets];  a[fi]=ti; return { pendingTargets: a };  }); },
  setAwaitingTarget(v)        { set({ awaitingTargetFor: v }); },

  showOverlay(name)  { set({ [`overlay${name}`]: true  }); },
  closeOverlay(name) { set({ [`overlay${name}`]: false }); },
  setResultData(d)   { set({ resultData: d }); },

  resetGame() {
    SFX.stopBGM();
    setTimeout(() => SFX.playSelectBGM(), 300);
    set(s => ({
      screen: 'selection', active: false, pTurn: true,
      myTeam: [], enTeam: [],
      pField: [null,null], eField: [null,null], activeAtk: 0,
      weather: new Weather().toPlain(), log: [], logCounter: 0,
      overlayResult: false, overlaySwap: false,
      overlayTowerFaint: false, overlayRetreat: false,
      resultData: null, towerActive: false, gameMode: 'normal',
      pendingMoves: [null,null], pendingTargets: [null,null],
    }));
  },
}));
