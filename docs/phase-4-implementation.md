# Cmdify Phase 4 - Enhancement Implementation Plan

> Polishing and enhancing existing features with high-impact, low-effort improvements.

**Document Version:** 1.0  
**Created:** November 29, 2025  
**Status:** Planning

---

## 📋 Executive Summary

Phase 4 focuses on **enhancing existing features** rather than adding new systems. These improvements create a more polished, engaging experience while maintaining the "easy to use" principle.

### Current State (After Phase 3)
| Feature | Status |
|---------|--------|
| AI Command Generation | ✅ Implemented |
| Command Library & Tags | ✅ Implemented |
| GitHub Sync (Gist) | ✅ Implemented |
| Focus Timer (Pomodoro) | ✅ Implemented |
| Companion Evolution (XP/Levels) | ✅ Implemented |
| Achievement System | ✅ Implemented |
| Activity Tracking | ✅ Implemented |
| TODO Scanner | ✅ Implemented |
| Reminder System | ✅ Implemented |
| Onboarding Flow | ✅ Implemented |

### Phase 4 Philosophy
| Principle | Application |
|-----------|-------------|
| **Integrate, don't isolate** | Connect existing features |
| **Small effort, big impact** | Quick wins that feel polished |
| **Delight users** | Small touches that make people smile |
| **No new services** | Enhance existing services only |

---

## 🔍 Enhancement Evaluation from Spec-4

### ✅ Selected Enhancements

| Enhancement | Category | Effort | Impact | Priority |
|-------------|----------|--------|--------|----------|
| Name Your Companion | Companion | Very Low | High 😊 | P1 |
| Companion Messages | Companion | Low | High 😊 | P1 |
| Companion Mood Emoji | Companion | Very Low | Medium | P1 |
| Achievement Progress Bars | Achievements | Low | High | P1 |
| "Almost There" Notifications | Achievements | Very Low | Medium | P1 |
| Break Suggestions | Focus Timer | Very Low | Medium | P1 |
| Session Types | Focus Timer | Low | High | P2 |
| Command Usage Stats | Commands | Very Low | Medium | P2 |
| Quick TODO from Selection | TODO Scanner | Very Low | Medium | P2 |
| Weekly Summary Notification | Activity | Very Low | Medium | P2 |
| Daily Challenges | Achievements | Medium | High | P2 |
| Command Templates | Commands | Low | High | P3 |
| Export My Data | Data | Very Low | Low | P3 |
| Reset Progress | Data | Very Low | Low | P3 |

### ❌ Deferred Enhancements

| Enhancement | Reason |
|-------------|--------|
| Seasonal Companions | Requires additional art assets |
| Focus History Calendar | Lower ROI, complex UI |
| Achievement Tiers | Adds complexity to existing system |
| Companion Memories | Nice-to-have, lower priority |
| Language Trends | Lower user demand |
| TODO Age Indicator | Requires git blame integration |

---

## 🎯 Phase 4 Features - Detailed Specification

---

## Sprint 1: Companion Personalization (Week 1)

### 1.1 Name Your Companion

**What:** Let users personalize their companion with a custom name.

**Why:** Creates emotional connection, zero implementation effort.

#### Data Model Update

```typescript
// src/models/companion.ts - Add to CompanionState

interface CompanionState {
  // ... existing fields
  name?: string;  // User-defined name (default: companion type name)
}
```

#### Implementation

```typescript
// src/services/companion.ts

/**
 * Set companion name
 */
async setCompanionName(name: string): Promise<void> {
  this.state.name = name.trim().substring(0, 20); // Max 20 chars
  await this.saveState();
}

/**
 * Get companion display name
 */
getCompanionName(): string {
  return this.state.name || COMPANION_NAMES[this.state.type];
}
```

#### UI Integration

```typescript
// Companion panel context menu or command
vscode.commands.registerCommand('cmdify.companion.rename', async () => {
  const currentName = companionService.getCompanionName();
  const newName = await vscode.window.showInputBox({
    prompt: 'Name your companion',
    value: currentName,
    placeHolder: 'Enter a name (max 20 characters)',
    validateInput: (value) => {
      if (value.length > 20) return 'Name must be 20 characters or less';
      return null;
    }
  });
  
  if (newName !== undefined) {
    await companionService.setCompanionName(newName);
    vscode.window.showInformationMessage(`Your companion is now named "${newName}"! 🎉`);
  }
});
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/models/companion.ts` | Add `name` to CompanionState |
| `src/services/companion.ts` | Add name methods |
| `src/views/companionPanel.ts` | Display name, add rename option |
| `package.json` | Add rename command |

---

### 1.2 Companion Messages (Contextual)

**What:** Companion shows contextual messages based on activity.

**Why:** Makes companion feel alive and reactive.

#### Message Categories

