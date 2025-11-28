import * as vscode from 'vscode';
import { CLICommand } from '../models/command';
import { StorageService } from '../services/storage';
import { extractVariables } from '../utils/variables';

interface CommandTreeItem {
  commandData?: CLICommand;
}

/**
 * Handle editing a command
 */
export async function handleEdit(
  item: CommandTreeItem | undefined,
  storage: StorageService
): Promise<void> {
  if (!item?.commandData) {
    const commands = storage.getAll();
    if (commands.length === 0) {
      vscode.window.showInformationMessage('No commands to edit.');
      return;
    }

    const items = commands.map((cmd) => ({
      label: cmd.prompt || cmd.command,
      description: cmd.tags.join(', '),
      detail: cmd.command,
      command: cmd,
    }));

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a command to edit',
      matchOnDetail: true,
    });

    if (!selection) {
      return;
    }

    await editCommand(selection.command, storage);
    return;
  }

  await editCommand(item.commandData, storage);
}

/**
 * Edit a specific command
 */
async function editCommand(cmd: CLICommand, storage: StorageService): Promise<void> {
  // Edit command
  const newCommand = await vscode.window.showInputBox({
    prompt: 'Edit the command',
    value: cmd.command,
    title: 'Edit Command',
  });

  if (newCommand === undefined) {
    return; // User cancelled
  }

  // Edit description/prompt
  const newPrompt = await vscode.window.showInputBox({
    prompt: 'Edit the description',
    value: cmd.prompt,
    title: 'Edit Description',
  });

  if (newPrompt === undefined) {
    return; // User cancelled
  }

  // Edit tags
  const newTags = await vscode.window.showInputBox({
    prompt: 'Edit tags (comma-separated)',
    value: cmd.tags.join(', '),
    title: 'Edit Tags',
  });

  if (newTags === undefined) {
    return; // User cancelled
  }

  const tags = newTags
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // Extract new variables
  const variables = extractVariables(newCommand);

  // Update the command
  const updatedCommand: CLICommand = {
    ...cmd,
    command: newCommand,
    prompt: newPrompt,
    tags,
    variables,
  };

  await storage.update(updatedCommand);
  vscode.window.showInformationMessage('Command updated!');
}

/**
 * Handle deleting a command
 */
export async function handleDelete(
  item: CommandTreeItem | undefined,
  storage: StorageService
): Promise<void> {
  if (!item?.commandData) {
    const commands = storage.getAll();
    if (commands.length === 0) {
      vscode.window.showInformationMessage('No commands to delete.');
      return;
    }

    const items = commands.map((cmd) => ({
      label: cmd.prompt || cmd.command,
      description: cmd.tags.join(', '),
      detail: cmd.command,
      command: cmd,
    }));

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a command to delete',
      matchOnDetail: true,
    });

    if (!selection) {
      return;
    }

    await deleteCommand(selection.command, storage);
    return;
  }

  await deleteCommand(item.commandData, storage);
}

/**
 * Delete a specific command
 */
async function deleteCommand(cmd: CLICommand, storage: StorageService): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    `Delete "${cmd.prompt || cmd.command}"?`,
    { modal: true },
    'Delete',
    'Cancel'
  );

  if (confirm !== 'Delete') {
    return;
  }

  await storage.delete(cmd.id);
  vscode.window.showInformationMessage('Command deleted!');
}
