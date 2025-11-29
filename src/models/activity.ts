/**
 * Activity Tracking types and interfaces
 * Tracks VS Code usage for productivity insights
 */

/**
 * Daily activity data
 */
export interface DailyActivity {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total minutes VS Code was focused */
  totalMinutes: number;
  /** Minutes spent per programming language */
  languageBreakdown: Record<string, number>;
  /** Count of unique files saved */
  filesEdited: number;
  /** Number of focus sessions completed */
  focusSessions: number;
  /** Total focus minutes from Pomodoro */
  focusMinutes: number;
}

/**
 * Aggregated activity statistics
 */
export interface ActivityStats {
  /** Current streak of days with activity */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Total focus minutes all time */
  totalFocusMinutes: number;
  /** Total focus sessions all time */
  totalSessions: number;
  /** Today's goal progress (0-100) */
  todayGoalProgress: number;
  /** Last 7 days of activity data */
  weeklyData: DailyActivity[];
}

/**
 * Activity tracking configuration
 */
export interface ActivityConfig {
  /** Whether activity tracking is enabled */
  enabled: boolean;
  /** Daily goal in minutes (default: 360 = 6 hours) */
  dailyGoalMinutes: number;
  /** Whether to track language breakdown */
  trackLanguages: boolean;
  /** Whether to show time in status bar */
  showInStatusBar: boolean;
}

/**
 * Default activity configuration
 */
export const DEFAULT_ACTIVITY_CONFIG: ActivityConfig = {
  enabled: true,
  dailyGoalMinutes: 360,
  trackLanguages: true,
  showInStatusBar: true,
};

/**
 * Default daily activity data
 */
export const DEFAULT_DAILY_ACTIVITY: DailyActivity = {
  date: '',
  totalMinutes: 0,
  languageBreakdown: {},
  filesEdited: 0,
  focusSessions: 0,
  focusMinutes: 0,
};

/**
 * Default activity stats
 */
export const DEFAULT_ACTIVITY_STATS: ActivityStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalFocusMinutes: 0,
  totalSessions: 0,
  todayGoalProgress: 0,
  weeklyData: [],
};

/**
 * Storage keys for activity data
 */
export const ACTIVITY_STORAGE_KEYS = {
  DAILY: 'cmdify.activity.daily',
  HISTORY: 'cmdify.activity.history',
  LAST_ACTIVE: 'cmdify.activity.lastActive',
} as const;

/**
 * Tracking interval in milliseconds (30 seconds)
 */
export const ACTIVITY_TRACKING_INTERVAL = 30 * 1000;

/**
 * Maximum days to keep in history
 */
export const ACTIVITY_HISTORY_DAYS = 30;
