// ══════════════════════════════════════════
// Selection Screen — Choose your team
// ══════════════════════════════════════════
import { useState, useMemo, useRef, useEffect } from 'react';
import { useBattleStore }   from '../../store/battleStore.js';
import { useProgressStore } from '../../store/progressStore.js';
import { DEX }              from '../../data/dex.js';
import { PokeSprite }       from '../UI/PokeSprite.jsx';
import { TypeBadge }        from '../UI/TypeBadge.jsx';
import styles               from './SelectionScreen.module.css';
import { getPokeAbility }  from '../../data/abilities.js';
import { getPokeClass }    from '../../engine/damage.js';
import { POKE_STATS }      from '../../data/pokeStats.js';

const GEN_RANGES = {
  all: [1, 999],
  1:   [1,   151],
  2:   [152, 251],
  3:   [252, 386],
  4:   [387, 493],
  5:   [494, 649],
  6:   [650, 721],
  7:   [722, 809],
};

const GEN_LABELS = {
  all: { label: '全部', icon: '✦', sub: '全' },
  1:   { label: 'Gen I',   icon: '🔴', sub: 'RBY' },
  2:   { label: 'Gen II',  icon: '🥇', sub: 'GSC' },
  3:   { label: 'Gen III', icon: '🟢', sub: 'RSE' },
  4:   { label: 'Gen IV',  icon: '💎', sub: 'DPP' },
  5:   { label: 'Gen V',   icon: '⚫', sub: 'BW'  },
  6:   { label: 'Gen VI',  icon: '🔵', sub: 'XY'  },
  7:   { label: 'Gen VII', icon: '🌺', sub: 'SM'  },
};

export function SelectionScreen() {
  const selectedIds = useBattleStore(s => s.selectedIds);
  const currentGen  = useBattleStore(s => s.currentGen);
  const togglePoke  = useBattleStore(s => s.toggleSelectPoke);
  const removePoke  = useBattleStore(s => s.removeFromTeam);
  const setGen      = useBattleStore(s => s.setGen);
  const startBattle = useBattleStore(s => s.startBattle);
  const setScreen   = useBattleStore(s => s.setScreen);
  const level       = useProgressStore(s => s.level);
  const xp          = useProgressStore(s => s.xp);
  const towerBest   = useProgressStore(s => s.towerBest);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const [lo, hi] = GEN_RANGES[currentGen] || [1, 999];
    return DEX.filter(p => {
      const inGen = p.id >= lo && p.id <= hi;
      const inSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return inGen && inSearch;
    });
  }, [currentGen, search]);

  const canStart = selectedIds.length >= 1;

  return (
    <div className={styles.screen}>
      {/* Profile bar */}
      <div className={styles.profileBar}>
        <div className={styles.profileLeft}>
          <span className={styles.levelBadge}>Lv.{level}</span>
          <div className={styles.xpBar}>
            <div className={styles.xpFill} style={{ width: `${Math.min(100, xp)}%` }} />
          </div>
        </div>
        <div className={styles.profileRight}>
          🏰 أفضل: <strong>{towerBest}</strong>
        </div>
      </div>

      {/* Gen tabs */}
      <div className={styles.genTabs}>
        {Object.entries(GEN_LABELS).map(([gen, info]) => (
          <button
            key={gen}
            className={`${styles.genTab} ${styles['g-' + gen]} ${currentGen === gen ? styles.active : ''}`}
            onClick={() => { setGen(gen); }}
          >
            <span className={styles.genIcon}>{info.icon}</span>
            <span className={styles.genLabel}>{info.label}</span>
            <span className={styles.genSub}>{info.sub}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          placeholder="🔍 ابحث عن بوكيمون..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Info bar */}
      <div className={styles.infoBar}>
        {selectedIds.length === 0
          ? 'اختر 4 بوكيمون ← 1،2 يدخلان ← 3،4 احتياط'
          : `تم اختيار ${selectedIds.length}/4 بوكيمون`}
      </div>

      {/* Team bar */}
      {selectedIds.length > 0 && (
        <TeamBar ids={selectedIds} onRemove={removePoke} />
      )}

      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          className={styles.startBtn}
          disabled={!canStart}
          onClick={startBattle}
        >
          ⚔ بدء المعركة 2v2
        </button>
        <button
          className={styles.towerBtn}
          onClick={() => setScreen('tower-pick')}
        >
          🏰 برج المعارك
        </button>
      </div>

      {/* Poke grid */}
      <PokeGrid
        pokes={filtered}
        selectedIds={selectedIds}
        onSelect={togglePoke}
      />
    </div>
  );
}

// ── Team bar ──────────────────────────────────────────────────────────────────
function TeamBar({ ids, onRemove }) {
  return (
    <div className={styles.teamBar}>
      {ids.map(id => {
        const poke = DEX.find(p => p.id === id);
        if (!poke) return null;
        return (
          <div key={id} className={styles.teamSlot}>
            <PokeSprite id={id} name={poke.name} size={38} />
            <button className={styles.removeBtn} onClick={() => onRemove(id)}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

// ── Pokemon grid with lazy loading ────────────────────────────────────────────
function PokeGrid({ pokes, selectedIds, onSelect }) {
  return (
    <div className={styles.grid}>
      {pokes.map((p, i) => (
        <PokeCard
          key={p.id}
          poke={p}
          selected={selectedIds.includes(p.id)}
          disabled={selectedIds.length >= 4 && !selectedIds.includes(p.id)}
          delay={Math.min(i * 0.02, 0.5)}
          onSelect={() => onSelect(p.id)}
        />
      ))}
    </div>
  );
}

// ── Single pokemon card ───────────────────────────────────────────────────────
function PokeCard({ poke, selected, disabled, delay, onSelect }) {
  const ref       = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { rootMargin: '150px' }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.card} ${selected ? styles.sel : ''} ${disabled ? styles.disabled : ''}`}
      style={{ animationDelay: `${delay}s` }}
      onClick={disabled ? undefined : onSelect}
    >
      {vis && <PokeSprite id={poke.id} name={poke.name} size={80} className={styles.cardImg} />}
      {!vis && <div className={styles.cardImgPlaceholder} />}
      <span className={styles.cardName}>{poke.name}</span>
      <div className={styles.cardTypes}>
        {poke.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
      </div>
      <PokeCardMeta poke={poke} />
    </div>
  );
}

// ── Class + ability mini row ──────────────────────────────────────────────────
function PokeCardMeta({ poke }) {
  const stats    = POKE_STATS[poke.id];
  const pokeClass = stats ? getPokeClass(poke.id, stats) : null;
  const ability   = getPokeAbility(poke.id);
  return (
    <div className={styles.cardMeta}>
      {pokeClass && (
        <span className={styles.classTag} style={{ color: pokeClass.color }}>
          {pokeClass.icon}
        </span>
      )}
      <span className={styles.cardHp}>HP {poke.hp}</span>
      {ability && (
        <span className={styles.abilityTag} title={ability.desc}>
          {ability.icon}
        </span>
      )}
    </div>
  );
}
