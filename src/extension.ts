import * as vscode from 'vscode';
import { StorageService } from './services/storage';
import { AIProvider } from './services/ai';
import { OpenAIProvider, AnthropicProvider, OllamaProvider, AzureOpenAIProvider, CustomProvider } from './ai/providers';
import { CommandsTreeProvider } from './views/treeProvider';
import {
  handleCreate,
  handleRun,
  handleCopy,
  handleSearch,
  handleEdit,
  handleDelete,
  handleSync,
  handleLogin,
  handleExport,
  handleImport,
  GitHubSyncService,
} from './commands';
import { disposeTerminal } from './utils/shell';
import { FocusService } from './services/focus';
import { CompanionService } from './services/companion';
import { CompanionPanelProvider } from './views/companionPanel';
import { ActivityService } from './services/activity';
import { ActivityPanelProvider } from './views/activityPanel';
import { formatTime } from './utils/dateUtils';
import { COMPANION_ICONS } from './models/companion';
import { TodoScannerService } from './services/todoScanner';
import { TodoSyncService } from './services/todoSync';
import { ReminderService } from './services/reminder';
import { AchievementService } from './services/achievement';
import { createTodoTreeView, TodoTreeItem } from './views/todoTreeProvider';
import { AchievementPanelProvider } from './views/achievementPanel';
import { DetectedTodo, GlobalReminder } from './models/todo';

let storage: StorageService;
let treeProvider: CommandsTreeProvider;
let syncService: GitHubSyncService;
let aiProvider: AIProvider | undefined;
let focusService: FocusService;
let companionService: CompanionService;
let focusStatusBarItem: vscode.StatusBarItem;
let todoScannerService: TodoScannerService;
let todoSyncService: TodoSyncService;
let reminderService: ReminderService;
let todoStatusBarItem: vscode.StatusBarItem;
let activityService: ActivityService;
let activityStatusBarItem: vscode.StatusBarItem;
let activityPanelProvider: ActivityPanelProvider;
let achievementService: AchievementService;
let achievementPanelProvider: AchievementPanelProvider;

/**
 * Update the noCommands context for welcome view
 */
async function updateNoCommandsContext(): Promise<void> {
  const hasCommands = storage.getAll().length > 0;
  await vscode.commands.executeCommand('setContext', 'cmdify.noCommands', !hasCommands);
}

/**
 * Check if AI provider is configured (has API key or is Ollama)
 */
async function checkAIConfigured(context: vscode.ExtensionContext): Promise<boolean> {
  const config = vscode.workspace.getConfiguration('cmdify.ai');
  const providerName = config.get<string>('provider', 'openai');

  // Ollama doesn't need an API key
  if (providerName === 'ollama') {
    return true;
  }

  // Check if API key exists for the provider
  const apiKey = await context.secrets.get(`cmdify.${providerName}`);
  return !!apiKey;
}

/**
 * Update the aiNotConfigured context for welcome view
 */
async function updateAIConfiguredContext(context: vscode.ExtensionContext): Promise<void> {
  const isConfigured = await checkAIConfigured(context);
  await vscode.commands.executeCommand('setContext', 'cmdify.aiNotConfigured', !isConfigured);
}

