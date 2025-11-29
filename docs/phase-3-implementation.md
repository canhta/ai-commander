# Cmdify Phase 3 - Implementation Plan

> A carefully curated selection of features from spec-3 that align with Cmdify's core purpose and VS Code extension capabilities.

**Document Version:** 1.0  
**Created:** November 29, 2025  
**Status:** Planning

---

## 📋 Executive Summary

After analyzing spec-3 against the current Cmdify implementation and VS Code extension limitations, this document presents a **refined Phase 3 roadmap** that builds upon existing features while maintaining focus on developer productivity.

### Current State (Phase 1 & 2)
| Feature | Status |
|---------|--------|
| AI Command Generation | ✅ Implemented |
| Command Library & Tags | ✅ Implemented |
| GitHub Sync (Gist) | ✅ Implemented |
| Focus Timer (Pomodoro) | ✅ Implemented |
| Animated Companions | ✅ Implemented (Basic) |
| TODO Scanner | ✅ Implemented |
| Reminder System | ✅ Implemented |
| Status Bar Integration | ✅ Implemented |

---

## 🔍 Feature Evaluation from Spec-3

### ❌ Rejected Features

| Feature | Reason for Rejection |
|---------|---------------------|
| **GitHub Notifications** | Outside core scope; VS Code already has GitHub extensions (GitHub Pull Requests, GitLens). Would require complex OAuth, webhooks, and duplicate existing functionality. Adds maintenance burden without unique value. |
| **Webhook System** | Overly complex for a productivity tool. Requires external service knowledge. Low user adoption expected. |
| **SQLite Storage** | Current JSON file storage works well. SQLite adds complexity without clear benefit for typical data sizes (<10MB). |
| **Code Snippets Support** | VS Code already has excellent snippet support. Would duplicate core editor functionality. |

### ✅ Approved Features (Modified)

| Feature | Fit Score | Priority |
|---------|-----------|----------|
| Activity Insights (Simplified) | ⭐⭐⭐⭐ | P1 |
| Companion Evolution 2.0 | ⭐⭐⭐⭐⭐ | P1 |
| Achievement System | ⭐⭐⭐⭐⭐ | P1 |
| Command Library UX Improvements | ⭐⭐⭐⭐ | P2 |
| Onboarding Flow | ⭐⭐⭐⭐ | P2 |
| Enhanced Sync (Conflict Resolution) | ⭐⭐⭐ | P3 |

---

## 🎯 Phase 3 Features - Detailed Specification

---

## Feature 1: Activity Insights (Simplified)

### Why This Fits
- Complements existing Focus Timer
- Uses only VS Code APIs (no external tracking)
- Enhances companion gamification
- Low complexity, high value

### What We Track (VS Code Only)
| Data | Method | Storage |
|------|--------|---------|
| Time in VS Code | `vscode.window.state.focused` | globalState |
| Active file language | `vscode.window.activeTextEditor` | globalState |
| Focus sessions | Existing FocusService | Already stored |
| Files edited (count only) | `onDidSaveTextDocument` | Daily aggregates |

### What We DON'T Track
- ❌ Specific file names (privacy)
- ❌ Code content
- ❌ Time outside VS Code
- ❌ Keystroke counting

### Data Model

```typescript
// src/models/activity.ts

interface DailyActivity {
  date: string;                    // YYYY-MM-DD
  totalMinutes: number;            // VS Code focused time
  languageBreakdown: {             // Minutes per language
    [language: string]: number;
  };
  filesEdited: number;             // Count of unique files saved
  focusSessions: number;           // From FocusService
  focusMinutes: number;            // From FocusService
}

interface ActivityStats {
  currentStreak: number;           // Days with 1+ focus session
  longestStreak: number;
  totalFocusMinutes: number;
  totalSessions: number;
  todayGoalProgress: number;       // 0-100%
  weeklyData: DailyActivity[];     // Last 7 days
}

interface ActivityConfig {
  dailyGoalMinutes: number;        // Default: 360 (6 hours)
  trackLanguages: boolean;         // Default: true
  showInStatusBar: boolean;        // Default: true
}
```