```typescript
// src/models/companion.ts

export const COMPANION_MESSAGES = {
  focusStart: [
    "Let's do this! 💪",
    "Focus mode activated!",
    "Time to get things done!",
    "You've got this! 🎯",
    "Let's crush it!"
  ],
  focusComplete: [
    "Great session! 🎉",
    "You crushed it!",
    "Well deserved break!",
    "Awesome work!",
    "That was productive!"
  ],
  breakStart: [
    "Take a breather! ☕",
    "Stretch time!",
    "Rest those eyes 👀",
    "You earned this break!",
    "Recharge mode! 🔋"
  ],
  streakMilestone: [
    "{name} is so proud of your {streak}-day streak! 🔥",
    "🔥 {streak} days! Keep it going!",
    "Wow! {streak} days strong! 💪"
  ],
  levelUp: [
    "🎉 Level up! {name} reached level {level}!",
    "Woohoo! Level {level} unlocked!",
    "{name} evolved to level {level}! ⭐"
  ],
  achievementUnlock: [
    "{name} helped you unlock {achievement}! 🏆",
    "Achievement unlocked: {achievement}! 🎊"
  ],
  idle: [
    "Ready when you are! 😊",
    "Waiting for you~",
    "Let's code something cool!",
    "💭"
  ],
  welcomeBack: [
    "Welcome back! Ready to code? 💻",
    "Missed you! Let's get started.",
    "{name} is happy to see you! 😊"
  ],
  todoComplete: [
    "One down! ✅",
    "Nice! Task complete!",
    "Checked off! 📋"
  ]
} as const;

/**
 * Get random message from category with variable replacement
 */
export function getCompanionMessage(
  category: keyof typeof COMPANION_MESSAGES,
  variables?: Record<string, string | number>
): string {
  const messages = COMPANION_MESSAGES[category];
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  if (!variables) return message;
  
  return message.replace(/\{(\w+)\}/g, (_, key) => 
    String(variables[key] ?? `{${key}}`)
  );
}
```

#### Display Implementation

```typescript
// src/services/companion.ts

private currentMessage: string = '';
private messageTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Show a contextual message
 */
showMessage(category: keyof typeof COMPANION_MESSAGES, variables?: Record<string, string | number>): void {
  const message = getCompanionMessage(category, {
    name: this.getCompanionName(),
    ...variables
  });
  
  this.currentMessage = message;
  this._onMessageChange.fire(message);
  
  // Clear message after 5 seconds
  if (this.messageTimeout) clearTimeout(this.messageTimeout);
  this.messageTimeout = setTimeout(() => {
    this.currentMessage = '';
    this._onMessageChange.fire('');
  }, 5000);
}

getCurrentMessage(): string {
  return this.currentMessage;
}
```

#### UI Display (Companion Panel)

```html
<!-- Add speech bubble above companion -->
<div class="message-bubble" id="messageBubble" style="display: none;">
  <span id="messageText"></span>
</div>

<style>
.message-bubble {
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 8px 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
```

#### Integration Points

```typescript
// src/extension.ts - Add message triggers

focusService.onStateChange((state) => {
  if (state.status === 'focusing') {
    companionService.showMessage('focusStart');
  }
});

focusService.onSessionComplete(() => {
  companionService.showMessage('focusComplete');
});

focusService.onBreakStart(() => {
  companionService.showMessage('breakStart');
});

companionService.onLevelUp((level) => {
  companionService.showMessage('levelUp', { level });
});

achievementService.onAchievementUnlocked((achievement) => {
  companionService.showMessage('achievementUnlock', { achievement: achievement.name });
});
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/models/companion.ts` | Add message constants and helper |
| `src/services/companion.ts` | Add message logic and events |
| `src/views/companionPanel.ts` | Add speech bubble UI |
| `src/extension.ts` | Wire up message triggers |

---

### 1.3 Companion Mood Emoji in Status Bar

**What:** Visual mood indicator in status bar.

**Current:** `[🤖 25:00 🔥3]`  
**Enhanced:** `[🤖😊 25:00 🔥3]` or `[🤖🎯 25:00 🔥3]`

#### Implementation

```typescript
// src/models/companion.ts

export type CompanionMoodEmoji = '😊' | '🎯' | '😫' | '🤩' | '😴' | '💤';

export const MOOD_EMOJIS: Record<CompanionMood, CompanionMoodEmoji> = {
  happy: '😊',
  focused: '🎯',
  tired: '😫',
  excited: '🤩',
  celebrating: '🤩',
  sleepy: '😴',
};

/**
 * Get mood based on current state
 */
export function determineMood(state: {
  focusStatus: FocusStatus;
  lastActivityMinutes: number;
  justCompletedSession: boolean;
  streakLost: boolean;
}): CompanionMood {
  if (state.justCompletedSession) return 'celebrating';
  if (state.streakLost) return 'tired';
  if (state.focusStatus === 'focusing') return 'focused';
  if (state.focusStatus === 'break') return 'happy';
  if (state.lastActivityMinutes > 120) return 'sleepy';
  return 'happy';
}
```

#### Status Bar Update