export async function activate(context: vscode.ExtensionContext) {
  console.log('Cmdify is now active!');

  // Initialize storage
  storage = new StorageService(context);
  await storage.initialize();

  // Set initial context for welcome view
  await updateNoCommandsContext();
  await updateAIConfiguredContext(context);

  // Initialize AI provider
  aiProvider = await initializeAIProvider(context);

  // Initialize sync service
  syncService = new GitHubSyncService(storage, context);

  // Initialize tree view
  treeProvider = new CommandsTreeProvider(storage);
  const treeView = vscode.window.createTreeView('cmdify.commands', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  // Update context when storage changes
  storage.onDidChange(async () => {
    await updateNoCommandsContext();
  });

  // Initialize Focus Timer services
  focusService = new FocusService(context);
  companionService = new CompanionService(context, focusService);

  // Initialize Focus Timer status bar
  focusStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  focusStatusBarItem.command = 'cmdify.focus.showPanel';
  updateFocusStatusBar();
  focusStatusBarItem.show();

  // Listen for focus timer updates
  focusService.onTick(() => updateFocusStatusBar());
  focusService.onStateChange(() => updateFocusStatusBar());
  companionService.onStateChange(() => updateFocusStatusBar());

  // Register Companion Panel webview
  const companionPanelProvider = new CompanionPanelProvider(
    context.extensionUri,
    focusService,
    companionService
  );
  const companionPanelDisposable = vscode.window.registerWebviewViewProvider(
    CompanionPanelProvider.viewType,
    companionPanelProvider
  );

  // Initialize TODO Scanner services
  todoScannerService = new TodoScannerService(context);
  todoSyncService = new TodoSyncService(context, todoScannerService);
  reminderService = new ReminderService(context, todoScannerService, todoSyncService);

  // Create TODO tree view
  const { treeView: todoTreeView, provider: todoTreeProvider } = createTodoTreeView(
    todoScannerService,
    reminderService
  );

  // Initialize TODO status bar
  todoStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    99
  );
  todoStatusBarItem.command = 'cmdify.todos.scan';
  updateTodoStatusBar();
  todoStatusBarItem.show();

  // Listen for TODO changes
  todoScannerService.onTodosChanged(() => updateTodoStatusBar());

  // Initial workspace scan (delayed to not block activation)
  setTimeout(() => {
    todoScannerService.scanWorkspace();
  }, 2000);

  // Initialize Activity Tracking service
  activityService = new ActivityService(context);
  activityPanelProvider = new ActivityPanelProvider(context.extensionUri, activityService);

  // Initialize Achievement System
  achievementService = new AchievementService(context, companionService, activityService);
  achievementPanelProvider = new AchievementPanelProvider(context.extensionUri, achievementService);

  // Track command creation for achievements
  storage.onDidChange(async () => {
    const commandCount = storage.getAll().length;
    await achievementService.checkCommandAchievements(commandCount);
  });

  // Initialize Activity status bar (between focus and TODO)
  const activityConfig = activityService.getConfig();
  if (activityConfig.showInStatusBar) {
    activityStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99.5 // Between focus (100) and TODO (99)
    );
    activityStatusBarItem.command = 'cmdify.activity.showDashboard';
    updateActivityStatusBar();
    activityStatusBarItem.show();

    // Listen for activity updates
    activityService.onActivityUpdate(() => updateActivityStatusBar());
  }

  // Connect focus session completion to activity tracking
  focusService.onSessionComplete(async () => {
    const focusConfig = focusService.getConfig();
    await activityService.recordFocusSession(focusConfig.focusDuration);

    // Award XP for completing focus session
    await companionService.awardXP(100, 'focusSessionComplete');

    // Check focus achievements
    const stats = activityService.getStats();
    await achievementService.checkFocusAchievements(stats.totalSessions);
    
    // Check marathon achievement (5 sessions in a day)
    const today = activityService.getToday();
    if (today) {
      await achievementService.trackDailySessions(today.focusSessions);
    }
  });

  // Award XP for taking breaks
  focusService.onBreakStart(async () => {
    await companionService.awardXP(25, 'breakTaken');
  });

  // Show level-up notifications
  companionService.onLevelUp(async (newLevel) => {
    const companionState = companionService.getState();
    const action = await vscode.window.showInformationMessage(
      `🎉 Level Up! Your ${companionState.type} is now Level ${newLevel}!`,
      'View Stats'
    );

    if (action === 'View Stats') {
      // TODO: Open companion stats panel
      vscode.commands.executeCommand('cmdify.focus.showPanel');
    }
  });

  // Show unlock notifications
  companionService.onUnlock(async ({ type, item }) => {
    if (type === 'companion') {
      const unlock = await vscode.window.showInformationMessage(
        `🐾 New Companion Unlocked: ${item.charAt(0).toUpperCase() + item.slice(1)}!`,
        'Switch Now',
        'Later'
      );

      if (unlock === 'Switch Now') {
        await companionService.setCompanionType(item as any);
      }
    } else {
      vscode.window.showInformationMessage(
        `✨ New Accessory Unlocked: ${item}!`
      );
    }
  });

  // Track night owl usage for owl companion unlock
  companionService.trackNightOwlUsage();

  // Register commands
  const commands = [
    vscode.commands.registerCommand('cmdify.create', () =>
      handleCreate(storage, aiProvider)
    ),
    vscode.commands.registerCommand('cmdify.run', () =>
      handleRun(undefined, storage)
    ),
    vscode.commands.registerCommand('cmdify.runFromTree', (item) =>
      handleRun(item, storage)
    ),
    vscode.commands.registerCommand('cmdify.search', () =>
      handleSearch(storage)
    ),
    vscode.commands.registerCommand('cmdify.copy', () =>
      handleCopy(undefined, storage)
    ),
    vscode.commands.registerCommand('cmdify.copyFromTree', (item) =>
      handleCopy(item, storage)
    ),
    vscode.commands.registerCommand('cmdify.edit', (item) =>
      handleEdit(item, storage)
    ),
    vscode.commands.registerCommand('cmdify.delete', (item) =>
      handleDelete(item, storage)
    ),
    vscode.commands.registerCommand('cmdify.sync', () =>
      handleSync(syncService)
    ),
    vscode.commands.registerCommand('cmdify.export', () =>
      handleExport(storage)
    ),
    vscode.commands.registerCommand('cmdify.import', () =>
      handleImport(storage)
    ),
    vscode.commands.registerCommand('cmdify.login', () =>
      handleLogin(syncService)
    ),
    vscode.commands.registerCommand('cmdify.settings', () =>
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'cmdify'
      )
    ),
    vscode.commands.registerCommand('cmdify.configureAI', () =>
      configureAIProvider(context)
    ),
    vscode.commands.registerCommand('cmdify.refresh', () =>
      treeProvider.refresh()
    ),
    vscode.commands.registerCommand('cmdify.sponsor', () =>
      vscode.env.openExternal(vscode.Uri.parse('https://ko-fi.com/canhta'))
    ),
    vscode.commands.registerCommand('cmdify.about', () =>
      handleAbout()
    ),
    // Focus Timer commands
    vscode.commands.registerCommand('cmdify.focus.start', () =>
      focusService.start()
    ),
    vscode.commands.registerCommand('cmdify.focus.pause', () =>
      focusService.pause()
    ),
    vscode.commands.registerCommand('cmdify.focus.resume', () =>
      focusService.resume()
    ),
    vscode.commands.registerCommand('cmdify.focus.stop', () =>
      focusService.stop()
    ),
    vscode.commands.registerCommand('cmdify.focus.skip', () =>
      focusService.skip()
    ),
    vscode.commands.registerCommand('cmdify.focus.showPanel', () =>
      vscode.commands.executeCommand('cmdify.focus.focus')
    ),
    // TODO Scanner commands
    vscode.commands.registerCommand('cmdify.todos.scan', async () => {
      const count = await todoScannerService.scanWorkspace();
      vscode.window.showInformationMessage(`📋 Found ${count.length} TODO items`);
    }),
    vscode.commands.registerCommand('cmdify.todos.refresh', () =>
      todoTreeProvider.refresh()
    ),
    vscode.commands.registerCommand('cmdify.todo.goToCode', async (item: TodoTreeItem | DetectedTodo) => {
      const todo = (item as TodoTreeItem).todo ?? (item as DetectedTodo);
      if (todo && 'filePath' in todo) {
        await todoSyncService.goToTodo(todo);
      }
    }),
    vscode.commands.registerCommand('cmdify.todo.setReminder', async (item: TodoTreeItem | DetectedTodo) => {
      const todo = (item as TodoTreeItem).todo ?? (item as DetectedTodo);
      if (todo && 'filePath' in todo) {
        await reminderService.setTodoReminderInteractive(todo);
      }
    }),
    vscode.commands.registerCommand('cmdify.todo.complete', async (item: TodoTreeItem | DetectedTodo) => {
      const todo = (item as TodoTreeItem).todo ?? (item as DetectedTodo);
      if (todo && 'id' in todo && todo.id) {
        await todoScannerService.markComplete(todo.id);
        vscode.window.showInformationMessage('✅ TODO marked as complete');
        
        // Track TODO completion for achievements
        const completedCount = todoScannerService.getCompletedTodos().length;
        await achievementService.checkTodoAchievements(completedCount);
        await companionService.awardXP(50, 'todoComplete');
      }
    }),
    vscode.commands.registerCommand('cmdify.todo.markDone', async (item: TodoTreeItem | DetectedTodo) => {
      const todo = (item as TodoTreeItem).todo ?? (item as DetectedTodo);
      if (todo && 'filePath' in todo) {
        await todoSyncService.markDoneInCode(todo);
      }
    }),
    vscode.commands.registerCommand('cmdify.todo.delete', async (item: TodoTreeItem | DetectedTodo) => {
      const todo = (item as TodoTreeItem).todo ?? (item as DetectedTodo);
      if (todo && 'filePath' in todo) {
        await todoSyncService.deleteTodoLine(todo);
      }
    }),
    vscode.commands.registerCommand('cmdify.reminder.add', async () => {
      const reminder = await reminderService.createGlobalReminderInteractive();
      if (reminder) {
        todoTreeProvider.refresh();
        vscode.window.showInformationMessage(`🔔 Reminder set for ${reminder.dueAt.toLocaleString()}`);
      }
    }),
    vscode.commands.registerCommand('cmdify.reminder.complete', async (item: TodoTreeItem) => {
      if (item.reminder) {
        await reminderService.completeGlobalReminder(item.reminder.id);
        todoTreeProvider.refresh();
        vscode.window.showInformationMessage('✅ Reminder completed');
      }
    }),
    vscode.commands.registerCommand('cmdify.reminder.delete', async (item: TodoTreeItem) => {
      if (item.reminder) {
        const confirm = await vscode.window.showWarningMessage(
          `Delete reminder "${item.reminder.title}"?`,
          { modal: true },
          'Delete'
        );
        if (confirm === 'Delete') {
          await reminderService.deleteGlobalReminder(item.reminder.id);
          todoTreeProvider.refresh();
        }
      }
    }),
    // Activity Dashboard command
    vscode.commands.registerCommand('cmdify.activity.showDashboard', () => {
      activityPanelProvider.show();
    }),
    // Achievement System commands
    vscode.commands.registerCommand('cmdify.showAchievements', () => {
      achievementPanelProvider.show();
    }),
  ];

  // Listen for configuration changes
  const configListener = vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (e.affectsConfiguration('cmdify.ai')) {
      aiProvider = await initializeAIProvider(context);
      await updateAIConfiguredContext(context);
    }
  });

  context.subscriptions.push(
    treeView,
    storage,
    treeProvider,
    configListener,
    focusService,
    companionService,
    focusStatusBarItem,
    companionPanelDisposable,
    todoScannerService,
    todoSyncService,
    reminderService,
    todoTreeView,
    todoTreeProvider,
    todoStatusBarItem,
    activityService,
    activityPanelProvider,
    achievementService,
    achievementPanelProvider,
    ...commands
  );

  // Add activity status bar to subscriptions if created
  if (activityStatusBarItem) {
    context.subscriptions.push(activityStatusBarItem);
  }
}

