# CLI Commander - VS Code Extension Specification v2

> An AI-first VS Code extension for managing and executing CLI commands.

---

## 1. Design Philosophy

### AI-First Principles
1. **One input, smart output** - User describes what they want; AI figures out the command
2. **Zero friction** - Minimal fields, smart defaults, instant action
3. **Command IS the identity** - No separate title/description; the command speaks for itself
4. **Progressive disclosure** - Simple by default, power features when needed

---

## 2. Simplified Data Model

### Command Model

```typescript
interface CLICommand {
  id: string;
  
  // Core - Only TWO required concepts
  prompt: string;                      // What user asked for (natural language)
  command: string;                     // The actual CLI command
  
  // Organization
  tags: string[];                      // Simple tagging
  
  // Execution context
  shell?: ShellType;                   // Default: auto-detect
  workingDirectory?: WorkingDirectory;
  variables?: CommandVariable[];       // Auto-extracted from {{var}} syntax
  
  // Metadata (auto-managed)
  createdAt: string;
  updatedAt: string;
  source: 'ai' | 'manual' | 'imported' | 'shared';
  usageCount: number;
  lastUsedAt?: string;
  
  // Sync
  syncId?: string;
}

interface CommandVariable {
  name: string;
  defaultValue?: string;
  description?: string;               // AI can auto-generate this
}

interface WorkingDirectory {
  type: 'workspace' | 'custom' | 'ask';
  path?: string;
}

type ShellType = 'bash' | 'zsh' | 'powershell' | 'pwsh' | 'cmd' | 'fish' | 'auto';
```

### Display Logic

```typescript
// What shows in the sidebar
function getDisplayName(cmd: CLICommand): string {
  // Use prompt if it's short enough, otherwise truncate command
  if (cmd.prompt && cmd.prompt.length <= 40) {
    return cmd.prompt;
  }
  return truncate(cmd.command, 40);
}

// Tooltip shows full details
function getTooltip(cmd: CLICommand): string {
  return `${cmd.prompt}\n\n${cmd.command}`;
}
```

---

## 3. Unified Creation Flow (AI-First)

### Single Smart Input

The same input handles both AI generation AND manual entry:

```
┌─────────────────────────────────────────────────────────────┐
│ ✨ What do you want to do?                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ delete all local git branches except main               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ↳ Press Enter to generate • Type actual command to skip AI │
└─────────────────────────────────────────────────────────────┘
```

### Smart Detection Logic

```typescript
function detectInputType(input: string): 'natural' | 'command' {
  const commandIndicators = [
    /^(git|npm|yarn|docker|kubectl|aws|gcloud|az)\s/,  // Starts with CLI tool
    /\|/,                                                // Has pipe
    /&&|\|\|/,                                          // Has operators
    /^[a-z]+\s+-/,                                      // Has flags
    /\$\(|\`/,                                          // Has subshell
    /^(cd|ls|rm|cp|mv|cat|echo|grep|find|chmod)\s/,    // Common commands
  ];
  
  return commandIndicators.some(r => r.test(input)) ? 'command' : 'natural';
}
```

### Flow Diagram

```
User Input
    │
    ├─► Looks like natural language?
    │       │
    │       ▼
    │   [AI Generate] ──► Preview Command
    │                          │
    │                          ├─► [✓ Save]
    │                          ├─► [▶ Run & Save]
    │                          ├─► [✏ Edit] ──► Manual edit
    │                          └─► [↻ Regenerate]
    │
    └─► Looks like actual command?
            │
            ▼
        [Save directly] ──► Optional: Add to category
                               │
                               ├─► [✓ Save]
                               └─► [▶ Run & Save]
```

---

## 4. User Interface

### 4.1 Sidebar View

```
┌─────────────────────────────────────────────┐
│ CLI COMMANDER                    [✨] [⚙] [↻]│
├─────────────────────────────────────────────┤
│ 🔍 Search or describe command...       [AI] │
├─────────────────────────────────────────────┤
│                                              │
│ ⏱ RECENT                                    │
│   ⚡ delete merged branches        ▶ 📋     │
│   ⚡ prune docker images           ▶ 📋     │
│                                              │
│ 🏷 git                                       │
│   ⚡ delete merged branches        ▶ 📋     │
│   ⚡ interactive rebase            ▶ 📋     │
│   ⚡ reset to remote               ▶ 📋     │
│                                              │
│ 🏷 docker                                    │
│   ⚡ prune images                  ▶ 📋     │
│   ⚡ stop all containers           ▶ 📋     │
│                                              │
│ 🏷 npm                                       │
│   ⚡ clear cache                   ▶ 📋     │
│                                              │
├─────────────────────────────────────────────┤
│ ❤️ Support on Ko-fi                          │
└─────────────────────────────────────────────┘

[✨] = Create new (opens smart input)
[⚙] = Settings
[↻] = Sync
[AI] = Indicates search also does AI generation
```

