export type Mood = 'idle' | 'happy' | 'hungry' | 'dirty' | 'sleep' | 'bored';

export function petSprite(mood: Mood, frame = 0): string {
  // Two simple frames for a subtle “blink/wiggle”
  const blink = frame % 2 === 0 ? "o" : "-";
  if (mood === 'happy') {
    return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  ${blink}${blink}  | |
|  \ -- /  |
 \  '--'  /
  '-.__.-'`;
  }
  if (mood === 'hungry') {
    return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  ${blink}_  | |
|  \ __/   |
 \  '--.  /
  '-.__\-'`;
  }
  if (mood === 'dirty') {
    return String.raw`
  .-""""-.
 /  .--.  \
|  /    \  |
| |  ${blink}${blink}  | |  ~
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
| |  ${blink}${blink}  | |
|  \ __/  |
 \  '--'  /
  '-.__.-'`;
}
