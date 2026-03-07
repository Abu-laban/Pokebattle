// WeatherBar — shows active weather with particles
import { useEffect, useRef } from 'react';
import { useBattleStore } from '../../store/battleStore.js';
import { WEATHER_INFO } from '../../engine/Weather.js';
import styles from './WeatherBar.module.css';

export function WeatherBar() {
  const weather = useBattleStore(s => s.weather);
  const particlesRef = useRef(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    container.innerHTML = '';
    if (!weather.type) return;

    if (weather.type === 'RAIN') {
      for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        const size = 1 + Math.random();
        el.style.cssText = `
          position:absolute;width:${size}px;height:${12 + Math.random() * 8}px;
          background:linear-gradient(180deg,transparent,rgba(79,195,247,.7));
          border-radius:2px;left:${Math.random()*100}%;top:-20px;
          animation:rainDrop ${0.6 + Math.random() * 0.5}s linear ${Math.random() * 2}s infinite;`;
        container.appendChild(el);
      }
    } else if (weather.type === 'SAND') {
      for (let i = 0; i < 20; i++) {
        const el = document.createElement('div');
        const size = 2 + Math.random() * 3;
        el.style.cssText = `
          position:absolute;width:${size}px;height:${size}px;
          background:rgba(255,183,77,.5);border-radius:50%;
          left:-10px;top:${Math.random()*80}%;
          animation:sandDrift ${1.5 + Math.random()}s linear ${Math.random() * 2}s infinite;`;
        container.appendChild(el);
      }
    } else if (weather.type === 'HAIL') {
      for (let i = 0; i < 20; i++) {
        const el = document.createElement('div');
        el.style.cssText = `
          position:absolute;font-size:${3 + Math.random() * 3}px;
          left:${Math.random()*100}%;top:-20px;color:rgba(128,222,234,.8);
          animation:snowFall ${1.2 + Math.random()}s linear ${Math.random() * 2}s infinite;`;
        el.textContent = '❄';
        container.appendChild(el);
      }
    }
  }, [weather.type]);

  if (!weather.type) return null;
  const w = WEATHER_INFO[weather.type];

  return (
    <div
      className={styles.bar}
      style={{ background: w.bg, borderColor: w.borderColor }}
    >
      <span className={styles.icon}>{w.icon}</span>
      <span className={styles.name} style={{ color: w.color }}>{w.name}</span>
      <span className={styles.turns}>
        {weather.turns} {weather.turns === 1 ? 'دور' : 'أدوار'}
      </span>

      {/* Particle container */}
      <div ref={particlesRef} className={styles.particles} aria-hidden />
    </div>
  );
}
