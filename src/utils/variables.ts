import * as vscode from 'vscode';
import { CommandVariable } from '../models/command';

/**
 * Regular expression to match variables in {{name}} format
 */
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * Extract variables from a command string
 */
export function extractVariables(command: string): CommandVariable[] {
  const variables: CommandVariable[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = VARIABLE_PATTERN.exec(command)) !== null) {
    const name = match[1].trim();
    if (!seen.has(name)) {
      seen.add(name);
      variables.push({ name });
    }
  }

  return variables;
}

/**
 * Replace variables in a command with their values
 */
export function replaceVariables(command: string, values: Map<string, string>): string {
  return command.replace(VARIABLE_PATTERN, (_, name) => {
    const trimmedName = name.trim();
    return values.get(trimmedName) ?? `{{${trimmedName}}}`;
  });
}

/**
 * Check if a command has variables
 */
export function hasVariables(command: string): boolean {
  return VARIABLE_PATTERN.test(command);
}

/**
 * Prompt user for variable values
 */
export async function promptForVariables(
  variables: CommandVariable[],
  command: string
): Promise<Map<string, string> | undefined> {
  const values = new Map<string, string>();

  for (const variable of variables) {
    const value = await vscode.window.showInputBox({
      prompt: variable.description || `Enter value for ${variable.name}`,
      placeHolder: variable.defaultValue || variable.name,
      value: variable.defaultValue,
      title: `Variable: ${variable.name}`,
    });

    if (value === undefined) {
      // User cancelled
      return undefined;
    }

    values.set(variable.name, value || variable.defaultValue || '');
  }

  return values;
}

/**
 * Show variable input with live preview
 */
export async function promptForVariablesWithPreview(
  variables: CommandVariable[],
  command: string
): Promise<string | undefined> {
  if (variables.length === 0) {
    return command;
  }

  const values = await promptForVariables(variables, command);
  if (!values) {
    return undefined;
  }

  return replaceVariables(command, values);
}

/**
 * Merge extracted variables with AI-suggested variables
 */
export function mergeVariables(
  extracted: CommandVariable[],
  suggested: CommandVariable[] | undefined
): CommandVariable[] {
  if (!suggested || suggested.length === 0) {
    return extracted;
  }

  const merged: CommandVariable[] = [];
  const extractedNames = new Set(extracted.map(v => v.name));

  // Add extracted variables, enriching with suggested data if available
  for (const ext of extracted) {
    const sug = suggested.find(s => s.name === ext.name);
    merged.push({
      name: ext.name,
      defaultValue: sug?.defaultValue || ext.defaultValue,
      description: sug?.description || ext.description,
    });
  }

  // Add any suggested variables that weren't extracted (shouldn't happen, but just in case)
  for (const sug of suggested) {
    if (!extractedNames.has(sug.name)) {
      merged.push(sug);
    }
  }

  return merged;
}
