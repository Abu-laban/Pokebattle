// ══════════════════════════════════════════
// BattleMember — Core game object (class-based)
// Represents a single Pokémon in battle with
// full state: HP, ULT, stages, statuses, flags
// ══════════════════════════════════════════
import { getPokeAbility } from '../data/abilities.js';
import { POKE_STATS }     from '../data/pokeStats.js';

export class BattleMember {
  /**
   * @param {object} poke - Pokémon data from DEX
   * @param {object} [opts] - Optional overrides: { hp, ult }
   */
  constructor(poke, opts = {}) {
    this.poke    = poke;
    this.hp      = opts.hp  !== undefined ? opts.hp  : poke.hp;
    this.ult     = opts.ult !== undefined ? opts.ult : 0;
    this.fainted = this.hp <= 0;

    // Stat stages (-6 to +6)
    this.stages = { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0 };

    // Active status conditions
    // { SLP: {turns}, PAR: {}, BRN: {}, PSN: {}, FRZ: {turns}, CNF: {turns} }
    this.statuses = {};

    // Battle flags
    this._lastPhysDmgReceived = 0;
    this._lastSpecDmgReceived = 0;
    this._destinyBond         = false;

    // Ability cache
    this._ability = null;
    this._abilityLoaded = false;
  }

  // ── Ability (lazy-loaded) ─────────────────────────────────────────────────
  get ability() {
    if (!this._abilityLoaded) {
      this._ability       = getPokeAbility(this.poke.id) ?? null;
      this._abilityLoaded = true;
    }
    return this._ability;
  }

  // ── HP helpers ────────────────────────────────────────────────────────────
  get maxHp()    { return this.poke.hp; }
  get hpPercent(){ return this.maxHp > 0 ? this.hp / this.maxHp : 0; }
  get isAlive()  { return !this.fainted && this.hp > 0; }

  dealDamage(amount) {
    this.hp = Math.max(0, this.hp - Math.max(1, amount));
    if (this.hp === 0) this.fainted = true;
    return this.hp === 0; // true = fainted this hit
  }

  healHp(amount) {
    this.hp = Math.min(this.maxHp, this.hp + Math.max(1, amount));
  }

  forceKO() {
    this.hp = 0;
    this.fainted = true;
  }

  // ── ULT helpers ───────────────────────────────────────────────────────────
  get ultReady() { return this.ult >= 100; }

  chargeUlt(amount = 20) {
    this.ult = Math.min(100, this.ult + amount);
  }

  consumeUlt() {
    if (!this.ultReady) return false;
    // ── ULT is CONSUMED on use but does NOT reset to 0 in tower ──
    // It stays at 100 between tower battles, resets only when used
    this.ult = 0;
    return true;
  }

  // ── Stage helpers ─────────────────────────────────────────────────────────
  changeStage(stat, delta) {
    const cur     = this.stages[stat] ?? 0;
    const next    = Math.max(-6, Math.min(6, cur + delta));
    this.stages[stat] = next;
    return next - cur; // actual change applied
  }

  resetStages() {
    this.stages = { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0 };
  }

  // ── Status helpers ────────────────────────────────────────────────────────
  hasStatus(type)    { return !!this.statuses[type]; }
  addStatus(type, data = {}) { this.statuses[type] = data; }
  removeStatus(type) { delete this.statuses[type]; }
  clearAllStatus()   { this.statuses = {}; }
  get activeStatuses() { return Object.keys(this.statuses); }

  // ── Effective stats (with stages + ability + status multipliers) ──────────
  get effStats() {
    const base = POKE_STATS[this.poke.id] || { a: 80, d: 80, sa: 80, sd: 80, sp: 80 };
    const st   = this.stages;
    const ab   = this.ability;
    const hasSts = this.activeStatuses.length > 0;

    const stageMult = (s) => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);

    const brnMult  = this.hasStatus('BRN') ? 0.5 : 1;
    const parMult  = this.hasStatus('PAR') ? 0.5 : 1;
    const gutsMult = (ab?.id === 'GUTS'   && hasSts) ? 1.5 : 1;
    const mrvlMult = (ab?.id === 'MARVEL_SCALE' && hasSts) ? 1.5 : 1;
    const hugeMult = (ab?.id === 'HUGE_POWER' || ab?.id === 'PURE_POWER') ? 2 : 1;

    return {
      atk:   Math.max(1, Math.round(base.a  * stageMult(st.atk   || 0) * brnMult * gutsMult * hugeMult)),
      def:   Math.max(1, Math.round(base.d  * stageMult(st.def   || 0) * mrvlMult)),
      spatk: Math.max(1, Math.round(base.sa * stageMult(st.spatk || 0))),
      spdef: Math.max(1, Math.round(base.sd * stageMult(st.spdef || 0))),
      spd:   Math.max(1, Math.round(base.sp * stageMult(st.spd   || 0) * parMult)),
    };
  }

  // ── Serialize for Zustand (plain object) ─────────────────────────────────
  toPlain() {
    return {
      poke:     this.poke,
      hp:       this.hp,
      ult:      this.ult,
      fainted:  this.fainted,
      stages:   { ...this.stages },
      statuses: { ...this.statuses },
      _lastPhysDmgReceived: this._lastPhysDmgReceived,
      _lastSpecDmgReceived: this._lastSpecDmgReceived,
      _destinyBond:         this._destinyBond,
    };
  }

  // ── Deserialize from Zustand plain object ────────────────────────────────
  static fromPlain(plain) {
    if (!plain?.poke) return null;
    const m = new BattleMember(plain.poke, { hp: plain.hp, ult: plain.ult ?? 0 });
    m.fainted  = plain.fainted ?? (plain.hp <= 0);
    m.stages   = { ...{ atk:0, def:0, spatk:0, spdef:0, spd:0 }, ...plain.stages };
    m.statuses = { ...plain.statuses };
    m._lastPhysDmgReceived = plain._lastPhysDmgReceived ?? 0;
    m._lastSpecDmgReceived = plain._lastSpecDmgReceived ?? 0;
    m._destinyBond         = plain._destinyBond ?? false;
    return m;
  }

  // ── Factory: fresh member ────────────────────────────────────────────────
  static fresh(poke, opts = {}) {
    return new BattleMember(poke, opts);
  }

  // ── Factory: fainted placeholder (for 2v2/tower slot filling) ────────────
  static faintedPlaceholder(poke) {
    const m = new BattleMember(poke, { hp: 0 });
    m.fainted = true;
    return m;
  }
}