/**
 * Update the focus timer status bar
 */
function updateFocusStatusBar(): void {
  const focusState = focusService.getState();
  const companionState = companionService.getState();
  const stats = focusService.getStats();

  const icons = COMPANION_ICONS[companionState.type];
  const icon = icons[focusState.status] || icons.idle;

  let text = icon;

  if (focusState.status === 'focusing' || focusState.status === 'break' || focusState.status === 'paused') {
    text += ` ${formatTime(focusState.timeRemaining)}`;
  }

  if (stats.currentStreak > 0) {
    text += ` $(flame)${stats.currentStreak}`;
  }

  focusStatusBarItem.text = text;
  focusStatusBarItem.tooltip = getFocusTooltip(focusState.status, focusState.todaySessions);
}

/**
 * Update the TODO status bar
 */
function updateTodoStatusBar(): void {
  const openCount = todoScannerService.getOpenCount();
  const dueCount = todoScannerService.getDueCount();

  if (openCount === 0) {
    todoStatusBarItem.text = '$(checklist) 0';
    todoStatusBarItem.tooltip = 'No TODOs found - Click to scan workspace';
  } else if (dueCount > 0) {
    todoStatusBarItem.text = `$(checklist) ${openCount} $(warning) ${dueCount}`;
    todoStatusBarItem.tooltip = `${openCount} TODOs (${dueCount} due/overdue) - Click to scan`;
  } else {
    todoStatusBarItem.text = `$(checklist) ${openCount}`;
    todoStatusBarItem.tooltip = `${openCount} TODOs - Click to scan workspace`;
  }
}

