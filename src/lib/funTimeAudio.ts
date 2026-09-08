/**
 * Lightweight procedural audio engine for Fun Time.
 * Uses Web Audio API triggered strictly on user click interactions
 * to respect browser autoplay policies with zero external network dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a lighthearted, cheerful laughing / chuckle sound ("Ha-ha-ha!")
 * Synthesizes four quick staccato tones with playful pitch rises and bouncy decays.
 */
export function playLaughSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Cheerful laugh burst frequencies (staccato chuckles)
    const chucklePitches = [440, 540, 480, 600];

    chucklePitches.forEach((pitch, index) => {
      const startTime = now + index * 0.11;
      const duration = 0.085;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Triangle wave has a warmer, slightly nasal, cheerful acoustic quality
      osc.type = 'triangle';

      // Pitch contour for laugh chuckle: quick scoop up and down
      osc.frequency.setValueAtTime(pitch * 0.9, startTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.18, startTime + 0.03);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.95, startTime + duration);

      // Volume envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch {
    // Graceful fallback - silently continue if audio cannot play
  }
}

/**
 * Plays a short, subtle, pleasant "bye-bye" exit chime.
 * Synthesizes two gentle descending melodic tones (E5 -> A4).
 */
export function playExitSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, time: 0, dur: 0.16 }, // E5
      { freq: 440.0, time: 0.14, dur: 0.28 }, // A4
    ];

    notes.forEach(({ freq, time, dur }) => {
      const startTime = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, startTime + dur);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.14, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  } catch {
    // Graceful fallback
  }
}