### 4.2 Search Bar Behavior

The search bar is **dual-purpose**:

```
State 1: Empty
┌─────────────────────────────────────────────┐
│ 🔍 Search or describe command...       [AI] │
└─────────────────────────────────────────────┘

State 2: Typing - matches existing
┌─────────────────────────────────────────────┐
│ 🔍 delete br                                 │
├─────────────────────────────────────────────┤
│ MATCHING COMMANDS                            │
│   ⚡ delete merged branches                  │
│   ⚡ delete remote branch                    │
├─────────────────────────────────────────────┤
│ ✨ Generate "delete br..." with AI           │
└─────────────────────────────────────────────┘

State 3: No matches - suggests AI
┌─────────────────────────────────────────────┐
│ 🔍 find large files over 100mb               │
├─────────────────────────────────────────────┤
│ No matching commands                         │
├─────────────────────────────────────────────┤
│ ✨ Generate with AI (Enter)                  │
└─────────────────────────────────────────────┘
```

### 4.3 Command Item (Expanded on Click)

```
┌─────────────────────────────────────────────┐
│ ⚡ delete merged branches              ▶ 📋 │
├─────────────────────────────────────────────┤
│ git branch --merged main | grep -v main     │
│ | xargs -n 1 git branch -d                  │
├─────────────────────────────────────────────┤
│ 🏷 git, cleanup                              │
│ Used 12 times • Last: 2 days ago            │
├─────────────────────────────────────────────┤
│ [▶ Run] [📋 Copy] [✏ Edit] [🗑 Delete]      │
└─────────────────────────────────────────────┘
```

### 4.4 AI Generation Preview

```
┌─────────────────────────────────────────────┐
│ ✨ AI Generated Command                      │
├─────────────────────────────────────────────┤
│ "find all files larger than 100mb"          │
├─────────────────────────────────────────────┤
│ find . -type f -size +100M -exec ls -lh {} \│
│                                              │
│ ℹ️  Finds files over 100MB and shows details │
├─────────────────────────────────────────────┤
│ [✓ Save] [▶ Run] [✏ Edit] [↻ Retry]        │
└─────────────────────────────────────────────┘
```

### 4.5 Variable Input (When Running)

```
┌─────────────────────────────────────────────┐
│ ▶ delete merged branches                     │
├─────────────────────────────────────────────┤
│ branch                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ main                                    │ │
│ └─────────────────────────────────────────┘ │
│ Branch to keep (default: main)              │
├─────────────────────────────────────────────┤
│ Preview:                                     │
│ git branch --merged main | grep -v main...  │
├─────────────────────────────────────────────┤
│              [▶ Run] [Cancel]               │
└─────────────────────────────────────────────┘
```

### 4.6 Destructive Command Warning

```
┌─────────────────────────────────────────────┐
│ ⚠️ Heads up - this looks destructive         │
├─────────────────────────────────────────────┤
│ rm -rf ./node_modules                       │
│                                              │
│ Detected: rm -rf (force delete)             │
├─────────────────────────────────────────────┤
│ ☐ Don't warn me for this command            │
│                                              │
│         [Run Anyway] [Cancel]               │
└─────────────────────────────────────────────┘
```

---

## 5. Command Palette Commands

```typescript
// Primary (AI-first)
"cliCommander.create"              // Opens smart input (AI + manual)
"cliCommander.run"                 // Quick pick from all commands

// Search bar equivalent
"cliCommander.search"              // Focus search bar with AI capability

// Actions
"cliCommander.copy"                // Copy selected command
"cliCommander.edit"                // Edit selected command
"cliCommander.delete"              // Delete selected command

// Sync
"cliCommander.sync"                // Sync with GitHub
"cliCommander.login"               // GitHub login

// Settings
"cliCommander.settings"            // Open settings
"cliCommander.configureAI"         // Quick AI provider setup
```

---

## 6. Settings (Simplified)

