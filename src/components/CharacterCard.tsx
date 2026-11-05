import React, { useState } from 'react';
import { 
  Character, 
  CharacterClassType 
} from '../types/character';
import { CLASS_PORTRAITS } from '../data/characterData';
import { 
  Shield, 
  Heart, 
  Sword, 
  Wand2, 
  Eye, 
  Compass, 
  Sun, 
  Sparkles, 
  Flame, 
  Copy, 
  Check, 
  RefreshCw, 
  Bookmark, 
  BookmarkCheck,
  Feather,
  Palette,
  Gamepad2
} from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onRerollName: () => void;
  onRerollClass: () => void;
  onToggleFavorite: (id: string) => void;
  onGeneratePortrait: () => void;
  onRegeneratePortrait: () => void;
  isPortraitGenerating: boolean;
  onTogglePortraitStyle: () => void;
}

export function getClassIcon(cls: CharacterClassType) {
  switch (cls) {
    case 'Warrior':
      return <Sword className="w-5 h-5 text-amber-400" />;
    case 'Mage':
      return <Wand2 className="w-5 h-5 text-blue-400" />;
    case 'Rogue':
      return <Eye className="w-5 h-5 text-emerald-400" />;
    case 'Ranger':
      return <Compass className="w-5 h-5 text-lime-400" />;
    case 'Paladin':
      return <Sun className="w-5 h-5 text-yellow-400" />;
    case 'Cleric':
      return <Sparkles className="w-5 h-5 text-amber-300" />;
    case 'Druid':
      return <Feather className="w-5 h-5 text-teal-400" />;
    case 'Warlock':
      return <Flame className="w-5 h-5 text-purple-400" />;
  }
}

function getStatModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onRerollName,
  onRerollClass,
  onToggleFavorite,
  onGeneratePortrait,
  onRegeneratePortrait,
  isPortraitGenerating,
  onTogglePortraitStyle
}) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Available portraits for this class
  const classPortraits = CLASS_PORTRAITS[character.characterClass] || [];
  const currentPortrait = classPortraits[character.portraitVariantIndex % classPortraits.length] || classPortraits[0];
  const activeUrl = character.activePortraitUrl || character.imagePath || currentPortrait?.url;

  const handleCopy = () => {
    const text = `
⚔️ ${character.name} ${character.title}
Class: ${character.characterClass} | Race: ${character.race} | Level: ${character.level}
Alignment: ${character.alignment} | HP: ${character.hp} | AC: ${character.armorClass}
Portrait Style: ${character.portraitStyle === 'cartoon' ? 'Cartoon / Video-Game Art' : 'Realistic High Fantasy'}

Attributes:
STR: ${character.stats.str} (${getStatModifier(character.stats.str)})
DEX: ${character.stats.dex} (${getStatModifier(character.stats.dex)})
CON: ${character.stats.con} (${getStatModifier(character.stats.con)})
INT: ${character.stats.int} (${getStatModifier(character.stats.int)})
WIS: ${character.stats.wis} (${getStatModifier(character.stats.wis)})
CHA: ${character.stats.cha} (${getStatModifier(character.stats.cha)})

Signature Ability: ${character.signatureAbility.name} - ${character.signatureAbility.description}
Gear: ${character.startingGear}
Lore: ${character.backstoryHook}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statEntries: Array<{ label: string; key: keyof typeof character.stats; name: string }> = [
    { label: 'STR', key: 'str', name: 'Strength' },
    { label: 'DEX', key: 'dex', name: 'Dexterity' },
    { label: 'CON', key: 'con', name: 'Constitution' },
    { label: 'INT', key: 'int', name: 'Intelligence' },
    { label: 'WIS', key: 'wis', name: 'Wisdom' },
    { label: 'CHA', key: 'cha', name: 'Charisma' }
  ];

  return (
    <article className="relative w-full max-w-4xl bg-slate-950/85 border border-amber-500/40 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md transition-all duration-300 magical-glow-border ring-1 ring-amber-500/20">
      {/* Decorative Ornate Corner Accents */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-500/50" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-500/50" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-500/50" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-500/50" />

      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Level {character.level} Adventurer</span>
          <span aria-hidden="true">·</span>
          <span>{character.race}</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-400/90">{character.alignment}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(character.id)}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              character.isFavorite
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={character.isFavorite ? 'Saved in Party' : 'Save to Party Roster'}
          >
            {character.isFavorite ? (
              <BookmarkCheck className="w-4 h-4 text-amber-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {character.isFavorite ? 'Saved' : 'Save'}
            </span>
          </button>

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 text-xs transition-colors flex items-center gap-1.5"
            title="Copy character stats to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy Sheet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Portrait and Core Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column: Portrait & Dedicated Portrait Buttons */}
        <div className="md:col-span-5 flex flex-col items-center">
          {/* Portrait Container */}
          <div className="relative w-full aspect-square max-w-[280px] rounded-xl overflow-hidden border-2 border-amber-500/40 bg-slate-950 shadow-inner group">
            {activeUrl && !imageError ? (
              <img
                src={activeUrl}
                alt={`${character.name} the ${character.characterClass}`}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                  isPortraitGenerating ? 'opacity-30 blur-sm scale-95' : 'opacity-100'
                }`}
              />
            ) : (
              /* Fallback Styled Container if image fails */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center mb-3">
                  {getClassIcon(character.characterClass)}
                </div>
                <span className="font-cinzel text-lg font-bold text-amber-200">
                  {character.characterClass}
                </span>
                <span className="text-xs text-slate-400 mt-1">{character.race}</span>
              </div>
            )}

            {/* In-flight Generating Shimmer Overlay */}
            {isPortraitGenerating && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                <span className="font-cinzel text-xs font-bold text-amber-300">
                  Rendering {character.characterClass} Portrait...
                </span>
              </div>
            )}

            {/* Top Style Tag Overlay */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/85 border border-amber-500/40 backdrop-blur-sm text-[10px] font-mono text-amber-300">
              <Gamepad2 className="w-3 h-3 text-amber-400" />
              <span>{character.portraitStyle === 'cartoon' ? 'Cartoon Game Art' : 'High Fantasy'}</span>
            </div>

            {/* Class Badge Overlay at Bottom */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-3 pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-slate-900/80 border border-slate-700">
                  {getClassIcon(character.characterClass)}
                </div>
                <span className="font-cinzel text-sm font-bold tracking-wide text-amber-300">
                  {character.characterClass}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                Lvl {character.level}
              </span>
            </div>
          </div>

          {/* TWO DEDICATED BUTTONS: "Generate Portrait" & "Regenerate Portrait" */}
          <div className="w-full max-w-[280px] mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Button 1: Generate Portrait */}
              <button
                onClick={onGeneratePortrait}
                disabled={isPortraitGenerating}
                className="py-2 px-3 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                title={`Generate a cartoon / video-game portrait matching ${character.characterClass}`}
              >
                <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap">Generate Portrait</span>
              </button>

              {/* Button 2: Regenerate Portrait */}
              <button
                onClick={onRegeneratePortrait}
                disabled={isPortraitGenerating}
                className="py-2 px-3 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title={`Regenerate portrait variant for ${character.characterClass}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 shrink-0 ${isPortraitGenerating ? 'animate-spin' : ''}`} />
                <span className="whitespace-nowrap">Regenerate Portrait</span>
              </button>
            </div>

            {/* Quick Re-roll Mini Controls for Name & Class */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
              <button
                onClick={onRerollName}
                className="flex-1 py-1.5 px-2 text-[11px] rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-amber-300 hover:border-slate-700 flex items-center justify-center gap-1 transition-colors"
                title="Generate a new fantasy name"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-roll Name</span>
              </button>
              <button
                onClick={onRerollClass}
                className="flex-1 py-1.5 px-2 text-[11px] rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-amber-300 hover:border-slate-700 flex items-center justify-center gap-1 transition-colors"
                title="Change class and abilities"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-roll Class</span>
              </button>
              <button
                onClick={onTogglePortraitStyle}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-amber-300 hover:border-slate-700 transition-colors"
                title="Toggle Cartoon / Realistic Art Style"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Character Details, Name, Class & Stats */}
        <div className="md:col-span-7 flex flex-col gap-5">
          {/* Hero Name & Class Section */}
          <div>
            <div className="flex items-baseline gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">
                {character.characterClass} · {character.race}
              </span>
            </div>
            <h1 className="font-uncial text-3xl sm:text-4xl lg:text-5xl font-normal text-amber-100 tracking-wider leading-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)] select-all">
              {character.name}
            </h1>
            <p className="text-sm font-medium text-amber-300/80 font-cinzel italic mt-1">
              "{character.title}"
            </p>
          </div>

          {/* Vitals Ribbon: HP, Armor Class, Hit Die */}
          <div className="grid grid-cols-2 gap-3 py-2 px-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Health Points</div>
                <div className="font-mono text-base font-bold text-slate-100 tabular-nums">
                  {character.hp} <span className="text-xs font-normal text-slate-400">HP</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Armor Class</div>
                <div className="font-mono text-base font-bold text-slate-100 tabular-nums">
                  {character.armorClass} <span className="text-xs font-normal text-slate-400">AC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attribute Scores Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
              Core Attributes
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {statEntries.map(({ label, key, name }) => {
                const score = character.stats[key];
                const mod = getStatModifier(score);
                const isHigh = score >= 14;

                return (
                  <div
                    key={label}
                    title={`${name}: ${score} (${mod})`}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-colors ${
                      isHigh
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400">
                      {label}
                    </span>
                    <span className="font-mono text-base font-bold tabular-nums my-0.5">
                      {score}
                    </span>
                    <span className={`text-[10px] font-mono px-1 rounded ${
                      isHigh ? 'bg-amber-400/20 text-amber-300 font-semibold' : 'text-slate-400'
                    }`}>
                      {mod}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signature Ability & Starting Gear */}
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wide text-amber-300 font-mono">
                  Signature Ability: {character.signatureAbility.name}
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {character.signatureAbility.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-1">
                <Sword className="w-3.5 h-3.5 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-300 font-mono">
                  Equipment
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                {character.startingGear}
              </p>
            </div>

            <div className="text-xs text-slate-400/90 italic border-l-2 border-amber-500/40 pl-3 py-0.5">
              <span className="text-slate-500 not-italic font-mono uppercase text-[10px] block">Origin Quest</span>
              "{character.backstoryHook}"
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
