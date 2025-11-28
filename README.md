# Cmdify

AI-powered CLI command manager for VS Code. Describe what you want, get the command.

## Features

### Command Management
- **AI Command Generation** - Describe in plain English, get shell commands
- **Smart Detection** - Auto-detects if input is natural language or a command
- **Multiple AI Providers** - OpenAI, Anthropic Claude, Ollama, Azure OpenAI, or custom endpoints
- **Command Library** - Save, organize, and reuse commands with tags
- **Variable Support** - Use `{{variable}}` syntax for dynamic commands
- **Safety Warnings** - Alerts before running destructive commands
- **GitHub Sync** - Sync commands across machines via Gist

### Focus Timer
- **Pomodoro Technique** - Built-in focus timer with customizable work/break durations
- **Animated Companions** - Pixel art companions (cat, dog, robot, plant, flame) that react to your focus state
- **Session Tracking** - Track completed sessions and maintain daily streaks
- **Status Bar Integration** - Quick access to timer controls from the status bar

## Quick Start

1. Press `Cmd+Shift+C` (Mac) or `Ctrl+Shift+C` (Windows/Linux)
2. Type what you want to do: *"delete all merged git branches"*
3. Review the generated command and save or run it

## Commands

| Command | Description |
|---------|-------------|
| `Cmdify: Create Command` | Create via AI or manual entry |
| `Cmdify: Run Command` | Execute a saved command |
| `Cmdify: Search Commands` | Find and run commands |
| `Cmdify: Configure AI Provider` | Set up OpenAI/Anthropic/Ollama |
| `Cmdify: Sync Commands` | Sync with GitHub Gist |
| `Cmdify Focus: Start Focus Session` | Start a focus timer session |
| `Cmdify Focus: Pause Focus Session` | Pause the current session |
| `Cmdify Focus: Stop Focus Session` | Stop and reset the timer |

## Settings

### AI Settings
| Setting | Description | Default |
|---------|-------------|--------|
| `cmdify.ai.provider` | AI provider (openai/anthropic/ollama/azure/custom) | `openai` |
| `cmdify.ai.model` | Model to use | `gpt-4o-mini` |
| `cmdify.execution.confirmDestructive` | Warn on dangerous commands | `true` |
| `cmdify.view.groupBy` | Group commands by tags/source/none | `none` |
| `cmdify.sync.enabled` | Enable GitHub sync | `false` |

### Focus Timer Settings
| Setting | Description | Default |
|---------|-------------|--------|
| `cmdify.focus.focusDuration` | Focus session duration (minutes) | `25` |
| `cmdify.focus.shortBreakDuration` | Short break duration (minutes) | `5` |
| `cmdify.focus.longBreakDuration` | Long break duration (minutes) | `15` |
| `cmdify.focus.sessionsBeforeLongBreak` | Sessions before long break | `4` |
| `cmdify.focus.companionType` | Companion character | `robot` |

## AI Provider Setup

1. Run `Cmdify: Configure AI Provider`
2. Select your provider and enter API key
3. Choose a model

**Ollama** runs locally - no API key needed.

## Support

If you find Cmdify helpful, consider supporting its development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-ff5f5f?logo=ko-fi&logoColor=white)](https://ko-fi.com/canhta)

## License

MIT
