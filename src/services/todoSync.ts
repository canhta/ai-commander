/**
 * TODO Sync Service
 * Handles two-way sync between TODO comments in code and reminders
 */

import * as vscode from 'vscode';
import { DetectedTodo, DATE_PATTERN } from '../models/todo';
import { formatDateString } from '../utils/dateUtils';
import { TodoScannerService } from './todoScanner';

/**
 * TODO Sync Service
 * Manages syncing dates and status back to code comments
 */
export class TodoSyncService implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly scanner: TodoScannerService
  ) {}

  /**
   * Add a due date to a TODO comment in code
   */
  async addReminder(todo: DetectedTodo, dueDate: Date): Promise<boolean> {
    try {
      const document = await vscode.workspace.openTextDocument(todo.filePath);
      const line = document.lineAt(todo.lineNumber);
      const lineText = line.text;

      // Format date
      const dateStr = formatDateString(dueDate);
      let newText: string;

      // Check if already has a date
      if (DATE_PATTERN.test(lineText)) {
        // Replace existing date
        newText = lineText.replace(DATE_PATTERN, `@${dateStr}`);
      } else {
        // Add date after the TODO type
        // Match patterns like "// TODO:", "// TODO :", "# TODO:", etc.
        const typePattern = new RegExp(
          `((?:\\/\\/|#|<!--)\\s*(?:TODO|FIXME|HACK|XXX|BUG|OPTIMIZE|REVIEW))\\s*(:?)\\s*`,
          'i'
        );
        
        const match = typePattern.exec(lineText);
        if (match) {
          const prefix = lineText.substring(0, match.index + match[0].length);
          const suffix = lineText.substring(match.index + match[0].length);
          // Insert (@date) after TODO type
          newText = `${prefix.trimEnd()}(@${dateStr}): ${suffix.trim()}`;
        } else {
          // Fallback: append date at the end
          newText = `${lineText.trimEnd()} @${dateStr}`;
        }
      }

      // Apply edit
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, line.range, newText);
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        // Save the document
        await document.save();
        // Rescan the file
        await this.scanner.scanFile(document.uri);
      }

      return success;
    } catch (error) {
      console.error('Error adding reminder to TODO:', error);
      vscode.window.showErrorMessage(`Failed to add reminder: ${error}`);
      return false;
    }
  }

  /**
   * Remove the due date from a TODO comment
   */
  async removeReminder(todo: DetectedTodo): Promise<boolean> {
    try {
      const document = await vscode.workspace.openTextDocument(todo.filePath);
      const line = document.lineAt(todo.lineNumber);
      const lineText = line.text;

      // Remove date pattern including parentheses if present
      let newText = lineText
        .replace(/\(@\d{4}-\d{2}-\d{2}\)/g, '')
        .replace(/\(@(?:today|tomorrow|next-week|next-month)\)/gi, '')
        .replace(/@\d{4}-\d{2}-\d{2}/g, '')
        .replace(/@(?:today|tomorrow|next-week|next-month)/gi, '')
        .replace(/\s+:/g, ':')  // Clean up extra spaces before colon
        .replace(/:\s+/g, ': '); // Normalize space after colon

      // Apply edit
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, line.range, newText);
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        await document.save();
        await this.scanner.scanFile(document.uri);
      }

      return success;
    } catch (error) {
      console.error('Error removing reminder from TODO:', error);
      return false;
    }
  }

  /**
   * Mark a TODO as done by changing TODO to DONE in the code
   */
  async markDoneInCode(todo: DetectedTodo): Promise<boolean> {
    try {
      const document = await vscode.workspace.openTextDocument(todo.filePath);
      const line = document.lineAt(todo.lineNumber);
      const lineText = line.text;

      // Replace TODO/FIXME/etc with DONE
      const typePattern = /\b(TODO|FIXME|HACK|XXX|BUG|OPTIMIZE|REVIEW)\b/gi;
      const newText = lineText.replace(typePattern, 'DONE');

      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, line.range, newText);
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        await document.save();
        await this.scanner.markComplete(todo.id);
      }

      return success;
    } catch (error) {
      console.error('Error marking TODO as done:', error);
      return false;
    }
  }

  /**
   * Delete a TODO comment line entirely
   */
  async deleteTodoLine(todo: DetectedTodo): Promise<boolean> {
    // Confirm with user
    const confirm = await vscode.window.showWarningMessage(
      `Delete this TODO comment?\n"${todo.description}"`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (confirm !== 'Delete') {
      return false;
    }

    try {
      const document = await vscode.workspace.openTextDocument(todo.filePath);
      const line = document.lineAt(todo.lineNumber);

      const edit = new vscode.WorkspaceEdit();
      // Delete the entire line including the newline
      const range = new vscode.Range(
        line.range.start,
        document.lineAt(Math.min(todo.lineNumber + 1, document.lineCount - 1)).range.start
      );
      edit.delete(document.uri, range);
      
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        await document.save();
        // Rescan the entire file since line numbers changed
        await this.scanner.scanFile(document.uri);
      }

      return success;
    } catch (error) {
      console.error('Error deleting TODO line:', error);
      return false;
    }
  }

  /**
   * Open a TODO in the editor
   */
  async goToTodo(todo: DetectedTodo): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(todo.filePath);
      const editor = await vscode.window.showTextDocument(document);
      
      // Move cursor to the line
      const position = new vscode.Position(todo.lineNumber, 0);
      const selection = new vscode.Selection(position, position);
      editor.selection = selection;
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    } catch (error) {
      console.error('Error navigating to TODO:', error);
      vscode.window.showErrorMessage(`Failed to open file: ${todo.filePath}`);
    }
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
