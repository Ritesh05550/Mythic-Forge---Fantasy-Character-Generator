import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipForward, 
  Music2, 
  Sparkles,
  ListMusic,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  FANTASY_TRACKS, 
  startFantasyMusic, 
  stopFantasyMusic, 
  setAudioMuted, 
  switchTrack,
  getCurrentTrackIndex,
  isAudioEngineActive
} from '../utils/audio';

interface MusicPlayerProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ isMuted, onToggleMute }) => {
  const [isPlaying, setIsPlaying] = useState(() => isAudioEngineActive());
  const [trackIndex, setTrackIndex] = useState(() => getCurrentTrackIndex());
  const [showTrackList, setShowTrackList] = useState(false);

  const currentTrack = FANTASY_TRACKS[trackIndex] || FANTASY_TRACKS[0];

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopFantasyMusic();
      setIsPlaying(false);
    } else {
      startFantasyMusic(trackIndex);
      setIsPlaying(true);
      if (isMuted) {
        onToggleMute(); // unmute so user can immediately hear the song
      }
    }
  };

  const handleSelectTrack = (idx: number) => {
    setTrackIndex(idx);
    switchTrack(idx);
    if (!isPlaying) {
      setIsPlaying(true);
      startFantasyMusic(idx);
      if (isMuted) onToggleMute();
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (trackIndex + 1) % FANTASY_TRACKS.length;
    handleSelectTrack(nextIdx);
  };

  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    onToggleMute();
    setAudioMuted(newMuteState);
    if (!isPlaying && !newMuteState) {
      setIsPlaying(true);
      startFantasyMusic(trackIndex);
    }
  };

  // Sync mute state changes
  useEffect(() => {
    setAudioMuted(isMuted);
  }, [isMuted]);

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 rounded-xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-md shadow-xl overflow-hidden transition-all">
      {/* Top Main Player Bar */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Fantasy Orchestral Jukebox</span>
              </span>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {currentTrack.mood}
              </span>
              {currentTrack.isFeatured && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-1">
                  <span>🔔</span>
                  <span>FEATURED SONG</span>
                </span>
              )}
            </div>

            <h4 className="font-cinzel text-sm sm:text-base font-bold text-slate-100 truncate">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-amber-300/80 font-mono truncate">
              {currentTrack.subtitle} ({currentTrack.tempoBpm} BPM)
            </p>
          </div>
        </div>

        {/* Music Controls & Equalizer */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Animated Visualizer Bars */}
          <div 
            className="flex items-end gap-1 h-6 px-2 py-1 rounded bg-slate-950/70 border border-slate-800"
            title={isPlaying && !isMuted ? 'High-Fidelity Audio Playing' : 'Audio Muted / Paused'}
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

          {/* Track Selection Drawer Button */}
          <button
            onClick={() => setShowTrackList(prev => !prev)}
            className={`px-3 py-2 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
              showTrackList
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-amber-300 hover:border-slate-700'
            }`}
            title="Choose from 5 fantasy songs"
          >
            <ListMusic className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Choose Song</span>
            {showTrackList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Play / Pause Button */}
          <button
            onClick={handlePlayToggle}
            className="py-2 px-3 rounded-lg border border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-md"
            title={isPlaying ? 'Pause music' : 'Play fantasy music'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span className="hidden sm:inline">Play</span>
              </>
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={handleNextTrack}
            className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-amber-300 hover:border-slate-700 transition-colors cursor-pointer"
            title="Next Song"
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
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Track Selection Drawer */}
      {showTrackList && (
        <div className="border-t border-slate-800 bg-slate-950/80 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 animate-fadeIn">
          {FANTASY_TRACKS.map((t, idx) => {
            const isCurrent = idx === trackIndex;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTrack(idx)}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/40 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {isCurrent && isPlaying && !isMuted ? (
                    <div className="w-3 h-3 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                    </div>
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-cinzel text-xs font-bold truncate flex items-center gap-1">
                      <span>{idx + 1}. {t.title}</span>
                      {t.isFeatured && <span className="text-[9px] text-amber-400 font-normal">⭐</span>}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                      {t.tempoBpm} BPM
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {t.subtitle}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                    <span className="text-amber-400/80">Mood: {t.mood}</span>
                    {t.isFeatured && (
                      <span className="text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40">
                        Featured Song
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
