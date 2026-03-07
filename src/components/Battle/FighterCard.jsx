// FighterCard — single combatant HUD panel
import { useRef, useEffect } from 'react';
import { PokeSprite } from '../UI/PokeSprite.jsx';
import { HPBar }      from '../UI/HPBar.jsx';
import { TypeBadge }  from '../UI/TypeBadge.jsx';
import { loadSpriteWithFallback } from '../../engine/sprites.js';
import { STAT_AR }    from '../../engine/status.js';
import styles from './FighterCard.module.css';

const STATUS_STYLE = {
  SLP: { bg: '#6A1FA0', color: '#E1BEE7', label: '😴 نائم' },
  PAR: { bg: '#F9A825', color: '#1A1A1A', label: '⚡ مشلول' },
  BRN: { bg: '#BF360C', color: '#FFCCBC', label: '🔥 محترق' },
  PSN: { bg: '#4A148C', color: '#E1BEE7', label: '☠️ مسموم' },
  FRZ: { bg: '#006064', color: '#B2EBF2', label: '❄️ مجمّد' },
  CNF: { bg: '#FF6F00', color: '#fff',    label: '😵 مرتبك' },
};

export function FighterCard({ member, isPlayer, isActive, fieldPos }) {
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current && member?.poke) {
      loadSpriteWithFallback(imgRef.current, member.poke.id, member.poke.name);
    }
  }, [member?.poke?.id]);

  if (!member) {
    return <div className={`${styles.card} ${styles.empty}`}><span>—</span></div>;
  }

  const { poke, hp, ult, fainted, statuses, stages } = member;
  const statusEntries = statuses ? Object.keys(statuses) : [];
  const stageEntries  = stages
    ? Object.entries(stages).filter(([, v]) => v !== 0)
    : [];

  return (
    <div className={`
      ${styles.card}
      ${isPlayer ? styles.player : styles.enemy}
      ${fainted   ? styles.fainted  : ''}
      ${isActive  ? styles.active   : ''}
    `}>
      {/* Sprite */}
      <img
        ref={imgRef}
        alt={poke.name}
        className={`${styles.sprite} ${fainted ? styles.sprFainted : ''}`}
        style={{ width: 68, height: 68 }}
      />

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.nameLine}>
          <span className={styles.name}>{poke.name}</span>
          {isActive && !fainted && <span className={styles.activeDot} />}
        </div>
        <HPBar current={hp} max={poke.hp} />

        {/* ULT bar */}
        <div className={styles.ultWrap}>
          <span className={styles.ultLabel}>ULT</span>
          <div className={styles.ultTrack}>
            <div className={styles.ultFill} style={{ width: `${ult}%` }} />
          </div>
          <span className={styles.ultPct}>{ult}%</span>
        </div>

        {/* Statuses & stages */}
        {(statusEntries.length > 0 || stageEntries.length > 0) && (
          <div className={styles.badges}>
            {statusEntries.map(s => {
              const st = STATUS_STYLE[s];
              return st ? (
                <span key={s} className={styles.statusBadge}
                  style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              ) : null;
            })}
            {stageEntries.map(([stat, val]) => (
              <span key={stat}
                className={`${styles.stageBadge} ${val > 0 ? styles.pos : styles.neg}`}>
                {STAT_AR[stat] || stat}{val > 0 ? `+${val}` : val}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
