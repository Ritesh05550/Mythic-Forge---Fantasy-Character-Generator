import { CharacterClassType, CharacterRaceType, AlignmentType, ClassDefinition, Character } from '../types/character';

export const FANTASY_FIRST_NAMES = [
  'Alistair', 'Katherine', 'Thorgar', 'Vesper', 'Lyra', 
  'Zephyr', 'Valerius', 'Sylas', 'Maeve', 'Branok', 
  'Elowen', 'Kaelen', 'Morrigan', 'Darian', 'Seraphina', 
  'Garrick', 'Rowena', 'Thorin', 'Elora', 'Finnegan',
  'Cassian', 'Isolde', 'Balthazar', 'Evander', 'Nyx',
  'Aldous', 'Rhiannon', 'Caelum', 'Freya', 'Gideon'
];

export const FANTASY_SURNAME_PREFIXES = [
  'Storm', 'Iron', 'Shadow', 'Moon', 'Dusk', 
  'Dawn', 'Night', 'Raven', 'Fire', 'Stone', 
  'Silver', 'Frost', 'Wild', 'Blood', 'Sun', 
  'Grim', 'Ash', 'Star', 'Thunder', 'Rune'
];

export const FANTASY_SURNAME_SUFFIXES = [
  'weaver', 'breaker', 'dancer', 'whisper', 'stride', 
  'chaser', 'shade', 'scar', 'heart', 'caller', 
  'binder', 'fall', 'watcher', 'forge', 'seeker', 
  'helm', 'born', 'warden', 'song', 'fang'
];

export const FANTASY_TITLES = [
  'the Unbroken',
  'Whisperer of the Void',
  'Blade of the Dawn',
  'the Cinder-Touched',
  'the Silent Gale',
  'Shield of the High Spire',
  'the Runebound',
  'Seeker of Starlight',
  'of the Iron Bastion',
  'the Shadow Sovereign',
  'Keeper of the Eternal Ember',
  'Bane of the Wyrm',
  'the Oathsworn',
  'Wanderer of the Mist'
];

export const CHARACTER_RACES: CharacterRaceType[] = [
  'Human',
  'High Elf',
  'Wood Elf',
  'Mountain Dwarf',
  'Dragonborn',
  'Tiefling',
  'Halfling',
  'Half-Orc'
];

export const ALIGNMENTS: AlignmentType[] = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral'
];

export interface PortraitOption {
  id: string;
  name: string;
  url: string;
  style: 'cartoon' | 'realistic';
  tags: string[];
}