```typescript
// src/extension.ts - Update status bar rendering

function updateFocusStatusBar(): void {
  const state = focusService.getState();
  const companionState = companionService.getState();
  const moodEmoji = MOOD_EMOJIS[companionState.mood];
  const companionIcon = companionService.getCompanionIcon();
  
  if (state.status === 'idle') {
    focusStatusBar.text = `${companionIcon}${moodEmoji}`;
  } else {
    const time = formatTime(state.timeRemaining);
    const streak = focusService.getStats().currentStreak;
    focusStatusBar.text = `${companionIcon}${moodEmoji} ${time} 🔥${streak}`;
  }
}
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/models/companion.ts` | Add mood emoji constants |
| `src/extension.ts` | Update status bar format |

---

## Sprint 2: Achievement Enhancements (Week 2)

### 2.1 Achievement Progress Tracking

**What:** Show progress toward locked achievements.

**Current:**
```
🔒 Focus Master - Complete 50 sessions
```

**Enhanced:**
```
🔒 Focus Master - Complete 50 sessions (32/50)
████████░░░░░░░░ 64%
```

#### Data Model

```typescript
// src/models/achievement.ts

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percentage: number;
}
```

#### Implementation

```typescript
// src/services/achievement.ts

/**
 * Get progress for all trackable achievements
 */
getProgress(): AchievementProgress[] {
  const stats = this.getStats();
  const progress: AchievementProgress[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    if (this.isUnlocked(achievement.id)) continue;
    if (achievement.secret) continue;
    
    const current = this.getCurrentValueForCondition(achievement.condition);
    const target = achievement.condition.value;
    
    progress.push({
      achievementId: achievement.id,
      current,
      target,
      percentage: Math.min(100, Math.round((current / target) * 100))
    });
  }
  
  return progress.sort((a, b) => b.percentage - a.percentage);
}

private getCurrentValueForCondition(condition: AchievementCondition): number {
  switch (condition.type) {
    case 'sessions':
      return this.activityService.getStats().totalSessions;
    case 'streak':
      return this.activityService.getStats().currentStreak;
    case 'todos':
      return this.data.todosCompleted;
    case 'commands':
      return this.commandCount;
    case 'level':
      return this.companionService.getState().level;
    default:
      return 0;
  }
}
```

#### UI Update (Achievement Panel)

```typescript
// Update achievement card rendering
function renderAchievementCard(achievement: Achievement, progress?: AchievementProgress): string {
  const isUnlocked = unlockedMap.has(achievement.id);
  
  if (isUnlocked) {
    return `
      <div class="achievement unlocked">
        <span class="icon">${achievement.icon}</span>
        <div class="info">
          <div class="name">${achievement.name}</div>
          <div class="description">${achievement.description}</div>
        </div>
        <span class="status">✅</span>
      </div>
    `;
  }
  
  const progressBar = progress ? `
    <div class="progress-container">
      <div class="progress-bar" style="width: ${progress.percentage}%"></div>
    </div>
    <div class="progress-text">${progress.current}/${progress.target} (${progress.percentage}%)</div>
  ` : '';
  
  return `
    <div class="achievement locked">
      <span class="icon">🔒</span>
      <div class="info">
        <div class="name">${achievement.name}</div>
        <div class="description">${achievement.description}</div>
        ${progressBar}
      </div>
    </div>
  `;
}
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/models/achievement.ts` | Add AchievementProgress interface |
| `src/services/achievement.ts` | Add getProgress method |
| `src/views/achievementPanel.ts` | Update UI with progress bars |

---

### 2.2 "Almost There" Notifications

**What:** Notify when user is close (90%+) to an achievement.

#### Implementation

```typescript
// src/services/achievement.ts

private notifiedNearCompletion: Set<string> = new Set();

/**
 * Check for near-completion achievements and notify
 */
async checkNearCompletionNotifications(): Promise<void> {
  const config = vscode.workspace.getConfiguration('cmdify.achievements');
  if (!config.get<boolean>('notifyNearCompletion', true)) return;
  
  const progress = this.getProgress();
  
  for (const p of progress) {
    if (p.percentage >= 90 && !this.notifiedNearCompletion.has(p.achievementId)) {
      const achievement = getAchievementById(p.achievementId);
      if (!achievement) continue;
      
      this.notifiedNearCompletion.add(p.achievementId);
      
      const action = await vscode.window.showInformationMessage(
        `🏆 Almost there! "${achievement.name}" - ${p.current}/${p.target}`,
        'View Achievements'
      );
      
      if (action === 'View Achievements') {
        vscode.commands.executeCommand('cmdify.achievements.show');
      }
    }
  }
}
```

#### Settings

```json
{
  "cmdify.achievements.notifyNearCompletion": {
    "type": "boolean",
    "default": true,
    "description": "Show notification when you're close to unlocking an achievement"
  }
}
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/services/achievement.ts` | Add notification logic |
| `package.json` | Add setting |

---

### 2.3 Daily Challenges

**What:** Optional rotating daily mini-goals for extra XP.

#### Data Model

