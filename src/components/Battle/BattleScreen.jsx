// ══════════════════════════════════════════
// BattleScreen — Main battle component (2v2 + Tower)
// ══════════════════════════════════════════
import { useCallback } from 'react';
import { useBattleStore }   from '../../store/battleStore.js';
import { useBattleEngine }  from '../../hooks/useBattleEngine.js';
import { FighterCard }      from './FighterCard.jsx';
import { WeatherBar }       from './WeatherBar.jsx';
import { BattleLog }        from './BattleLog.jsx';
import { MoveGrid }         from './MoveGrid.jsx';
import { DualMovePanel }    from './DualMovePanel.jsx';
import { ResultOverlay }    from '../Overlays/ResultOverlay.jsx';
import styles from './BattleScreen.module.css';

export function BattleScreen() {
  const screen = useBattleStore(s => s.screen);
  if (screen !== 'battle') return null;

  return (
    <>
      <BattleMain />
      <ResultOverlay />
    </>
  );
}

function BattleMain() {
  const myTeam      = useBattleStore(s => s.myTeam);
  const enTeam      = useBattleStore(s => s.enTeam);
  const pField      = useBattleStore(s => s.pField);
  const eField      = useBattleStore(s => s.eField);
  const activeAtk   = useBattleStore(s => s.activeAtk);
  const pTurn       = useBattleStore(s => s.pTurn);
  const active      = useBattleStore(s => s.active);
  const towerActive = useBattleStore(s => s.towerActive);
  const towerStreak = useBattleStore(s => s.towerStreak);
  const pendingMoves = useBattleStore(s => s.pendingMoves);
  const resetGame   = useBattleStore(s => s.resetGame);

  const { executeDualTurn, executeTowerTurn } = useBattleEngine();

  // Both player slots have moves chosen
  const allReady = !towerActive && (
    (pField[0] === null || myTeam[pField[0]]?.fainted || pendingMoves[0] !== null) &&
    (pField[1] === null || myTeam[pField[1]]?.fainted || pendingMoves[1] !== null) &&
    pendingMoves.some(m => m !== null)
  );

  const handleTowerMove = useCallback((moveIdx) => {
    if (!pTurn || !active) return;
    executeTowerTurn(moveIdx);
  }, [pTurn, active, executeTowerTurn]);

  const handlePanelCommit = useCallback(() => {
    // auto-commit when both are ready
  }, []);

  const activeMember = towerActive
    ? myTeam[pField[0] ?? 0]
    : null;

  return (
    <div className={styles.screen}>
      {/* Tower streak bar */}
      {towerActive && (
        <div className={styles.towerBar}>
          <span>🏰 برج المعارك</span>
          <span className={styles.streak}>سلسلة: <strong>{towerStreak}</strong></span>
        </div>
      )}

      {/* Arena — fighters */}
      <div className={`${styles.arena} arena`}>
        <div className={styles.arenaGlow} />
        <div className={styles.fighters}>
          {/* Player side */}
          <div className={styles.side}>
            <div className={styles.sideLabel}>🎮 فريقك</div>
            <FighterCard
              member={pField[0] !== null ? myTeam[pField[0]] : null}
              isPlayer fieldPos={0}
              isActive={pTurn && activeAtk === 0}
            />
            {!towerActive && (
              <FighterCard
                member={pField[1] !== null ? myTeam[pField[1]] : null}
                isPlayer fieldPos={1}
                isActive={pTurn && activeAtk === 1}
              />
            )}
          </div>

          {/* VS divider */}
          <div className={styles.vs}>VS</div>

          {/* Enemy side */}
          <div className={styles.side}>
            <div className={`${styles.sideLabel} ${styles.enemyLabel}`}>💀 العدو</div>
            <FighterCard
              member={eField[0] !== null ? enTeam[eField[0]] : null}
              isPlayer={false} fieldPos={0}
            />
            {!towerActive && (
              <FighterCard
                member={eField[1] !== null ? enTeam[eField[1]] : null}
                isPlayer={false} fieldPos={1}
              />
            )}
          </div>
        </div>
      </div>

      {/* Weather bar */}
      <WeatherBar />

      {/* Turn indicator */}
      <div className={`${styles.turnBar} ${pTurn ? styles.playerTurn : styles.enemyTurn}`}>
        <span className={styles.dot} />
        {pTurn ? '🗡️ دورك للهجوم!' : '💀 دور العدو...'}
        <span className={styles.dot} />
      </div>

      {/* ── TOWER: single move grid ── */}
      {towerActive && activeMember && (
        <div className={styles.towerMoves}>
          <div className={styles.movesHead}>⚔ اختر هجومك</div>
          <MoveGrid
            moves={activeMember.poke.moves}
            ult={activeMember.ult}
            onSelect={handleTowerMove}
            disabled={!pTurn || !active}
          />
        </div>
      )}

      {/* ── 2v2: dual move panels + commit button ── */}
      {!towerActive && (
        <>
          <div className={styles.dualPanels}>
            <DualMovePanel fieldPos={0} onCommit={handlePanelCommit} />
            <DualMovePanel fieldPos={1} onCommit={handlePanelCommit} />
          </div>
          <button
            className={`${styles.endTurnBtn} ${allReady ? styles.ready : ''}`}
            disabled={!allReady || !pTurn || !active}
            onClick={executeDualTurn}
          >
            ⚔ انهاء الدور
          </button>
        </>
      )}

      {/* Retreat */}
      <button
        className={styles.retreatBtn}
        disabled={!active}
        onClick={resetGame}
      >
        🏳️ انسحاب من المعركة
      </button>

      {/* Battle log */}
      <BattleLog />
    </div>
  );
}
