// ResultOverlay — win/lose/tower-end screen
import { useBattleStore }   from '../../store/battleStore.js';
import { useProgressStore } from '../../store/progressStore.js';
import { PokeSprite }       from '../UI/PokeSprite.jsx';
import styles from './ResultOverlay.module.css';

export function ResultOverlay() {
  const show       = useBattleStore(s => s.overlayResult);
  const resultData = useBattleStore(s => s.resultData);
  const resetGame  = useBattleStore(s => s.resetGame);
  const level      = useProgressStore(s => s.level);
  const wins       = useProgressStore(s => s.wins);
  const towerBest  = useProgressStore(s => s.towerBest);

  if (!show || !resultData) return null;

  const isTower = resultData.type === 'tower';
  const won     = resultData.won;

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        {/* Title */}
        <div className={`${styles.title} ${isTower ? styles.tower : won ? styles.win : styles.lose}`}>
          {isTower
            ? (resultData.streak > 0 ? '🏆 انتهى البرج!' : '💀 الهزيمة')
            : won ? '🏆 انتصرت!' : '💀 خسرت...'}
        </div>

        {/* Sprite */}
        {resultData.enemy && !isTower && (
          <PokeSprite
            id={resultData.enemy.id}
            name={resultData.enemy.name}
            size={90}
            className={styles.sprite}
          />
        )}

        {/* Stats */}
        <div className={styles.stats}>
          {isTower ? (
            <>
              <Stat label="سلسلة هذه الجولة" value={resultData.streak} />
              <Stat label="أفضل سلسلة" value={towerBest} />
            </>
          ) : (
            <>
              <Stat label="المستوى" value={level} />
              <Stat label="الانتصارات" value={wins} />
              {resultData.xp > 0 && <Stat label="XP مكتسب" value={`+${resultData.xp}`} gold />}
            </>
          )}
        </div>

        <button className={styles.returnBtn} onClick={resetGame}>
          🏠 العودة للقائمة
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, gold }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 3,
                    fontFamily: "'Press Start 2P', monospace" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900,
                    color: gold ? '#FFD600' : '#fff' }}>{value}</div>
    </div>
  );
}