```typescript
// src/models/achievement.ts

export interface DailyChallenge {
  id: string;
  description: string;
  condition: {
    type: 'focus_sessions' | 'todos' | 'coding_time' | 'no_skip_break';
    value: number;
  };
  xpReward: number;
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: 'focus_3', description: 'Complete 3 focus sessions today', condition: { type: 'focus_sessions', value: 3 }, xpReward: 75 },
  { id: 'focus_5', description: 'Complete 5 focus sessions today', condition: { type: 'focus_sessions', value: 5 }, xpReward: 100 },
  { id: 'todo_5', description: 'Complete 5 TODOs today', condition: { type: 'todos', value: 5 }, xpReward: 75 },
  { id: 'todo_10', description: 'Complete 10 TODOs today', condition: { type: 'todos', value: 10 }, xpReward: 100 },
  { id: 'code_2h', description: 'Code for 2+ hours today', condition: { type: 'coding_time', value: 120 }, xpReward: 75 },
  { id: 'code_4h', description: 'Code for 4+ hours today', condition: { type: 'coding_time', value: 240 }, xpReward: 100 },
  { id: 'no_skip', description: "Don't skip any breaks today", condition: { type: 'no_skip_break', value: 1 }, xpReward: 50 },
];

/**
 * Get today's challenge based on date seed
 */
export function getTodayChallenge(): DailyChallenge {
  const seed = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[index];
}
```

#### Service Implementation

```typescript
// src/services/achievement.ts

interface DailyChallengeState {
  date: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  skippedBreaks: number;
}

private dailyChallengeState: DailyChallengeState | null = null;

/**
 * Get current daily challenge with progress
 */
getDailyChallenge(): { challenge: DailyChallenge; progress: number; completed: boolean } | null {
  const config = vscode.workspace.getConfiguration('cmdify.achievements');
  if (!config.get<boolean>('dailyChallenges', true)) return null;
  
  const today = getTodayString();
  const challenge = getTodayChallenge();
  
  // Reset if new day
  if (!this.dailyChallengeState || this.dailyChallengeState.date !== today) {
    this.dailyChallengeState = {
      date: today,
      challengeId: challenge.id,
      progress: 0,
      completed: false,
      skippedBreaks: 0
    };
  }
  
  return {
    challenge,
    progress: this.dailyChallengeState.progress,
    completed: this.dailyChallengeState.completed
  };
}

/**
 * Update daily challenge progress
 */
async updateDailyChallengeProgress(type: string, value: number): Promise<void> {
  const challengeInfo = this.getDailyChallenge();
  if (!challengeInfo || challengeInfo.completed) return;
  
  const { challenge } = challengeInfo;
  if (challenge.condition.type !== type) return;
  
  this.dailyChallengeState!.progress = value;
  
  if (value >= challenge.condition.value) {
    this.dailyChallengeState!.completed = true;
    await this.companionService.awardXP(challenge.xpReward, 'dailyChallenge');
    
    vscode.window.showInformationMessage(
      `🎯 Daily Challenge Complete! +${challenge.xpReward} XP`,
      'View Achievements'
    );
  }
}
```

#### UI (Companion Panel Addition)

```html
<div class="daily-challenge" id="dailyChallenge">
  <div class="challenge-header">🎯 Today's Challenge</div>
  <div class="challenge-description" id="challengeDesc">Complete 3 focus sessions</div>
  <div class="challenge-progress">
    <div class="progress-bar" id="challengeProgress" style="width: 33%"></div>
  </div>
  <div class="challenge-reward">Reward: +75 XP</div>
</div>
```

#### Settings

```json
{
  "cmdify.achievements.dailyChallenges": {
    "type": "boolean",
    "default": true,
    "description": "Enable daily challenges for bonus XP"
  }
}
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/models/achievement.ts` | Add DailyChallenge types |
| `src/services/achievement.ts` | Add challenge logic |
| `src/views/companionPanel.ts` | Add challenge display |
| `package.json` | Add settings |

---

## Sprint 3: Focus Timer Enhancements (Week 3)

### 3.1 Break Suggestions

**What:** Contextual break activity suggestions when break starts.

#### Implementation

```typescript
// src/models/focus.ts

export const BREAK_SUGGESTIONS: Record<number, string[]> = {
  5: [
    '🙆 Stretch your arms and shoulders',
    '👀 Look at something 20 feet away for 20 seconds',
    '💧 Drink some water',
    '🚶 Stand up and walk around',
    '🧘 Take 5 deep breaths'
  ],
  10: [
    '🚶 Take a short walk',
    '🙆 Do some stretches',
    '🍎 Grab a healthy snack',
    '☕ Make a cup of tea or coffee',
    '🌿 Step outside for fresh air'
  ],
  15: [
    '🚶 Go outside briefly',
    '💪 Do a quick workout',
    '🧘 Practice meditation',
    '📱 Call a friend or family',
    '🎵 Listen to your favorite song'
  ]
};

export function getBreakSuggestion(breakMinutes: number): string {
  const suggestions = BREAK_SUGGESTIONS[breakMinutes] || BREAK_SUGGESTIONS[5];
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}
```

#### Integration

