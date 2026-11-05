/**
 * High-Fidelity Web Audio API engine for procedural sound effects and mysterious fantasy background music.
 * Features multi-oscillator detuned harmonic synthesis, stereo delay/acoustic space, and track switching.
 * 100% self-contained in the browser with zero external audio assets needed.
 */

let audioCtx: AudioContext | null = null;
let musicMasterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let delayNode: DelayNode | null = null;
let delayFeedbackGain: GainNode | null = null;
let delayDampingFilter: BiquadFilterNode | null = null;

let isMusicActive = false;
let isAudioMuted = false;
let currentTrackIndex = 0;
let musicLoopTimer: number | null = null;
let activeVoiceNodes: Array<{ stop: (time: number) => void }> = [];

export interface FantasyTrack {
  id: string;
  title: string;
  subtitle: string;
  mood: string;
  tempoBpm: number;
  rootFreq: number; // Base frequency in Hz
  scaleIntervals: number[]; // semitones from root
  bassProgression: number[]; // semitones from root
  melodyPattern: number[]; // note indexes into scale
  harmonyPattern?: number[]; // harmonic counter-melody
  isFeatured?: boolean;
}

export const FANTASY_TRACKS: FantasyTrack[] = [
  {
    id: 'carol-of-the-bells',
    title: 'Carol of the Bells (Gothic Carillon)',
    subtitle: 'Iconic Shchedryk Bell Carillon & Cathedral Chimes in A Minor',
    mood: 'Featured Holiday Legend',
    tempoBpm: 140,
    rootFreq: 220.00, // A3
    scaleIntervals: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24], // A Natural Minor extended
    bassProgression: [0, -2, -4, -5], // A, G, F, E
    melodyPattern: [9, 8, 9, 7, 9, 8, 9, 7, 9, 8, 9, 7, 9, 8, 9, 7], // C5-B4-C5-A4 iconic 4-note bell ostinato
    harmonyPattern: [11, 10, 11, 9, 11, 10, 11, 9, 9, 8, 9, 7, 7, 5, 7, 4], // Rising counter-chimes
    isFeatured: true
  },
  {
    id: 'elden-citadel',
    title: 'Shadows of the Elden Citadel',
    subtitle: 'Majestic Heroic Adventure in D Dorian',
    mood: 'Heroic & Mysterious',
    tempoBpm: 72,
    rootFreq: 146.83, // D3
    scaleIntervals: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19], // D Dorian
    bassProgression: [0, -4, -2, -5], // D, Bb, C, A
    melodyPattern: [0, 2, 4, 7, 6, 4, 3, 5, 4, 2, 0, 7, 8, 7, 4, 2],
    harmonyPattern: [4, 6, 7, 10, 9, 7, 5, 7, 6, 4, 2, 9, 10, 9, 7, 4]
  },
  {
    id: 'ancient-prophecy',
    title: 'The Ancient Prophecy of Blackwood',
    subtitle: 'Haunting Mystery & Cathedral Chimes in A Minor',
    mood: 'Atmospheric & Dark',
    tempoBpm: 64,
    rootFreq: 220.00, // A3
    scaleIntervals: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19], // A Harmonic/Natural Minor
    bassProgression: [0, -5, -3, -1], // A, F, G, G#
    melodyPattern: [0, 3, 5, 6, 5, 3, 2, 4, 3, 1, 0, 4, 5, 7, 6, 2],
    harmonyPattern: [3, 5, 7, 8, 7, 5, 4, 6, 5, 3, 2, 6, 7, 9, 8, 4]
  },
  {
    id: 'astral-veil',
    title: 'Echoes of the Astral Veil',
    subtitle: 'Celestial Enigma & Mystic Lydian Shimmer',
    mood: 'Ethereal & Enchanting',
    tempoBpm: 76,
    rootFreq: 164.81, // E3
    scaleIntervals: [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19], // E Lydian / Mystic
    bassProgression: [0, -3, -5, -7], // E, C, A, F#
    melodyPattern: [4, 6, 7, 9, 7, 6, 4, 2, 0, 2, 4, 7, 6, 4, 2, 0],
    harmonyPattern: [7, 9, 11, 12, 11, 9, 7, 4, 2, 4, 7, 11, 9, 7, 4, 2]
  },
  {
    id: 'midnight-crucible',
    title: 'Midnight Crucible of the Alchemist',
    subtitle: 'Deep Gothic Arcana & Sub-Bass Resonances',
    mood: 'Tense & Alchemical',
    tempoBpm: 60,
    rootFreq: 130.81, // C3
    scaleIntervals: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 18, 19], // C Harmonic Minor
    bassProgression: [0, -4, -1, -5], // C, Ab, B, G
    melodyPattern: [0, 2, 3, 6, 5, 3, 2, 4, 3, 2, 0, 6, 7, 6, 3, 1],
    harmonyPattern: [3, 5, 6, 9, 8, 6, 5, 7, 6, 5, 3, 9, 10, 9, 6, 3]
  },
  {
    id: 'dawn-vanguard',
    title: 'Triumph of the Dawn Vanguard',
    subtitle: 'High-Energy Battle March & Heroic Fanfare',
    mood: 'Epic & Driving',
    tempoBpm: 84,
    rootFreq: 196.00, // G3
    scaleIntervals: [0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19], // G Mixolydian
    bassProgression: [0, -5, -3, -2], // G, C, Eb, F
    melodyPattern: [0, 4, 5, 7, 9, 7, 5, 4, 7, 9, 11, 12, 9, 7, 5, 4],
    harmonyPattern: [4, 7, 9, 11, 12, 11, 9, 7, 11, 12, 14, 16, 12, 11, 9, 7]
  }
];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      
      // Music master gain
      musicMasterGain = audioCtx.createGain();
      musicMasterGain.gain.setValueAtTime(0.22, audioCtx.currentTime);

      // SFX gain
      sfxGain = audioCtx.createGain();
      sfxGain.gain.setValueAtTime(0.28, audioCtx.currentTime);

      // Stereo Acoustic Space Delay / Reverb Network
      delayNode = audioCtx.createDelay(1.0);
      delayNode.delayTime.setValueAtTime(0.28, audioCtx.currentTime);

      delayFeedbackGain = audioCtx.createGain();
      delayFeedbackGain.gain.setValueAtTime(0.32, audioCtx.currentTime);

      delayDampingFilter = audioCtx.createBiquadFilter();
      delayDampingFilter.type = 'lowpass';
      delayDampingFilter.frequency.setValueAtTime(2400, audioCtx.currentTime);

      // Connect delay loop
      delayNode.connect(delayDampingFilter);
      delayDampingFilter.connect(delayFeedbackGain);
      delayFeedbackGain.connect(delayNode);
      delayDampingFilter.connect(audioCtx.destination);

      musicMasterGain.connect(audioCtx.destination);
      musicMasterGain.connect(delayNode); // Send a portion to acoustic space
      sfxGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Frequency from semitone offset
 */