/**
 * Update the activity status bar
 */
function updateActivityStatusBar(): void {
  if (!activityStatusBarItem) {
    return;
  }

  const text = activityService.getStatusBarText();
  const tooltip = activityService.getStatusBarTooltip();

  activityStatusBarItem.text = `$(clock) ${text}`;
  activityStatusBarItem.tooltip = tooltip;
}

/**
 * Get tooltip for focus status bar
 */
function getFocusTooltip(status: string, todaySessions: number): string {
  let tooltip = 'Focus Timer - Click to open panel\n';
  tooltip += `${todaySessions} sessions today\n`;

  switch (status) {
    case 'focusing':
      tooltip += 'Currently focusing...';
      break;
    case 'break':
      tooltip += 'Taking a break';
      break;
    case 'paused':
      tooltip += 'Session paused';
      break;
    default:
      tooltip += 'Ready to focus';
  }

  return tooltip;
}

/**
 * Initialize the AI provider based on configuration
 */
async function initializeAIProvider(
  context: vscode.ExtensionContext
): Promise<AIProvider | undefined> {
  const config = vscode.workspace.getConfiguration('cmdify.ai');
  const providerName = config.get<string>('provider', 'openai');

  switch (providerName) {
    case 'openai':
      return new OpenAIProvider(context.secrets);
    case 'anthropic':
      return new AnthropicProvider(context.secrets);
    case 'ollama':
      return new OllamaProvider();
    case 'azure':
      return new AzureOpenAIProvider(context.secrets);
    case 'custom':
      return new CustomProvider(context.secrets);
    default:
      return undefined;
  }
}

