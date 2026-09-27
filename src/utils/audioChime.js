// utils/audioChime.js
// Web Audio API Synthesizer Chime for real-time new order notification

export const playOrderChime = () => {
  try {
    const isMuted = localStorage.getItem('serviq_audio_muted') === 'true';
    if (isMuted) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First Note: G5 (784 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second Note: C6 (1046.5 Hz) - bright pleasant notification
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('Audio chime playback error:', err.message);
  }
};

export const isAudioMuted = () => {
  return localStorage.getItem('serviq_audio_muted') === 'true';
};

export const setAudioMuted = (muted) => {
  localStorage.setItem('serviq_audio_muted', muted ? 'true' : 'false');
};
