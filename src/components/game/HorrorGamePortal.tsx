import React, { useState } from 'react';
import { Character } from '../../types/character';
import { RunDistanceCategory, DISTANCE_CONFIGS, RunDistanceConfig } from '../../types/game';
import { HorrorRunnerGame } from './HorrorRunnerGame';
import { getClassIcon } from '../CharacterCard';
import { 
  Gamepad2, 
  MapPin, 
  Shield, 
  Heart, 
  Hand, 
  Flame, 
  ChevronRight, 
  Trees, 
  Building2, 
  Sparkles 
} from 'lucide-react';

interface HorrorGamePortalProps {
  activeCharacter: Character;
  roster: Character[];
  isMuted: boolean;
  onSelectCharacter: (char: Character) => void;
}

export const HorrorGamePortal: React.FC<HorrorGamePortalProps> = ({
  activeCharacter,
  roster,
  isMuted,
  onSelectCharacter
}) => {
  const [selectedDistance, setSelectedDistance] = useState<RunDistanceCategory>('5K');
  const [isGameActive, setIsGameActive] = useState(false);

  const currentDistanceConfig: RunDistanceConfig = DISTANCE_CONFIGS[selectedDistance];

  const handleStartGame = () => {
    setIsGameActive(true);
    // Smooth scroll into view
    setTimeout(() => {
      const el = document.getElementById('game-portal-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleExitGame = () => {
    setIsGameActive(false);
  };

  return (
    <section 
      id="game-portal-anchor"
      className="w-full max-w-4xl mx-auto mt-8 mb-12 p-6 md:p-8 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-2xl relative z-20 magical-glow-border"
    >
      {/* Ornate Corner Accents */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-500/50" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-500/50" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-500/50" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-500/50" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Horror Expedition Portal
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-mono text-purple-300">Live Adventure Simulation</span>
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-slate-100">
              The Blackwood Gauntlet
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Shadowed City</span>
          </span>
          <span>⇄</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deep Horror Forest</span>
          </span>
        </div>
      </div>

      {/* When Game is Active: Render the Horror Runner Game Engine */}
      {isGameActive ? (
        <HorrorRunnerGame
          character={activeCharacter}
          distanceConfig={currentDistanceConfig}
          isMuted={isMuted}
          onExitGame={handleExitGame}
        />
      ) : (
        /* Pre-Game Setup & Character Selection View */
        <div className="space-y-6">
          {/* Step 1: Selected Character Preview & Tabletop Stats */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Selected Adventurer for Expedition</span>
              </div>
              {roster.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Switch Hero:</span>
                  <select
                    value={activeCharacter.id}
                    onChange={(e) => {
                      const found = roster.find((c) => c.id === e.target.value);
                      if (found) onSelectCharacter(found);
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-200 cursor-pointer focus:outline-none focus:border-amber-500 font-mono"
                  >
                    {roster.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.characterClass})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-xl border border-amber-500/40 overflow-hidden bg-slate-950 shrink-0">
                  <img
                    src={activeCharacter.activePortraitUrl || activeCharacter.imagePath}
                    alt={activeCharacter.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 p-0.5 rounded bg-slate-950/80 border border-slate-700">
                    {getClassIcon(activeCharacter.characterClass)}
                  </div>
                </div>

                <div>
                  <h3 className="font-uncial text-xl text-amber-100 font-normal">
                    {activeCharacter.name}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    {activeCharacter.characterClass} · {activeCharacter.race} · Level {activeCharacter.level}
                  </div>
                </div>
              </div>

              {/* Tabletop Vitals applied directly to game survivability */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1 justify-center">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>Health</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-rose-300">
                    {activeCharacter.hp} HP
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1 justify-center">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>Armor Class</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-cyan-300">
                    {activeCharacter.armorClass} AC
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1 justify-center">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Aegis Shields</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-300">
                    x{Math.max(2, 3 + Math.floor((activeCharacter.armorClass - 10) / 4))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Distance Selector & Time Options */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>2. Select Expedition Distance Category</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {(Object.keys(DISTANCE_CONFIGS) as RunDistanceCategory[]).map((catKey) => {
                const conf = DISTANCE_CONFIGS[catKey];
                const isSelected = selectedDistance === catKey;

                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedDistance(catKey)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="font-cinzel text-base font-bold text-slate-100">
                        {conf.id}
                      </div>
                      <div className="text-[11px] font-mono text-amber-300/80 mt-0.5">
                        {conf.targetMeters.toLocaleString()} m
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-2">
                      {conf.estimatedTime}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-400 italic mt-2.5">
              "{currentDistanceConfig.description}"
            </p>
          </div>

          {/* Step 3: Mechanics & Gesture Controls Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <Hand className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-100 block">Hand & Gesture Dodging</span>
                <span className="text-[11px] text-slate-400">
                  Slide your hand sideways across the track, toggle live webcam motion, or use Left/Right arrow keys.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-100 block">Shields & Game Over</span>
                <span className="text-[11px] text-slate-400">
                  Shields absorb incoming terrifying hazards. Run out of shields and get caught to trigger a Game Over.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-100 block">XP & In-Game Boosters</span>
                <span className="text-[11px] text-slate-400">
                  Collect coins along lanes or click in-game "XP Gain" buttons during the run to boost score and run faster!
                </span>
              </div>
            </div>
          </div>

          {/* Launch Adventure Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-mono text-center sm:text-left">
              Running as <span className="text-amber-300 font-semibold">{activeCharacter.name}</span> on the <span className="text-amber-300 font-semibold">{currentDistanceConfig.name}</span>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-cinzel text-base font-black tracking-wider flex items-center justify-center gap-2.5 shadow-2xl transition-all transform active:scale-95 cursor-pointer ring-2 ring-amber-400/50"
            >
              <Gamepad2 className="w-5 h-5 text-amber-950" />
              <span>Play Adventure Game</span>
              <ChevronRight className="w-4 h-4 text-amber-950" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
