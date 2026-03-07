// HPBar — animated health bar with color-coded thresholds
import styles from './HPBar.module.css';

export function HPBar({ current, max, showText = true }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, current / max * 100)) : 0;
  const cls = pct > 50 ? 'green' : pct > 25 ? 'yellow' : 'red';

  return (
    <div className={styles.wrap}>
      {showText && (
        <span className={styles.txt}>{Math.max(0, current)}/{max}</span>
      )}
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${styles[cls]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
