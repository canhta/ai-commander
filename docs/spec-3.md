# Cmdify v2.0 - Production Feature Specification

A focused, production-ready roadmap prioritizing **ease of use** and **seamless experience**.

---

## 🎯 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Zero Config** | Works out of the box, no setup required |
| **Non-Intrusive** | Subtle notifications, user controls everything |
| **Integrated** | Features connect naturally, not bolted on |
| **Fast** | No performance impact on editor |
| **Privacy First** | Local data, optional sync |

---

## 🔔 Feature 1: GitHub Notifications

### User Experience

**Setup (One-time, 30 seconds):**
1. Click "Connect GitHub" in status bar
2. Authorize via GitHub OAuth (browser opens)
3. Done. Notifications start automatically.

**Daily Usage:**
- Status bar shows: `🔔 2` when you have updates
- Click to see dropdown with recent activity
- Click any item to open in browser
- Notifications auto-dismiss when viewed

### What Gets Notified

| Event | Default | Icon |
|-------|---------|------|
| PR approved | ✅ On | ✅ |
| PR changes requested | ✅ On | ⚠️ |
| PR commented | ✅ On | 💬 |
| PR merged | ✅ On | 🎉 |
| CI failed on your branch | ✅ On | ❌ |
| CI passed on your branch | ⚙️ Off | ✅ |
| Review requested from you | ✅ On | 👀 |
| Mentioned in comment | ✅ On | @ |

### UI Components

**Status Bar (Always Visible):**
```
[🔔 2] ← Click to expand
```

**Quick Pick Dropdown:**
```
┌─────────────────────────────────────────────┐
│ 🔔 GitHub Notifications                     │
├─────────────────────────────────────────────┤
│ ✅ PR #123 approved by @sarah        2m ago │
│ 💬 New comment on PR #456           15m ago │
│ ❌ CI failed on feature/auth         1h ago │
├─────────────────────────────────────────────┤
│ ⚙️ Settings    🔄 Refresh    ✓ Mark all read │
└─────────────────────────────────────────────┘
```

**Toast Notifications (Important Only):**
- Only for: CI failures, changes requested, review requests
- Includes action button: "View PR"
- Auto-dismiss after 5 seconds

### Smart Features

| Feature | How It Works |
|---------|--------------|
| **Auto-detect repos** | Scans workspace for .git, monitors those repos |
| **Branch awareness** | Highlights notifications for current branch |
| **Do Not Disturb** | Pauses during Focus Sessions automatically |
| **Smart polling** | More frequent when VS Code is active |

### Settings (All Optional)
```json
{
  "cmdify.github.enabled": true,
  "cmdify.github.pollInterval": 60,
  "cmdify.github.showCISuccess": false,
  "cmdify.github.muteWeekends": false,
  "cmdify.github.repos": [] // empty = auto-detect
}
```

---

## 📊 Feature 2: Activity Insights

### User Experience

**Setup:** None. Starts tracking automatically when you code.

**Access:**
- Click companion in status bar → "View Stats"
- Or: Command Palette → "Cmdify: Show Activity Dashboard"

### Dashboard (Webview Panel)

```
┌──────────────────────────────────────────────────────┐
│ 📊 Today's Activity                          [Close] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Coding Time Today: 4h 32m                          │
│  ████████████████░░░░░░░░  (Goal: 6h)               │
│                                                      │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  By Language:                                        │
│  TypeScript  ████████████  2h 15m                   │
│  Python      ██████        1h 02m                   │
│  JSON        ███           45m                      │
│  Markdown    ██            30m                      │
│                                                      │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  Focus Sessions: 4 of 6 completed  🍅🍅🍅🍅⚪⚪      │
│                                                      │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  🔥 Current Streak: 12 days                         │
│                                                      │
│  This Week:                                          │
│  Mon ██████  Tue ████████  Wed ██████████           │
│  Thu ████    Fri ░░░░░░░░  (today)                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Status Bar Integration

**Compact View (Default):**
```
[🍅 2/4] [⏱️ 2h 15m] [🐱]
   │         │        │
   │         │        └── Companion (click for menu)
   │         └── Today's coding time
   └── Focus sessions completed
