// BattleLog — scrolling battle messages
import { useEffect, useRef } from 'react';
import { useBattleStore } from '../../store/battleStore.js';
import styles from './BattleLog.module.css';

export function BattleLog() {
  const log     = useBattleStore(s => s.log);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className={styles.log}>
      {log.map(entry => (
        <div key={entry.id} className={`${styles.entry} ${styles[entry.cls] || ''}`}>
          {entry.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
