export type CharacterClassType = 
  | 'Warrior' 
  | 'Mage' 
  | 'Rogue' 
  | 'Ranger' 
  | 'Paladin' 
  | 'Cleric' 
  | 'Druid' 
  | 'Warlock';

export type CharacterRaceType =
  | 'Human'
  | 'High Elf'
  | 'Wood Elf'
  | 'Mountain Dwarf'
  | 'Dragonborn'
  | 'Tiefling'
  | 'Halfling'
  | 'Half-Orc';

export type AlignmentType =
  | 'Lawful Good'
  | 'Neutral Good'
  | 'Chaotic Good'
  | 'Lawful Neutral'
  | 'True Neutral'
  | 'Chaotic Neutral';

export interface CharacterStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  characterClass: CharacterClassType;
  race: CharacterRaceType;
  alignment: AlignmentType;
  level: number;
  hp: number;
  armorClass: number;
  stats: CharacterStats;
  signatureAbility: {
    name: string;
    description: string;
  };
  startingGear: string;
  backstoryHook: string;
  imagePath?: string;
  cartoonImagePath?: string;
  activePortraitUrl?: string;
  portraitStyle: 'cartoon' | 'realistic';
  portraitVariantIndex: number;
  hasGeneratedPortrait: boolean;
  accentColor: string;
  generatedAt: number;
  isFavorite?: boolean;
}

export interface ClassDefinition {
  name: CharacterClassType;
  role: string;
  description: string;
  hitDie: number;
  primaryStat: keyof CharacterStats;
  accentColor: string;
  accentBorder: string;
  badgeBg: string;
  imagePath?: string;
  abilities: Array<{ name: string; description: string }>;
  starterEquipment: string[];
}