/**
 * Configure AI provider (API key setup)
 */
async function configureAIProvider(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration('cmdify.ai');

  // Step 1: Select provider
  interface ProviderItem extends vscode.QuickPickItem {
    value: string;
  }

  const providers: ProviderItem[] = [
    { label: 'OpenAI', value: 'openai', description: 'GPT-4o, GPT-4o-mini, GPT-4 Turbo' },
    { label: 'Anthropic', value: 'anthropic', description: 'Claude Sonnet, Claude Haiku' },
    { label: 'Ollama', value: 'ollama', description: 'Local models (no API key needed)' },
    { label: 'Azure OpenAI', value: 'azure', description: 'Azure-hosted OpenAI models' },
    { label: 'Custom', value: 'custom', description: 'Custom OpenAI-compatible endpoint' },
  ];

  const selectedProvider = await vscode.window.showQuickPick<ProviderItem>(providers, {
    placeHolder: 'Select AI provider',
    title: 'Step 1: Select AI Provider',
  });

  if (!selectedProvider) {
    return;
  }

  // Handle custom provider separately
  if (selectedProvider.value === 'custom') {
    await configureCustomProvider(context, config);
    return;
  }

  // Step 2: Select model (dropdown)
  const models = await getModelsForProvider(selectedProvider.value, context);
  if (models.length === 0) {
    vscode.window.showErrorMessage('No models available for this provider.');
    return;
  }

  interface ModelItem extends vscode.QuickPickItem {
    value: string;
  }

  const selectedModel = await vscode.window.showQuickPick<ModelItem>(models, {
    placeHolder: 'Select model',
    title: 'Step 2: Select AI Model',
  });

  if (!selectedModel) {
    return;
  }

  // Step 3: Enter API key (if required)
  if (selectedProvider.value !== 'ollama') {
    const existingKey = await context.secrets.get(`cmdify.${selectedProvider.value}`);
    const apiKey = await vscode.window.showInputBox({
      prompt: `Enter your ${selectedProvider.label} API key`,
      password: true,
      placeHolder: selectedProvider.value === 'azure' ? 'Your Azure API key' : 'sk-...',
      title: `Step 3: ${selectedProvider.label} API Key`,
      value: existingKey ? '' : undefined,
      validateInput: (value) => {
        if (!value && !existingKey) {
          return 'API key is required';
        }
        return undefined;
      },
    });

    // User cancelled
    if (apiKey === undefined) {
      return;
    }

    // Only store if a new key was provided
    if (apiKey) {
      await context.secrets.store(`cmdify.${selectedProvider.value}`, apiKey);
    }
  }

  // Step 4: Azure-specific configuration
  if (selectedProvider.value === 'azure') {
    const endpoint = await vscode.window.showInputBox({
      prompt: 'Enter your Azure OpenAI endpoint',
      placeHolder: 'https://your-resource.openai.azure.com',
      title: 'Step 4: Azure OpenAI Endpoint',
      validateInput: (value) => {
        if (!value) {
          return 'Endpoint is required for Azure';
        }
        if (!value.startsWith('https://')) {
          return 'Endpoint must start with https://';
        }
        return undefined;
      },
    });

    if (!endpoint) {
      return;
    }

    await config.update('customEndpoint', endpoint, vscode.ConfigurationTarget.Global);
  }

  // Save provider and model configuration
  await config.update('provider', selectedProvider.value, vscode.ConfigurationTarget.Global);
  await config.update('model', selectedModel.value, vscode.ConfigurationTarget.Global);

  // Clear custom endpoint for non-Azure providers
  if (selectedProvider.value !== 'azure') {
    await config.update('customEndpoint', '', vscode.ConfigurationTarget.Global);
  }

  // Reinitialize provider and update context
  aiProvider = await initializeAIProvider(context);
  await updateAIConfiguredContext(context);
  vscode.window.showInformationMessage(
    `AI configured: ${selectedProvider.label} with ${selectedModel.label}`
  );
}

