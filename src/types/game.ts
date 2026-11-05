import { Character } from './character';

export type RunDistanceCategory = '1K' | '5K' | '10K' | '15K' | '20K' | '20MIN';

export interface RunDistanceConfig {
  id: RunDistanceCategory;
  name: string;
  targetMeters: number;
  timeLimitSec?: number;
  description: string;
  estimatedTime: string;
}

export const DISTANCE_CONFIGS: Record<RunDistanceCategory, RunDistanceConfig> = {
  '1K': {
    id: '1K',
    name: '1K Twilight Sprint',
    targetMeters: 1000,
    description: 'A swift 1,000-meter dash through the shadowed streets to test your reflexes and pace.',
    estimatedTime: '~2-3 min pace'
  },
  '5K': {
    id: '5K',
    name: '5K Shadow Run',
    targetMeters: 5000,
    description: 'A terrifying 5-kilometer sprint through city alleys and the forest fringe.',
    estimatedTime: '~12-15 min pace'
  },
  '10K': {
    id: '10K',
    name: '10K Gauntlet',
    targetMeters: 10000,
    description: 'Ten kilometers deep into the haunted blackwoods and back.',
    estimatedTime: '~25-30 min pace'
  },
  '15K': {
    id: '15K',
    name: '15K Expedition',
    targetMeters: 15000,
    description: 'An endurance test across shifting environments and relentless horrors.',
    estimatedTime: '~40-45 min pace'
  },
  '20K': {
    id: '20K',
    name: '20K Marathon',
    targetMeters: 20000,
    description: 'The ultimate nightmare trek through unending shadowed terrain.',
    estimatedTime: '~60+ min pace'
  },
  '20MIN': {
    id: '20MIN',
    name: '20+ Min Survival Sprint',
    targetMeters: 8000,
    timeLimitSec: 1200, // 20 minutes
    description: 'Time-based horror sprint: survive 20 full minutes of horrors.',
    estimatedTime: '20:00 timed survival'
  }
};

export type GameEnvironment = 'CITY_STREETS' | 'HORROR_FOREST';

export interface GameObstacle {
  id: number;
  lane: 0 | 1 | 2; // 0: Left, 1: Center, 2: Right
  z: number; // 0 (horizon) to 100 (player impact zone)
  type: 'SHADOW_GHOUL' | 'IRON_BARRICADE' | 'DEADWOOD_CLAW' | 'WEEPING_SPECTER';
  name: string;
  damage: number;
}

export interface GameCollectible {
  id: number;
  lane: 0 | 1 | 2;
  z: number;
  type: 'COIN' | 'SHIELD' | 'XP_ORB';
  value: number;
}

export interface GameRunStats {
  character: Character;
  distanceCoveredMeters: number;
  targetMeters: number;
  timeElapsedSec: number;
  coinsCollected: number;
  xpEarned: number;
  shieldsUsed: number;
  hazardsDodged: number;
  isVictory: boolean;
  environment: GameEnvironment;
}