```typescript
// src/services/focus.ts or extension.ts

focusService.onBreakStart(() => {
  const config = focusService.getConfig();
  const breakDuration = config.shortBreakDuration;
  const suggestion = getBreakSuggestion(breakDuration);
  
  vscode.window.showInformationMessage(
    `☕ Break time! (${breakDuration} min)\n${suggestion}`,
    'Skip Break',
    'Start Break'
  ).then(action => {
    if (action === 'Skip Break') {
      focusService.skipBreak();
    }
  });
});
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/models/focus.ts` | Add break suggestions |
| `src/extension.ts` | Integrate with break notification |

---

### 3.2 Session Types

**What:** Predefined session configurations for different work types.

#### Data Model

```typescript
// src/models/focus.ts

export interface SessionType {
  id: string;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  icon: string;
  description: string;
}

export const SESSION_TYPES: SessionType[] = [
  { 
    id: 'standard', 
    name: 'Standard', 
    focusMinutes: 25, 
    breakMinutes: 5, 
    icon: '🍅',
    description: 'Classic Pomodoro technique'
  },
  { 
    id: 'deep', 
    name: 'Deep Work', 
    focusMinutes: 50, 
    breakMinutes: 10, 
    icon: '🧠',
    description: 'For complex tasks requiring concentration'
  },
  { 
    id: 'quick', 
    name: 'Quick Task', 
    focusMinutes: 15, 
    breakMinutes: 3, 
    icon: '⚡',
    description: 'Short bursts for simple tasks'
  },
  { 
    id: 'marathon', 
    name: 'Marathon', 
    focusMinutes: 90, 
    breakMinutes: 15, 
    icon: '🏃',
    description: 'Extended focus for deep work'
  },
];
```

#### Implementation

```typescript
// src/commands/focus.ts or extension.ts

vscode.commands.registerCommand('cmdify.focus.start', async () => {
  const config = vscode.workspace.getConfiguration('cmdify.focus');
  const showSessionPicker = config.get<boolean>('showSessionTypePicker', true);
  
  if (showSessionPicker) {
    const items = SESSION_TYPES.map(type => ({
      label: `${type.icon} ${type.name}`,
      description: `${type.focusMinutes}/${type.breakMinutes} min`,
      detail: type.description,
      sessionType: type
    }));
    
    items.push({
      label: '⚙️ Custom',
      description: 'Use settings values',
      detail: `${config.get('focusDuration')}/${config.get('shortBreakDuration')} min`,
      sessionType: null
    });
    
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select session type',
      title: 'Start Focus Session'
    });
    
    if (!selected) return;
    
    if (selected.sessionType) {
      await focusService.startWithConfig({
        focusDuration: selected.sessionType.focusMinutes,
        shortBreakDuration: selected.sessionType.breakMinutes
      });
    } else {
      await focusService.start();
    }
  } else {
    await focusService.start();
  }
});
```

#### Service Update

```typescript
// src/services/focus.ts

/**
 * Start session with custom config
 */
async startWithConfig(customConfig: Partial<FocusConfig>): Promise<void> {
  this.currentSessionConfig = { ...this.config, ...customConfig };
  // Use currentSessionConfig for this session
  await this.start();
}
```

#### Settings

```json
{
  "cmdify.focus.showSessionTypePicker": {
    "type": "boolean",
    "default": true,
    "description": "Show session type picker when starting focus"
  }
}
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/models/focus.ts` | Add SessionType interface and data |
| `src/services/focus.ts` | Add startWithConfig method |
| `src/extension.ts` | Update start command |
| `package.json` | Add settings |

---

## Sprint 4: Command Library Enhancements (Week 4)

### 4.1 Command Usage Stats

**What:** Track and display which commands are used most.

#### Data Model Update

```typescript
// Already exists in CLICommand:
// usageCount: number;
// lastUsedAt?: string;
```

#### UI Enhancement (Tree View)

```typescript
// src/views/treeProvider.ts

/**
 * Add "Most Used" section to tree
 */
private getMostUsedCommands(): CLICommand[] {
  return this.storage.getAll()
    .filter(cmd => cmd.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);
}

getChildren(element?: CommandTreeItem): CommandTreeItem[] {
  if (!element) {
    // Root level
    const sections: CommandTreeItem[] = [];
    
    // Favorites
    const favorites = this.getFavorites();
    if (favorites.length > 0) {
      sections.push(new CommandTreeItem('⭐ Favorites', 'section', favorites));
    }
    
    // Most Used (NEW)
    const mostUsed = this.getMostUsedCommands();
    if (mostUsed.length > 0) {
      sections.push(new CommandTreeItem('📊 Most Used', 'section', mostUsed));
    }
    
    // All commands...
    return sections;
  }
  // ...
}
```

#### Display Format

```
📊 MOST USED
   ⚡ git status           (used 47 times)
   ⚡ npm run dev          (used 32 times)
   ⚡ docker ps            (used 28 times)
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/views/treeProvider.ts` | Add most used section |

---

### 4.2 Quick TODO from Selection

**What:** Select code → Right-click → "Add TODO here"

#### Implementation

