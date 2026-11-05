/**
 * Web Audio API engine for procedural sound effects and mysterious fantasy background music.
 * 100% self-contained in the browser with zero external audio assets needed.
 */

let audioCtx: AudioContext | null = null;
let musicMasterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let isMusicActive = false;
let isAudioMuted = false;
let currentTrackIndex = 0;
let musicLoopTimer: number | null = null;
let activeVoiceNodes: Array<{ stop: (time: number) => void }> = [];

export interface FantasyTrack {
  id: string;
  title: string;
  subtitle: string;
  tempoBpm: number;
  rootFreq: number; // Base frequency in Hz
  scaleIntervals: number[]; // semitones from root
  bassProgression: number[]; // semitones from root
  melodyPattern: number[]; // note indexes into scale
}

export const FANTASY_TRACKS: FantasyTrack[] = [
  {
    id: 'elden-citadel',
    title: 'Shadows of the Elden Citadel',
    subtitle: 'Mysterious Heroic Theme in D Dorian',
    tempoBpm: 68,
    rootFreq: 146.83, // D3
    scaleIntervals: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19], // D Dorian
    bassProgression: [0, -4, -2, -5], // D, Bb, C, A
    melodyPattern: [0, 2, 4, 7, 6, 4, 3, 5, 4, 2, 0, 7, 8, 7, 4, 2]
  },
  {
    id: 'forgotten-prophecy',
    title: 'The Hero’s Ancient Prophecy',
    subtitle: 'Haunting Arcane Hymn in A Minor',
    tempoBpm: 60,
    rootFreq: 220.00, // A3
    scaleIntervals: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19], // A Harmonic/Natural Minor
    bassProgression: [0, -5, -3, -1], // A, F, G, G#
    melodyPattern: [0, 3, 5, 6, 5, 3, 2, 4, 3, 1, 0, 4, 5, 7, 6, 2]
  },
  {
    id: 'astral-veil',
    title: 'Echoes of the Astral Veil',
    subtitle: 'Celestial Enigma in E Mystical',
    tempoBpm: 72,
    rootFreq: 164.81, // E3
    scaleIntervals: [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19], // E Lydian / Mystic
    bassProgression: [0, -3, -5, -7], // E, C, A, F#
    melodyPattern: [4, 6, 7, 9, 7, 6, 4, 2, 0, 2, 4, 7, 6, 4, 2, 0]
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
      musicMasterGain.gain.setValueAtTime(0.18, audioCtx.currentTime);

      // SFX gain
      sfxGain = audioCtx.createGain();
      sfxGain.gain.setValueAtTime(0.25, audioCtx.currentTime);

      musicMasterGain.connect(audioCtx.destination);
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

      gain.gain.setValueAtTime(0.04, now + idx * 0.03);
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
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.05, now + idx * 0.045);
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
 * Schedule a phrase of mysterious hero fantasy music
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

  // Clear previous voice references
  activeVoiceNodes = [];

  // 1. Deep Atmospheric Bass Drone
  track.bassProgression.forEach((semitone, i) => {
    const chordTime = now + (i * 4 * beatDuration);
    const chordDuration = 4 * beatDuration;
    const bassFreq = getFreq(track.rootFreq / 2, semitone);

    // Deep Sub Bass
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(bassFreq, chordTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, chordTime);
    filter.frequency.exponentialRampToValueAtTime(260, chordTime + chordDuration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(160, chordTime + chordDuration);

    bassGain.gain.setValueAtTime(0.0001, chordTime);
    bassGain.gain.linearRampToValueAtTime(0.04, chordTime + 0.6);
    bassGain.gain.setValueAtTime(0.035, chordTime + chordDuration - 0.4);
    bassGain.gain.linearRampToValueAtTime(0.0001, chordTime + chordDuration);

    bassOsc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start(chordTime);
    bassOsc.stop(chordTime + chordDuration);
    activeVoiceNodes.push(bassOsc);

    // 2. Ethereal High Pad
    const padOsc = ctx.createOscillator();
    const padGain = ctx.createGain();
    const padFilter = ctx.createBiquadFilter();

    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(bassFreq * 2, chordTime);

    padFilter.type = 'bandpass';
    padFilter.frequency.setValueAtTime(450, chordTime);
    padFilter.Q.setValueAtTime(1.5, chordTime);

    padGain.gain.setValueAtTime(0.0001, chordTime);
    padGain.gain.linearRampToValueAtTime(0.03, chordTime + 0.8);
    padGain.gain.setValueAtTime(0.025, chordTime + chordDuration - 0.5);
    padGain.gain.linearRampToValueAtTime(0.0001, chordTime + chordDuration);

    padOsc.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(masterGain);

    padOsc.start(chordTime);
    padOsc.stop(chordTime + chordDuration);
    activeVoiceNodes.push(padOsc);
  });

  // 3. Mysterious Melodic Pluck / Harp Arpeggios
  track.melodyPattern.forEach((scaleIdx, step) => {
    const noteTime = now + (step * beatDuration);
    const semitones = track.scaleIntervals[scaleIdx % track.scaleIntervals.length];
    const noteFreq = getFreq(track.rootFreq, semitones);

    // Primary bell/harp voice
    const melOsc = ctx.createOscillator();
    const melGain = ctx.createGain();

    melOsc.type = step % 2 === 0 ? 'sine' : 'triangle';
    melOsc.frequency.setValueAtTime(noteFreq, noteTime);

    melGain.gain.setValueAtTime(0.0001, noteTime);
    melGain.gain.linearRampToValueAtTime(0.035, noteTime + 0.015);
    melGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + beatDuration * 1.5);

    melOsc.connect(melGain);
    melGain.connect(masterGain);

    melOsc.start(noteTime);
    melOsc.stop(noteTime + beatDuration * 1.6);
    activeVoiceNodes.push(melOsc);

    // High celestial shimmer harmonic for mysterious flavor
    if (step % 4 === 0) {
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();

      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(noteFreq * 2, noteTime);

      shimmerGain.gain.setValueAtTime(0.0001, noteTime);
      shimmerGain.gain.linearRampToValueAtTime(0.015, noteTime + 0.02);
      shimmerGain.gain.exponentialRampToValueAtTime(0.00001, noteTime + beatDuration * 2);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(masterGain);

      shimmerOsc.start(noteTime);
      shimmerOsc.stop(noteTime + beatDuration * 2.1);
      activeVoiceNodes.push(shimmerOsc);
    }
  });

  // Schedule next phrase before current one finishes
  if (isMusicActive) {
    const loopIntervalMs = (phraseDuration - 0.2) * 1000;
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
    currentTrackIndex = trackIdx % FANTASY_TRACKS.length;
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

  // Smoothly unmute if not globally muted
  if (!isAudioMuted) {
    musicMasterGain.gain.cancelScheduledValues(ctx.currentTime);
    musicMasterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.5);
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
    musicMasterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
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
      musicMasterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3);
    }
  }

  if (sfxGain) {
    sfxGain.gain.cancelScheduledValues(ctx.currentTime);
    sfxGain.gain.linearRampToValueAtTime(muted ? 0.00001 : 0.25, ctx.currentTime + 0.2);
  }
}

/**
 * Switch track
 */
export function switchTrack(trackIdx: number) {
  currentTrackIndex = trackIdx % FANTASY_TRACKS.length;
  if (isMusicActive) {
    stopFantasyMusic();
    startFantasyMusic(currentTrackIndex);
  }
}

export function getCurrentTrack(): FantasyTrack {
  return FANTASY_TRACKS[currentTrackIndex];
}

export function isAudioEngineActive(): boolean {
  return isMusicActive && !isAudioMuted;
}