```

### Data Tracked

| Data | Storage | Retention |
|------|---------|-----------|
| Time per file | Local | 30 days |
| Time per language | Local | Forever |
| Daily totals | Local | Forever |
| Focus sessions | Local | Forever |
| Streak data | Local + Gist | Forever |

### Privacy Controls
```json
{
  "cmdify.activity.enabled": true,
  "cmdify.activity.trackFiles": true,  // false = only languages
  "cmdify.activity.syncToGist": false  // opt-in cloud sync
}
```

---

## 🎮 Feature 3: Companion System 2.0

### User Experience

**First Launch:**
- Companion appears in status bar with welcome message
- "Hi! I'm here to keep you company while you code 🐱"

**Daily Interaction:**
- Companion reacts to your activity
- Levels up as you build streaks
- Unlocks new companions and accessories

### Companion States

| State | Trigger | Animation |
|-------|---------|-----------|
| **Idle** | Normal coding | Gentle breathing |
| **Focused** | During Focus Session | Determined look |
| **Celebrating** | Complete TODO/Focus | Happy dance |
| **Resting** | During break | Sleeping/relaxing |
| **Cheering** | Streak milestone | Party animation |
| **Sad** | 3+ days inactive | Looking down |

### Progression System

**Levels:**
```
Level 1: Newcomer      (Start)
Level 2: Regular       (7-day streak)
Level 3: Dedicated     (14-day streak)
Level 4: Committed     (30-day streak)
Level 5: Legendary     (100-day streak)
```

**Unlockables:**
| Unlock | Requirement |
|--------|-------------|
| 🐱 Cat | Default |
| 🐕 Dog | 50 focus sessions |
| 🤖 Robot | 100 TODOs completed |
| 🌱 Plant | 7-day streak |
| 🔥 Flame | 30-day streak |
| 🦊 Fox | 500 commands run |
| 🐼 Panda | Secret (use extension for 1 year) |

**Accessories (Cosmetic):**
- Hats, glasses, backgrounds
- Earned through achievements
- Seasonal items (holiday themes)

### Achievement System

```
┌─────────────────────────────────────────┐
│ 🏆 Achievements                         │
├─────────────────────────────────────────┤
│ ✅ First Focus     - Complete 1 session │
│ ✅ Getting Started - 7-day streak       │
│ ✅ TODO Master     - Complete 50 TODOs  │
│ 🔒 Centurion      - 100-day streak     │
│ 🔒 Night Owl      - Code after midnight │
│ 🔒 Early Bird     - Code before 6am    │
└─────────────────────────────────────────┘
```

### Companion Menu (Click Status Bar)

```
┌─────────────────────────────────────┐
│ 🐱 Whiskers (Level 3)               │
│ ████████████░░░░  Level 4 in 5 days │
├─────────────────────────────────────┤
│ 📊 View Stats                       │
│ 🏆 Achievements (12/30)             │
│ 🎨 Change Companion                 │
│ 👒 Accessories                      │
├─────────────────────────────────────┤
│ 🍅 Start Focus Session              │
│ ⏸️ Take a Break                     │
└─────────────────────────────────────┘
```

---

## 📦 Feature 4: Command Library 2.0

### Improvements Over Current

| Current | v2.0 |
|---------|------|
| Flat list | Folders + Tags |
| Manual search | Fuzzy search + Recent |
| Basic sync | Smart sync with conflict resolution |
| Commands only | Commands + Code Snippets |

### Quick Access (Improved UX)

**Keyboard Shortcut:** `Cmd+Shift+C` (unchanged)

**New Quick Pick UI:**
```
┌─────────────────────────────────────────────────┐
│ 🔍 Search commands...                           │
├─────────────────────────────────────────────────┤
│ ⭐ FAVORITES                                    │
│    git checkout -b {{branch}}                   │
│    docker-compose up -d                         │
├─────────────────────────────────────────────────┤
│ 🕐 RECENT                                       │
│    npm run build                                │
│    kubectl get pods                             │
├─────────────────────────────────────────────────┤
│ 📁 ALL COMMANDS                                 │
│    > Git (12)                                   │
│    > Docker (8)                                 │
│    > npm (15)                                   │
└─────────────────────────────────────────────────┘
```

### Code Snippets Support

```
┌─────────────────────────────────────────────────┐
│ Type: ◉ Command  ○ Code Snippet                 │
├─────────────────────────────────────────────────┤
│ Title: React useEffect template                 │
│ Language: TypeScript                            │
│ Tags: react, hooks                              │
├─────────────────────────────────────────────────┤
│ useEffect(() => {                               │
│   {{code}}                                      │
│   return () => {                                │
│     // cleanup                                  │
│   };                                            │
│ }, [{{dependencies}}]);                         │
└─────────────────────────────────────────────────┘
```

### Smart Features

| Feature | Description |
|---------|-------------|
| **Auto-suggest tags** | Based on command content |
| **Usage analytics** | See which commands you use most |
| **Import from Gist** | Import community command packs |
| **Duplicate detection** | Warn if similar command exists |

---

## 🔗 Feature 5: Quick Integrations

### Webhook System (Simple)

**Use Cases:**
- Send daily summary to Slack
- Notify Discord when you hit a streak
- Log activity to Notion via Zapier

**Setup:**
```
Command: "Cmdify: Add Webhook"

