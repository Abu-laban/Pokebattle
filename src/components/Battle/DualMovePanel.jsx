// DualMovePanel — 2v2 move selection (one panel per player pokemon)
import { useBattleStore } from '../../store/battleStore.js';
import styles from './DualMovePanel.module.css';

const TYPE_COLORS = {
  FIRE:'#FF6B35', WATER:'#4FC3F7', GRASS:'#66BB6A', ELECTRIC:'#FFD600',
  PSYCHIC:'#EC407A', ICE:'#80DEEA', DRAGON:'#5C6BC0', DARK:'#37474F',
  GHOST:'#7E57C2', ROCK:'#8D6E63', GROUND:'#BCAAA4', STEEL:'#90A4AE',
  FIGHTING:'#EF5350', POISON:'#AB47BC', BUG:'#8BC34A', FLYING:'#29B6F6',
  FAIRY:'#F48FB1', NORMAL:'#BDBDBD',
};

export function DualMovePanel({ fieldPos, onCommit }) {
  const myTeam = useBattleStore(s => s.myTeam);
  const pField = useBattleStore(s => s.pField);
  const pendingMoves   = useBattleStore(s => s.pendingMoves);
  const pendingTargets = useBattleStore(s => s.pendingTargets);
  const pTurn  = useBattleStore(s => s.pTurn);
  const setPendingMove   = useBattleStore(s => s.setPendingMove);
  const setPendingTarget = useBattleStore(s => s.setPendingTarget);

  const idx    = pField[fieldPos];
  const member = idx !== null ? myTeam[idx] : null;

  if (!member || member.fainted) {
    return <div className={styles.panel + ' ' + styles.empty}>—</div>;
  }

  const queued  = pendingMoves[fieldPos] !== null;
  const isFirst = fieldPos === 0;

  const handleMove = (mi) => {
    setPendingMove(fieldPos, mi);
    setPendingTarget(fieldPos, 0); // auto-target first enemy
    onCommit?.(fieldPos);
  };

  return (
    <div className={`${styles.panel} ${queued ? styles.queued : ''} ${isFirst ? styles.first : styles.second}`}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.pokeNum}>{fieldPos + 1}</span>
        <span className={styles.pokeName}>{member.poke.name}</span>
        {queued
          ? <span className={styles.readyBadge}>✔ جاهز</span>
          : <span className={styles.chooseTxt}>اختر هجوماً</span>
        }
      </div>

      {/* Moves */}
      {!queued ? (
        <div className={styles.moves}>
          {member.poke.moves.map((mv, i) => {
            const color   = TYPE_COLORS[mv.t] || '#888';
            const blocked = mv.u && member.ult < 100;
            return (
              <button
                key={i}
                className={`${styles.mv} ${mv.u ? styles.ultMv : ''} ${blocked ? styles.blocked : ''}`}
                style={{ '--c': color }}
                disabled={!pTurn || blocked}
                onClick={() => handleMove(i)}
              >
                {mv.u && <span className={styles.ultTag}>ULT</span>}
                <span className={styles.mvName}>{mv.n}</span>
                <span className={styles.mvType} style={{ background: color }}>{mv.t}</span>
                <span className={styles.mvPwr}>{mv.p > 0 ? `${mv.p}` : '—'}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={styles.queuedMove}>
          <span>⚔ {member.poke.moves[pendingMoves[fieldPos]]?.n}</span>
          <button
            className={styles.cancelBtn}
            onClick={() => { setPendingMove(fieldPos, null); }}
          >✕ تغيير</button>
        </div>
      )}
    </div>
  );
}
