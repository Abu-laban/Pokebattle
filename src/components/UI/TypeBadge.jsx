// TypeBadge — colored type pill
import styles from './TypeBadge.module.css';

const TYPE_COLORS = {
  FIRE:     { bg: '#FF6B35', color: '#fff' },
  WATER:    { bg: '#4FC3F7', color: '#000' },
  GRASS:    { bg: '#66BB6A', color: '#000' },
  ELECTRIC: { bg: '#FFD600', color: '#000' },
  PSYCHIC:  { bg: '#EC407A', color: '#fff' },
  ICE:      { bg: '#80DEEA', color: '#000' },
  DRAGON:   { bg: '#5C6BC0', color: '#fff' },
  DARK:     { bg: '#37474F', color: '#fff' },
  GHOST:    { bg: '#7E57C2', color: '#fff' },
  ROCK:     { bg: '#8D6E63', color: '#fff' },
  GROUND:   { bg: '#BCAAA4', color: '#000' },
  STEEL:    { bg: '#90A4AE', color: '#000' },
  FIGHTING: { bg: '#EF5350', color: '#fff' },
  POISON:   { bg: '#AB47BC', color: '#fff' },
  BUG:      { bg: '#8BC34A', color: '#000' },
  FLYING:   { bg: '#29B6F6', color: '#000' },
  FAIRY:    { bg: '#F48FB1', color: '#000' },
  NORMAL:   { bg: '#BDBDBD', color: '#000' },
};

export function TypeBadge({ type, size = 'md' }) {
  const c = TYPE_COLORS[type] || { bg: '#555', color: '#fff' };
  return (
    <span
      className={`${styles.badge} ${styles[size]}`}
      style={{ background: c.bg, color: c.color }}
    >
      {type}
    </span>
  );
}