function getFreq(baseFreq: number, semitones: number): number {
  return baseFreq * Math.pow(2, semitones / 12);
}

/**
 * Play a light dice tumble sound
 */
export function playDiceRollSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;

    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const clickTime = now + i * 0.04 + Math.random() * 0.02;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + Math.random() * 260, clickTime);
      osc.frequency.exponentialRampToValueAtTime(100, clickTime + 0.03);

      gain.gain.setValueAtTime(0.08, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);

      osc.connect(gain);
      gain.connect(targetGain);

      osc.start(clickTime);
      osc.stop(clickTime + 0.035);
    }
  } catch {
    // Ignore error
  }
}

/**
 * Play a resonant fantasy triumph chime
 */
export function playManifestSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;

    const now = ctx.currentTime + 0.05;
    const freqs = [293.66, 440.00, 587.33, 739.99];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.05, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.6);

      osc.connect(gain);
      gain.connect(targetGain);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.65);
    });
  } catch {
    // Ignore error
  }
}

/**
 * Play portrait invocation sparkle sound
 */
export function playPortraitInvocationSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.06, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.35);

      osc.connect(gain);
      gain.connect(targetGain);

      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.4);
    });
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: Coin pickup (crisp bright chime)
 */
export function playCoinSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(987.77, now);
    osc1.frequency.setValueAtTime(1318.51, now + 0.06);
    osc2.frequency.setValueAtTime(1318.51, now + 0.06);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(targetGain);

    osc1.start(now);
    osc2.start(now + 0.06);
    osc1.stop(now + 0.23);
    osc2.stop(now + 0.23);
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: Shield absorption / activation clang
 */
export function playShieldSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(targetGain);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: Shield break clash
 */
export function playShieldBreakSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(targetGain);

    osc.start(now);
    osc.stop(now + 0.29);
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: XP Surge Boost
 */
export function playXpBoostSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    const freqs = [349.23, 440.00, 523.25, 698.46];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.03);
      gain.gain.setValueAtTime(0.07, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.25);
      osc.connect(gain);
      gain.connect(targetGain);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.26);
    });
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: Horror Game Over Thud / Stinger
 */
export function playGameOverSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    [130.81, 138.59, 92.50].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 1.2);
      gain.gain.setValueAtTime(0.19, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
      osc.connect(gain);
      gain.connect(targetGain);
      osc.start(now);
      osc.stop(now + 1.35);
    });
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: Lane dodge whoosh
 */
