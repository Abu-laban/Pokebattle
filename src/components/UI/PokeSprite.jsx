// PokeSprite — handles animated GIF → static PNG → official art fallback chain
import { useEffect, useRef } from 'react';
import { loadSpriteWithFallback } from '../../engine/sprites.js';
import styles from './PokeSprite.module.css';

export function PokeSprite({ id, name, size = 88, className = '', style = {} }) {
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current && id) {
      loadSpriteWithFallback(imgRef.current, id, name);
    }
  }, [id, name]);

  return (
    <img
      ref={imgRef}
      alt={name || ''}
      className={`${styles.sprite} ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  );
}
