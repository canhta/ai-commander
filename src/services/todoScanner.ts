/**
 * TODO Scanner Service
 * Scans workspace for TODO, FIXME, HACK, and other comment markers
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import {
  DetectedTodo,
  TodoPattern,
  TodoScannerConfig,
  StoredTodoMeta,
  DEFAULT_TODO_PATTERNS,
  DEFAULT_SCANNER_CONFIG,
  DATE_PATTERN,
  inferPriorityFromType,
} from '../models/todo';
import { parseDueDateString } from '../utils/dateUtils';

const TODO_META_KEY = 'cmdify.todos.meta';

/**
 * TODO Scanner Service
 */
export class TodoScannerService implements vscode.Disposable {
  private todos: Map<string, DetectedTodo> = new Map();
  private storedMeta: Map<string, StoredTodoMeta> = new Map();
  private config: TodoScannerConfig;
  private customPatterns: TodoPattern[] = [];
  private disposables: vscode.Disposable[] = [];

  // Event emitters
  private readonly _onTodosChanged = new vscode.EventEmitter<DetectedTodo[]>();
  readonly onTodosChanged = this._onTodosChanged.event;

  private readonly _onScanStarted = new vscode.EventEmitter<void>();
  readonly onScanStarted = this._onScanStarted.event;

  private readonly _onScanCompleted = new vscode.EventEmitter<number>();
  readonly onScanCompleted = this._onScanCompleted.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.config = this.loadConfig();
    this.loadStoredMeta();
    this.parseCustomPatterns();

