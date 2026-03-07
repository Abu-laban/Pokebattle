// MoveGrid — displays move buttons for tower (1 pokemon at a time)
import styles from './MoveGrid.module.css';

const TYPE_COLORS = {
  FIRE:'#FF6B35', WATER:'#4FC3F7', GRASS:'#66BB6A', ELECTRIC:'#FFD600',
  PSYCHIC:'#EC407A', ICE:'#80DEEA', DRAGON:'#5C6BC0', DARK:'#37474F',
  GHOST:'#7E57C2', ROCK:'#8D6E63', GROUND:'#BCAAA4', STEEL:'#90A4AE',
  FIGHTING:'#EF5350', POISON:'#AB47BC', BUG:'#8BC34A', FLYING:'#29B6F6',
  FAIRY:'#F48FB1', NORMAL:'#BDBDBD',
};

export function MoveGrid({ moves, ult, onSelect, disabled }) {
  return (
    <div className={styles.grid}>
      {(moves || []).map((mv, i) => {
        const color = TYPE_COLORS[mv.t] || '#888';
        const isUlt = mv.u;
        const ultBlocked = isUlt && ult < 100;
        return (
          <button
            key={i}
            className={`${styles.btn} ${isUlt ? styles.ult : ''} ${ultBlocked ? styles.blocked : ''}`}
            style={{ '--type-color': color }}
            disabled={disabled || ultBlocked}
            onClick={() => onSelect(i)}
          >
            {isUlt && <span className={styles.ultTag}>ULT</span>}
            <span className={styles.moveName}>{mv.n}</span>
            <span className={styles.moveType} style={{ background: color }}>
              {mv.t}
            </span>
            {!isUlt && (
              <span className={styles.movePwr}>{mv.p > 0 ? `PWR ${mv.p}` : 'داعم'}</span>
            )}
            {isUlt && (
              <div className={styles.ultProg}>
                <div className={styles.ultProgFill} style={{ width: `${ult}%` }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