```typescript
// src/extension.ts

vscode.commands.registerTextEditorCommand('cmdify.addTodoFromSelection', async (editor) => {
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  const todoText = await vscode.window.showInputBox({
    prompt: 'TODO description',
    placeHolder: 'What needs to be done?',
    value: selectedText ? `Review: ${selectedText.substring(0, 50)}` : ''
  });
  
  if (!todoText) return;
  
  const position = selection.start;
  const line = editor.document.lineAt(position.line);
  const indent = line.text.match(/^\s*/)?.[0] || '';
  
  // Detect comment style based on language
  const commentPrefix = getCommentPrefix(editor.document.languageId);
  const todoComment = `${indent}${commentPrefix} TODO: ${todoText}\n`;
  
  await editor.edit(edit => {
    edit.insert(new vscode.Position(position.line, 0), todoComment);
  });
  
  // Trigger TODO rescan
  vscode.commands.executeCommand('cmdify.todos.refresh');
});

function getCommentPrefix(languageId: string): string {
  const blockComments = ['html', 'xml', 'css'];
  const hashComments = ['python', 'ruby', 'shell', 'yaml', 'dockerfile'];
  
  if (blockComments.includes(languageId)) return '<!--';
  if (hashComments.includes(languageId)) return '#';
  return '//';
}
```

#### Context Menu Registration

```json
// package.json
{
  "menus": {
    "editor/context": [
      {
        "command": "cmdify.addTodoFromSelection",
        "group": "cmdify",
        "when": "editorTextFocus"
      }
    ]
  }
}
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/extension.ts` | Add command |
| `package.json` | Add command and context menu |

---

### 4.3 Command Templates (Import Packs)

**What:** Pre-built command packs for common workflows.

#### Data Model

```typescript
// src/models/command.ts

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  commands: Omit<CLICommand, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[];
}

export const COMMAND_TEMPLATES: CommandTemplate[] = [
  {
    id: 'git-basics',
    name: 'Git Basics',
    description: 'Essential Git commands',
    icon: '📦',
    commands: [
      { prompt: 'Git status', command: 'git status', tags: ['git'], source: 'imported' },
      { prompt: 'Git pull', command: 'git pull', tags: ['git'], source: 'imported' },
      { prompt: 'Git push', command: 'git push', tags: ['git'], source: 'imported' },
      { prompt: 'Git log (oneline)', command: 'git log --oneline -20', tags: ['git'], source: 'imported' },
      { prompt: 'Git diff', command: 'git diff', tags: ['git'], source: 'imported' },
      { prompt: 'Git stash', command: 'git stash', tags: ['git'], source: 'imported' },
      { prompt: 'Git stash pop', command: 'git stash pop', tags: ['git'], source: 'imported' },
    ]
  },
  {
    id: 'docker-basics',
    name: 'Docker Basics',
    description: 'Common Docker commands',
    icon: '🐳',
    commands: [
      { prompt: 'List containers', command: 'docker ps', tags: ['docker'], source: 'imported' },
      { prompt: 'List all containers', command: 'docker ps -a', tags: ['docker'], source: 'imported' },
      { prompt: 'List images', command: 'docker images', tags: ['docker'], source: 'imported' },
      { prompt: 'Stop all containers', command: 'docker stop $(docker ps -q)', tags: ['docker'], source: 'imported' },
      { prompt: 'Remove all stopped containers', command: 'docker container prune -f', tags: ['docker'], source: 'imported' },
      { prompt: 'Docker compose up', command: 'docker-compose up -d', tags: ['docker'], source: 'imported' },
      { prompt: 'Docker compose down', command: 'docker-compose down', tags: ['docker'], source: 'imported' },
    ]
  },
  {
    id: 'npm-scripts',
    name: 'npm Scripts',
    description: 'Common npm commands',
    icon: '📦',
    commands: [
      { prompt: 'Install dependencies', command: 'npm install', tags: ['npm'], source: 'imported' },
      { prompt: 'Run dev server', command: 'npm run dev', tags: ['npm'], source: 'imported' },
      { prompt: 'Run build', command: 'npm run build', tags: ['npm'], source: 'imported' },
      { prompt: 'Run tests', command: 'npm test', tags: ['npm'], source: 'imported' },
      { prompt: 'Run linter', command: 'npm run lint', tags: ['npm'], source: 'imported' },
      { prompt: 'Update packages', command: 'npm update', tags: ['npm'], source: 'imported' },
    ]
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'kubectl essentials',
    icon: '☸️',
    commands: [
      { prompt: 'Get pods', command: 'kubectl get pods', tags: ['k8s'], source: 'imported' },
      { prompt: 'Get services', command: 'kubectl get services', tags: ['k8s'], source: 'imported' },
      { prompt: 'Get deployments', command: 'kubectl get deployments', tags: ['k8s'], source: 'imported' },
      { prompt: 'Describe pod', command: 'kubectl describe pod {{pod_name}}', tags: ['k8s'], source: 'imported' },
      { prompt: 'Pod logs', command: 'kubectl logs {{pod_name}}', tags: ['k8s'], source: 'imported' },
      { prompt: 'Exec into pod', command: 'kubectl exec -it {{pod_name}} -- /bin/sh', tags: ['k8s'], source: 'imported' },
    ]
  }
];
```

