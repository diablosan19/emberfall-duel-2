// Emberfall Duel — WebAudio synth. No audio files, no network: every sound is
// a short oscillator envelope, created lazily on the first user gesture.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq, dur, type, vol, slideTo) {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(vol || 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function sfx(name) {
  switch (name) {
    case 'play': tone(520, 0.12, 'triangle', 0.14, 760); break;
    case 'hit': tone(180, 0.16, 'sawtooth', 0.14, 70); tone(90, 0.2, 'square', 0.08, 50); break;
    case 'heal': tone(660, 0.18, 'sine', 0.1, 990); break;
    case 'draw': tone(880, 0.07, 'triangle', 0.08, 1100); break;
    case 'block': tone(240, 0.12, 'square', 0.08, 180); break;
    case 'resonance': tone(523, 0.1, 'triangle', 0.12); setTimeout(() => tone(784, 0.14, 'triangle', 0.12), 70); setTimeout(() => tone(1046, 0.2, 'triangle', 0.12), 140); break;
    case 'turn': tone(392, 0.1, 'triangle', 0.1, 523); break;
    case 'guardian': tone(330, 0.15, 'triangle', 0.12, 220); break;
    case 'win': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.13), i * 110)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sawtooth', 0.07), i * 130)); break;
    case 'click': tone(700, 0.05, 'square', 0.05); break;
    default: tone(440, 0.08, 'sine', 0.08); break;
  }
}
