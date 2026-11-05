import React from 'react';
import { CLASS_DEFINITIONS } from '../data/characterData';
import { CharacterClassType } from '../types/character';
import { getClassIcon } from './CharacterCard';
import { Sparkles, Dices } from 'lucide-react';

interface ClassCodexProps {
  onForgeClass: (cls: CharacterClassType) => void;
}

export const ClassCodex: React.FC<ClassCodexProps> = ({ onForgeClass }) => {
  const classList = Object.values(CLASS_DEFINITIONS);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="font-cinzel text-2xl font-bold text-amber-200">
          The Guild Codex
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore the eight foundational archetypes. Click any guild emblem to forge a character of that specific class.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classList.map((item) => (
          <div
            key={item.name}
            className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getClassIcon(item.name)}
                  </div>
                  <div>
                    <h3 className="font-cinzel text-lg font-bold text-slate-100">
                      {item.name}
                    </h3>
                    <span className="text-xs text-amber-400/90 font-mono">
                      {item.role}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-500">Hit Die</div>
                  <div className="font-mono text-xs font-bold text-slate-300">d{item.hitDie}</div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {item.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Guild Abilities:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.abilities.map((ab) => (
                    <span
                      key={ab.name}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {ab.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onForgeClass(item.name)}
              className="mt-5 w-full py-2 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-cinzel font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Forge a {item.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