export function playLaneSwitchSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(targetGain);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: High leap / jump whoosh
 */
export function playJumpSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(targetGain);
    osc.start(now);
    osc.stop(now + 0.24);
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: Ground slide through mud/gravel
 */
export function playSlideSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(targetGain);
    osc.start(now);
    osc.stop(now + 0.26);
  } catch {
    // Ignore
  }
}

/**
 * Game Sound: Deep tense heartbeat thud
 */
export function playHeartbeatSound(isMuted: boolean = false) {
  if (isMuted || isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;
    const targetGain = sfxGain;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(targetGain);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // Ignore
  }
}

/**
 * Schedule a phrase of high-fidelity mysterious hero fantasy music
 */
function scheduleMusicPhrase() {
  const ctx = getAudioContext();
  if (!ctx || !musicMasterGain || !isMusicActive) return;
  const masterGain = musicMasterGain;

  const track = FANTASY_TRACKS[currentTrackIndex];
  const beatDuration = 60 / track.tempoBpm;
  const now = ctx.currentTime + 0.05;
  const phraseBeats = 16;
  const phraseDuration = phraseBeats * beatDuration;

  activeVoiceNodes = [];

  // 1. Lush Multi-Oscillator Sub-Bass & Cello Drone
  track.bassProgression.forEach((semitone, i) => {
    const chordTime = now + (i * 4 * beatDuration);
    const chordDuration = 4 * beatDuration;
    const bassFreq = getFreq(track.rootFreq / 2, semitone);

    // Warm Analog Detuned Saw Bass
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(bassFreq, chordTime);
    osc2.frequency.setValueAtTime(bassFreq * 1.003, chordTime); // Gentle detune chorus

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, chordTime);
    filter.frequency.exponentialRampToValueAtTime(320, chordTime + chordDuration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(180, chordTime + chordDuration);

    bassGain.gain.setValueAtTime(0.0001, chordTime);
    bassGain.gain.linearRampToValueAtTime(0.045, chordTime + 0.5);
    bassGain.gain.setValueAtTime(0.04, chordTime + chordDuration - 0.4);
    bassGain.gain.linearRampToValueAtTime(0.0001, chordTime + chordDuration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(masterGain);

    osc1.start(chordTime);
    osc2.start(chordTime);
    osc1.stop(chordTime + chordDuration);
    osc2.stop(chordTime + chordDuration);
    activeVoiceNodes.push(osc1, osc2);

    // Ethereal High Pad with Bandpass filter
    const padOsc = ctx.createOscillator();
    const padGain = ctx.createGain();
    const padFilter = ctx.createBiquadFilter();

    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(bassFreq * 2, chordTime);

    padFilter.type = 'bandpass';
    padFilter.frequency.setValueAtTime(520, chordTime);
    padFilter.Q.setValueAtTime(1.8, chordTime);

    padGain.gain.setValueAtTime(0.0001, chordTime);
    padGain.gain.linearRampToValueAtTime(0.035, chordTime + 0.8);
    padGain.gain.setValueAtTime(0.03, chordTime + chordDuration - 0.5);
    padGain.gain.linearRampToValueAtTime(0.0001, chordTime + chordDuration);

    padOsc.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(masterGain);

    padOsc.start(chordTime);
    padOsc.stop(chordTime + chordDuration);
    activeVoiceNodes.push(padOsc);
  });

  // 2. Celtic Harp / Mystic Plucked Melody (Dual Detune for Richness)
  track.melodyPattern.forEach((scaleIdx, step) => {
    const noteTime = now + (step * beatDuration);
    const semitones = track.scaleIntervals[scaleIdx % track.scaleIntervals.length];
    const noteFreq = getFreq(track.rootFreq, semitones);

    const isBellTrack = track.id === 'carol-of-the-bells';

    const melOsc1 = ctx.createOscillator();
    const melOsc2 = ctx.createOscillator();
    const melGain = ctx.createGain();

    if (isBellTrack) {
      // Crystal cathedral bell carillon synthesis: fundamental + chime octave overtone
      melOsc1.type = 'sine';
      melOsc2.type = 'sine';
      melOsc1.frequency.setValueAtTime(noteFreq, noteTime);
      melOsc2.frequency.setValueAtTime(noteFreq * 2.0, noteTime);

      melGain.gain.setValueAtTime(0.0001, noteTime);
      melGain.gain.linearRampToValueAtTime(0.052, noteTime + 0.008);
      melGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + beatDuration * 2.6);
    } else {
      melOsc1.type = 'triangle';
      melOsc2.type = 'sine';
      melOsc1.frequency.setValueAtTime(noteFreq, noteTime);
      melOsc2.frequency.setValueAtTime(noteFreq * 1.002, noteTime); // Shimmer detune

      melGain.gain.setValueAtTime(0.0001, noteTime);
      melGain.gain.linearRampToValueAtTime(0.04, noteTime + 0.015);
      melGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + beatDuration * 1.8);
    }

    melOsc1.connect(melGain);
    melOsc2.connect(melGain);
    melGain.connect(masterGain);

    melOsc1.start(noteTime);
    melOsc2.start(noteTime);
    melOsc1.stop(noteTime + beatDuration * (isBellTrack ? 2.7 : 1.9));
    melOsc2.stop(noteTime + beatDuration * (isBellTrack ? 2.7 : 1.9));
    activeVoiceNodes.push(melOsc1, melOsc2);

    // Harmonic Counterpoint Shimmer / Bell Echo
    if (track.harmonyPattern && (isBellTrack || step % 2 === 0)) {
      const harmIdx = track.harmonyPattern[step % track.harmonyPattern.length];
      const harmSemitones = track.scaleIntervals[harmIdx % track.scaleIntervals.length];
      const harmFreq = getFreq(track.rootFreq, harmSemitones);

      const harmOsc = ctx.createOscillator();
      const harmGain = ctx.createGain();

      harmOsc.type = isBellTrack ? 'triangle' : 'sine';
      harmOsc.frequency.setValueAtTime(harmFreq, noteTime);

      harmGain.gain.setValueAtTime(0.0001, noteTime);
      harmGain.gain.linearRampToValueAtTime(isBellTrack ? 0.024 : 0.02, noteTime + 0.015);
      harmGain.gain.exponentialRampToValueAtTime(0.00001, noteTime + beatDuration * 2.2);

      harmOsc.connect(harmGain);
      harmGain.connect(masterGain);

      harmOsc.start(noteTime);
      harmOsc.stop(noteTime + beatDuration * 2.3);
      activeVoiceNodes.push(harmOsc);
    }
  });

  // Schedule next phrase before current one ends
  if (isMusicActive) {
    const loopIntervalMs = (phraseDuration - 0.15) * 1000;
    musicLoopTimer = window.setTimeout(() => {
      scheduleMusicPhrase();
    }, loopIntervalMs);
  }
}

