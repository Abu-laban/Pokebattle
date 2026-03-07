// ══════════════════════════════════════════
// Progress / Achievements Store (Zustand + persist)
// ══════════════════════════════════════════
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export function xpForLevel(lvl) {
  return 100 + (lvl - 1) * 50;
}

export const ACHIEVEMENTS = [
  { id: 'first_win',    title: '🏆 أول انتصار!',     desc: 'فز بمعركتك الأولى',           check: p => p.wins >= 1          },
  { id: 'win_5',        title: '🔥 5 انتصارات',       desc: 'فز بـ 5 معارك',               check: p => p.wins >= 5          },
  { id: 'win_25',       title: '⚡ 25 انتصار',        desc: 'فز بـ 25 معركة',              check: p => p.wins >= 25         },
  { id: 'tower_5',      title: '🏰 بطل البرج',        desc: 'حقق 5 انتصارات في البرج',     check: p => p.towerBest >= 5     },
  { id: 'tower_10',     title: '👑 أسطورة البرج',     desc: 'حقق 10 انتصارات في البرج',    check: p => p.towerBest >= 10    },
  { id: 'super_eff_10', title: '✨ 10 ضربات فعّالة',  desc: 'أصب ضربة فعّالة جداً 10 مرات',check: p => p.superEffHits >= 10 },
  { id: 'lvl_5',        title: '⭐ مستوى 5',          desc: 'ابلغ المستوى 5',              check: p => p.level >= 5         },
  { id: 'lvl_10',       title: '🌟 مستوى 10',         desc: 'ابلغ المستوى 10',             check: p => p.level >= 10        },
];

export const useProgressStore = create(
  persist(
    (set, get) => ({
      level: 1, xp: 0, wins: 0, losses: 0,
      totalDmg: 0, superEffHits: 0,
      towerBest: 0, towerCurrent: 0,
      unlockedAchievements: [],

      gainXP(amount) {
        set(s => {
          let xp  = s.xp + amount;
          let lvl = s.level;
          while (xp >= xpForLevel(lvl)) { xp -= xpForLevel(lvl); lvl++; }
          return { xp, level: lvl };
        });
        get().checkAchievements();
      },

      recordWin()  { set(s => ({ wins:    s.wins    + 1 })); get().checkAchievements(); },
      recordLoss() { set(s => ({ losses:  s.losses  + 1 })); },
      recordSuperEff() { set(s => ({ superEffHits: s.superEffHits + 1 })); get().checkAchievements(); },

      setTowerResult(streak) {
        set(s => ({
          towerCurrent: streak,
          towerBest: Math.max(s.towerBest, streak),
        }));
        get().checkAchievements();
      },

      xpPercent() {
        const s = get();
        return Math.min(100, Math.round(s.xp / xpForLevel(s.level) * 100));
      },

      checkAchievements() {
        const p = get();
        ACHIEVEMENTS.forEach(ach => {
          if (!p.unlockedAchievements.includes(ach.id) && ach.check(p)) {
            set(s => ({ unlockedAchievements: [...s.unlockedAchievements, ach.id] }));
            window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: ach }));
          }
        });
      },

      reset() {
        set({ level:1, xp:0, wins:0, losses:0, totalDmg:0,
              superEffHits:0, towerBest:0, towerCurrent:0, unlockedAchievements:[] });
      },
    }),
    { name: 'pokebattle-progress' }
  )
);