### Implementation

```typescript
// src/services/activity.ts

class ActivityService implements vscode.Disposable {
  private currentDay: DailyActivity;
  private lastActiveTime: Date | null = null;
  private checkInterval: ReturnType<typeof setInterval>;
  
  constructor(context: vscode.ExtensionContext) {
    // Check activity every 30 seconds
    this.checkInterval = setInterval(() => this.recordActivity(), 30000);
    
    // Listen for editor changes
    vscode.window.onDidChangeActiveTextEditor(() => this.onEditorChange());
    vscode.workspace.onDidSaveTextDocument(() => this.onFileSave());
    vscode.window.onDidChangeWindowState((e) => this.onFocusChange(e.focused));
  }
  
  private recordActivity(): void {
    if (!vscode.window.state.focused) return;
    // Add 30 seconds to today's total
  }
  
  getToday(): DailyActivity;
  getWeekly(): DailyActivity[];
  getStats(): ActivityStats;
}
```

### UI: Status Bar Addition

```
Current:  [🤖 25:00 🔥3] [📋 5]
                          └── TODOs due
Proposed: [🤖 25:00 🔥3] [⏱️ 2h15m] [📋 5]
                          └── Today's coding time
```

**Click Action:** Opens Activity Dashboard (webview)

### UI: Activity Dashboard (Webview)

Simple, clean dashboard accessible via:
- Click status bar time
- Command: `Cmdify: Show Activity Dashboard`
- Companion menu → "View Stats"

```
┌──────────────────────────────────────────────────┐
│ 📊 Today's Activity                      [Close] │
├──────────────────────────────────────────────────┤
│                                                  │
│  VS Code Active: 4h 32m                         │
│  ████████████████░░░░  (Goal: 6h)               │
│                                                  │
│  Focus Sessions: 4 of 6  🍅🍅🍅🍅⚪⚪            │
│                                                  │
│  ───────────────────────────────────────────    │
│                                                  │
│  Languages Today:                                │
│  TypeScript  ██████████  2h 15m                 │
│  Python      █████       1h 02m                 │
│  JSON        ███         45m                    │
│                                                  │
│  ───────────────────────────────────────────    │
│                                                  │
│  This Week:                                      │
│  Mon ████  Tue ██████  Wed ████████             │
│  Thu ██    Fri ████    Sat ░░  Sun ░░           │
│                                                  │
│  🔥 Current Streak: 12 days                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Settings

```json
{
  "cmdify.activity.enabled": true,
  "cmdify.activity.dailyGoalMinutes": 360,
  "cmdify.activity.showInStatusBar": true,
  "cmdify.activity.trackLanguages": true
}
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/models/activity.ts` | Create |
| `src/services/activity.ts` | Create |
| `src/views/activityPanel.ts` | Create |
| `src/extension.ts` | Modify - add service |
| `package.json` | Add settings, command |

---

## Feature 2: Companion Evolution 2.0

### Why This Fits
- Builds on existing companion system
- Increases engagement and retention
- Fun without being distracting
- Unique differentiator

### Current State
- Basic companion selection (cat, dog, robot, plant, flame)
- Mood changes based on focus status
- No progression or unlocks

### Proposed Enhancements

#### 2.1 Experience & Leveling System

```typescript
// src/models/companion.ts - Enhanced

interface CompanionState {
  type: CompanionType;
  level: number;                    // 1-50
  experience: number;               // XP towards next level
  mood: CompanionMood;
  
  // New fields
  unlockedCompanions: CompanionType[];
  unlockedAccessories: AccessoryId[];
  equippedAccessory?: AccessoryId;
  totalXP: number;                  // Lifetime XP
  joinedDate: string;               // When user started using companion
}