┌─────────────────────────────────────────────────┐
│ Add Webhook                                     │
├─────────────────────────────────────────────────┤
│ Name: Slack Daily Summary                       │
│ URL:  https://hooks.slack.com/services/...      │
│                                                 │
│ Trigger on:                                     │
│ ☑️ Daily summary (end of day)                   │
│ ☐ Focus session complete                        │
│ ☐ Achievement unlocked                          │
│ ☐ Streak milestone                              │
└─────────────────────────────────────────────────┘
```

### Pre-formatted Outputs

**Slack Format:**
```json
{
  "blocks": [
    {
      "type": "header",
      "text": "📊 Daily Coding Summary"
    },
    {
      "type": "section",
      "text": "Coded for *4h 32m* today\n✅ 6 focus sessions\n🔥 12-day streak"
    }
  ]
}
```

**Discord Format:**
```json
{
  "embeds": [{
    "title": "📊 Daily Coding Summary",
    "color": 5814783,
    "fields": [
      { "name": "Time", "value": "4h 32m", "inline": true },
      { "name": "Focus", "value": "6 sessions", "inline": true }
    ]
  }]
}
```

---

## 🔄 Feature 6: Enhanced Sync

### What Syncs (via GitHub Gist)

| Data | Sync | Notes |
|------|------|-------|
| Commands & Snippets | ✅ | Always |
| Settings | ✅ | Always |
| Companion progress | ✅ | Level, unlocks |
| Achievements | ✅ | Earned badges |
| Activity stats | ⚙️ | Opt-in |
| Streak data | ✅ | Keep streak across devices |

### Conflict Resolution

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Sync Conflict Detected                       │
├─────────────────────────────────────────────────┤
│ Command "deploy-prod" differs:                  │
│                                                 │
│ Local:  ./deploy.sh --env=production           │
│ Remote: ./deploy.sh --env=prod --verbose       │
│                                                 │
│ [Keep Local] [Keep Remote] [Keep Both]         │
└─────────────────────────────────────────────────┘
```

---

## 📱 Onboarding Flow

### First Install Experience

**Step 1: Welcome (Auto-shows)**
```
┌─────────────────────────────────────────────────┐
│ 👋 Welcome to Cmdify!                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Your personal productivity companion for        │
│ VS Code. Let's get you set up in 30 seconds.   │
│                                                 │
│              [Get Started →]                    │
└─────────────────────────────────────────────────┘
```

