// utils/audioChime.js
// High-Fidelity, High-Volume Web Audio API Synthesizer with Dynamics Compression

export const TONE_OPTIONS = [
  { id: 'classic', label: 'Classic Chime', desc: 'Resonant dual-tone ascending bell (Recommended)' },
  { id: 'arpeggio', label: 'Melodic Arpeggio', desc: 'Ascending 4-tone cafe melody with long singing sustain (~1.8s)' },
  { id: 'gong', label: 'Kitchen Gong', desc: 'Deep brass call bell for noisy kitchens (~1.5s)' },
  { id: 'broadcast', label: 'Broadcast Alert', desc: 'Two-phrase chime with rich resonance for busy environments (~2.1s)' }
];

export const getAudioSettings = () => {
  try {
    const muted = localStorage.getItem('serviq_audio_muted') === 'true';
    const rawVol = localStorage.getItem('serviq_audio_volume');
    const volume = rawVol !== null ? Math.max(0, Math.min(10, Number(rawVol))) : 8;
    const tone = localStorage.getItem('serviq_audio_tone') || 'classic';
    return {
      muted: muted || volume === 0,
      volume,
      tone: TONE_OPTIONS.some(t => t.id === tone) ? tone : 'classic'
    };
  } catch (e) {
    return { muted: false, volume: 8, tone: 'classic' };
  }
};

export const saveAudioSettings = ({ muted, volume, tone }) => {
  try {
    if (muted !== undefined) {
      localStorage.setItem('serviq_audio_muted', muted ? 'true' : 'false');
    }
    if (volume !== undefined) {
      const v = Math.max(0, Math.min(10, Number(volume)));
      localStorage.setItem('serviq_audio_volume', String(v));
      if (v === 0) {
        localStorage.setItem('serviq_audio_muted', 'true');
      }
    }
    if (tone !== undefined) {
      localStorage.setItem('serviq_audio_tone', tone);
    }

    // Broadcast change event across window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('serviq_audio_settings_changed', {
        detail: getAudioSettings()
      }));
    }
  } catch (e) {
    console.warn('Failed to save audio settings to localStorage', e);
  }
};

// Legacy helpers for backwards compatibility
export const isAudioMuted = () => getAudioSettings().muted;
export const setAudioMuted = (muted) => saveAudioSettings({ muted });

