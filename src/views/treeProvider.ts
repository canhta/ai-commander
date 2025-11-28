import * as vscode from 'vscode';
import { CLICommand, getDisplayName } from '../models/command';
import { CommandTreeItem, TreeItemType } from '../models/types';
import { StorageService } from '../services/storage';

/**
 * Tree data provider for the commands sidebar
 */
export class CommandsTreeProvider implements vscode.TreeDataProvider<CommandTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<CommandTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private storage: StorageService) {
    // Refresh when storage changes
    storage.onDidChange(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CommandTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CommandTreeItem): Thenable<CommandTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.getRootItems());
    }

    if (element.itemType === 'recent') {
      return Promise.resolve(this.getRecentCommands());
    }

    if (element.itemType === 'tag' && element.tagName) {
      return Promise.resolve(this.getCommandsByTag(element.tagName));
    }

    if (element.itemType === 'source' && element.sourceName) {
      return Promise.resolve(this.getCommandsBySource(element.sourceName));
    }

    return Promise.resolve([]);
  }

  private getRootItems(): CommandTreeItem[] {
    const config = vscode.workspace.getConfiguration('cmdify.view');
    const showRecent = config.get<boolean>('showRecent', true);
    const groupBy = config.get<string>('groupBy', 'tags');

    const items: CommandTreeItem[] = [];

    // Recent section
    if (showRecent) {
      const recentCount = this.storage.getRecent().length;
      if (recentCount > 0) {
        items.push(this.createCategoryItem('Recent', 'recent', recentCount, 'history'));
      }
    }

    // Group by tags, source, or show flat list
    if (groupBy === 'tags') {
      const grouped = this.storage.getGroupedByTag();
      const sortedTags = Array.from(grouped.keys()).sort();

      for (const tag of sortedTags) {
        const count = grouped.get(tag)?.length || 0;
        items.push(this.createCategoryItem(tag, 'tag', count, 'tag', tag));
      }
    } else if (groupBy === 'source') {
      const grouped = this.storage.getGroupedBySource();
      const sourceOrder = ['ai', 'manual', 'imported', 'shared'];
      const sourceLabels: Record<string, string> = {
        'ai': 'AI Generated',
        'manual': 'Manual',
        'imported': 'Imported',
        'shared': 'Shared',
      };
      const sourceIcons: Record<string, string> = {
        'ai': 'sparkle',
        'manual': 'edit',
        'imported': 'cloud-download',
        'shared': 'cloud',
      };

      for (const source of sourceOrder) {
        const commands = grouped.get(source);
        if (commands && commands.length > 0) {
          items.push(this.createCategoryItem(
            sourceLabels[source] || source,
            'source' as TreeItemType,
            commands.length,
            sourceIcons[source] || 'terminal',
            undefined,
            source
          ));
        }
      }
    } else {
      // Flat list (none)
      const commands = this.storage.getAll();
      for (const cmd of commands) {
        items.push(this.createCommandItem(cmd));
      }
    }

    // Show welcome message if no commands
    if (items.length === 0) {
      const welcomeItem: CommandTreeItem = {
        label: '✨ Create your first command',
        itemType: 'command',
        command: {
          command: 'cmdify.create',
          title: 'Create Command',
        },
        collapsibleState: vscode.TreeItemCollapsibleState.None,
      };
      items.push(welcomeItem);
    }

    return items;
  }

  private getRecentCommands(): CommandTreeItem[] {
    const config = vscode.workspace.getConfiguration('cmdify.view');
    const recentCount = config.get<number>('recentCount', 5);
    const recent = this.storage.getRecent(recentCount);
    return recent.map((cmd) => this.createCommandItem(cmd));
  }

  private getCommandsByTag(tag: string): CommandTreeItem[] {
    const grouped = this.storage.getGroupedByTag();
    const commands = grouped.get(tag) || [];
    return commands.map((cmd) => this.createCommandItem(cmd));
  }

  private getCommandsBySource(source: string): CommandTreeItem[] {
    const grouped = this.storage.getGroupedBySource();
    const commands = grouped.get(source) || [];
    return commands.map((cmd) => this.createCommandItem(cmd));
  }

  private createCategoryItem(
    label: string,
    itemType: TreeItemType,
    count: number,
    icon: string,
    tagName?: string,
    sourceName?: string
  ): CommandTreeItem {
    const displayLabel = tagName === 'untagged' ? 'Untagged' : label;
    return {
      label: displayLabel,
      description: `${count}`,
      itemType,
      tagName,
      sourceName,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      iconPath: new vscode.ThemeIcon(icon),
      contextValue: 'category',
    };
  }

  private createCommandItem(cmd: CLICommand): CommandTreeItem {
    const item: CommandTreeItem = {
      label: getDisplayName(cmd),
      tooltip: new vscode.MarkdownString(this.formatTooltip(cmd)),
      description: this.getCommandDescription(cmd),
      itemType: 'command',
      commandData: cmd,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      iconPath: new vscode.ThemeIcon(this.getCommandIcon(cmd)),
      contextValue: 'command',
    };

    return item;
  }

  private formatTooltip(cmd: CLICommand): string {
    const lines = [
      `**${cmd.prompt}**`,
      '',
      '```',
      cmd.command,
      '```',
    ];

    if (cmd.tags.length > 0) {
      lines.push('', `Tags: ${cmd.tags.join(', ')}`);
    }

    if (cmd.usageCount > 0) {
      lines.push(`Used ${cmd.usageCount} times`);
    }

    if (cmd.lastUsedAt) {
      const lastUsed = new Date(cmd.lastUsedAt);
      lines.push(`Last used: ${this.formatRelativeTime(lastUsed)}`);
    }

    return lines.join('\n');
  }

  private getCommandDescription(cmd: CLICommand): string {
    // Show source icon
    switch (cmd.source) {
      case 'ai':
        return '$(sparkle)';
      case 'shared':
        return '$(cloud)';
      case 'imported':
        return '$(cloud-download)';
      default:
        return '';
    }
  }

  private getCommandIcon(cmd: CLICommand): string {
    // Could be customized based on command type or tags
    return 'terminal';
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes === 0) {
          return 'just now';
        }
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
      }
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    if (days === 1) {
      return 'yesterday';
    }

    if (days < 7) {
      return `${days} days ago`;
    }

    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }

    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
