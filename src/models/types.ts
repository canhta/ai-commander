/**
 * Shared type definitions
 */

import * as vscode from 'vscode';
import { CLICommand } from './command';

/**
 * Tree item type for categorization
 */
export type TreeItemType = 'favorites' | 'recent' | 'tag' | 'source' | 'command' | 'mostUsed';

/**
 * Command tree item interface for sidebar and command handlers
 */
export interface CommandTreeItem extends vscode.TreeItem {
  command?: vscode.Command;
  commandData?: CLICommand;
  itemType?: TreeItemType;
  tagName?: string;
  sourceName?: string;
}

/**
 * Quick pick item with command data
 */
export interface CommandQuickPickItem extends vscode.QuickPickItem {
  command?: CLICommand;
}
