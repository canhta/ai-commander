# Set Up AI Command Generation 🤖

Cmdify uses AI to generate CLI commands from natural language descriptions. Just describe what you want to do, and get the exact command!

## Supported Providers

| Provider | Models | Notes |
|----------|--------|-------|
| **OpenAI** | GPT-4o, GPT-4o-mini | Fast and reliable |
| **Anthropic** | Claude 3.5 Sonnet | Great for complex commands |
| **Ollama** | Local models | Free, runs on your machine |
| **Azure OpenAI** | Enterprise deployment | For organizations |

## Quick Start

1. Click **Configure AI Provider** above
2. Choose your preferred provider
3. Enter your API key (or start Ollama locally)
4. Start generating commands!

## Example

**You say:** "Find all TypeScript files modified in the last week"

**Cmdify generates:**
```bash
find . -name "*.ts" -mtime -7
```

> 💡 **Tip:** You can always change your AI provider in Settings → Cmdify → AI
