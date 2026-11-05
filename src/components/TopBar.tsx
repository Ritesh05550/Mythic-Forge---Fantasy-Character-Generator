import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface TopBarProps {
  forgedCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  activeTab: 'forge' | 'roster' | 'classes';
  setActiveTab: (tab: 'forge' | 'roster' | 'classes') => void;
  isAnimationActive: boolean;
  onToggleAnimation: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  forgedCount,
  isMuted,
  onToggleMute,
  activeTab,
  setActiveTab,
  isAnimationActive,
  onToggleAnimation
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-amber-500/20 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 shadow-lg">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-cinzel text-xl font-bold tracking-wider text-amber-100 whitespace-nowrap">
          Mythic Forge
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('forge')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'forge'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Character Forge</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'roster'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Adventurer Roster</span>
          {forgedCount > 0 && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {forgedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'classes'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Class Codex</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action / Utility */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Enchanted Realm Animation Toggle */}
        <button
          onClick={onToggleAnimation}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
            isAnimationActive
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={isAnimationActive ? 'Enchanted Portal & Ghost Animation Active' : 'Animation Paused'}
        >
          <span>🎃</span>
          <span className="hidden sm:inline">{isAnimationActive ? 'Ambiance On' : 'Ambiance Off'}</span>
        </button>

        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-300 hover:border-slate-700 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute mysterious music' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <div className="text-xs text-slate-400 hidden lg:block font-mono">
          <span className="text-amber-400 font-semibold">{forgedCount}</span> Heroes Summoned
        </div>
      </div>
    </header>
  );
};
