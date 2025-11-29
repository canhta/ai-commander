# Changelog

All notable changes to Cmdify will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.7] - 2025-11-29

### Added

- Achievement System with gamification features
  - Unlock achievements for focus sessions, streaks, todos, and commands
  - XP rewards and progress tracking
  - Secret achievements to discover
  - Achievement panel with category breakdown
- Activity Dashboard for productivity insights
  - Daily coding time tracking
  - Language breakdown visualization
  - Weekly activity chart
  - Streak and session statistics
- Companion Evolution 2.0
  - New unlockable companions (fox, owl, panda, star)
  - Companion levels and experience points
  - Mood system based on user activity
  - Accessories and customization options
- Interactive onboarding flow for new users

### Changed

- **Icon System Refactor**: Replaced inconsistent emoji usage with professional Lucide SVG icons
  - Webview panels now use Lucide icons for consistent styling
  - Tree views use VS Code ThemeIcons for native integration
  - Status bar uses codicon syntax for proper rendering
  - Centralized icon management in `src/utils/icons.ts` and `src/utils/lucide.ts`
- Improved panel styling with better visual hierarchy
- Enhanced notification messages with codicons

### Fixed

- Fixed icon rendering issues in webview panels
- Resolved inconsistent icon appearance across different VS Code themes

## [0.0.6] - 2025-11-28

### Added

- TODO Scanner & Reminder System
  - Automatically scans workspace for TODO, FIXME, HACK, BUG, and other comment markers
  - Sidebar tree view organized by due date (Overdue, Today, This Week, No Date)
  - Set reminders on TODOs with date annotations (@2024-12-01, @tomorrow, @next-week)
  - Two-way sync: adding reminders updates the code comments
  - Global reminders not tied to code
  - Notification system with snooze and complete actions
  - Configurable file patterns and custom regex patterns
- TODO status bar item showing count of due items
- Context menu actions for TODOs (Go to Code, Set Reminder, Mark Complete, Delete)

### Changed

- Added TODOs & Reminders view to the Cmdify sidebar
- Extended configuration with TODO scanner settings

## [0.0.5] - 2025-11-28

### Added

- Focus Timer with Pomodoro technique support
- Animated pixel art companion characters (cat, dog, robot, plant, flame)
- Four companion states: idle, focus, break, celebrate
- Session tracking with streak counter
- Configurable focus/break durations

### Changed

- Replaced emoji icons with VS Code codicons in status bar
- Updated control buttons with clean SVG icons
- Improved companion panel UI styling

### Fixed

- Status bar now uses proper codicon syntax for better compatibility

## [0.0.1] - 2025-11-28

### Added

- AI-powered command generation from natural language
- Support for multiple AI providers: OpenAI, Anthropic Claude, Ollama, Azure OpenAI, and custom endpoints
- Command library to save, organize, and reuse commands
- Variable support with `{{variable}}` syntax for dynamic commands
- Safety warnings before running destructive commands
- GitHub Gist sync for cross-machine command sharing
- Keyboard shortcut `Cmd+Shift+C` / `Ctrl+Shift+C` for quick command creation
- Export and import commands functionality
- Tag-based command organization
