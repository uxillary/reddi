import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { petSprite, Mood } from './ascii';

type Pet = {
  name: string;
  hunger: number;      // 0..100 (higher worse)
  fun: number;         // 0..100 (higher better)
  clean: number;       // 0..100 (higher better)
  energy: number;      // 0..100 (higher better)
  dayId: string;
  lastTick: number;    // ms
  born: string;        // YYYY-MM-DD
};

const clamp = (v:number, min=0, max=100) => Math.max(min, Math.min(max, v));
const todayId = () => new Date().toISOString().slice(0,10);

const defaultPet = (): Pet => ({
  name: 'EGG-420',
  hunger: 20,
  fun: 60,
  clean: 70,
  energy: 80,
  dayId: todayId(),
  lastTick: Date.now(),
  born: todayId(),
});

function load(): Pet {
  const raw = localStorage.getItem('reddi.pet');
  if (raw) {
    try {
      const data = JSON.parse(raw) as Partial<Pet>;
      if (!data.born) data.born = data.dayId ?? todayId();
      return data as Pet;
    } catch (error) {
      console.warn('Failed to parse saved pet data', error);
    }
  }
  return defaultPet();
}
function save(p: Pet) { localStorage.setItem('reddi.pet', JSON.stringify(p)); }

let clickCtx: AudioContext | null = null;

function playClick() {
  if (typeof window === 'undefined') return;
  const win = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const Ctx = win.AudioContext || win.webkitAudioContext;
  if (!Ctx) return;
  clickCtx = clickCtx ?? new Ctx();
  const ctx = clickCtx;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
  osc.stop(ctx.currentTime + 0.12);
}

