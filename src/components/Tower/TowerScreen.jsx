// Tower Selection Screen
import { useState, useEffect, useRef } from 'react';
import { useBattleStore }   from '../../store/battleStore.js';
import { DEX }              from '../../data/dex.js';
import { PokeSprite }       from '../UI/PokeSprite.jsx';
import { TypeBadge }        from '../UI/TypeBadge.jsx';
import styles               from './TowerScreen.module.css';

export function TowerScreen() {
  const towerTeam     = useBattleStore(s => s.towerTeam);
  const addTowerPoke  = useBattleStore(s => s.addTowerPoke);
  const removePoke    = useBattleStore(s => s.removeTowerPoke);
  const startTower    = useBattleStore(s => s.startTower);
  const setScreen     = useBattleStore(s => s.setScreen);
  const [search, setSearch] = useState('');

  const available = DEX.filter(p =>
    !towerTeam.some(t => t.poke.id === p.id) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => setScreen('selection')}>← رجوع</button>
        <h2 className={styles.title}>🏰 برج المعارك</h2>
        <p className={styles.sub}>اختر 6 بوكيمون لاجتياز أطول سلسلة ممكنة</p>
      </div>

      {/* Team slots */}
      <div className={styles.slots}>
        {Array.from({ length: 6 }, (_, i) => (
          <TowerSlot
            key={i}
            slot={towerTeam[i]}
            index={i}
            onRemove={() => removePoke(i)}
          />
        ))}
      </div>

      {/* Start button */}
      <button
        className={styles.startBtn}
        disabled={towerTeam.length < 6}
        onClick={startTower}
      >
        🏰 ادخل البرج ({towerTeam.length}/6)
      </button>

      {/* Search */}
      <input
        className={styles.search}
        placeholder="🔍 ابحث..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Pick grid */}
      <div className={styles.grid}>
        {available.map(p => (
          <div
            key={p.id}
            className={`${styles.card} ${towerTeam.length >= 6 ? styles.disabled : ''}`}
            onClick={() => towerTeam.length < 6 && addTowerPoke(p)}
          >
            <PokeSprite id={p.id} name={p.name} size={56} />
            <span className={styles.name}>{p.name}</span>
            <div className={styles.types}>
              {p.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TowerSlot({ slot, index, onRemove }) {
  if (!slot) {
    return (
      <div className={`${styles.slot} ${styles.empty}`}>
        <span className={styles.slotNum}>{index + 1}</span>
        <span className={styles.plus}>+</span>
        <span className={styles.emptyLabel}>فارغ</span>
      </div>
    );
  }
  return (
    <div className={`${styles.slot} ${styles.filled}`}>
      <span className={styles.slotNum}>{index + 1}</span>
      <PokeSprite id={slot.poke.id} name={slot.poke.name} size={44} />
      <span className={styles.slotName}>{slot.poke.name}</span>
      <span className={styles.slotHp}>HP {slot.poke.hp}</span>
      <button className={styles.removeBtn} onClick={onRemove}>✕</button>
    </div>
  );
}
