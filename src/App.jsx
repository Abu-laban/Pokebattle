import { useEffect } from 'react';
import { useBattleStore }   from './store/battleStore.js';
import { WEATHER_INFO }     from './engine/Weather.js';
import { SFX }              from './engine/audio.js';
import { SelectionScreen }  from './components/Selection/SelectionScreen.jsx';
import { BattleScreen }     from './components/Battle/BattleScreen.jsx';
import { TowerScreen }      from './components/Tower/TowerScreen.jsx';
import './styles/globals.css';

function Stars() {
  useEffect(() => {
    const layer = document.getElementById('stars-layer');
    if (!layer || layer.children.length > 0) return;
    for (let i = 0; i < 60; i++) {
      const s   = document.createElement('div');
      s.className = 'star';
      const sz  = Math.random() * 2.5 + 1;
      s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*58}%;left:${Math.random()*100}%;--d:${2+Math.random()*4}s;--delay:${Math.random()*4}s`;
      layer.appendChild(s);
    }
  }, []);
  return <div className="stars-layer" id="stars-layer" />;
}

export default function App() {
  const screen  = useBattleStore(s => s.screen);
  const weather = useBattleStore(s => s.weather);

  useEffect(() => {
    document.body.classList.remove('weather-sun','weather-rain','weather-sand','weather-hail');
    if (weather.type) document.body.classList.add(WEATHER_INFO[weather.type]?.bodyClass ?? '');
  }, [weather.type]);

  useEffect(() => {
    const t = setTimeout(() => SFX.playSelectBGM(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Stars />
      <div className="app-wrap">
        <header style={{ textAlign:'center', padding:'16px 0 22px' }}>
          <h1 style={{
            fontFamily:"'Press Start 2P',monospace",
            fontSize:'clamp(13px,3vw,20px)',
            background:'linear-gradient(135deg,#FFD600,#FF6B35,#EC407A)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            letterSpacing:'3px', filter:'drop-shadow(0 0 20px rgba(255,107,53,.4))',
          }}>PokéBattle</h1>
          <p style={{ fontSize:'10px',color:'rgba(255,255,255,.35)',marginTop:'5px',letterSpacing:'3px' }}>
            ARENA · GEN I–VII
          </p>
        </header>

        {screen === 'selection'  && <SelectionScreen />}
        {screen === 'battle'     && <BattleScreen />}
        {screen === 'tower-pick' && <TowerScreen />}
      </div>
    </>
  );
}
