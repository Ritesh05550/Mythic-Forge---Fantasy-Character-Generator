import React from 'react';
import { Character } from '../types/character';
import { getClassIcon } from './CharacterCard';
import { Trash2, BookmarkCheck, ArrowRight, Shield } from 'lucide-react';

interface PartyRosterProps {
  roster: Character[];
  activeCharacterId: string | null;
  onSelectCharacter: (char: Character) => void;
  onRemoveCharacter: (id: string) => void;
  onClearRoster: () => void;
}

export const PartyRoster: React.FC<PartyRosterProps> = ({
  roster,
  activeCharacterId,
  onSelectCharacter,
  onRemoveCharacter,
  onClearRoster
}) => {
  if (roster.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/30 max-w-xl mx-auto">
        <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="font-cinzel text-lg font-bold text-slate-300">The Hall is Empty</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Click the "Forge Fantasy Character" button above to summon your first heroic adventurer into this roster.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-cinzel text-base font-bold text-amber-200">
            Adventurer Roster
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({roster.length} Heroes)
          </span>
        </div>

        <button
          onClick={onClearRoster}
          className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
          title="Clear all generated adventurers"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {roster.map((char) => {
          const isActive = char.id === activeCharacterId;
          return (
            <div
              key={char.id}
              onClick={() => onSelectCharacter(char)}
              className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer text-left flex items-start justify-between ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-lg ring-1 ring-amber-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                  {getClassIcon(char.characterClass)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-cinzel text-sm font-bold text-slate-100 group-hover:text-amber-200 truncate">
                      {char.name}
                    </h4>
                    {char.isFavorite && (
                      <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                    {char.characterClass} · {char.race}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    HP: {char.hp} | AC: {char.armorClass}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCharacter(char.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                  title="Remove from roster"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-amber-400' : 'text-slate-600'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