/**
 * Start or resume playing mysterious fantasy background music
 */
export function startFantasyMusic(trackIdx?: number) {
  if (typeof trackIdx === 'number') {
    currentTrackIndex = Math.max(0, Math.min(FANTASY_TRACKS.length - 1, trackIdx));
  }
  
  const ctx = getAudioContext();
  if (!ctx || !musicMasterGain) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  isMusicActive = true;
  if (musicLoopTimer) {
    clearTimeout(musicLoopTimer);
  }

  if (!isAudioMuted) {
    musicMasterGain.gain.cancelScheduledValues(ctx.currentTime);
    musicMasterGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.4);
  }

  scheduleMusicPhrase();
}

/**
 * Stop playing fantasy music
 */
export function stopFantasyMusic() {
  isMusicActive = false;
  if (musicLoopTimer) {
    clearTimeout(musicLoopTimer);
    musicLoopTimer = null;
  }
  const ctx = getAudioContext();
  if (ctx && musicMasterGain) {
    musicMasterGain.gain.cancelScheduledValues(ctx.currentTime);
    musicMasterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
  }
}

/**
 * Mute / Unmute entire audio system (music + sfx)
 */
export function setAudioMuted(muted: boolean) {
  isAudioMuted = muted;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (musicMasterGain) {
    musicMasterGain.gain.cancelScheduledValues(ctx.currentTime);
    if (muted) {
      musicMasterGain.gain.linearRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
    } else if (isMusicActive) {
      musicMasterGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.3);
    }
  }

  if (sfxGain) {
    sfxGain.gain.cancelScheduledValues(ctx.currentTime);
    sfxGain.gain.linearRampToValueAtTime(muted ? 0.00001 : 0.28, ctx.currentTime + 0.2);
  }
}

/**
 * Switch to a specific track by index
 */
export function switchTrack(trackIdx: number) {
  currentTrackIndex = (trackIdx + FANTASY_TRACKS.length) % FANTASY_TRACKS.length;
  if (isMusicActive) {
    stopFantasyMusic();
    startFantasyMusic(currentTrackIndex);
  }
}

/**
 * Get current track
 */
export function getCurrentTrack(): FantasyTrack {
  return FANTASY_TRACKS[currentTrackIndex];
}

/**
 * Get current track index
 */
export function getCurrentTrackIndex(): number {
  return currentTrackIndex;
}

/**
 * Is music currently actively playing
 */
export function isAudioEngineActive(): boolean {
  return isMusicActive && !isAudioMuted;
}