// XP Rewards
const XP_REWARDS = {
  focusSessionComplete: 100,
  breakTaken: 25,
  todoComplete: 50,
  dailyGoalReached: 200,
  streakDay: 50,
  streakWeek: 500,
  streakMonth: 2000,
};

// Level thresholds (exponential curve)
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
// Level 1: 100 XP, Level 10: 3844 XP, Level 20: 221,808 XP
```

#### 2.2 Companion Unlocks

| Companion | How to Unlock |
|-----------|--------------|
| 🤖 Robot | Default |
| 🐱 Cat | 10 focus sessions |
| 🐕 Dog | 25 focus sessions |
| 🌱 Plant | 7-day streak |
| 🔥 Flame | 30-day streak |
| 🦊 Fox | Complete 50 TODOs |
| 🦉 Owl | Use extension after midnight 5 times |
| 🐼 Panda | 100-day streak (legendary) |
| ⭐ Star | Reach level 25 |

#### 2.3 Accessories (Cosmetic)

```typescript
interface Accessory {
  id: AccessoryId;
  name: string;
  category: 'hat' | 'glasses' | 'background';
  unlockedBy: UnlockCondition;
}

const ACCESSORIES: Accessory[] = [
  { id: 'party_hat', name: 'Party Hat', category: 'hat', unlockedBy: { type: 'level', value: 5 } },
  { id: 'crown', name: 'Crown', category: 'hat', unlockedBy: { type: 'streak', value: 30 } },
  { id: 'sunglasses', name: 'Sunglasses', category: 'glasses', unlockedBy: { type: 'sessions', value: 50 } },
  { id: 'nerd_glasses', name: 'Nerd Glasses', category: 'glasses', unlockedBy: { type: 'todos', value: 100 } },
  { id: 'confetti', name: 'Confetti', category: 'background', unlockedBy: { type: 'level', value: 10 } },
];
```

#### 2.4 Enhanced Companion Panel

Update the existing webview:

```
┌─────────────────────────────────────┐
│ 🤖 Sparky                   Level 7 │
│ ████████████░░░░  428/650 XP        │
├─────────────────────────────────────┤
│                                     │
│         [Companion Display]         │
│         (with accessory)            │
│                                     │
├─────────────────────────────────────┤
│          ⏱️ 25:00                   │
│   [▶ Start]  [⏸️ Pause]  [⏭️ Skip] │
├─────────────────────────────────────┤
│ 🔥 12 day streak                    │
│ ✅ 4/6 sessions today               │
├─────────────────────────────────────┤
│ [📊 Stats] [🏆 Achievements] [🎨]   │
└─────────────────────────────────────┘
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/models/companion.ts` | Enhance with XP/level system |
| `src/services/companion.ts` | Add XP earning, level up logic |
| `src/views/companionPanel.ts` | Update UI |
| `media/companions/` | Add new companion sprites |

---

## Feature 3: Achievement System

### Why This Fits
- Natural extension of companion system
- Increases long-term engagement
- Provides goals and milestones
- Uses existing data sources

### Implementation

```typescript
// src/models/achievement.ts

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'focus' | 'todos' | 'commands' | 'streaks' | 'special';
  condition: AchievementCondition;
  xpReward: number;
  secret?: boolean;              // Hidden until unlocked
}

interface AchievementCondition {
  type: 'sessions' | 'streak' | 'todos' | 'commands' | 'level' | 'time' | 'special';
  value: number;
  comparison?: '>=' | '==' | '>';
}

interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
  notified: boolean;
}
```

### Achievement List

```typescript
const ACHIEVEMENTS: Achievement[] = [
  // Focus Category
  { id: 'first_focus', name: 'First Focus', description: 'Complete your first focus session', icon: '🎯', category: 'focus', condition: { type: 'sessions', value: 1 }, xpReward: 50 },
  { id: 'focus_10', name: 'Getting Focused', description: 'Complete 10 focus sessions', icon: '🍅', category: 'focus', condition: { type: 'sessions', value: 10 }, xpReward: 100 },
  { id: 'focus_50', name: 'Focus Master', description: 'Complete 50 focus sessions', icon: '🧘', category: 'focus', condition: { type: 'sessions', value: 50 }, xpReward: 300 },
  { id: 'focus_100', name: 'Centurion', description: 'Complete 100 focus sessions', icon: '💯', category: 'focus', condition: { type: 'sessions', value: 100 }, xpReward: 500 },
  
  // Streak Category
  { id: 'streak_3', name: 'Getting Started', description: '3-day streak', icon: '🌱', category: 'streaks', condition: { type: 'streak', value: 3 }, xpReward: 75 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', category: 'streaks', condition: { type: 'streak', value: 7 }, xpReward: 150 },
  { id: 'streak_30', name: 'Monthly Master', description: '30-day streak', icon: '⚡', category: 'streaks', condition: { type: 'streak', value: 30 }, xpReward: 500 },
  { id: 'streak_100', name: 'Legendary', description: '100-day streak', icon: '👑', category: 'streaks', condition: { type: 'streak', value: 100 }, xpReward: 2000 },
  
  // TODO Category
  { id: 'todo_1', name: 'Task Tamer', description: 'Complete your first TODO', icon: '✓', category: 'todos', condition: { type: 'todos', value: 1 }, xpReward: 25 },
  { id: 'todo_25', name: 'Task Tackler', description: 'Complete 25 TODOs', icon: '📋', category: 'todos', condition: { type: 'todos', value: 25 }, xpReward: 150 },
  { id: 'todo_100', name: 'TODO Terminator', description: 'Complete 100 TODOs', icon: '🏆', category: 'todos', condition: { type: 'todos', value: 100 }, xpReward: 500 },
  
  // Command Category
  { id: 'cmd_1', name: 'Command Creator', description: 'Create your first command', icon: '⌨️', category: 'commands', condition: { type: 'commands', value: 1 }, xpReward: 25 },
  { id: 'cmd_10', name: 'Command Collector', description: 'Save 10 commands', icon: '📚', category: 'commands', condition: { type: 'commands', value: 10 }, xpReward: 100 },
  { id: 'cmd_ai', name: 'AI Whisperer', description: 'Generate 10 commands with AI', icon: '🤖', category: 'commands', condition: { type: 'special', value: 10 }, xpReward: 200 },
  
  // Special (Secret)
  { id: 'night_owl', name: 'Night Owl', description: 'Code after midnight', icon: '🦉', category: 'special', condition: { type: 'special', value: 1 }, xpReward: 100, secret: true },
  { id: 'early_bird', name: 'Early Bird', description: 'Start coding before 6 AM', icon: '🐦', category: 'special', condition: { type: 'special', value: 1 }, xpReward: 100, secret: true },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Complete focus sessions on both weekend days', icon: '🎮', category: 'special', condition: { type: 'special', value: 1 }, xpReward: 150, secret: true },
];
```

### Achievement UI

Via Command Palette or Companion Panel:

```
┌─────────────────────────────────────────────────┐
│ 🏆 Achievements                    12/24 Earned │
├─────────────────────────────────────────────────┤
│                                                 │
│ FOCUS                                           │
│ ✅ 🎯 First Focus        - Complete 1 session  │
│ ✅ 🍅 Getting Focused    - Complete 10 sessions│
│ 🔒 🧘 Focus Master       - Complete 50 sessions│
│ 🔒 💯 Centurion          - Complete 100        │
│                                                 │
│ STREAKS                                         │
│ ✅ 🌱 Getting Started    - 3-day streak        │
│ ✅ 🔥 Week Warrior       - 7-day streak        │
│ 🔒 ⚡ Monthly Master     - 30-day streak       │
│                                                 │
│ SPECIAL                                         │
│ ✅ 🦉 Night Owl          - ???                 │
│ 🔒 ❓ ???                - ???                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Notification on Unlock

```typescript
// Non-intrusive toast notification
vscode.window.showInformationMessage(
  `🏆 Achievement Unlocked: ${achievement.name}! (+${achievement.xpReward} XP)`,
  'View Achievements'
);
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/models/achievement.ts` | Create |
| `src/services/achievement.ts` | Create |
| `src/views/achievementPanel.ts` | Create |
| `src/services/companion.ts` | Integrate XP rewards |
| `src/extension.ts` | Register service |

---

## Feature 4: Command Library UX Improvements

### Why This Fits
- Directly improves core functionality
- Low complexity
- High user impact

### Improvements

#### 4.1 Favorites

```typescript
// Add to CLICommand model
interface CLICommand {
  // ... existing fields
  isFavorite?: boolean;
}
```

#### 4.2 Improved Quick Pick UI

```
┌─────────────────────────────────────────────────┐
│ 🔍 Search commands...                           │
├─────────────────────────────────────────────────┤
│ ⭐ FAVORITES                                    │
│    ⚡ git checkout -b {{branch}}                │
│    ⚡ docker-compose up -d                      │
├─────────────────────────────────────────────────┤
│ 🕐 RECENT                                       │
│    ⚡ npm run build                             │
│    ⚡ kubectl get pods                          │
├─────────────────────────────────────────────────┤
│ 📁 ALL COMMANDS                                 │
│    git (12 commands)                            │
│    docker (8 commands)                          │
│    npm (15 commands)                            │
└─────────────────────────────────────────────────┘
```

#### 4.3 Fuzzy Search Enhancement

- Use VS Code's built-in fuzzy matcher
- Search in command text AND prompt

#### 4.4 Duplicate Detection

```typescript
// When creating new command
function checkDuplicate(newCommand: string): CLICommand | undefined {
  // Check for exact matches
  // Check for similar commands (Levenshtein distance)
  // Warn user if duplicate found
}
```

### Files to Modify

| File | Action |
|------|--------|
| `src/models/command.ts` | Add isFavorite |
| `src/commands/create.ts` | Add duplicate check |
| `src/commands/run.ts` | Improve quick pick |
| `src/views/treeProvider.ts` | Add favorites section |

---

## Feature 5: Onboarding Flow

### Why This Fits
- Improves first-run experience
- Increases user activation
- One-time implementation

### Flow

**Trigger:** First activation of extension

#### Step 1: Welcome

```
┌─────────────────────────────────────────────────┐
│ 👋 Welcome to Cmdify!                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Your AI-powered productivity companion for      │
│ VS Code.                                        │
│                                                 │
│ ✨ Generate CLI commands with AI                │
│ 🍅 Stay focused with Pomodoro timer            │
│ 📋 Track TODOs in your codebase                │
│                                                 │
│              [Get Started →]                    │
└─────────────────────────────────────────────────┘
```

#### Step 2: Choose Companion

```
┌─────────────────────────────────────────────────┐
│ 🎨 Choose Your Companion                        │
├─────────────────────────────────────────────────┤
│                                                 │
│   🤖        🐱        🐕        🌱        🔥    │
│  Robot     Cat*      Dog*     Plant*    Flame* │
│   [●]      [○]       [○]       [○]       [○]   │
│                                                 │
│   * Unlock these by using Cmdify!              │
│                                                 │
│              [Continue →]                       │
└─────────────────────────────────────────────────┘
```

#### Step 3: AI Setup (Optional)

```
┌─────────────────────────────────────────────────┐
│ 🤖 Set Up AI Command Generation (Optional)     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Describe what you want, get the command.       │
│                                                 │
│ Providers:                                      │
│ ○ OpenAI (GPT-4)                               │
│ ○ Anthropic (Claude)                           │
│ ○ Ollama (Local, free)                         │
│                                                 │
│   [Configure Now]    [Skip for Later]          │
└─────────────────────────────────────────────────┘
```

#### Step 4: Quick Tips

```
┌─────────────────────────────────────────────────┐
│ ✅ You're all set!                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Quick tips:                                     │
│                                                 │
│ ⌨️  Cmd+Shift+C → Create/run commands          │
│ 🤖 Click companion → Start focus session       │
│ 📋 TODOs are scanned automatically             │
│                                                 │
│              [Start Coding! 🚀]                 │
└─────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/services/onboarding.ts

class OnboardingService {
  private readonly ONBOARDING_KEY = 'cmdify.onboarding.completed';
  
  async checkAndShowOnboarding(): Promise<void> {
    const completed = this.context.globalState.get<boolean>(this.ONBOARDING_KEY);
    if (!completed) {
      await this.showOnboardingWalkthrough();
    }
  }
  
  private async showOnboardingWalkthrough(): Promise<void> {
    // Use VS Code's walkthrough API or custom webview
  }
}
```

### Files to Create

| File | Action |
|------|--------|
| `src/services/onboarding.ts` | Create |
| `src/views/onboardingPanel.ts` | Create (webview) |
| `package.json` | Add walkthrough contribution |

---

## Feature 6: Enhanced Sync (P3 - Lower Priority)

### Why This Fits
- Improves existing feature
- Users have requested conflict handling

### Minimal Implementation

#### Conflict Detection

```typescript
interface SyncConflict {
  commandId: string;
  local: CLICommand;
  remote: CLICommand;
  type: 'modified' | 'deleted_local' | 'deleted_remote';
}

async function detectConflicts(local: CLICommand[], remote: CLICommand[]): Promise<SyncConflict[]>;
```

#### Simple Resolution UI

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Sync Conflict                                │
├─────────────────────────────────────────────────┤
│ Command "deploy-prod" differs:                  │
│                                                 │
│ Local:  ./deploy.sh --env=production           │
│ Remote: ./deploy.sh --env=prod --verbose       │
│                                                 │
│ [Keep Local] [Keep Remote] [Keep Both]         │
└─────────────────────────────────────────────────┘
```

### Files to Modify

| File | Action |
|------|--------|
| `src/commands/sync.ts` | Add conflict detection |
| `src/models/command.ts` | Add sync metadata |

---

## 📅 Implementation Timeline

### Sprint 1 (Week 1-2): Foundation
| Task | Priority | Estimate |
|------|----------|----------|
| Activity Service (basic tracking) | P1 | 3 days |
| Activity model & storage | P1 | 1 day |
| Status bar integration | P1 | 1 day |
| Achievement model & data | P1 | 2 days |

### Sprint 2 (Week 3-4): Companion Evolution
| Task | Priority | Estimate |
|------|----------|----------|
| XP & Leveling system | P1 | 2 days |
| Companion unlock logic | P1 | 2 days |
| Accessory system | P1 | 2 days |
| Update companion panel UI | P1 | 2 days |
| New companion sprites | P1 | 2 days |

### Sprint 3 (Week 5-6): Achievements & Activity UI
| Task | Priority | Estimate |
|------|----------|----------|
| Achievement service | P1 | 2 days |
| Achievement checking logic | P1 | 2 days |
| Achievement panel UI | P1 | 2 days |
| Activity dashboard webview | P1 | 3 days |
| Integration & notifications | P1 | 1 day |

### Sprint 4 (Week 7-8): Polish & UX
| Task | Priority | Estimate |
|------|----------|----------|
| Command favorites | P2 | 1 day |
| Quick pick improvements | P2 | 2 days |
| Duplicate detection | P2 | 1 day |
| Onboarding flow | P2 | 3 days |
| Testing & bug fixes | P1 | 3 days |

### Sprint 5 (Week 9-10): Optional & Release
| Task | Priority | Estimate |
|------|----------|----------|
| Enhanced sync (if time) | P3 | 3 days |
| Documentation update | P1 | 2 days |
| Marketplace screenshots | P1 | 1 day |
| Release prep | P1 | 2 days |

---

## 🏗️ Technical Architecture

### Service Dependencies

```
┌─────────────────────────────────────────────────┐
│                  Extension                       │
│                     │                            │
│    ┌────────────────┼────────────────┐          │
│    ▼                ▼                ▼          │
│ ┌──────┐      ┌──────────┐     ┌──────────┐    │
│ │Focus │◄────►│ Activity │◄───►│Achievement│   │
│ │Service│      │ Service  │     │ Service  │    │
│ └──┬───┘      └────┬─────┘     └────┬─────┘    │
│    │               │                 │          │
│    └───────────────┼─────────────────┘          │
│                    ▼                            │
│            ┌─────────────┐                      │
│            │  Companion  │                      │
│            │   Service   │                      │
│            └─────────────┘                      │
│                    │                            │
│                    ▼                            │
│            ┌─────────────┐                      │
│            │ globalState │                      │
│            └─────────────┘                      │
└─────────────────────────────────────────────────┘
```

### Storage Keys

| Key | Data |
|-----|------|
| `cmdify.activity.daily` | Current day's activity |
| `cmdify.activity.history` | Last 30 days |
| `cmdify.companion.state` | Companion with XP/level |
| `cmdify.achievements.unlocked` | Unlocked achievements |
| `cmdify.onboarding.completed` | Onboarding status |

### Performance Considerations

| Operation | Budget | Implementation |
|-----------|--------|----------------|
| Activity tracking | < 5ms | Debounce, batch updates |
| Achievement check | < 10ms | On-demand, cached |
| Panel render | < 100ms | Lazy loading |
| Activation | < 50ms | Defer non-critical |

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Feature adoption | > 50% | Users with 1+ achievement |
| Engagement | > 60% | Daily active users |
| Retention | > 40% | 7-day retention |
| Rating | > 4.5 | Marketplace reviews |
| Streak length | > 7 days avg | Analytics |

---

## 📝 Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/models/activity.ts` | Activity data models |
| `src/models/achievement.ts` | Achievement definitions |
| `src/services/activity.ts` | Activity tracking |
| `src/services/achievement.ts` | Achievement logic |
| `src/services/onboarding.ts` | First-run flow |
| `src/views/activityPanel.ts` | Activity dashboard |
| `src/views/achievementPanel.ts` | Achievement display |
| `src/views/onboardingPanel.ts` | Onboarding webview |
| `media/companions/*.svg` | New companion sprites |

### Modified Files
| File | Changes |
|------|---------|
| `src/extension.ts` | Register new services |
| `src/models/companion.ts` | Add XP, level, unlocks |
| `src/models/command.ts` | Add isFavorite |
| `src/services/companion.ts` | XP earning, leveling |
| `src/views/companionPanel.ts` | Updated UI |
| `src/views/treeProvider.ts` | Favorites section |
| `src/commands/sync.ts` | Conflict handling (P3) |
| `package.json` | New settings, commands |
| `README.md` | Feature documentation |

---

## ✅ Definition of Done

A feature is complete when:

1. ✅ Code implemented and type-safe
2. ✅ Settings exposed in `package.json`
3. ✅ Commands registered if applicable
4. ✅ UI accessible and responsive
5. ✅ Data persists correctly across sessions
6. ✅ No console errors or warnings
7. ✅ README updated
8. ✅ Manual testing passed on macOS/Windows
9. ✅ Performance budget met

---

## 🚀 Release Notes Draft

### v2.0.0 - The Companion Update

**New Features:**
- 📊 **Activity Insights** - Track your coding time and language usage
- 🎮 **Companion Evolution** - Level up your companion and unlock new friends
- 🏆 **Achievements** - 24 achievements to unlock as you use Cmdify
- ⭐ **Favorites** - Mark your most-used commands
- 👋 **Onboarding** - Better first-run experience

**Improvements:**
- Improved command search with fuzzy matching
- Duplicate command detection
- Better sync conflict handling

---

*Last Updated: November 29, 2025*
