import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipForward, 
  Music2, 
  Sparkles
} from 'lucide-react';
import { 
  FANTASY_TRACKS, 
  startFantasyMusic, 
  stopFantasyMusic, 
  setAudioMuted, 
  switchTrack 
} from '../utils/audio';

interface MusicPlayerProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ isMuted, onToggleMute }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);

  const currentTrack = FANTASY_TRACKS[trackIndex];

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopFantasyMusic();
      setIsPlaying(false);
    } else {
      startFantasyMusic(trackIndex);
      setIsPlaying(true);
      if (isMuted) {
        onToggleMute(); // unmute so user can immediately hear the mystery song
      }
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (trackIndex + 1) % FANTASY_TRACKS.length;
    setTrackIndex(nextIdx);
    switchTrack(nextIdx);
    if (!isPlaying) {
      setIsPlaying(true);
      startFantasyMusic(nextIdx);
      if (isMuted) onToggleMute();
    }
  };

  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    onToggleMute();
    setAudioMuted(newMuteState);
    if (!isPlaying && !newMuteState) {
      // Auto-start music if user explicitly unmutes the music player
      setIsPlaying(true);
      startFantasyMusic(trackIndex);
    }
  };

  // Sync mute state changes
  useEffect(() => {
    setAudioMuted(isMuted);
  }, [isMuted]);

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Track Info with Animated Soundwave Indicator */}
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="relative p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
          <Music2 className="w-5 h-5" />
          {isPlaying && !isMuted && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Hero Fantasy Music</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-mono text-slate-400">
              Track {trackIndex + 1}/{FANTASY_TRACKS.length}
            </span>
          </div>

          <h4 className="font-cinzel text-sm font-bold text-slate-100 truncate">
            {currentTrack.title}
          </h4>
          <p className="text-xs text-amber-300/70 font-mono truncate">
            {currentTrack.subtitle}
          </p>
        </div>
      </div>

      {/* Music Controls & Equalizer */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Animated Visualizer Bars (Mystery Audio) */}
        <div 
          className="flex items-end gap-1 h-6 px-2 py-1 rounded bg-slate-950/70 border border-slate-800"
          title={isPlaying && !isMuted ? 'Mystery Fantasy Audio Active' : 'Audio Muted / Paused'}
        >
          {[0.6, 1.0, 0.4, 0.8, 0.5, 0.9, 0.3].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlaying && !isMuted
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-700 h-1.5'
              }`}
              style={{
                height: isPlaying && !isMuted ? `${height * 100}%` : '4px',
                animationDelay: `${i * 120}ms`
              }}
            />
          ))}
        </div>

        {/* Play / Pause Button */}
        <button
          onClick={handlePlayToggle}
          className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title={isPlaying ? 'Pause mysterious fantasy music' : 'Play mysterious fantasy music'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-amber-300" />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-amber-300" />
              <span className="hidden sm:inline">Play Theme</span>
            </>
          )}
        </button>

        {/* Next Mystery Track */}
        <button
          onClick={handleNextTrack}
          className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-amber-300 hover:border-slate-700 transition-colors cursor-pointer"
          title="Next Mysterious Song"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Mute / Unmute Button */}
        <button
          onClick={handleMuteToggle}
          className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
            isMuted
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              : 'bg-slate-950 border-slate-800 text-amber-400 hover:text-amber-300 hover:border-slate-700'
          }`}
          title={isMuted ? 'Unmute Audio (Hear Mystery Hero Music)' : 'Mute Audio'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Unmute</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Mute</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
