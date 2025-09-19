import { useEffect, useMemo, useRef, useState } from 'react';
import { petSprite, Mood } from './ascii';

type Pet = {
  name: string;
  hunger: number; // 0..100 (higher worse)
  fun: number; // 0..100 (higher better)
  clean: number; // 0..100 (higher better)
  energy: number; // 0..100 (higher better)
  dayId: string;
  lastTick: number; // ms
  born: string; // YYYY-MM-DD
};

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
const todayId = () => new Date().toISOString().slice(0, 10);

let audioContext: AudioContext | null = null;

function playClick() {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return;
  try {
    if (!audioContext) {
      audioContext = new window.AudioContext();
    }
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (error) {
    // Graceful no-op if audio playback is blocked.
  }
}

type StatBarProps = {
  label: string;
  value: number;
  isAge?: boolean;
};

function StatBar({ label, value, isAge = false }: StatBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const state = isAge ? 'ok' : pct < 25 ? 'bad' : pct < 50 ? 'warn' : 'ok';
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    const span = spanRef.current;
    const previous = lastValue.current;
    lastValue.current = value;
    if (!span || Math.abs(value - previous) < 5) return;
    span.classList.remove('pulse');
    span.dataset.version = String(Number(span.dataset.version ?? '0') + 1);
    void span.offsetWidth;
    span.classList.add('pulse');
    const timeout = window.setTimeout(() => {
      span.classList.remove('pulse');
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [value]);

  return (
    <>
      <div className="stat-label">{label}</div>
      <div className="bar" data-state={state}>
        <span ref={spanRef} data-version="0" style={{ width: pct + '%' }} />
      </div>
    </>
  );
}

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
function save(p: Pet) {
  localStorage.setItem('reddi.pet', JSON.stringify(p));
}

export default function App() {
  const [pet, setPet] = useState<Pet>(() => load());
  const screenRef = useRef<HTMLDivElement | null>(null);
  const flashTimeout = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [blinkOn, setBlinkOn] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPet((prev) => {
        const elapsed = Date.now() - prev.lastTick;
        const steps = Math.max(1, Math.floor(elapsed / 6000));
        let { hunger, fun, clean, energy } = prev;

        // Passive decay/gain (tuned for chill daily play)
        hunger = clamp(hunger + 1 * steps);
        fun = clamp(fun - 0.5 * steps);
        clean = clamp(clean - 0.4 * steps);
        energy = clamp(energy + 0.2 * steps); // small recharge if idle

        const next = {
          ...prev,
          hunger,
          fun,
          clean,
          energy,
          lastTick: Date.now(),
          dayId: todayId(),
        };
        save(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let blinkTimeout: ReturnType<typeof window.setTimeout> | null = null;
    const interval = window.setInterval(() => {
      setBlinkOn(true);
      if (blinkTimeout) {
        window.clearTimeout(blinkTimeout);
      }
      blinkTimeout = window.setTimeout(() => {
        setBlinkOn(false);
        blinkTimeout = null;
      }, 100);
    }, 2200);
    return () => {
      window.clearInterval(interval);
      if (blinkTimeout) {
        window.clearTimeout(blinkTimeout);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimeout.current) {
        window.clearTimeout(flashTimeout.current);
      }
    };
  }, []);

  const flashScreen = () => {
    const screen = screenRef.current;
    if (!screen) return;
    if (flashTimeout.current) {
      window.clearTimeout(flashTimeout.current);
    }
    screen.classList.add('flash');
    flashTimeout.current = window.setTimeout(() => {
      screen.classList.remove('flash');
      flashTimeout.current = null;
    }, 200);
  };

  // Mood logic
  const mood: Mood = useMemo(() => {
    if (pet.energy < 20) return 'sleep';
    if (pet.hunger > 70) return 'hungry';
    if (pet.clean < 30) return 'dirty';
    if (pet.fun > 80) return 'happy';
    if (pet.fun < 30) return 'bored';
    return 'idle';
  }, [pet]);

  const applyAction = (updater: (p: Pet) => Pet) => {
    playClick();
    setPet((p) => {
      const next = updater(p);
      save(next);
      return next;
    });
    flashScreen();
  };

  const feed = () =>
    applyAction((p) => ({ ...p, hunger: clamp(p.hunger - 25), energy: clamp(p.energy + 5) }));
  const play = () =>
    applyAction((p) => ({
      ...p,
      fun: clamp(p.fun + 20),
      energy: clamp(p.energy - 8),
      hunger: clamp(p.hunger + 8),
    }));
  const cleanUp = () => applyAction((p) => ({ ...p, clean: clamp(p.clean + 30) }));
  const sleep = () => applyAction((p) => ({ ...p, energy: clamp(p.energy + 25) }));
  const rename = () => {
    playClick();
    const name = prompt('Name your pet:', pet.name)?.trim();
    if (name)
      setPet((p) => {
        const n = { ...p, name };
        save(n);
        return n;
      });
    if (name) {
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

  const ascii = petSprite(mood, blinkOn);
  const asciiLines = ascii.split('\n');
  while (asciiLines.length) {
    const first = asciiLines[0];
    if (!first || first.trim() !== '') break;
    asciiLines.shift();
  }
  while (asciiLines.length) {
    const last = asciiLines[asciiLines.length - 1];
    if (!last || last.trim() !== '') break;
    asciiLines.pop();
  }
  const asciiFace = asciiLines.map((line) => line.replace(/\s+$/, '')).join('\n');

  // Simple “evolution” badge for later: show stage by aggregate health
  const fullness = 100 - pet.hunger;
  const fun = pet.fun;
  const clean = pet.clean;
  const energy = pet.energy;
  const health = Math.round((fullness + fun + clean + energy) / 4);
  const stage = health > 85 ? 3 : health > 65 ? 2 : 1;
  const age = Math.floor((Date.now() - new Date(pet.born).getTime()) / 86400000);
  const agePercent = Math.min(100, Math.round((age / 7) * 100));
  const eggId = pet.name.toUpperCase().startsWith('EGG-')
    ? pet.name.toUpperCase().slice(4)
    : pet.name.toUpperCase();
  const day = Math.max(1, age + 1);

  return (
    <div className="device">
      <div className="bezel">
        <div className="screen" ref={screenRef}>
          <div className="header">
            <span className="badge">reddy-pet</span>
            <span className="badge">Stage {stage}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16 }}>
            <div className="face">
              <pre aria-label="pet-face" style={{ margin: 0 }}>
                {asciiFace}
              </pre>
            </div>

            <div>
              <div className="stats">
                <StatBar label="Hunger" value={fullness} />
                <StatBar label="Fun" value={fun} />
                <StatBar label="Clean" value={clean} />
                <StatBar label="Energy" value={energy} />
                <StatBar label="Age" value={agePercent} isAge />
                <StatBar label="Health" value={health} />
              </div>
            </div>
          </div>

          <div className="controls">
            <button className="btn btn--primary" onClick={feed}>
              FEED
            </button>
            <button className="btn" onClick={play}>
              PLAY
            </button>
            <button className="btn btn--danger" onClick={cleanUp}>
              CLEAN
            </button>
            <button className="btn" onClick={sleep}>
              SLEEP
            </button>
            <button className="btn" onClick={rename}>
              NAME
            </button>
            <button className="btn" onClick={reset}>
              RESET
            </button>
          </div>

          <div className="meta">
            ★ Stage {stage} • EGG-{eggId} • Day {day}
          </div>
        </div>
      </div>
    </div>
  );
}