    // Listen for config changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('cmdify.todos')) {
          this.config = this.loadConfig();
          this.parseCustomPatterns();
        }
      })
    );

    // Listen for file saves
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (this.config.scanOnSave && this.shouldScanFile(doc.uri)) {
          this.scanFile(doc.uri);
        }
      })
    );

    // Listen for file deletions
    this.disposables.push(
      vscode.workspace.onDidDeleteFiles((e) => {
        for (const uri of e.files) {
          this.removeTodosForFile(uri.fsPath);
        }
      })
    );
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfig(): TodoScannerConfig {
    const config = vscode.workspace.getConfiguration('cmdify.todos');
    return {
      includePatterns: config.get<string[]>('includePatterns', DEFAULT_SCANNER_CONFIG.includePatterns),
      excludePatterns: config.get<string[]>('excludePatterns', DEFAULT_SCANNER_CONFIG.excludePatterns),
      scanOnSave: config.get<boolean>('scanOnSave', DEFAULT_SCANNER_CONFIG.scanOnSave),
      customPatterns: config.get<string[]>('customPatterns', DEFAULT_SCANNER_CONFIG.customPatterns),
    };
  }

  /**
   * Load stored TODO metadata
   */
  private loadStoredMeta(): void {
    const stored = this.context.globalState.get<StoredTodoMeta[]>(TODO_META_KEY, []);
    this.storedMeta.clear();
    for (const meta of stored) {
      this.storedMeta.set(meta.id, meta);
    }
  }

  /**
   * Save stored TODO metadata
   */
  private async saveStoredMeta(): Promise<void> {
    const metaArray = Array.from(this.storedMeta.values());
    await this.context.globalState.update(TODO_META_KEY, metaArray);
  }

  /**
   * Parse custom regex patterns from config
   */
  private parseCustomPatterns(): void {
    this.customPatterns = [];
    for (const pattern of this.config.customPatterns) {
      try {
        const regex = new RegExp(pattern, 'gi');
        this.customPatterns.push({ regex, type: 'CUSTOM' });
      } catch (e) {
        console.warn(`Invalid custom TODO pattern: ${pattern}`);
      }
    }
  }

  /**
   * Generate a unique ID for a TODO
   */
  private generateId(filePath: string, lineNumber: number): string {
    const hash = crypto.createHash('md5');
    hash.update(`${filePath}:${lineNumber}`);
    return hash.digest('hex').substring(0, 12);
  }

  /**
   * Check if a file should be scanned
   */
  private shouldScanFile(uri: vscode.Uri): boolean {
    const relativePath = vscode.workspace.asRelativePath(uri);
    
    // Check exclude patterns first
    for (const pattern of this.config.excludePatterns) {
      if (this.matchGlob(relativePath, pattern)) {
        return false;
      }
    }

    // Check include patterns
    for (const pattern of this.config.includePatterns) {
      if (this.matchGlob(relativePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple glob matching (simplified for common patterns)
   */
  private matchGlob(path: string, pattern: string): boolean {
    // Convert glob to regex
    let regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    try {
      const regex = new RegExp(`^${regexStr}$`, 'i');
      return regex.test(path);
    } catch {
      return false;
    }
  }

  /**
   * Scan the entire workspace for TODOs
   */
  async scanWorkspace(): Promise<DetectedTodo[]> {
    this._onScanStarted.fire();
    this.todos.clear();

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      this._onScanCompleted.fire(0);
      return [];
    }

    // Build include pattern
    const includePattern = `{${this.config.includePatterns.join(',')}}`;
    const excludePattern = `{${this.config.excludePatterns.join(',')}}`;

    try {
      const files = await vscode.workspace.findFiles(includePattern, excludePattern, 1000);
      
      // Scan files in parallel (but limit concurrency)
      const batchSize = 20;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(uri => this.scanFile(uri, false)));
      }

      this._onTodosChanged.fire(this.getTodos());
      this._onScanCompleted.fire(this.todos.size);
    } catch (error) {
      console.error('Error scanning workspace:', error);
      this._onScanCompleted.fire(0);
    }

    return this.getTodos();
  }

  /**
   * Scan a single file for TODOs
   */
  async scanFile(uri: vscode.Uri, emitEvent: boolean = true): Promise<DetectedTodo[]> {
    const fileTodos: DetectedTodo[] = [];

    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const text = document.getText();
      const lines = text.split('\n');

      // Remove old todos for this file
      this.removeTodosForFile(uri.fsPath, false);

      // All patterns to check
      const allPatterns = [...DEFAULT_TODO_PATTERNS, ...this.customPatterns];

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];

        for (const pattern of allPatterns) {
          // Reset regex lastIndex
          pattern.regex.lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = pattern.regex.exec(line)) !== null) {
            const todoType = match[1]?.toUpperCase() || pattern.type;
            const description = match[2]?.trim() || match[0];
            const fullText = match[0];

            // Check for date pattern
            let dueDate: Date | undefined;
            let dueDateRaw: string | undefined;
            const dateMatch = DATE_PATTERN.exec(description);
            if (dateMatch) {
              dueDateRaw = dateMatch[1];
              dueDate = parseDueDateString(dueDateRaw);
            }

            const id = this.generateId(uri.fsPath, lineNum);
            const storedMeta = this.storedMeta.get(id);

            const todo: DetectedTodo = {
              id,
              filePath: uri.fsPath,
              lineNumber: lineNum,
              type: todoType,
              text: fullText,
              description: description.replace(DATE_PATTERN, '').trim(),
              dueDate,
              dueDateRaw,
              priority: inferPriorityFromType(todoType),
              status: storedMeta?.status || 'open',
              createdAt: storedMeta?.createdAt ? new Date(storedMeta.createdAt) : new Date(),
              completedAt: storedMeta?.completedAt ? new Date(storedMeta.completedAt) : undefined,
            };

            this.todos.set(id, todo);
            fileTodos.push(todo);

            // Save initial metadata if not exists
            if (!storedMeta) {
              this.storedMeta.set(id, {
                id,
                status: 'open',
                createdAt: new Date().toISOString(),
              });
            }

            // Only match once per line per pattern type
            break;
          }
        }
      }

      if (emitEvent && fileTodos.length > 0) {
        await this.saveStoredMeta();
        this._onTodosChanged.fire(this.getTodos());
      }
    } catch (error) {
      // File might not exist or be readable
      console.warn(`Error scanning file ${uri.fsPath}:`, error);
    }

    return fileTodos;
  }

  /**
   * Remove all TODOs for a file
   */
  private removeTodosForFile(filePath: string, emitEvent: boolean = true): void {
    const idsToRemove: string[] = [];
    for (const [id, todo] of this.todos) {
      if (todo.filePath === filePath) {
        idsToRemove.push(id);
      }
    }

    for (const id of idsToRemove) {
      this.todos.delete(id);
    }

    if (emitEvent && idsToRemove.length > 0) {
      this._onTodosChanged.fire(this.getTodos());
    }
  }

  /**
   * Get all detected TODOs
   */
  getTodos(): DetectedTodo[] {
    return Array.from(this.todos.values()).filter(t => t.status !== 'completed');
  }

  /**
   * Get all TODOs including completed
   */
  getAllTodos(): DetectedTodo[] {
    return Array.from(this.todos.values());
  }

  /**
   * Get a TODO by ID
   */
  getTodoById(id: string): DetectedTodo | undefined {
    return this.todos.get(id);
  }

  /**
   * Get overdue TODOs
   */
  getOverdueTodos(): DetectedTodo[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return this.getTodos().filter(todo => {
      if (!todo.dueDate || todo.status !== 'open') {
        return false;
      }
      const due = new Date(todo.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < now;
    });
  }

  /**
   * Get TODOs due today
   */
  getTodayTodos(): DetectedTodo[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getTodos().filter(todo => {
      if (!todo.dueDate || todo.status !== 'open') {
        return false;
      }
      const due = new Date(todo.dueDate);
      due.setHours(0, 0, 0, 0);
      return due >= now && due < tomorrow;
    });
  }

  /**
   * Get TODOs due this week
   */
  getThisWeekTodos(): DetectedTodo[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    return this.getTodos().filter(todo => {
      if (!todo.dueDate || todo.status !== 'open') {
        return false;
      }
      const due = new Date(todo.dueDate);
      due.setHours(0, 0, 0, 0);
      return due >= tomorrow && due <= endOfWeek;
    });
  }

  /**
   * Get TODOs with no date
   */
  getNoDateTodos(): DetectedTodo[] {
    return this.getTodos().filter(todo => !todo.dueDate && todo.status === 'open');
  }

  /**
   * Get completed TODOs
   */
  getCompletedTodos(): DetectedTodo[] {
    return Array.from(this.todos.values()).filter(t => t.status === 'completed');
  }

  /**
   * Mark a TODO as completed
   */
  async markComplete(id: string): Promise<void> {
    const todo = this.todos.get(id);
    if (todo) {
      todo.status = 'completed';
      todo.completedAt = new Date();

      const meta = this.storedMeta.get(id) || {
        id,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      meta.status = 'completed';
      meta.completedAt = new Date().toISOString();
      this.storedMeta.set(id, meta);

      await this.saveStoredMeta();
      this._onTodosChanged.fire(this.getTodos());
    }
  }

  /**
   * Mark a TODO as open
   */
  async markOpen(id: string): Promise<void> {
    const todo = this.todos.get(id);
    if (todo) {
      todo.status = 'open';
      todo.completedAt = undefined;

      const meta = this.storedMeta.get(id);
      if (meta) {
        meta.status = 'open';
        delete meta.completedAt;
        this.storedMeta.set(id, meta);
      }

      await this.saveStoredMeta();
      this._onTodosChanged.fire(this.getTodos());
    }
  }

  /**
   * Snooze a TODO until a specific date
   */
  async snoozeTodo(id: string, until: Date): Promise<void> {
    const todo = this.todos.get(id);
    if (todo) {
      todo.status = 'snoozed';

      const meta = this.storedMeta.get(id) || {
        id,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      meta.status = 'snoozed';
      meta.snoozedUntil = until.toISOString();
      this.storedMeta.set(id, meta);

      await this.saveStoredMeta();
      this._onTodosChanged.fire(this.getTodos());
    }
  }

  /**
   * Get total count of open TODOs
   */
  getOpenCount(): number {
    return this.getTodos().filter(t => t.status === 'open').length;
  }

  /**
   * Get count of TODOs due today or overdue
   */
  getDueCount(): number {
    return this.getOverdueTodos().length + this.getTodayTodos().length;
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this._onTodosChanged.dispose();
    this._onScanStarted.dispose();
    this._onScanCompleted.dispose();
  }
}
