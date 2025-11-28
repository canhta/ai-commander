import * as vscode from 'vscode';
import { CLICommand } from '../models/command';
import { CommandTreeItem, CommandQuickPickItem } from '../models/types';
import { StorageService } from '../services/storage';

/**
 * Create quick pick items from commands
 */
export function createCommandQuickPickItems(commands: CLICommand[]): CommandQuickPickItem[] {
  return commands.map((cmd) => ({
    label: cmd.prompt || cmd.command,
    description: cmd.tags.join(', '),
    detail: cmd.command,
    command: cmd,
  }));
}

/**
 * Show a quick pick to select a command, or use the provided item
 * Returns the selected command or undefined if cancelled/no commands
 */
export async function selectCommand(
  item: CommandTreeItem | undefined,
  storage: StorageService,
  options: {
    placeHolder: string;
    emptyMessage: string;
    showCreateOption?: boolean;
  }
): Promise<CLICommand | undefined> {
  // If item has command data, return it directly
  if (item?.commandData) {
    return item.commandData;
  }

  const commands = storage.getAll();
  
  if (commands.length === 0) {
    if (options.showCreateOption) {
      const create = await vscode.window.showInformationMessage(
        'No commands saved yet. Create your first command?',
        'Create'
      );
      if (create === 'Create') {
        await vscode.commands.executeCommand('cmdify.create');
      }
    } else {
      vscode.window.showInformationMessage(options.emptyMessage);
    }
    return undefined;
  }

  const items = createCommandQuickPickItems(commands);

  const selection = await vscode.window.showQuickPick(items, {
    placeHolder: options.placeHolder,
    matchOnDetail: true,
  });

  return selection?.command;
}