/**
 * Configure custom OpenAI-compatible provider
 */
async function configureCustomProvider(
  context: vscode.ExtensionContext,
  config: vscode.WorkspaceConfiguration
): Promise<void> {
  // Step 2: Enter custom endpoint
  const endpoint = await vscode.window.showInputBox({
    prompt: 'Enter your custom API endpoint',
    placeHolder: 'https://api.example.com/v1/chat/completions',
    title: 'Step 2: Custom API Endpoint',
    validateInput: (value) => {
      if (!value) {
        return 'Endpoint is required';
      }
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return 'Endpoint must start with http:// or https://';
      }
      return undefined;
    },
  });

  if (!endpoint) {
    return;
  }

  // Step 3: Enter model name
  const modelName = await vscode.window.showInputBox({
    prompt: 'Enter the model name to use',
    placeHolder: 'gpt-4o-mini, llama-3.1-70b, etc.',
    title: 'Step 3: Model Name',
    validateInput: (value) => {
      if (!value) {
        return 'Model name is required';
      }
      return undefined;
    },
  });

  if (!modelName) {
    return;
  }

  // Step 4: Enter API key (optional for some custom endpoints)
  const apiKey = await vscode.window.showInputBox({
    prompt: 'Enter API key (leave empty if not required)',
    password: true,
    placeHolder: 'API key (optional)',
    title: 'Step 4: API Key (Optional)',
  });

  // User cancelled
  if (apiKey === undefined) {
    return;
  }

  // Save all configuration
  await config.update('provider', 'custom', vscode.ConfigurationTarget.Global);
  await config.update('customEndpoint', endpoint, vscode.ConfigurationTarget.Global);
  await config.update('model', modelName, vscode.ConfigurationTarget.Global);

  if (apiKey) {
    await context.secrets.store('cmdify.custom', apiKey);
  }

  // Reinitialize provider and update context
  aiProvider = await initializeAIProvider(context);
  await updateAIConfiguredContext(context);
  vscode.window.showInformationMessage(`AI configured: Custom provider with ${modelName}`);
}

