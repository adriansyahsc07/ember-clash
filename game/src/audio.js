// Ember Clash — tiny WebAudio sound effects.
// No audio files: every sound is an oscillator, so the game stays
// fully offline and the whole bundle stays a handful of text files.

let audioCtx = null;
let muted = false;

function context() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, ctx.currentTime + when);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + dur + 0.02);
}

export function playClick() {
  tone(660, 0.07, 'triangle', 0.08);
}

export function playDeal() {
  tone(440, 0.06, 'triangle', 0.07);
  tone(554, 0.06, 'triangle', 0.07, 0.07);
}

export function playWinRound() {
  tone(523, 0.12, 'sine', 0.12);
  tone(784, 0.16, 'sine', 0.12, 0.1);
}

export function playLoseRound() {
  tone(330, 0.14, 'sawtooth', 0.06);
  tone(220, 0.2, 'sawtooth', 0.06, 0.1);
}

export function playVictory() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.12, i * 0.13));
}

export function playDefeat() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.15));
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