```jsonc
{
  // AI
  "cliCommander.ai.provider": {
    "enum": ["openai", "anthropic", "ollama", "azure", "custom"],
    "default": "openai"
  },
  "cliCommander.ai.model": {
    "type": "string",
    "default": "gpt-4o-mini"
  },
  "cliCommander.ai.customEndpoint": {
    "type": "string"
  },

  // Execution
  "cliCommander.execution.mode": {
    "enum": ["terminal", "background"],
    "default": "terminal"
  },
  "cliCommander.execution.reuseTerminal": {
    "type": "boolean",
    "default": true
  },
  "cliCommander.execution.confirmDestructive": {
    "type": "boolean", 
    "default": true
  },

  // View
  "cliCommander.view.showRecent": {
    "type": "boolean",
    "default": true
  },
  "cliCommander.view.recentCount": {
    "type": "number",
    "default": 5
  },
  "cliCommander.view.groupBy": {
    "enum": ["tags", "source", "none"],
    "default": "tags"
  },

  // Sync
  "cliCommander.sync.enabled": {
    "type": "boolean",
    "default": false
  },
  "cliCommander.sync.autoSync": {
    "type": "boolean",
    "default": true
  }
}
```

---

## 7. AI Service

### 7.1 System Prompt

```typescript
const SYSTEM_PROMPT = `You are a CLI command generator. Convert natural language to shell commands.

Context:
- OS: {{os}}
- Shell: {{shell}}

Rules:
1. Return ONLY valid shell commands
2. Use {{variable_name}} for user-configurable values
3. Prefer safe, portable commands
4. For destructive operations, prefer safer alternatives when possible

Response format (JSON):
{
  "command": "the shell command",
  "explanation": "one-line explanation (optional)",
  "variables": [
    {"name": "var_name", "default": "value", "description": "what it is"}
  ],
  "tags": ["suggested", "tags"]
}`;
```

### 7.2 Provider Interface

```typescript
interface AIProvider {
  id: string;
  name: string;
  generate(prompt: string, context: AIContext): Promise<AIResponse>;
}

interface AIContext {
  os: string;
  shell: string;
  existingTags?: string[];  // For tag suggestions
}

interface AIResponse {
  command: string;
  explanation?: string;
  variables?: CommandVariable[];
  suggestedTags?: string[];
}

// Providers
const providers = {
  openai: { endpoint: 'https://api.openai.com/v1/chat/completions', models: ['gpt-4o', 'gpt-4o-mini'] },
  anthropic: { endpoint: 'https://api.anthropic.com/v1/messages', models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'] },
  ollama: { endpoint: 'http://localhost:11434/api/generate', models: [] },  // Dynamic
};
```

---

## 8. Security

### 8.1 Destructive Pattern Detection

```typescript
const DESTRUCTIVE_PATTERNS = [
  { pattern: /rm\s+-[rf]*\s/i, label: 'rm (delete files)' },
  { pattern: /sudo\s/i, label: 'sudo (elevated privileges)' },
  { pattern: />\s*\/dev\//i, label: 'write to device' },
  { pattern: /mkfs/i, label: 'format filesystem' },
  { pattern: /dd\s/i, label: 'dd (disk copy)' },
  { pattern: /chmod\s+777/i, label: 'chmod 777 (world writable)' },
  { pattern: /:()\s*{\s*:|:&\s*};:/i, label: 'fork bomb' },
];

const BLOCKED_PATTERNS = [
  /:()\s*{\s*:|:&\s*};:/,  // Fork bomb - never allow
];

function analyzeCommand(cmd: string): SecurityAnalysis {
  const dominated = BLOCKED_PATTERNS.some(p => p.test(cmd));
  const warnings = DESTRUCTIVE_PATTERNS
    .filter(p => p.pattern.test(cmd))
    .map(p => p.label);
  
  return { blocked: dominated, warnings };
}
```

### 8.2 API Key Storage

```typescript
// Always use VS Code SecretStorage
class SecretStore {
  constructor(private secrets: vscode.SecretStorage) {}
  
  async setApiKey(provider: string, key: string) {
    await this.secrets.store(`cliCommander.${provider}`, key);
  }
  
  async getApiKey(provider: string) {
    return this.secrets.get(`cliCommander.${provider}`);
  }
}
```

---

## 9. GitHub Sync

### 9.1 Simple Gist-Based Sync

```typescript
interface SyncPayload {
  version: '1.0';
  commands: CLICommand[];
  exportedAt: string;
}

// Single file in a private gist
const GIST_FILENAME = 'cli-commander.json';

class GitHubSync {
  async authenticate() {
    return vscode.authentication.getSession('github', ['gist'], { createIfNone: true });
  }
  
  async push(commands: CLICommand[]) { /* ... */ }
  async pull(): Promise<CLICommand[]> { /* ... */ }
  async sync() { /* merge strategy */ }
}
```

---

## 10. Project Structure