export const CLASS_PORTRAITS: Record<CharacterClassType, PortraitOption[]> = {
  Warrior: [
    {
      id: 'warrior_cartoon_1',
      name: 'Heroic Vanguard (Video Game)',
      url: '/src/assets/images/cartoon_warrior_game_1793859407499.jpg',
      style: 'cartoon',
      tags: ['Chunky Plate Armor', 'Rune Claymore', 'Vibrant Game Art']
    },
    {
      id: 'warrior_real_1',
      name: 'Iron Knight (High Fantasy)',
      url: '/src/assets/images/fantasy_warrior_portrait_1793858981946.jpg',
      style: 'realistic',
      tags: ['Battle-worn', 'Engraved Silver', 'Noble Knight']
    }
  ],
  Mage: [
    {
      id: 'mage_cartoon_1',
      name: 'Arcane Runecaster (Video Game)',
      url: '/src/assets/images/cartoon_mage_game_1793859408749.jpg',
      style: 'cartoon',
      tags: ['Glowing Orbs', 'Mystic Runes', 'Vibrant Game Art']
    },
    {
      id: 'mage_real_1',
      name: 'Archmage of the Blue Dawn',
      url: '/src/assets/images/fantasy_mage_portrait_1793858982715.jpg',
      style: 'realistic',
      tags: ['Sapphire Robes', 'Astral Staff', 'High Fantasy']
    }
  ],
  Rogue: [
    {
      id: 'rogue_cartoon_1',
      name: 'Shadow Stalker (Video Game)',
      url: '/src/assets/images/cartoon_rogue_game_1793859410207.jpg',
      style: 'cartoon',
      tags: ['Twin Poison Blades', 'Hooded Cowl', 'Vibrant Game Art']
    },
    {
      id: 'rogue_real_1',
      name: 'Nightblade Assassin',
      url: '/src/assets/images/fantasy_rogue_portrait_1793858983783.jpg',
      style: 'realistic',
      tags: ['Dark Leather', 'Dual Daggers', 'High Fantasy']
    }
  ],
  Ranger: [
    {
      id: 'ranger_cartoon_1',
      name: 'Woodland Deadeye (Video Game)',
      url: '/src/assets/images/cartoon_ranger_game_1793859409318.jpg',
      style: 'cartoon',
      tags: ['Emerald Braid', 'Rune Longbow', 'Vibrant Game Art']
    },
    {
      id: 'ranger_real_1',
      name: 'Deepwood Scout',
      url: '/src/assets/images/fantasy_ranger_portrait_1793858983170.jpg',
      style: 'realistic',
      tags: ['Elven Bow', 'Forest Camo', 'High Fantasy']
    }
  ],
  Paladin: [
    {
      id: 'paladin_cartoon_1',
      name: 'Dawn Justiciar (Video Game)',
      url: '/src/assets/images/cartoon_paladin_game_1793859444547.jpg',
      style: 'cartoon',
      tags: ['Sun Warhammer', 'Radiant Gold Armor', 'Vibrant Game Art']
    },
    {
      id: 'paladin_real_1',
      name: 'Avenger of the Dawn',
      url: '/src/assets/images/fantasy_warrior_portrait_1793858981946.jpg',
      style: 'realistic',
      tags: ['Full Plate', 'Sacred Vow', 'High Fantasy']
    }
  ],
  Warlock: [
    {
      id: 'warlock_cartoon_1',
      name: 'Eldritch Invocator (Video Game)',
      url: '/src/assets/images/cartoon_warlock_game_1793859444817.jpg',
      style: 'cartoon',
      tags: ['Void Eye Grimoire', 'Cosmic Flames', 'Vibrant Game Art']
    },
    {
      id: 'warlock_real_1',
      name: 'Hexblade Channeler',
      url: '/src/assets/images/fantasy_mage_portrait_1793858982715.jpg',
      style: 'realistic',
      tags: ['Astral Mantle', 'Occult Staff', 'High Fantasy']
    }
  ],
  Cleric: [
    {
      id: 'cleric_cartoon_1',
      name: 'Radiant Dawnkeeper (Video Game)',
      url: '/src/assets/images/cartoon_paladin_game_1793859444547.jpg',
      style: 'cartoon',
      tags: ['Solar Relic', 'Blessed Armor', 'Vibrant Game Art']
    },
    {
      id: 'cleric_real_1',
      name: 'High Priest of Lumina',
      url: '/src/assets/images/fantasy_mage_portrait_1793858982715.jpg',
      style: 'realistic',
      tags: ['Holy Robes', 'Celestial Aura', 'High Fantasy']
    }
  ],
  Druid: [
    {
      id: 'druid_cartoon_1',
      name: 'Verdant Shifter (Video Game)',
      url: '/src/assets/images/cartoon_ranger_game_1793859409318.jpg',
      style: 'cartoon',
      tags: ['Living Flora', 'Primal Aura', 'Vibrant Game Art']
    },
    {
      id: 'druid_real_1',
      name: 'Ancient Warden of the Oak',
      url: '/src/assets/images/fantasy_ranger_portrait_1793858983170.jpg',
      style: 'realistic',
      tags: ['Ironwood Staff', 'Wild Cloak', 'High Fantasy']
    }
  ]
};

