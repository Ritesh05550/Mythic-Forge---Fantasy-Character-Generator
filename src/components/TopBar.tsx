import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Sparkles, BookOpen, Gamepad2 } from 'lucide-react';

interface TopBarProps {
  forgedCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  activeTab: 'forge' | 'roster' | 'classes' | 'game';
  setActiveTab: (tab: 'forge' | 'roster' | 'classes' | 'game') => void;
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
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-8 px-4 sm:px-6 py-2.5 md:py-4 border-b border-amber-500/20 bg-slate-950/95 backdrop-blur-md sticky top-0 z-30 shadow-lg">
      <div className="flex items-center justify-between w-full md:w-auto">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-cinzel text-lg sm:text-xl font-bold tracking-wider text-amber-100 whitespace-nowrap">
            Mythic Forge
          </span>
        </div>

        {/* Zone 3: Primary Action / Utility (On Mobile: Next to Brand) */}
        <div className="flex items-center gap-2 shrink-0 md:hidden">
          <button
            onClick={onToggleAnimation}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer ${
              isAnimationActive
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isAnimationActive ? 'Ambiance Active' : 'Ambiance Paused'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-300 hover:border-slate-700 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute music' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Zone 2: Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('forge')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            activeTab === 'forge'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Character Forge</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('game');
            setTimeout(() => {
              const el = document.getElementById('game-portal-anchor');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            activeTab === 'game'
              ? 'text-purple-300 font-bold'
              : 'text-purple-400 hover:text-purple-300 font-semibold'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          <span>Game Portal</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            activeTab === 'classes'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Class Codex</span>
        </button>
      </nav>

      {/* Zone 3: Desktop Primary Action / Utility */}
      <div className="hidden md:flex items-center gap-2.5 shrink-0">
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
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAnimationActive ? 'Ambiance On' : 'Ambiance Off'}</span>
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
        <div className="text-xs text-slate-400 font-mono">
          <span className="text-amber-400 font-semibold">{forgedCount}</span> Heroes
        </div>
      </div>

      {/* Mobile Navigation Tab Strip */}
      <div className="flex md:hidden items-center justify-between w-full pt-2 border-t border-slate-800/80 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab('forge')}
          className={`flex-1 py-1.5 px-1 rounded-lg text-center flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'forge'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Forge</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('game');
            setTimeout(() => {
              const el = document.getElementById('game-portal-anchor');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
          className={`flex-1 py-1.5 px-1 rounded-lg text-center flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'game'
              ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
              : 'text-purple-400 hover:text-purple-300'
          }`}
        >
          <Gamepad2 className="w-3 h-3 text-purple-400" />
          <span>Game</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 py-1.5 px-1 rounded-lg text-center flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>Roster ({forgedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex-1 py-1.5 px-1 rounded-lg text-center flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          <span>Codex</span>
        </button>
      </div>
    </header>
  );
};
