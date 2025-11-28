import * as vscode from 'vscode';
import { CLICommand } from '../models/command';
import { CommandTreeItem } from '../models/types';
import { StorageService } from '../services/storage';
import { analyzeCommand, getWarningMessage } from '../services/security';
import { executeCommand, getWorkspaceFolder, promptWorkingDirectory } from '../utils/shell';
import { hasVariables, extractVariables, promptForVariablesWithPreview } from '../utils/variables';
import { selectCommand, createCommandQuickPickItems } from '../utils/quickPick';

/**
 * Handle running a command
 */
export async function handleRun(
  item: CommandTreeItem | undefined,
  storage: StorageService
): Promise<void> {
  const cmd = await selectCommand(item, storage, {
    placeHolder: 'Select a command to run',
    emptyMessage: 'No commands saved yet.',
    showCreateOption: true,
  });

  if (cmd) {
    await runCommand(cmd, storage);
  }
}

/**
 * Run a specific command
 */
async function runCommand(cmd: CLICommand, storage: StorageService): Promise<void> {
  let commandToRun = cmd.command;

  // Handle variables
  if (hasVariables(commandToRun)) {
    const variables = cmd.variables || extractVariables(commandToRun);
    const processed = await promptForVariablesWithPreview(variables, commandToRun);
    
    if (!processed) {
      return; // User cancelled
    }
    
    commandToRun = processed;
  }

  // Security check
  const config = vscode.workspace.getConfiguration('cmdify.execution');
  const confirmDestructive = config.get<boolean>('confirmDestructive', true);

  if (confirmDestructive && !cmd.skipDestructiveWarning) {
    const analysis = analyzeCommand(commandToRun);

    if (analysis.blocked) {
      vscode.window.showErrorMessage(
        'This command is blocked for safety reasons.',
        { modal: true }
      );
      return;
    }

    if (analysis.warnings.length > 0) {
      const warningMessage = getWarningMessage(analysis);
      
      const result = await vscode.window.showWarningMessage(
        `⚠️ Heads up - this looks destructive\n\n${commandToRun}\n\n${warningMessage}`,
        { modal: true },
        'Run Anyway',
        "Don't Warn for This Command",
        'Cancel'
      );

      if (result === "Don't Warn for This Command") {
        // Update command to skip future warnings
        const updatedCmd: CLICommand = {
          ...cmd,
          skipDestructiveWarning: true,
        };
        await storage.update(updatedCmd);
        // Continue to run the command
      } else if (result !== 'Run Anyway') {
        return;
      }
    }
  }

  // Handle working directory
  let workingDirectory: string | undefined;

  if (cmd.workingDirectory) {
    switch (cmd.workingDirectory.type) {
      case 'workspace':
        workingDirectory = getWorkspaceFolder();
        break;
      case 'custom':
        workingDirectory = cmd.workingDirectory.path;
        break;
      case 'ask':
        workingDirectory = await promptWorkingDirectory();
        if (!workingDirectory) {
          return; // User cancelled
        }
        break;
    }
  }

  // Execute the command
  executeCommand(commandToRun, { workingDirectory });

  // Record usage
  await storage.recordUsage(cmd.id);
}

/**
 * Handle copying a command to clipboard
 */
export async function handleCopy(
  item: CommandTreeItem | undefined,
  storage: StorageService
): Promise<void> {
  const cmd = await selectCommand(item, storage, {
    placeHolder: 'Select a command to copy',
    emptyMessage: 'No commands to copy.',
  });

  if (cmd) {
    await vscode.env.clipboard.writeText(cmd.command);
    vscode.window.showInformationMessage('Command copied to clipboard!');
  }
}

/**
 * Search and optionally generate commands
 */
export async function handleSearch(storage: StorageService): Promise<void> {
  const commands = storage.getAll();
  const items: vscode.QuickPickItem[] = createCommandQuickPickItems(commands);

  // Add AI generation option
  items.push({
    label: '$(sparkle) Generate with AI...',
    description: 'Describe what you want to do',
    alwaysShow: true,
  });

  const selection = await vscode.window.showQuickPick(items, {
    placeHolder: 'Search or describe a command...',
    matchOnDetail: true,
    matchOnDescription: true,
  });

  if (!selection) {
    return;
  }

  if (selection.label === '$(sparkle) Generate with AI...') {
    await vscode.commands.executeCommand('cmdify.create');
    return;
  }

  // Find and run the selected command
  const cmd = commands.find(
    (c) => (c.prompt || c.command) === selection.label && c.command === selection.detail
  );

  if (cmd) {
    await runCommand(cmd, storage);
  }
}