```
cli-commander/
├── src/
│   ├── extension.ts
│   ├── commands/
│   │   ├── create.ts         # Unified AI + manual creation
│   │   ├── run.ts
│   │   ├── edit.ts
│   │   └── sync.ts
│   ├── views/
│   │   ├── treeProvider.ts   # Sidebar
│   │   └── searchProvider.ts # Smart search bar
│   ├── services/
│   │   ├── storage.ts
│   │   ├── ai.ts
│   │   ├── security.ts
│   │   └── github.ts
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   └── ollama.ts
│   │   └── prompts.ts
│   └── utils/
│       ├── shell.ts
│       └── variables.ts
├── package.json
└── README.md
```

---

## 11. package.json (Key Parts)

```json
{
  "name": "cli-commander",
  "displayName": "CLI Commander",
  "description": "AI-powered CLI command manager",
  "version": "1.0.0",
  
  "contributes": {
    "viewsContainers": {
      "activitybar": [{
        "id": "cli-commander",
        "title": "CLI Commander",
        "icon": "$(terminal)"
      }]
    },
    "views": {
      "cli-commander": [{
        "id": "cliCommander.commands",
        "name": "Commands",
        "type": "webview"
      }]
    },
    "commands": [
      {
        "command": "cliCommander.create",
        "title": "Create Command",
        "icon": "$(sparkle)",
        "category": "CLI Commander"
      },
      {
        "command": "cliCommander.run",
        "title": "Run Command",
        "icon": "$(play)",
        "category": "CLI Commander"
      }
    ],
    "keybindings": [
      {
        "command": "cliCommander.create",
        "key": "ctrl+shift+c",
        "mac": "cmd+shift+c"
      }
    ],
    "configuration": {
      "title": "CLI Commander",
      "properties": { /* settings */ }
    }
  },
  
  "sponsor": {
    "url": "https://ko-fi.com/canhta"
  }
}
```

---

## 12. User Flows

### Flow 1: First Time User
```
1. Install extension
2. See empty sidebar with "✨ Create your first command"
3. Click → Smart input appears
4. Type "delete node_modules"
5. AI generates: rm -rf node_modules
6. Click Save → Command appears in sidebar
7. Prompt to set up AI provider (if not configured)
```

### Flow 2: Quick Create (AI)
```
1. Press Cmd+Shift+C (or click ✨)
2. Type: "find all TODO comments in code"
3. Press Enter
4. See generated: grep -rn "TODO" . --include="*.{js,ts,py}"
5. Click "Run" → Executes immediately
6. Auto-saved to library
```

### Flow 3: Quick Create (Manual)
```
1. Press Cmd+Shift+C
2. Type: git log --oneline -20
3. System detects it's a command
4. Shows: "Save this command?" 
5. Click Save → Done
```

### Flow 4: Search & Run
```
1. Focus search bar
2. Type "docker"
3. See matching commands
4. Click ▶ on "prune images"
5. Runs in terminal
```

### Flow 5: Search & Generate
```
1. Focus search bar
2. Type "compress folder to zip"
3. No matches found
4. Click "✨ Generate with AI"
5. AI generates command
6. Save and run
```

---

## 13. Implementation Phases

### Phase 1: Core (Week 1-2)
- [ ] Project setup
- [ ] Simple data model
- [ ] Local storage (JSON file)
- [ ] Basic tree view
- [ ] Run command in terminal
- [ ] Copy to clipboard

### Phase 2: AI Integration (Week 2-3)
- [ ] Smart input detection
- [ ] OpenAI provider
- [ ] Anthropic provider  
- [ ] Ollama provider
- [ ] Generation preview
- [ ] Variable extraction

### Phase 3: Polish (Week 3-4)
- [ ] Smart search bar
- [ ] Destructive command warnings
- [ ] Recent commands section
- [ ] Tags/grouping
- [ ] Edit flow

### Phase 4: Sync (Week 4-5)
- [ ] GitHub authentication
- [ ] Gist sync
- [ ] Import/export

### Phase 5: Release (Week 5-6)
- [ ] Onboarding walkthrough
- [ ] Sponsor integration
- [ ] Documentation
- [ ] Marketplace publish

---

## 14. Success Metrics

- **Zero to first command**: < 30 seconds
- **AI generation**: < 3 seconds
- **Daily active users**: Track via telemetry (opt-in)
- **Commands created**: Track AI vs manual ratio

---

## 15. Future Ideas

| Feature | When |
|---------|------|
| Hosted LLM (monetization) | v2 |
| Team sharing | v2 |
| Command marketplace | v3 |
| Natural language execution | v2 |
| Workflow chaining | v3 |
| VS Code Task integration | v2 |
