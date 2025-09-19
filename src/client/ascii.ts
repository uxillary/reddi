export type Mood = 'idle' | 'happy' | 'hungry' | 'dirty' | 'sleep' | 'bored';

export function petSprite(mood: Mood, blinkOn = false): string {
  const eye = blinkOn ? '-' : '•';
  const eyes = `${eye}${eye}`;
  if (mood === 'happy') {
    return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  ${eyes}  | |
|  \ -- /  |
 \  '--'  /
  '-.__.-'`;
  }
  if (mood === 'hungry') {
    return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  ${eye}_  | |
|  \ __/   |
 \  '--.  /
  '-.__\-'`;
  }
  if (mood === 'dirty') {
    return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  ${eyes}  | |  ~
|  \ .. /  | ~
 \  '--'  /  ~
  '-.__.-'`;
  }
  if (mood === 'sleep') {
    return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  - - | | z
|  \ __/  |  z
 \  '--'  /   z
  '-.__.-'`;
  }
  if (mood === 'bored') {
    return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  - - | |
|  \ ___/  |
 \  '--'  /
  '-.__.-'`;
  }
  // idle
  return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  ${eyes}  | |
|  \ __/  |
 \  '--'  /
  '-.__.-'`;
}