export const CLASS_DEFINITIONS: Record<CharacterClassType, ClassDefinition> = {
  Warrior: {
    name: 'Warrior',
    role: 'Frontline Vanguard & Master of Arms',
    description: 'Masters of martial combat and tactical discipline, unyielding clad in plate mail.',
    hitDie: 10,
    primaryStat: 'str',
    accentColor: 'text-amber-400',
    accentBorder: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/10 text-amber-300',
    imagePath: '/src/assets/images/cartoon_warrior_game_1793859407499.jpg',
    abilities: [
      { name: 'Second Wind', description: 'Surge with adrenaline to regain vitality in the crucible of battle.' },
      { name: 'Action Surge', description: 'Push past mortal limits to strike with explosive speed.' },
      { name: 'Indomitable Will', description: 'Shrug off debilitating mental blows through sheer grit.' }
    ],
    starterEquipment: [
      'Tempered Bastard Sword & Heavy Kite Shield',
      'Ornate Plate Harness with Fur Trim',
      'Vanguard War Horn & Throwing Axes'
    ]
  },
  Mage: {
    name: 'Mage',
    role: 'Arcane Scholar & Reality Weaver',
    description: 'Channelers of cosmic ether, turning arcane mysteries into blazing incantations.',
    hitDie: 6,
    primaryStat: 'int',
    accentColor: 'text-blue-400',
    accentBorder: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/10 text-blue-300',
    imagePath: '/src/assets/images/cartoon_mage_game_1793859408749.jpg',
    abilities: [
      { name: 'Arcane Ward', description: 'Manifest a shimmering hex-barrier absorbing incoming spell damage.' },
      { name: 'Frostfire Cascade', description: 'Sunder enemy lines with braided elemental ice and azure flame.' },
      { name: 'Chrono-Stutter', description: 'Fracture localized spacetime to evade imminent strikes.' }
    ],
    starterEquipment: [
      'Etched Sapphire Focus Staff with Living Crystal',
      'Velvet Scholar Robes of the Astral College',
      'Spellbook Bound in Chimera Hide & Component Satchel'
    ]
  },
  Rogue: {
    name: 'Rogue',
    role: 'Shadow Infiltrator & Precision Striker',
    description: 'Lethal opportunists who weaponize stealth, lockcraft, and pinpoint anatomy strikes.',
    hitDie: 8,
    primaryStat: 'dex',
    accentColor: 'text-emerald-400',
    accentBorder: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/10 text-emerald-300',
    imagePath: '/src/assets/images/cartoon_rogue_game_1793859410207.jpg',
    abilities: [
      { name: 'Sneak Attack', description: 'Exploit a foe’s distraction to deliver a fatal, pinpoint laceration.' },
      { name: 'Cunning Action', description: 'Melt into the gloom with instant dash, disengage, or hide.' },
      { name: 'Uncanny Dodge', description: 'Read incoming blade arcs instinctively to halve physical impacts.' }
    ],
    starterEquipment: [
      'Twin Damascus Steel Daggers with Serrated Spines',
      'Studded Shadow-Leather Cuirass & Silent Boots',
      'Set of Masterwork Thieves’ Tools & Smoke Pellets'
    ]
  },
  Ranger: {
    name: 'Ranger',
    role: 'Wilderness Warden & Deadeye Archer',
    description: 'Solitary scouts who commune with primal nature and strike unseen from the tree line.',
    hitDie: 10,
    primaryStat: 'dex',
    accentColor: 'text-lime-400',
    accentBorder: 'border-lime-500/40',
    badgeBg: 'bg-lime-500/10 text-lime-300',
    imagePath: '/src/assets/images/cartoon_ranger_game_1793859409318.jpg',
    abilities: [
      { name: 'Hunter’s Mark', description: 'Supernaturally bind focus to prey for amplified critical strikes.' },
      { name: 'Hail of Thorns', description: 'Loose an arrow that bursts into a storm of enchanted briars.' },
      { name: 'Natural Camouflage', description: 'Blend seamlessly with woodland brush and cavern stone.' }
    ],
    starterEquipment: [
      'Ancient Yew Recurve Bow & Quiver of Fletched Broadheads',
      'Leaf-Embossed Leather Hauberk & Elven Traveling Cloak',
      'Twin Bone-Handled Hunting Knives & Survival Kit'
    ]
  },
  Paladin: {
    name: 'Paladin',
    role: 'Holy Avenger & Bastion of Light',
    description: 'Bound by sacred vows to vanquish corruption and safeguard the defenseless.',
    hitDie: 10,
    primaryStat: 'cha',
    accentColor: 'text-yellow-400',
    accentBorder: 'border-yellow-500/40',
    badgeBg: 'bg-yellow-500/10 text-yellow-300',
    imagePath: '/src/assets/images/cartoon_paladin_game_1793859444547.jpg',
    abilities: [
      { name: 'Divine Smite', description: 'Infuse weapon strikes with radiant celestial fire.' },
      { name: 'Lay on Hands', description: 'Channel cleansing divine touch to cure toxins and heal wounds.' },
      { name: 'Aura of Courage', description: 'Bolster nearby allies against magical fear and despair.' }
    ],
    starterEquipment: [
      'Sun-Forged Greatsword Inscribed with Ancient Liturgies',
      'Polished Steel Full Plate with Golden Tabard',
      'Silver Holy Symbol of the Morning Lord'
    ]
  },
  Cleric: {
    name: 'Cleric',
    role: 'Divine Channeler & Radiant Healer',
    description: 'Intermediaries between mortal realms and the celestial gods, wielding miraculous blessings.',
    hitDie: 8,
    primaryStat: 'wis',
    accentColor: 'text-amber-300',
    accentBorder: 'border-amber-400/40',
    badgeBg: 'bg-amber-400/10 text-amber-200',
    imagePath: '/src/assets/images/cartoon_paladin_game_1793859444547.jpg',
    abilities: [
      { name: 'Radiance of the Dawn', description: 'Dispel magical darkness and smite aberrations with pure light.' },
      { name: 'Preserve Life', description: 'Restore fallen comrades with an outpouring of divine vitality.' },
      { name: 'Turn Undead', description: 'Speak the sacred name to send fiends and spirits fleeing in terror.' }
    ],
    starterEquipment: [
      'Spiked Morningstar & Reliquary Tower Shield',
      'Chainmail Vestment over Embroidered Priestly Surcoat',
      'Censer of Sanctified Myrrh & Prayer Beads'
    ]
  },
  Druid: {
    name: 'Druid',
    role: 'Primal Shifter & Keeper of the Wilds',
    description: 'Guardians of primeval forests who command weather, earth, and beast forms.',
    hitDie: 8,
    primaryStat: 'wis',
    accentColor: 'text-teal-400',
    accentBorder: 'border-teal-500/40',
    badgeBg: 'bg-teal-500/10 text-teal-300',
    imagePath: '/src/assets/images/cartoon_ranger_game_1793859409318.jpg',
    abilities: [
      { name: 'Wild Shape', description: 'Assume the terrifying form of a Dire Bear or Spectral Hawk.' },
      { name: 'Grasp of the Briar', description: 'Summon razor vines that entangle and crush enemy formations.' },
      { name: 'Call Lightning', description: 'Summon stormclouds to strike continuous lightning bolts.' }
    ],
    starterEquipment: [
      'Ironwood Quarterstaff Rooted with Amber Resin',
      'Hardened Barkscale Armor & Verdant Shamanic Mantle',
      'Mistletoe Sprig Focus & Herbalist Pouch'
    ]
  },
  Warlock: {
    name: 'Warlock',
    role: 'Occult Invocator & Eldritch Harvester',
    description: 'Seekers of forbidden knowledge bound by pacts to beings from beyond the stars.',
    hitDie: 8,
    primaryStat: 'cha',
    accentColor: 'text-purple-400',
    accentBorder: 'border-purple-500/40',
    badgeBg: 'bg-purple-500/10 text-purple-300',
    imagePath: '/src/assets/images/cartoon_warlock_game_1793859444817.jpg',
    abilities: [
      { name: 'Eldritch Blast', description: 'Hurl beams of crackling violet force that blast enemies backward.' },
      { name: 'Hexblade Curse', description: 'Mark a doomed target, draining life essence upon their demise.' },
      { name: 'Misty Escape', description: 'Vanish into black vapor when struck, reappearing nearby.' }
    ],
    starterEquipment: [
      'Obsidian-Bladed Scythe with Carved Void Glyphs',
      'Silk Duster Lined with Astral Runes & Dark Amulet',
      'Grimoire of Whispers Bound in Black Leather'
    ]
  }
};