export default function App() {
  const [pet, setPet] = useState<Pet>(() => load());
  const [blinkOn, setBlinkOn] = useState(false);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const flashTimeoutRef = useRef<number>();
  const lastValuesRef = useRef<Record<string, number>>({});
  const pulseTimeouts = useRef<Record<string, number>>({});
  const [activePulses, setActivePulses] = useState<Record<string, boolean>>({});

  // Game tick: every 6s = “~1 hour” of pet time (tune freely)
  useEffect(() => {
    const id = setInterval(() => {
      setPet(prev => {
        const elapsed = Date.now() - prev.lastTick;
        const steps = Math.max(1, Math.floor(elapsed / 6000));
        let { hunger, fun, clean, energy } = prev;

        // Passive decay/gain (tuned for chill daily play)
        hunger = clamp(hunger + 1 * steps);
        fun    = clamp(fun - 0.5 * steps);
        clean  = clamp(clean - 0.4 * steps);
        energy = clamp(energy + 0.2 * steps); // small recharge if idle

        const next = { ...prev, hunger, fun, clean, energy, lastTick: Date.now(), dayId: todayId() };
        save(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let blinkTimeout: number | undefined;
    const interval = window.setInterval(() => {
      setBlinkOn(true);
      window.clearTimeout(blinkTimeout);
      blinkTimeout = window.setTimeout(() => setBlinkOn(false), 100);
    }, 2200);
    return () => {
      window.clearInterval(interval);
      if (blinkTimeout !== undefined) window.clearTimeout(blinkTimeout);
    };
  }, []);

  const flashScreen = useCallback(() => {
    if (!screenRef.current) return;
    screenRef.current.classList.add('flash');
    if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(() => {
      screenRef.current?.classList.remove('flash');
      flashTimeoutRef.current = undefined;
    }, 200);
  }, []);

  const triggerPulse = useCallback((key: string) => {
    setActivePulses(prev => ({ ...prev, [key]: true }));
    const timeout = pulseTimeouts.current[key];
    if (timeout) window.clearTimeout(timeout);
    pulseTimeouts.current[key] = window.setTimeout(() => {
      setActivePulses(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      delete pulseTimeouts.current[key];
    }, 400);
  }, []);

  useEffect(() => () => {
    if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current);
    Object.values(pulseTimeouts.current).forEach(id => window.clearTimeout(id));
  }, []);

  // Mood logic
  const mood: Mood = useMemo(() => {
    if (pet.energy < 20) return 'sleep';
    if (pet.hunger > 70) return 'hungry';
    if (pet.clean < 30) return 'dirty';
    if (pet.fun > 80) return 'happy';
    if (pet.fun < 30) return 'bored';
    return 'idle';
  }, [pet]);

  const feed = () => {
    playClick();
    setPet(p => {
      const n = { ...p, hunger: clamp(p.hunger - 25), energy: clamp(p.energy + 5) };
      save(n);
      return n;
    });
    flashScreen();
  };
  const play = () => {
    playClick();
    setPet(p => {
      const n = { ...p, fun: clamp(p.fun + 20), energy: clamp(p.energy - 8), hunger: clamp(p.hunger + 8) };
      save(n);
      return n;
    });
    flashScreen();
  };
  const cleanUp = () => {
    playClick();
    setPet(p => {
      const n = { ...p, clean: clamp(p.clean + 30) };
      save(n);
      return n;
    });
    flashScreen();
  };
  const sleep = () => {
    playClick();
    setPet(p => {
      const n = { ...p, energy: clamp(p.energy + 25) };
      save(n);
      return n;
    });
    flashScreen();
  };
  const rename = () => {
    playClick();
    const name = prompt('Name your pet:', pet.name)?.trim();
    if (name) {
      setPet(p => {
        const n = { ...p, name };
        save(n);
        return n;
      });
      flashScreen();
    }
  };
  const reset = () => {
    playClick();
    const n = defaultPet();
    save(n);
    setPet(n);
    flashScreen();
  };

  // Simple “evolution” badge for later: show stage by aggregate health
  const fullness = 100 - pet.hunger;
  const fun = pet.fun;
  const clean = pet.clean;
  const energy = pet.energy;
  const health = Math.round(( fullness + fun + clean + energy ) / 4);
  const stage = health > 85 ? 3 : health > 65 ? 2 : 1;
  const age = Math.floor((Date.now() - new Date(pet.born).getTime()) / 86400000);
  const agePercent = Math.min(100, Math.round((age / 7) * 100));
  const eggId = pet.name.toUpperCase().startsWith('EGG-') ? pet.name.toUpperCase().slice(4) : pet.name.toUpperCase();
  const day = Math.max(1, age + 1);

  const stats = useMemo(
    () => [
      { key: 'hunger', label: 'Hunger', value: fullness },
      { key: 'fun', label: 'Fun', value: fun },
      { key: 'clean', label: 'Clean', value: clean },
      { key: 'energy', label: 'Energy', value: energy },
      { key: 'age', label: 'Age', value: agePercent, isAge: true },
      { key: 'health', label: 'Health', value: health },
    ],
    [fullness, fun, clean, energy, agePercent, health]
  );

  useEffect(() => {
    stats.forEach(({ key, value }) => {
      const pct = Math.max(0, Math.min(100, Math.round(value)));
      const last = lastValuesRef.current[key];
      if (last === undefined) {
        lastValuesRef.current[key] = pct;
        return;
      }
      if (Math.abs(pct - last) >= 5) {
        lastValuesRef.current[key] = pct;
        triggerPulse(key);
      } else {
        lastValuesRef.current[key] = pct;
      }
    });
  }, [stats, triggerPulse]);

  const ascii = petSprite(mood, blinkOn);
  const asciiLines = ascii.split('\n');
  while (asciiLines.length && asciiLines[0].trim() === '') asciiLines.shift();
  while (asciiLines.length && asciiLines[asciiLines.length - 1].trim() === '') asciiLines.pop();
  const asciiFace = asciiLines.map(line => line.replace(/\s+$/, '')).join('\n');

  return (
    <div className="device">
      <div className="bezel">
        <div className="screen" ref={screenRef}>
          <div className="header">
            <span className="badge">reddy-pet</span>
            <span className="badge">Stage {stage}</span>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:16}}>
            <div className="face">
              <pre aria-label="pet-face" style={{margin:0}}>{asciiFace}</pre>
            </div>

            <div>
              <div className="stats">
                {stats.map(({ key, label, value, isAge }) => {
                  const pct = Math.max(0, Math.min(100, Math.round(value)));
                  const state = isAge ? 'ok' : pct < 25 ? 'bad' : pct < 50 ? 'warn' : 'ok';
                  return (
                    <Fragment key={key}>
                      <div className="stat-label">{label}</div>
                      <div className="bar" data-state={state}>
                        <span
                          className={activePulses[key] ? 'pulse' : undefined}
                          style={{ width: pct + '%' }}
                        />
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="controls">
            <button className="btn btn--primary" onClick={feed}>FEED</button>
            <button className="btn" onClick={play}>PLAY</button>
            <button className="btn btn--danger" onClick={cleanUp}>CLEAN</button>
            <button className="btn" onClick={sleep}>SLEEP</button>
            <button className="btn" onClick={rename}>NAME</button>
            <button className="btn" onClick={reset}>RESET</button>
          </div>

          <div className="meta">★ Stage {stage} • EGG-{eggId} • Day {day}</div>
        </div>
      </div>
    </div>
  );
}
