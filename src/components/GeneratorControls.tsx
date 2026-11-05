import React from 'react';
import { Sparkles, Dices, Filter } from 'lucide-react';
import { CharacterClassType, CharacterRaceType } from '../types/character';
import { CHARACTER_RACES } from '../data/characterData';

interface GeneratorControlsProps {
  onGenerate: () => void;
  isGenerating: boolean;
  selectedClassFilter: CharacterClassType | 'ANY';
  setSelectedClassFilter: (cls: CharacterClassType | 'ANY') => void;
  selectedRaceFilter: CharacterRaceType | 'ANY';
  setSelectedRaceFilter: (race: CharacterRaceType | 'ANY') => void;
}

export const GeneratorControls: React.FC<GeneratorControlsProps> = ({
  onGenerate,
  isGenerating,
  selectedClassFilter,
  setSelectedClassFilter,
  selectedRaceFilter,
  setSelectedRaceFilter
}) => {
  const classes: Array<CharacterClassType | 'ANY'> = [
    'ANY',
    'Warrior',
    'Mage',
    'Rogue',
    'Ranger',
    'Paladin',
    'Cleric',
    'Druid',
    'Warlock'
  ];

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto my-4">
      {/* Primary Generator Action Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        aria-label="Generate Random Fantasy Character"
        className={`group relative w-full sm:w-auto px-8 py-4 rounded-xl font-cinzel text-lg sm:text-xl font-bold tracking-wider text-amber-950 transition-all duration-200 transform active:scale-95 shadow-xl flex items-center justify-center gap-3 cursor-pointer select-none ${
          isGenerating
            ? 'bg-amber-400 opacity-90 cursor-wait'
            : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 hover:shadow-amber-500/25 ring-2 ring-amber-400/50'
        }`}
      >
        <div className={`p-1 rounded-md bg-amber-900/15 transition-transform duration-300 ${isGenerating ? 'rotate-180 animate-spin' : 'group-hover:rotate-12'}`}>
          <Dices className="w-6 h-6 text-amber-950" />
        </div>
        
        <span>{isGenerating ? 'Forging Soul...' : 'Forge Fantasy Character'}</span>
        
        <Sparkles className="w-5 h-5 text-amber-900/80 hidden sm:block" />
        
        {/* Subtle Keyboard Shortcut Badge */}
        <span className="hidden md:inline-flex ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/20 text-amber-950/80 font-normal border border-amber-950/20">
          Space
        </span>
      </button>

      {/* Optional Filters Row */}
      <div className="flex items-center gap-3 flex-wrap justify-center text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono text-slate-400">Lock Archetype:</span>
        </div>

        {/* Class Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value as CharacterClassType | 'ANY')}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            aria-label="Filter Class"
          >
            <option value="ANY">Random Class (Any)</option>
            {classes.filter(c => c !== 'ANY').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Race Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedRaceFilter}
            onChange={(e) => setSelectedRaceFilter(e.target.value as CharacterRaceType | 'ANY')}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            aria-label="Filter Race"
          >
            <option value="ANY">Random Race (Any)</option>
            {CHARACTER_RACES.map((race) => (
              <option key={race} value={race}>
                {race}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