// Tone Synthesizers with Full Harmonic Presence
const playToneSynthesis = (ctx, masterGain, now, toneId) => {
  switch (toneId) {
    case 'crisp': // Legacy fallback
    case 'arpeggio': {
      // 4-note ascending cafe arpeggio melody with warm singing sustain (~1.85s)
      // Notes: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
      const notes = [
        { freq: 523.25, time: 0, decay: 0.60, gain: 0.85 },
        { freq: 659.25, time: 0.18, decay: 0.65, gain: 0.90 },
        { freq: 783.99, time: 0.36, decay: 0.75, gain: 0.95 },
        { freq: 1046.50, time: 0.54, decay: 1.35, gain: 1.00 }
      ];

      notes.forEach(({ freq, time, decay, gain }) => {
        const tStart = now + time;
        const tEnd = tStart + decay;

        // Primary fundamental bell tone (pure sine)
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, tStart);
        g.gain.setValueAtTime(gain, tStart);
        g.gain.exponentialRampToValueAtTime(0.001, tEnd);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(tStart);
        osc.stop(tEnd);

        // Harmonic overtone shimmer (triangle 2x octave harmonic)
        const oscHarm = ctx.createOscillator();
        const gHarm = ctx.createGain();
        oscHarm.type = 'triangle';
        oscHarm.frequency.setValueAtTime(freq * 2, tStart);
        gHarm.gain.setValueAtTime(gain * 0.35, tStart);
        gHarm.gain.exponentialRampToValueAtTime(0.001, tStart + (decay * 0.55));
        oscHarm.connect(gHarm);
        gHarm.connect(masterGain);
        oscHarm.start(tStart);
        oscHarm.stop(tStart + (decay * 0.55));
      });
      break;
    }

    case 'gong': {
      // Deep resonant brass call bell (A3 220Hz fundamental + A4 440Hz + C#5 554Hz + E5 659Hz)
      const freqs = [220, 440, 554.37, 659.25];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : (idx === 1 ? 'triangle' : 'sine');
        osc.frequency.setValueAtTime(freq, now);
        const initialAmp = idx === 0 ? 0.7 : (0.55 / idx);
        gain.gain.setValueAtTime(initialAmp, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.4);
      });
      break;
    }

    case 'pop': // Legacy fallback
    case 'broadcast': {
      // Two-phrase luxury broadcast alert chime with extended bell ring (~2.1s)
      // Phrase 1 (The Call): G5 (784Hz) -> E5 (659Hz)
      // Phrase 2 (The Confirmation): A5 (880Hz) -> C6 (1046Hz) with singing resonant ring
      const phrases = [
        { freq: 783.99, time: 0, decay: 0.60, gain: 0.90 },
        { freq: 659.25, time: 0.22, decay: 0.70, gain: 0.85 },
        { freq: 880.00, time: 0.58, decay: 0.70, gain: 0.95 },
        { freq: 1046.50, time: 0.82, decay: 1.35, gain: 1.00 }
      ];

      phrases.forEach(({ freq, time, decay, gain }) => {
        const tStart = now + time;
        const tEnd = tStart + decay;

        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, tStart);
        g.gain.setValueAtTime(gain, tStart);
        g.gain.exponentialRampToValueAtTime(0.001, tEnd);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(tStart);
        osc.stop(tEnd);

        // Warm 5th harmonic overtone (freq * 1.5) for lush brass presence
        const oscHarm = ctx.createOscillator();
        const gHarm = ctx.createGain();
        oscHarm.type = 'triangle';
        oscHarm.frequency.setValueAtTime(freq * 1.5, tStart);
        gHarm.gain.setValueAtTime(gain * 0.28, tStart);
        gHarm.gain.exponentialRampToValueAtTime(0.001, tStart + (decay * 0.5));
        oscHarm.connect(gHarm);
        gHarm.connect(masterGain);
        oscHarm.start(tStart);
        oscHarm.stop(tStart + (decay * 0.5));
      });
      break;
    }

    case 'classic':
    default: {
      // Classic ascending dual-tone bell with rich harmonic body
      // Note 1: G5 (784 Hz) + harmonic G6 (1568 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(1.0, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.45);

      const osc1Harm = ctx.createOscillator();
      const gain1Harm = ctx.createGain();
      osc1Harm.type = 'triangle';
      osc1Harm.frequency.setValueAtTime(1567.98, now);
      gain1Harm.gain.setValueAtTime(0.35, now);
      gain1Harm.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1Harm.connect(gain1Harm);
      gain1Harm.connect(masterGain);
      osc1Harm.start(now);
      osc1Harm.stop(now + 0.25);

      // Note 2: C6 (1046.5 Hz) + harmonic C7 (2093 Hz) - bright and bold
      const note2Time = now + 0.13;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, note2Time);
      gain2.gain.setValueAtTime(1.0, note2Time);
      gain2.gain.exponentialRampToValueAtTime(0.001, note2Time + 0.7);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(note2Time);
      osc2.stop(note2Time + 0.7);

      const osc2Harm = ctx.createOscillator();
      const gain2Harm = ctx.createGain();
      osc2Harm.type = 'triangle';
      osc2Harm.frequency.setValueAtTime(2093, note2Time);
      gain2Harm.gain.setValueAtTime(0.35, note2Time);
      gain2Harm.gain.exponentialRampToValueAtTime(0.001, note2Time + 0.4);
      osc2Harm.connect(gain2Harm);
      gain2Harm.connect(masterGain);
      osc2Harm.start(note2Time);
      osc2Harm.stop(note2Time + 0.4);
      break;
    }
  }
};

export const playOrderChime = (overrideOptions = {}) => {
  try {
    const settings = getAudioSettings();
    const muted = overrideOptions.muted !== undefined ? overrideOptions.muted : settings.muted;
    const volume = overrideOptions.volume !== undefined ? overrideOptions.volume : settings.volume;
    const tone = overrideOptions.tone || settings.tone;

    if (muted || volume <= 0) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Dynamics Compressor to prevent clipping while maximizing perceived loudness
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(10, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.2, now);

    const masterGain = ctx.createGain();

    // Scale volume 1-10 to high master gain (up to 0.95 at level 10)
    // Logarithmic curve for smooth perceived volume
    const volRatio = Math.max(1, Math.min(10, volume)) / 10;
    const effectiveGain = Math.pow(volRatio, 1.4) * 0.95;

    masterGain.gain.setValueAtTime(effectiveGain, now);
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    playToneSynthesis(ctx, masterGain, now, tone);
  } catch (err) {
    console.warn('Audio chime playback error:', err.message);
  }
};

// Preview a tone at a given volume (ignores mute so user can test sounds)
export const previewTone = (toneId, volumeLevel = 8) => {
  try {
    const vol = Math.max(1, Math.min(10, Number(volumeLevel) || 8));
    playOrderChime({ muted: false, volume: vol, tone: toneId });
  } catch (err) {
    console.warn('Tone preview error:', err.message);
  }
};
