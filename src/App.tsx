import { useState, useEffect, useCallback } from 'react';
import { Character, CharacterClassType, CharacterRaceType } from './types/character';
import { 
  generateCharacter, 
  FANTASY_FIRST_NAMES, 
  FANTASY_SURNAME_PREFIXES, 
  FANTASY_SURNAME_SUFFIXES, 
  FANTASY_TITLES,
  CLASS_DEFINITIONS,
  CLASS_PORTRAITS
} from './data/characterData';
import { 
  playDiceRollSound, 
  playManifestSound, 
  playPortraitInvocationSound,
  setAudioMuted
} from './utils/audio';
import { TopBar } from './components/TopBar';
import { CharacterCard } from './components/CharacterCard';
import { GeneratorControls } from './components/GeneratorControls';
import { PartyRoster } from './components/PartyRoster';
import { ClassCodex } from './components/ClassCodex';
import { MusicPlayer } from './components/MusicPlayer';
import { EnchantedRealmBackground } from './components/EnchantedRealmBackground';
import { Users } from 'lucide-react';

const STORAGE_KEY = 'mythic_forge_roster_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'forge' | 'roster' | 'classes'>('forge');
  const [isMuted, setIsMuted] = useState(false);
  const [isAnimationActive, setIsAnimationActive] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPortraitGenerating, setIsPortraitGenerating] = useState(false);
  
  const [selectedClassFilter, setSelectedClassFilter] = useState<CharacterClassType | 'ANY'>('ANY');
  const [selectedRaceFilter, setSelectedRaceFilter] = useState<CharacterRaceType | 'ANY'>('ANY');

  // Initial character state
  const [currentCharacter, setCurrentCharacter] = useState<Character>(() => {
    return generateCharacter();
  });

  // Roster history
  const [roster, setRoster] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Keep audio system synchronized with mute state
  useEffect(() => {
    setAudioMuted(isMuted);
  }, [isMuted]);

  // Keep roster synchronized
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    } catch {
      // Ignore storage errors
    }
  }, [roster]);

  // Main character generation handler
  const handleGenerate = useCallback((overrideClass?: CharacterClassType, overrideRace?: CharacterRaceType) => {
    setIsGenerating(true);
    playDiceRollSound(isMuted);

    const classChoice = overrideClass || (selectedClassFilter === 'ANY' ? undefined : selectedClassFilter);
    const raceChoice = overrideRace || (selectedRaceFilter === 'ANY' ? undefined : selectedRaceFilter);

    setTimeout(() => {
      const newChar = generateCharacter(classChoice, raceChoice);
      setCurrentCharacter(newChar);
      setRoster(prev => [newChar, ...prev.filter(c => c.id !== newChar.id)].slice(0, 20));
      setIsGenerating(false);
      playManifestSound(isMuted);
      window.dispatchEvent(new CustomEvent('spooky-burst'));
    }, 180);
  }, [isMuted, selectedClassFilter, selectedRaceFilter]);

  // Keyboard shortcut: Spacebar triggers character generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate]);

  // "Generate Portrait" button handler (matching character class)
  const handleGeneratePortrait = () => {
    setIsPortraitGenerating(true);
    playPortraitInvocationSound(isMuted);
    window.dispatchEvent(new CustomEvent('spooky-burst'));

    setTimeout(() => {
      const classPortraits = CLASS_PORTRAITS[currentCharacter.characterClass] || [];
      const cartoonPortrait = classPortraits.find(p => p.style === 'cartoon') || classPortraits[0];
      const updated: Character = {
        ...currentCharacter,
        portraitStyle: 'cartoon',
        activePortraitUrl: cartoonPortrait.url,
        cartoonImagePath: cartoonPortrait.url,
        hasGeneratedPortrait: true
      };
      setCurrentCharacter(updated);
      setRoster(prev => prev.map(c => c.id === updated.id ? updated : c));
      setIsPortraitGenerating(false);
    }, 320);
  };

  // "Regenerate Portrait" button handler (matching character class)
  const handleRegeneratePortrait = () => {
    setIsPortraitGenerating(true);
    playPortraitInvocationSound(isMuted);
    window.dispatchEvent(new CustomEvent('spooky-burst'));

    setTimeout(() => {
      const classPortraits = CLASS_PORTRAITS[currentCharacter.characterClass] || [];
      const nextIndex = (currentCharacter.portraitVariantIndex + 1) % classPortraits.length;
      const nextPortrait = classPortraits[nextIndex];
      const updated: Character = {
        ...currentCharacter,
        portraitVariantIndex: nextIndex,
        portraitStyle: nextPortrait.style,
        activePortraitUrl: nextPortrait.url,
        cartoonImagePath: nextPortrait.url,
        hasGeneratedPortrait: true
      };
      setCurrentCharacter(updated);
      setRoster(prev => prev.map(c => c.id === updated.id ? updated : c));
      setIsPortraitGenerating(false);
    }, 320);
  };

  // Toggle between Cartoon Video-Game Art and High Fantasy Concept Art
  const handleTogglePortraitStyle = () => {
    playPortraitInvocationSound(isMuted);
    const classPortraits = CLASS_PORTRAITS[currentCharacter.characterClass] || [];
    const targetStyle = currentCharacter.portraitStyle === 'cartoon' ? 'realistic' : 'cartoon';
    const matching = classPortraits.find(p => p.style === targetStyle) || classPortraits[0];
    const updated: Character = {
      ...currentCharacter,
      portraitStyle: targetStyle,
      activePortraitUrl: matching.url
    };
    setCurrentCharacter(updated);
    setRoster(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  // Reroll single name
  const handleRerollName = () => {
    playDiceRollSound(isMuted);
    const firstName = FANTASY_FIRST_NAMES[Math.floor(Math.random() * FANTASY_FIRST_NAMES.length)];
    const surnamePrefix = FANTASY_SURNAME_PREFIXES[Math.floor(Math.random() * FANTASY_SURNAME_PREFIXES.length)];
    const surnameSuffix = FANTASY_SURNAME_SUFFIXES[Math.floor(Math.random() * FANTASY_SURNAME_SUFFIXES.length)];
    const title = FANTASY_TITLES[Math.floor(Math.random() * FANTASY_TITLES.length)];

    setCurrentCharacter(prev => {
      const updated = {
        ...prev,
        name: `${firstName} ${surnamePrefix}${surnameSuffix}`,
        title
      };
      setRoster(r => r.map(c => c.id === updated.id ? updated : c));
      return updated;
    });
  };

  // Reroll single class
  const handleRerollClass = () => {
    playDiceRollSound(isMuted);
    const classes: CharacterClassType[] = [
      'Warrior', 'Mage', 'Rogue', 'Ranger', 
      'Paladin', 'Cleric', 'Druid', 'Warlock'
    ];
    const available = classes.filter(c => c !== currentCharacter.characterClass);
    const newClass = available[Math.floor(Math.random() * available.length)];
    const classDef = CLASS_DEFINITIONS[newClass];
    const ability = classDef.abilities[Math.floor(Math.random() * classDef.abilities.length)];
    const equipment = classDef.starterEquipment[Math.floor(Math.random() * classDef.starterEquipment.length)];
    const classPortraits = CLASS_PORTRAITS[newClass] || [];
    const newPortrait = classPortraits[0];

    setCurrentCharacter(prev => {
      const updatedStats = { ...prev.stats };
      if (updatedStats[classDef.primaryStat] < 14) {
        updatedStats[classDef.primaryStat] = 14 + Math.floor(Math.random() * 4);
      }

      const conMod = Math.floor((updatedStats.con - 10) / 2);
      const hp = Math.max(1, classDef.hitDie + conMod + Math.floor(Math.random() * 6));

      const updated: Character = {
        ...prev,
        characterClass: newClass,
        signatureAbility: ability,
        startingGear: equipment,
        hp,
        imagePath: newPortrait.url,
        activePortraitUrl: newPortrait.url,
        cartoonImagePath: newPortrait.url,
        portraitVariantIndex: 0,
        portraitStyle: newPortrait.style,
        accentColor: classDef.accentColor,
        stats: updatedStats
      };
      setRoster(r => r.map(c => c.id === updated.id ? updated : c));
      return updated;
    });
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setCurrentCharacter(prev => {
      if (prev.id === id) {
        return { ...prev, isFavorite: !prev.isFavorite };
      }
      return prev;
    });
    setRoster(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  // Select character from roster
  const handleSelectCharacter = (char: Character) => {
    setCurrentCharacter(char);
    setActiveTab('forge');
    playManifestSound(isMuted);
  };

  // Remove from roster
  const handleRemoveFromRoster = (id: string) => {
    setRoster(prev => prev.filter(c => c.id !== id));
  };

  // Clear roster
  const handleClearRoster = () => {
    setRoster([]);
  };

  // Direct forge from Codex
  const handleForgeClassFromCodex = (cls: CharacterClassType) => {
    setSelectedClassFilter(cls);
    handleGenerate(cls);
    setActiveTab('forge');
  };

  return (
    <div 
      className="min-h-screen text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden bg-slate-950"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(15, 23, 42, 0.84) 0%, rgba(2, 6, 23, 0.96) 100%), url('/src/assets/images/alchemist_workbench_texture_1793859997267.jpg')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center'
      }}
    >
      {/* Background Animated Enchanted Realm: Pumpkins, Portals, Escaping Runners & Ghosts */}
      <EnchantedRealmBackground enabled={isAnimationActive} />

      {/* Top Bar following contract */}
      <TopBar
        forgedCount={roster.length}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(prev => !prev)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAnimationActive={isAnimationActive}
        onToggleAnimation={() => setIsAnimationActive(prev => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col items-center relative z-10">
        {/* Mystery Hero Fantasy Music Player (with Mute/Unmute, Track list & Equalizer) */}
        <MusicPlayer
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(prev => !prev)}
        />

        {activeTab === 'forge' && (
          <div className="w-full flex flex-col items-center gap-6">
            {/* Header intro with balanced text */}
            <div className="text-center max-w-xl">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                Arcane Alchemical Crucible
              </span>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-amber-100 mt-1 [text-wrap:balance]">
                Forge Your Fantasy Adventurer
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-2 leading-relaxed">
                Summon heroic souls at the ancient alchemist's workbench. Customize attributes, unlock class codices, and manifest video-game portraits.
              </p>
            </div>

            {/* Prominent Generator Button and Filters */}
            <GeneratorControls
              onGenerate={() => handleGenerate()}
              isGenerating={isGenerating}
              selectedClassFilter={selectedClassFilter}
              setSelectedClassFilter={setSelectedClassFilter}
              selectedRaceFilter={selectedRaceFilter}
              setSelectedRaceFilter={setSelectedRaceFilter}
            />

            {/* Glowing Border & Subtle Magical Aura around Main Content */}
            <div className="relative w-full flex justify-center mt-2 group">
              {/* Outer magical particle glow blur */}
              <div 
                className="absolute -inset-2 bg-gradient-to-r from-amber-500/25 via-purple-600/20 to-amber-500/25 rounded-3xl blur-xl pointer-events-none -z-10 opacity-75 transition-opacity duration-500" 
                aria-hidden="true"
              />
              
              <CharacterCard
                character={currentCharacter}
                onRerollName={handleRerollName}
                onRerollClass={handleRerollClass}
                onToggleFavorite={handleToggleFavorite}
                onGeneratePortrait={handleGeneratePortrait}
                onRegeneratePortrait={handleRegeneratePortrait}
                isPortraitGenerating={isPortraitGenerating}
                onTogglePortraitStyle={handleTogglePortraitStyle}
              />
            </div>

            {/* Quick Mini Party Strip if roster has heroes */}
            {roster.length > 1 && (
              <div className="w-full max-w-4xl mt-6 pt-6 border-t border-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recent Adventurers in Your Guild ({roster.length})</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('roster')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    View Full Roster →
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {roster.slice(0, 5).map(char => (
                    <button
                      key={char.id}
                      onClick={() => handleSelectCharacter(char)}
                      className={`px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap shrink-0 transition-all text-left flex items-center gap-2 ${
                        char.id === currentCharacter.id
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 font-semibold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{char.name}</span>
                      <span className="text-[10px] font-mono opacity-70">({char.characterClass})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roster' && (
          <PartyRoster
            roster={roster}
            activeCharacterId={currentCharacter.id}
            onSelectCharacter={handleSelectCharacter}
            onRemoveCharacter={handleRemoveFromRoster}
            onClearRoster={handleClearRoster}
          />
        )}

        {activeTab === 'classes' && (
          <ClassCodex
            onForgeClass={handleForgeClassFromCodex}
          />
        )}
      </main>

      {/* Clean Footer adhering to anti-slop rules (quiet copyright and links) */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span>Mythic Forge Character Generator</span>
          <span aria-hidden="true">·</span>
          <span>Cartoon & Video-Game Character Art</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-400/80">Press Spacebar to Forge</span>
        </div>
      </footer>
    </div>
  );
}