#### Implementation

```typescript
// src/commands/import.ts or extension.ts

vscode.commands.registerCommand('cmdify.importTemplates', async () => {
  const items = COMMAND_TEMPLATES.map(template => ({
    label: `${template.icon} ${template.name}`,
    description: `${template.commands.length} commands`,
    detail: template.description,
    template
  }));
  
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select command pack to import',
    canPickMany: true,
    title: '📦 Import Command Pack'
  });
  
  if (!selected || selected.length === 0) return;
  
  let importedCount = 0;
  
  for (const item of selected) {
    for (const cmdTemplate of item.template.commands) {
      const command: CLICommand = {
        ...cmdTemplate,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      };
      
      // Check for duplicates
      const existing = storage.getAll().find(c => c.command === command.command);
      if (!existing) {
        await storage.add(command);
        importedCount++;
      }
    }
  }
  
  vscode.window.showInformationMessage(
    `✅ Imported ${importedCount} commands from ${selected.length} pack(s)`
  );
});
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/models/command.ts` | Add CommandTemplate types and data |
| `src/extension.ts` | Add import command |
| `package.json` | Register command |

---

## Sprint 5: Activity & Data Enhancements (Week 5)

### 5.1 Weekly Summary Notification

**What:** Optional Monday notification with last week's summary.

#### Implementation

```typescript
// src/services/activity.ts

/**
 * Show weekly summary (call on Monday morning)
 */
async showWeeklySummary(): Promise<void> {
  const config = vscode.workspace.getConfiguration('cmdify.activity');
  if (!config.get<boolean>('weeklySummary', true)) return;
  
  // Only show on Monday
  if (new Date().getDay() !== 1) return;
  
  // Check if already shown this week
  const lastShown = this.context.globalState.get<string>('cmdify.weeklySummary.lastShown');
  const thisMonday = getThisMondayString();
  if (lastShown === thisMonday) return;
  
  const summary = this.getWeeklySummary();
  
  const action = await vscode.window.showInformationMessage(
    `📊 Last week: ${summary.totalHours}h coded, ${summary.sessions} focus sessions, ${summary.todosCompleted} TODOs done!`,
    'View Dashboard'
  );
  
  if (action === 'View Dashboard') {
    vscode.commands.executeCommand('cmdify.activity.showDashboard');
  }
  
  await this.context.globalState.update('cmdify.weeklySummary.lastShown', thisMonday);
}

getWeeklySummary(): { totalHours: number; sessions: number; todosCompleted: number } {
  const weekData = this.getWeeklyData();
  return {
    totalHours: Math.round(weekData.reduce((sum, d) => sum + d.totalMinutes, 0) / 60),
    sessions: weekData.reduce((sum, d) => sum + d.focusSessions, 0),
    todosCompleted: weekData.reduce((sum, d) => sum + (d.todosCompleted || 0), 0)
  };
}
```

#### Settings

```json
{
  "cmdify.activity.weeklySummary": {
    "type": "boolean",
    "default": true,
    "description": "Show weekly summary notification on Mondays"
  }
}
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/services/activity.ts` | Add weekly summary |
| `src/extension.ts` | Call on activation |
| `package.json` | Add setting |

---

### 5.2 Export My Data

**What:** Let users export all their data as JSON.

#### Implementation

```typescript
// src/extension.ts

vscode.commands.registerCommand('cmdify.exportData', async () => {
  const commands = storage.getAll();
  const activity = activityService.getHistory();
  const companionState = companionService.getState();
  const achievements = achievementService.getUnlockedAchievements();
  const stats = activityService.getStats();
  
  const data = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    commands,
    activity: {
      history: activity,
      stats
    },
    companion: companionState,
    achievements,
  };
  
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`cmdify-export-${getTodayString()}.json`),
    filters: { 'JSON': ['json'] }
  });
  
  if (uri) {
    await vscode.workspace.fs.writeFile(
      uri, 
      Buffer.from(JSON.stringify(data, null, 2))
    );
    vscode.window.showInformationMessage('✅ Data exported successfully!');
  }
});
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/extension.ts` | Add export command |
| `package.json` | Register command |

---

### 5.3 Reset Progress

**What:** Let users start fresh if desired.

#### Implementation

```typescript
// src/extension.ts

vscode.commands.registerCommand('cmdify.resetProgress', async () => {
  const confirm = await vscode.window.showWarningMessage(
    'Reset all Cmdify progress? This will clear your companion level, achievements, and activity history. Commands will NOT be deleted.',
    { modal: true },
    'Reset Everything',
    'Cancel'
  );
  
  if (confirm !== 'Reset Everything') return;
  
  // Double confirm
  const doubleConfirm = await vscode.window.showWarningMessage(
    'Are you absolutely sure? This cannot be undone.',
    { modal: true },
    'Yes, Reset',
    'Cancel'
  );
  
  if (doubleConfirm !== 'Yes, Reset') return;
  
  // Reset companion
  await companionService.reset();
  
  // Reset achievements
  await achievementService.reset();
  
  // Reset activity
  await activityService.reset();
  
  // Reset focus stats
  await focusService.resetStats();
  
  vscode.window.showInformationMessage(
    "Progress reset. Your companion is starting fresh! 🐣"
  );
});
```

