// ══════════════════════════════════════════
// BattleField — Manages field slots & faint replacement
// Knows which members are "on field" and handles
// automatic replacement when one faints
// ══════════════════════════════════════════
import { BattleMember } from './BattleMember.js';

export class BattleField {
  /**
   * @param {BattleMember[]} team  - Full team array (4 members)
   * @param {(number|null)[]} slots - Initial field indices [slot0, slot1]
   */
  constructor(team, slots) {
    this.team  = team;
    this.slots = [...slots]; // e.g. [0, 1] or [0, null]
  }

  // ── Accessors ─────────────────────────────────────────────────────────────
  memberAt(fieldPos) {
    const idx = this.slots[fieldPos];
    return idx !== null && idx !== undefined ? this.team[idx] : null;
  }

  indexAt(fieldPos) { return this.slots[fieldPos] ?? null; }

  get activeIndices() { return this.slots.filter(i => i !== null); }

  get activeMembers() {
    return this.slots
      .filter(i => i !== null)
      .map(i => this.team[i])
      .filter(m => m && !m.fainted);
  }

  get allFainted() {
    return this.team.every(m => m.fainted);
  }

  get anyAliveOnField() {
    return this.slots.some(i => i !== null && this.team[i]?.isAlive);
  }

  // ── Replace fainted slot with next alive bench member ─────────────────────
  // Returns { fieldPos, oldIdx, newIdx, member } | null if no replacement
  replaceFainted(fieldPos) {
    const idx = this.slots[fieldPos];
    if (idx !== null && this.team[idx]?.isAlive) return null; // not fainted

    const activeSet = new Set(this.slots.filter(i => i !== null));
    const nextIdx   = this.team.findIndex((m, i) => !m.fainted && !activeSet.has(i));

    if (nextIdx === -1) {
      this.slots[fieldPos] = null; // no replacement
      return null;
    }

    const oldIdx = this.slots[fieldPos];
    this.slots[fieldPos] = nextIdx;
    return { fieldPos, oldIdx, newIdx: nextIdx, member: this.team[nextIdx] };
  }

  // ── Process all fainted field slots ───────────────────────────────────────
  // Returns array of replacement events for logging
  processDeaths() {
    const events = [];
    for (let fi = 0; fi < this.slots.length; fi++) {
      const idx = this.slots[fi];
      if (idx !== null && this.team[idx]?.fainted) {
        const ev = this.replaceFainted(fi);
        if (ev) events.push(ev);
        else this.slots[fi] = null;
      }
    }
    return events;
  }

  // ── Serialize ─────────────────────────────────────────────────────────────
  toSlots() { return [...this.slots]; }

  toTeamPlain() { return this.team.map(m => m.toPlain()); }
}