export const BACKSTORY_HOOKS = [
  'Seeking an ancient relic stolen from their ancestral sanctuary deep in the crags.',
  'Carries an unyielding blood-oath to avenge their fallen mentor against the Shadow Cabal.',
  'Exiled from the royal high court after exposing a sinister conspirator among the nobility.',
  'Guided by recurring prophetic dreams of a shattered moon and an awakening elder god.',
  'The last surviving scion of a legendary order of guardians lost to history.',
  'Wanders the frontier seeking redemption for an unintended magical catastrophe.',
  'Fleeing a relentless bounty hunter contracted by a tyrannical merchant lord.',
  'Tasked by an ancient forest spirit to protect the slumbering seed of the World Tree.'
];

function rollStat(): number {
  const rolls = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ].sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2];
}

export function generateCharacter(
  overrideClass?: CharacterClassType,
  overrideRace?: CharacterRaceType
): Character {
  const classes: CharacterClassType[] = [
    'Warrior', 'Mage', 'Rogue', 'Ranger', 
    'Paladin', 'Cleric', 'Druid', 'Warlock'
  ];

  const chosenClass = overrideClass || classes[Math.floor(Math.random() * classes.length)];
  const chosenRace = overrideRace || CHARACTER_RACES[Math.floor(Math.random() * CHARACTER_RACES.length)];

  const firstName = FANTASY_FIRST_NAMES[Math.floor(Math.random() * FANTASY_FIRST_NAMES.length)];
  const surnamePrefix = FANTASY_SURNAME_PREFIXES[Math.floor(Math.random() * FANTASY_SURNAME_PREFIXES.length)];
  const surnameSuffix = FANTASY_SURNAME_SUFFIXES[Math.floor(Math.random() * FANTASY_SURNAME_SUFFIXES.length)];
  const title = FANTASY_TITLES[Math.floor(Math.random() * FANTASY_TITLES.length)];

  const classDef = CLASS_DEFINITIONS[chosenClass];
  const ability = classDef.abilities[Math.floor(Math.random() * classDef.abilities.length)];
  const equipment = classDef.starterEquipment[Math.floor(Math.random() * classDef.starterEquipment.length)];
  const backstory = BACKSTORY_HOOKS[Math.floor(Math.random() * BACKSTORY_HOOKS.length)];
  const alignment = ALIGNMENTS[Math.floor(Math.random() * ALIGNMENTS.length)];

  // Roll stats
  const stats = {
    str: rollStat(),
    dex: rollStat(),
    con: rollStat(),
    int: rollStat(),
    wis: rollStat(),
    cha: rollStat()
  };

  // Ensure class primary stat is strong
  const primary = classDef.primaryStat;
  if (stats[primary] < 14) {
    stats[primary] = 14 + Math.floor(Math.random() * 4);
  }

  // Calculate HP
  const conMod = Math.floor((stats.con - 10) / 2);
  const hp = Math.max(1, classDef.hitDie + conMod + Math.floor(Math.random() * 6));

  // Calculate AC
  const dexMod = Math.floor((stats.dex - 10) / 2);
  let ac = 10 + dexMod;
  if (chosenClass === 'Warrior' || chosenClass === 'Paladin') ac = 16 + (dexMod > 2 ? 2 : dexMod);
  if (chosenClass === 'Ranger' || chosenClass === 'Rogue') ac = 13 + dexMod;
  if (chosenClass === 'Mage' || chosenClass === 'Warlock') ac = 11 + dexMod;
  if (chosenClass === 'Cleric' || chosenClass === 'Druid') ac = 14 + (dexMod > 2 ? 2 : dexMod);

  const initialPortrait = CLASS_PORTRAITS[chosenClass][0];

  return {
    id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${firstName} ${surnamePrefix}${surnameSuffix}`,
    title,
    characterClass: chosenClass,
    race: chosenRace,
    alignment,
    level: 3,
    hp,
    armorClass: ac,
    stats,
    signatureAbility: ability,
    startingGear: equipment,
    backstoryHook: backstory,
    imagePath: initialPortrait.url,
    cartoonImagePath: initialPortrait.url,
    activePortraitUrl: initialPortrait.url,
    portraitStyle: 'cartoon',
    portraitVariantIndex: 0,
    hasGeneratedPortrait: true,
    accentColor: classDef.accentColor,
    generatedAt: Date.now()
  };
}
