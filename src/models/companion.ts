/**
 * Companion types and interfaces - Simplified
 */

/**
 * Available companion types
 */
export type CompanionType = 'cat' | 'dog' | 'robot' | 'plant' | 'flame';

/**
 * Companion mood states
 */
export type CompanionMood = 'happy' | 'focused' | 'tired' | 'celebrating';

/**
 * SVG animation states (maps to file names)
 */
export type CompanionSvgState = 'idle' | 'focus' | 'break' | 'celebrate';

/**
 * Companion state stored in globalState
 */
export interface CompanionState {
  type: CompanionType;
  mood: CompanionMood;
}

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
};

/**
 * Default companion state
 */
export const DEFAULT_COMPANION_STATE: CompanionState = {
  type: 'cat',
  mood: 'happy',
};

/**
 * All available companions
 */
export const ALL_COMPANIONS: CompanionType[] = ['cat', 'dog', 'robot', 'plant', 'flame'];
