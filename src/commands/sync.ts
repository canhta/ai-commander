import * as vscode from 'vscode';
import { CLICommand } from '../models/command';
import { StorageService } from '../services/storage';

const GIST_FILENAME = 'cmdify-commands.json';

interface SyncPayload {
  version: string;
  commands: CLICommand[];
  exportedAt: string;
}

/**
 * GitHub Sync Service
 */
export class GitHubSyncService {
  private gistId?: string;

  constructor(
    private storage: StorageService,
    private context: vscode.ExtensionContext
  ) {
    // Load stored gist ID
    this.gistId = context.globalState.get('cmdify.gistId');
  }

  /**
   * Authenticate with GitHub
   */
  async authenticate(): Promise<vscode.AuthenticationSession | undefined> {
    try {
      const session = await vscode.authentication.getSession('github', ['gist'], {
        createIfNone: true,
      });
      return session;
    } catch (error) {
      vscode.window.showErrorMessage('Failed to authenticate with GitHub.');
      return undefined;
    }
  }

  /**
   * Push commands to GitHub Gist
   */
  async push(): Promise<boolean> {
    const session = await this.authenticate();
    if (!session) {
      return false;
    }

    const commands = this.storage.exportCommands();
    const payload: SyncPayload = {
      version: '1.0',
      commands,
      exportedAt: new Date().toISOString(),
    };

    try {
      if (this.gistId) {
        // Update existing gist
        await this.updateGist(session.accessToken, payload);
      } else {
        // Create new gist
        await this.createGist(session.accessToken, payload);
      }

      vscode.window.showInformationMessage('Commands synced to GitHub!');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Failed to sync: ${message}`);
      return false;
    }
  }

  /**
   * Pull commands from GitHub Gist
   */
  async pull(): Promise<boolean> {
    const session = await this.authenticate();
    if (!session) {
      return false;
    }

    if (!this.gistId) {
      // Try to find existing gist
      const found = await this.findExistingGist(session.accessToken);
      if (!found) {
        vscode.window.showInformationMessage('No synced commands found. Push first to create a sync.');
        return false;
      }
    }

    try {
      const payload = await this.fetchGist(session.accessToken);
      if (!payload) {
        vscode.window.showErrorMessage('Failed to fetch synced commands.');
        return false;
      }

      await this.storage.importCommands(payload.commands, true);
      vscode.window.showInformationMessage(`Synced ${payload.commands.length} commands from GitHub!`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Failed to pull: ${message}`);
      return false;
    }
  }

  /**
   * Full sync (push local changes, pull remote changes)
   */
  async sync(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('cmdify.sync');
    const enabled = config.get<boolean>('enabled', false);

    if (!enabled) {
      const enable = await vscode.window.showInformationMessage(
        'GitHub sync is not enabled. Enable it now?',
        'Enable',
        'Cancel'
      );

      if (enable !== 'Enable') {
        return false;
      }

      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }

    // Pull first, then push
    await this.pull();
    return this.push();
  }

  /**
   * Create a new gist
   */
  private async createGist(token: string, payload: SyncPayload): Promise<void> {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        description: 'Cmdify - Synced Commands',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(payload, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json() as { id: string };
    this.gistId = data.id;
    await this.context.globalState.update('cmdify.gistId', this.gistId);
  }

  /**
   * Update existing gist
   */
  private async updateGist(token: string, payload: SyncPayload): Promise<void> {
    const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(payload, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      // Gist might have been deleted, try creating new one
      if (response.status === 404) {
        this.gistId = undefined;
        await this.context.globalState.update('cmdify.gistId', undefined);
        return this.createGist(token, payload);
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
  }

  /**
   * Fetch gist content
   */
  private async fetchGist(token: string): Promise<SyncPayload | undefined> {
    const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        this.gistId = undefined;
        await this.context.globalState.update('cmdify.gistId', undefined);
        return undefined;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json() as {
      files: Record<string, { content: string }>;
    };
    const content = data.files?.[GIST_FILENAME]?.content;

    if (!content) {
      return undefined;
    }

    return JSON.parse(content) as SyncPayload;
  }

  /**
   * Find existing Cmdify gist
   */
  private async findExistingGist(token: string): Promise<boolean> {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const gists = await response.json() as Array<{
      id: string;
      files: Record<string, unknown>;
    }>;
    const existing = gists.find((g) => GIST_FILENAME in g.files);

    if (existing) {
      this.gistId = existing.id;
      await this.context.globalState.update('cmdify.gistId', this.gistId);
      return true;
    }

    return false;
  }
}

/**
 * Handle sync command
 */
export async function handleSync(syncService: GitHubSyncService): Promise<void> {
  await syncService.sync();
}

/**
 * Handle GitHub login command
 */
export async function handleLogin(syncService: GitHubSyncService): Promise<void> {
  const session = await syncService.authenticate();
  if (session) {
    vscode.window.showInformationMessage(`Logged in as ${session.account.label}`);
  }
}

/**
 * Handle export commands to file
 */
export async function handleExport(storage: StorageService): Promise<void> {
  const commands = storage.exportCommands();
  
  if (commands.length === 0) {
    vscode.window.showInformationMessage('No commands to export.');
    return;
  }

  const payload: SyncPayload = {
    version: '1.0',
    commands,
    exportedAt: new Date().toISOString(),
  };

  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('cmdify-commands.json'),
    filters: {
      'JSON Files': ['json'],
      'All Files': ['*'],
    },
    saveLabel: 'Export Commands',
    title: 'Export Cmdify Commands',
  });

  if (!uri) {
    return;
  }

  try {
    const content = JSON.stringify(payload, null, 2);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
    vscode.window.showInformationMessage(`Exported ${commands.length} commands to ${uri.fsPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to export: ${message}`);
  }
}

/**
 * Handle import commands from file
 */
export async function handleImport(storage: StorageService): Promise<void> {
  const uris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: {
      'JSON Files': ['json'],
      'All Files': ['*'],
    },
    openLabel: 'Import Commands',
    title: 'Import Cmdify Commands',
  });

  if (!uris || uris.length === 0) {
    return;
  }

  try {
    const content = await vscode.workspace.fs.readFile(uris[0]);
    const payload = JSON.parse(content.toString()) as SyncPayload;

    if (!payload.commands || !Array.isArray(payload.commands)) {
      throw new Error('Invalid command file format');
    }

    // Ask user how to handle import
    const mergeOption = await vscode.window.showQuickPick([
      {
        label: '$(git-merge) Merge',
        description: 'Merge with existing commands (keeps both)',
        value: true,
      },
      {
        label: '$(replace-all) Replace',
        description: 'Replace all existing commands',
        value: false,
      },
    ], {
      placeHolder: 'How would you like to import?',
      title: 'Import Commands',
    });

    if (!mergeOption) {
      return;
    }

    await storage.importCommands(payload.commands, mergeOption.value);
    vscode.window.showInformationMessage(
      `Imported ${payload.commands.length} commands ${mergeOption.value ? '(merged)' : '(replaced)'}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to import: ${message}`);
  }
}