#### Files to Modify
| File | Changes |
|------|---------|
| `src/extension.ts` | Add reset command |
| `src/services/companion.ts` | Add reset method |
| `src/services/achievement.ts` | Add reset method |
| `src/services/activity.ts` | Add reset method |
| `package.json` | Register command |

---

## 📅 Implementation Timeline

### Sprint 1 (Week 1): Companion Personalization
| Task | Effort | Priority |
|------|--------|----------|
| Companion naming | Very Low | P1 |
| Companion messages | Low | P1 |
| Mood emoji in status bar | Very Low | P1 |

### Sprint 2 (Week 2): Achievement Enhancements
| Task | Effort | Priority |
|------|--------|----------|
| Progress tracking UI | Low | P1 |
| "Almost there" notifications | Very Low | P1 |
| Daily challenges system | Medium | P2 |

### Sprint 3 (Week 3): Focus Timer Enhancements
| Task | Effort | Priority |
|------|--------|----------|
| Break suggestions | Very Low | P1 |
| Session types picker | Low | P2 |

### Sprint 4 (Week 4): Command Library Enhancements
| Task | Effort | Priority |
|------|--------|----------|
| Command usage stats (most used) | Very Low | P2 |
| Quick TODO from selection | Very Low | P2 |
| Command templates import | Low | P3 |

### Sprint 5 (Week 5): Activity & Polish
| Task | Effort | Priority |
|------|--------|----------|
| Weekly summary notification | Very Low | P2 |
| Export my data | Very Low | P3 |
| Reset progress | Very Low | P3 |
| Testing & bug fixes | Medium | P1 |

---

## 📊 Integration Opportunities

These enhancements create natural connections between features:

```
Focus Session Complete
        │
        ├──► Companion celebrates + message
        ├──► XP awarded
        ├──► Achievement progress updated
        ├──► Daily challenge progress updated
        ├──► Activity stats updated
        └──► Break suggestion shown

TODO Completed
        │
        ├──► Companion reacts with message
        ├──► XP awarded  
        ├──► Achievement checked
        └──► Daily challenge updated

Achievement Almost Complete (90%)
        │
        └──► Notification with encouragement

Level Up
        │
        ├──► Companion celebration message
        └──► Achievement checked
```

---

## 📝 Files Summary

### New Files
| File | Purpose |
|------|---------|
| *None - All enhancements modify existing files* | |

### Modified Files
| File | Changes |
|------|---------|
| `src/models/companion.ts` | Add name, messages, mood emojis |
| `src/models/focus.ts` | Add session types, break suggestions |
| `src/models/achievement.ts` | Add progress interface, daily challenges |
| `src/services/companion.ts` | Add name methods, message system |
| `src/services/achievement.ts` | Add progress, notifications, daily challenges |
| `src/services/activity.ts` | Add weekly summary, reset |
| `src/services/focus.ts` | Add session type support |
| `src/views/companionPanel.ts` | Add message bubble, daily challenge, name display |
| `src/views/achievementPanel.ts` | Add progress bars |
| `src/views/treeProvider.ts` | Add most used section |
| `src/extension.ts` | Add new commands, wire up messages |
| `package.json` | Add commands, settings, context menus |

---

## ✅ Definition of Done

An enhancement is complete when:

1. ✅ Code implemented and type-safe
2. ✅ Settings exposed in `package.json` (if applicable)
3. ✅ Integrates with existing features seamlessly
4. ✅ No console errors or warnings
5. ✅ Manual testing passed
6. ✅ Performance impact minimal

---

## 🚀 Release Notes Draft

### v2.1.0 - The Personal Touch Update

**Companion Enhancements:**
- 🏷️ **Name Your Companion** - Give your companion a personal name
- 💬 **Companion Messages** - Your companion now reacts to your activities
- 😊 **Mood Indicator** - See your companion's mood in the status bar

**Achievement Enhancements:**
- 📊 **Progress Bars** - See how close you are to each achievement
- 🔔 **Almost There** - Get notified when you're 90% to an achievement
- 🎯 **Daily Challenges** - Rotating daily goals for bonus XP

**Focus Timer Enhancements:**
- ⚡ **Session Types** - Quick Task, Standard, Deep Work, or Marathon
- 💡 **Break Suggestions** - Helpful activity ideas during breaks

**Command Library:**
- 📊 **Most Used** - Quick access to your favorite commands
- 📝 **Quick TODO** - Add TODOs directly from code selection
- 📦 **Command Packs** - Import pre-built command collections

**Quality of Life:**
- 📧 **Weekly Summary** - Monday recap of your productivity
- 💾 **Export Data** - Download all your data as JSON
- 🔄 **Reset Progress** - Start fresh if you want

---

*Last Updated: November 29, 2025*