**Step 2: Choose Companion**
```
┌─────────────────────────────────────────────────┐
│ 🎨 Choose Your Companion                        │
├─────────────────────────────────────────────────┤
│                                                 │
│   🐱        🐕        🤖        🌱              │
│   Cat      Dog      Robot     Plant            │
│   [●]      [ ]       [ ]       [ ]             │
│                                                 │
│              [Continue →]                       │
└─────────────────────────────────────────────────┘
```

**Step 3: Optional GitHub (Can Skip)**
```
┌─────────────────────────────────────────────────┐
│ 🔔 Connect GitHub? (Optional)                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Get notified about PR reviews, CI status,      │
│ and more - right in VS Code.                   │
│                                                 │
│   [Connect GitHub]    [Skip for now]           │
│                                                 │
│ You can always connect later in settings.      │
└─────────────────────────────────────────────────┘
```

**Step 4: Done!**
```
┌─────────────────────────────────────────────────┐
│ ✅ You're all set!                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Quick tips:                                     │
│ • Cmd+Shift+C → Run commands                   │
│ • Click 🐱 → Start focus session               │
│ • Your activity is tracked automatically       │
│                                                 │
│              [Start Coding! 🚀]                 │
└─────────────────────────────────────────────────┘
```

---

## 🏗️ Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  VS Code Extension              │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Commands │  │  Focus   │  │   TODO   │      │
│  │ Manager  │  │  Timer   │  │  Scanner │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │
│       └─────────────┼─────────────┘             │
│                     ▼                           │
│            ┌────────────────┐                   │
│            │ Activity Core  │                   │
│            └───────┬────────┘                   │
│                    │                            │
│       ┌────────────┼────────────┐              │
│       ▼            ▼            ▼              │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐         │
│  │ GitHub  │ │Companion │ │ Webhooks│         │
│  │  Notif  │ │  System  │ │         │         │
│  └─────────┘ └──────────┘ └─────────┘         │
│                    │                            │
│                    ▼                            │
│            ┌────────────────┐                   │
│            │  Local Storage │ ←→ GitHub Gist   │
│            │   (SQLite)     │                   │
│            └────────────────┘                   │
└─────────────────────────────────────────────────┘
```

### Storage Schema

```typescript
// SQLite tables
interface Tables {
  activity: {
    id: number;
    date: string;
    project: string;
    language: string;
    duration_seconds: number;
  };
  
  focus_sessions: {
    id: number;
    started_at: string;
    ended_at: string;
    completed: boolean;
    duration_minutes: number;
  };
  
  companion: {
    type: string;
    level: number;
    xp: number;
    unlocked: string[]; // JSON array
    accessories: string[]; // JSON array
  };
  
  achievements: {
    id: string;
    unlocked_at: string;
  };
  
  streaks: {
    current: number;
    longest: number;
    last_active_date: string;
  };
}
```

### Performance Budget

| Operation | Target | Method |
|-----------|--------|--------|
| Extension activate | < 100ms | Lazy load features |
| File change tracking | < 5ms | Debounce 1s |
| GitHub poll | Background | Web Worker |
| Dashboard render | < 200ms | Virtual scrolling |
| Status bar update | < 10ms | Batch updates |

---

## 📅 Release Plan

### v2.0.0 - Core (Month 1)
- ✅ GitHub Notifications
- ✅ Activity Tracking
- ✅ New Onboarding

### v2.1.0 - Companion (Month 2)
- ✅ Companion Evolution
- ✅ Achievement System
- ✅ Unlockables

### v2.2.0 - Polish (Month 3)
- ✅ Command Library 2.0
- ✅ Webhook Integrations
- ✅ Enhanced Sync

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| Install → Active User | > 60% |
| Daily Active Users | > 40% of installs |
| GitHub connected | > 30% of users |
| Avg session length | > 2 hours |
| 5-star ratings | > 4.5 average |