interface ModelItem extends vscode.QuickPickItem {
  value: string;
}

async function getModelsForProvider(provider: string, context: vscode.ExtensionContext): Promise<ModelItem[]> {
  switch (provider) {
    case 'openai':
      return [
        { label: 'GPT-4o Mini', value: 'gpt-4o-mini', description: 'Recommended - Fast and cost-effective' },
        { label: 'GPT-4o', value: 'gpt-4o', description: 'Most capable' },
        { label: 'GPT-4 Turbo', value: 'gpt-4-turbo', description: 'Previous generation' },
        { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', description: 'Budget option' },
      ];
    case 'anthropic':
      return [
        { label: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514', description: 'Recommended - Best balance' },
        { label: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022', description: 'Fast and affordable' },
        { label: 'Claude Opus 4', value: 'claude-opus-4-20250514', description: 'Most capable' },
      ];
    case 'ollama': {
      // Try to fetch dynamic models from Ollama
      const ollamaProvider = new OllamaProvider();
      const models = await ollamaProvider.getAvailableModels();
      return models.map(model => ({
        label: model,
        value: model,
        description: model.includes('code') ? 'Optimized for code' : undefined,
      }));
    }
    case 'azure':
      return [
        { label: 'GPT-4o', value: 'gpt-4o', description: 'Azure-hosted GPT-4o' },
        { label: 'GPT-4o Mini', value: 'gpt-4o-mini', description: 'Azure-hosted GPT-4o Mini' },
        { label: 'GPT-4', value: 'gpt-4', description: 'Azure-hosted GPT-4' },
      ];
    default:
      return [];
  }
}

/**
 * Show about information
 */
async function handleAbout(): Promise<void> {
  const extension = vscode.extensions.getExtension('canhta.cmdify');
  const version = extension?.packageJSON?.version || 'unknown';

  const message = `Cmdify v${version} - AI-powered CLI command manager\n\nDescribe what you want, get the shell command.`;

  const action = await vscode.window.showInformationMessage(
    message,
    'GitHub',
    'Sponsor',
    'Settings'
  );

  switch (action) {
    case 'GitHub':
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/canhta/cmdify'));
      break;
    case 'Sponsor':
      vscode.env.openExternal(vscode.Uri.parse('https://ko-fi.com/canhta'));
      break;
    case 'Settings':
      vscode.commands.executeCommand('workbench.action.openSettings', 'cmdify');
      break;
  }
}

export function deactivate() {
  disposeTerminal();
  if (focusService) {
    focusService.dispose();
  }
  if (companionService) {
    companionService.dispose();
  }
  if (todoScannerService) {
    todoScannerService.dispose();
  }
  if (todoSyncService) {
    todoSyncService.dispose();
  }
  if (reminderService) {
    reminderService.dispose();
  }
  if (activityService) {
    activityService.dispose();
  }
  if (activityPanelProvider) {
    activityPanelProvider.dispose();
  }
}

