import { useEffect, useMemo, useRef, useState } from 'react';
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
    } catch {}
  }
  return defaultPet();
}
function save(p: Pet) { localStorage.setItem('reddi.pet', JSON.stringify(p)); }

export default function App() {
  const [pet, setPet] = useState<Pet>(() => load());
  const frame = useRef(0);

  // Game tick: every 6s = “~1 hour” of pet time (tune freely)
  useEffect(() => {
    const id = setInterval(() => {
      frame.current++;
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

  // Mood logic
  const mood: Mood = useMemo(() => {
    if (pet.energy < 20) return 'sleep';
    if (pet.hunger > 70) return 'hungry';
    if (pet.clean < 30) return 'dirty';
    if (pet.fun > 80) return 'happy';
    return 'idle';
  }, [pet]);

  const doFeed = () => setPet(p => { const n = { ...p, hunger: clamp(p.hunger - 25), energy: clamp(p.energy + 5) }; save(n); return n; });
  const doPlay = () => setPet(p => { const n = { ...p, fun: clamp(p.fun + 20), energy: clamp(p.energy - 8), hunger: clamp(p.hunger + 8) }; save(n); return n; });
  const doClean= () => setPet(p => { const n = { ...p, clean: clamp(p.clean + 30) }; save(n); return n; });
  const doSleep= () => setPet(p => { const n = { ...p, energy: clamp(p.energy + 25) }; save(n); return n; });
  const doRename = () => {
    const name = prompt('Name your pet:', pet.name)?.trim();
    if (name) setPet(p => { const n = { ...p, name }; save(n); return n; });
  };
  const doReset = () => {
    const n = defaultPet();
    save(n);
    setPet(n);
  };

  const sprite = petSprite(mood, frame.current);

  // Simple “evolution” badge for later: show stage by aggregate health
  const health = Math.round(( (100-pet.hunger) + pet.fun + pet.clean + pet.energy ) / 4);
  const stage = health > 85 ? '★ Stage 3' : health > 65 ? '★ Stage 2' : '★ Stage 1';
  const age = Math.floor((Date.now() - new Date(pet.born).getTime()) / 86400000);

  return (
    <div className="console">
      <div className="bezel">
        <div className="screen">
          <pre className="ascii">{sprite}</pre>

          <div className="stats">
            <div>Hunger</div>
            <div className="meter"><span style={{width: (100 - pet.hunger) + '%'}} /></div>
            <div>Fun</div>
            <div className="meter"><span style={{width: pet.fun + '%'}} /></div>
            <div>Clean</div>
            <div className="meter"><span style={{width: pet.clean + '%'}} /></div>
            <div>Energy</div>
            <div className="meter"><span style={{width: pet.energy + '%'}} /></div>
            <div>Age</div>
            <div style={{textAlign:'right'}}>{age}d</div>
            <div>Health</div>
            <div className="meter"><span style={{width: health + '%'}} /></div>
          </div>

          <div className="controls">
            <button onClick={doFeed}>FEED</button>
            <button className="sub" onClick={doPlay}>PLAY</button>
            <button onClick={doClean}>CLEAN</button>
            <button className="sub" onClick={doSleep}>SLEEP</button>
            <button className="sub" onClick={doRename}>NAME</button>
            <button className="sub" onClick={doReset}>RESET</button>
          </div>

          <div className="footer">
            {stage} · {pet.name} · Day {age}
          </div>
        </div>
      </div>
    </div>
  );
}
