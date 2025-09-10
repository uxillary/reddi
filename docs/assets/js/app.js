/* tiny pet logic */
const pet = document.getElementById('pet');
const mood = document.getElementById('mood');
const xp = document.getElementById('xp');
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

let score = 1;
let happy = 50;

const sfx = (tone=880, ms=70) => {
  try{
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ac = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square'; osc.frequency.value = tone;
    gain.gain.value = 0.02; osc.connect(gain); gain.connect(ac.destination);
    osc.start(); setTimeout(()=>{osc.stop(); ac.close();}, ms);
  }catch{}
};

const setMood = () => {
  const label = happy>70?'Vibing': happy>45?'Chill': happy>20?'Meh':'Grumpy';
  mood.textContent = `Mood: ${label}`;
  xp.textContent = `XP: ${String(score).padStart(4,'0')}`;
};

document.querySelectorAll('.c-btn').forEach(btn=>{
  btn.addEventListener('click', () => {
    const act = btn.dataset.action;
    if (act==='feed'){ happy=Math.min(100,happy+8); score+=2; sfx(660); }
    if (act==='play'){ happy=Math.min(100,happy+6); score+=3; sfx(990); }
    if (act==='clean'){ happy=Math.min(100,happy+4); score+=1; sfx(770); }
    pet.classList.remove('blink'); void pet.offsetWidth; pet.classList.add('blink');
    setMood();
  });
});

/* idle blink every ~6–10s */
setInterval(()=>{
  if (document.hidden) return;
  pet.classList.remove('blink'); void pet.offsetWidth; pet.classList.add('blink');
}, 6000 + Math.random()*4000);

setMood();
