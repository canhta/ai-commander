# Set Up AI Command Generation

Generate CLI commands from natural language. Describe what you want, get the command.

## Supported Providers

| Provider | Best For |
|----------|----------|
| **OpenAI** | Fast, reliable (GPT-4.1-nano, GPT-5-nano - best value) |
| **Anthropic** | Complex commands (Claude 3.5 Sonnet) |
| **Azure OpenAI** | Enterprise environments |
| **Custom** | Any API (local servers, third-party services) |

## Setup

1. Open Command Palette (`Cmd/Ctrl+Shift+P`)
2. Run **Cmdify: Configure AI Provider**
3. Select provider and enter API key
4. Choose a model

## Example

**Input:** *"Find all TypeScript files modified in the last week"*

**Output:**
```bash
find . -name "*.ts" -mtime -7
```

> **Tip:** Change provider anytime in Settings → Cmdify → AI
