/**
 * Companion types and interfaces - Enhanced with Evolution 2.0
 */

/**
 * Available companion types (including new unlockable ones)
 */
export type CompanionType =
  | 'cat' | 'dog' | 'robot' | 'plant' | 'flame'  // Original companions
  | 'fox' | 'owl' | 'panda' | 'star';              // New unlockable companions

/**
 * Companion mood states
 */
export type CompanionMood = 'happy' | 'focused' | 'tired' | 'celebrating';

/**
 * SVG animation states (maps to file names)
 */
export type CompanionSvgState = 'idle' | 'focus' | 'break' | 'celebrate';

/**
 * Accessory IDs for cosmetic items
 */
export type AccessoryId =
  | 'party_hat'
  | 'crown'
  | 'sunglasses'
  | 'nerd_glasses'
  | 'confetti';

/**
 * Unlock condition types
 */
export type UnlockConditionType = 'sessions' | 'streak' | 'todos' | 'level' | 'special';

/**
 * Unlock condition for companions and accessories
 */
export interface UnlockCondition {
  type: UnlockConditionType;
  value: number;
  description?: string;
}

/**
 * Accessory definition
 */
export interface Accessory {
  id: AccessoryId;
  name: string;
  category: 'hat' | 'glasses' | 'background';
  unlockedBy: UnlockCondition;
  emoji: string;
}

/**
 * Companion unlock definition
 */
export interface CompanionUnlock {
  type: CompanionType;
  name: string;
  emoji: string;
  unlockedBy: UnlockCondition;
  isDefault: boolean;
}

/**
 * Enhanced companion state with progression
 */
export interface CompanionState {
  type: CompanionType;
  mood: CompanionMood;

  // Progression fields
  level: number;
  experience: number;
  totalXP: number;

  // Unlocks
  unlockedCompanions: CompanionType[];
  unlockedAccessories: AccessoryId[];
  equippedAccessory?: AccessoryId;

  // Metadata
  joinedDate: string;

  // Special tracking for unlocks
  nightOwlCount?: number;  // Times used after midnight
}

/**
 * XP Rewards for different actions
 */
export const XP_REWARDS = {
  focusSessionComplete: 100,
  breakTaken: 25,
  todoComplete: 50,
  dailyGoalReached: 200,
  streakDay: 50,
  streakWeek: 500,
  streakMonth: 2000,
} as const;

/**
 * Calculate XP required for a given level (exponential curve)
 * Formula: 100 * 1.5^(level - 1)
 */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate total XP required to reach a level from level 1
 */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Companion unlock conditions
 */
export const COMPANION_UNLOCKS: CompanionUnlock[] = [
  {
    type: 'robot',
    name: 'Robot',
    emoji: '🤖',
    unlockedBy: { type: 'level', value: 0 },  // Default
    isDefault: true,
  },
  {
    type: 'cat',
    name: 'Cat',
    emoji: '🐱',
    unlockedBy: { type: 'sessions', value: 10, description: 'Complete 10 focus sessions' },
    isDefault: false,
  },
  {
    type: 'dog',
    name: 'Dog',
    emoji: '🐕',
    unlockedBy: { type: 'sessions', value: 25, description: 'Complete 25 focus sessions' },
    isDefault: false,
  },
  {
    type: 'plant',
    name: 'Plant',
    emoji: '🌱',
    unlockedBy: { type: 'streak', value: 7, description: 'Achieve 7-day streak' },
    isDefault: false,
  },
  {
    type: 'flame',
    name: 'Flame',
    emoji: '🔥',
    unlockedBy: { type: 'streak', value: 30, description: 'Achieve 30-day streak' },
    isDefault: false,
  },
  {
    type: 'fox',
    name: 'Fox',
    emoji: '🦊',
    unlockedBy: { type: 'todos', value: 50, description: 'Complete 50 TODOs' },
    isDefault: false,
  },
  {
    type: 'owl',
    name: 'Owl',
    emoji: '🦉',
    unlockedBy: { type: 'special', value: 5, description: 'Use extension after midnight 5 times' },
    isDefault: false,
  },
  {
    type: 'panda',
    name: 'Panda',
    emoji: '🐼',
    unlockedBy: { type: 'streak', value: 100, description: 'Achieve 100-day streak (legendary!)' },
    isDefault: false,
  },
  {
    type: 'star',
    name: 'Star',
    emoji: '⭐',
    unlockedBy: { type: 'level', value: 25, description: 'Reach level 25' },
    isDefault: false,
  },
];

/**
 * Accessory definitions
 */
export const ACCESSORIES: Accessory[] = [
  {
    id: 'party_hat',
    name: 'Party Hat',
    emoji: '🎩',
    category: 'hat',
    unlockedBy: { type: 'level', value: 5, description: 'Reach level 5' },
  },
  {
    id: 'crown',
    name: 'Crown',
    emoji: '👑',
    category: 'hat',
    unlockedBy: { type: 'streak', value: 30, description: 'Achieve 30-day streak' },
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    emoji: '😎',
    category: 'glasses',
    unlockedBy: { type: 'sessions', value: 50, description: 'Complete 50 focus sessions' },
  },
  {
    id: 'nerd_glasses',
    name: 'Nerd Glasses',
    emoji: '🤓',
    category: 'glasses',
    unlockedBy: { type: 'todos', value: 100, description: 'Complete 100 TODOs' },
  },
  {
    id: 'confetti',
    name: 'Confetti',
    emoji: '🎊',
    category: 'background',
    unlockedBy: { type: 'level', value: 10, description: 'Reach level 10' },
  },
];

/**
 * Companion codicons for status bar (VS Code built-in icons)
 * Using codicon syntax: $(icon-name)
 */
export const COMPANION_ICONS: Record<CompanionType, Record<string, string>> = {
  cat: {
    idle: '$(smiley)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
  dog: {
    idle: '$(smiley)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
  robot: {
    idle: '$(hubot)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
  plant: {
    idle: '$(smiley)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
  flame: {
    idle: '$(flame)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
  fox: {
    idle: '$(smiley)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
  owl: {
    idle: '$(smiley)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
  panda: {
    idle: '$(smiley)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
  star: {
    idle: '$(star-full)',
    focusing: '$(flame)',
    break: '$(coffee)',
    paused: '$(debug-pause)',
    celebrating: '$(star-full)',
  },
};

/**
 * Companion display names
 */
export const COMPANION_NAMES: Record<CompanionType, string> = {
  cat: 'Cat',
  dog: 'Dog',
  robot: 'Robot',
  plant: 'Plant',
  flame: 'Flame',
  fox: 'Fox',
  owl: 'Owl',
  panda: 'Panda',
  star: 'Star',
};

/**
 * Default companion state (with progression)
 */
export const DEFAULT_COMPANION_STATE: CompanionState = {
  type: 'robot',  // Default companion
  mood: 'happy',
  level: 1,
  experience: 0,
  totalXP: 0,
  unlockedCompanions: ['robot'],  // Robot is unlocked by default
  unlockedAccessories: [],
  equippedAccessory: undefined,
  joinedDate: new Date().toISOString(),
  nightOwlCount: 0,
};

/**
 * All available companions
 */
export const ALL_COMPANIONS: CompanionType[] = [
  'robot', 'cat', 'dog', 'plant', 'flame',
  'fox', 'owl', 'panda', 'star'
];
