import * as vscode from 'vscode';
import { AIProvider, AIContext, AIResponse, getSystemPrompt, parseAIResponse } from '../../services/ai';

/**
 * Custom OpenAI-compatible provider for command generation
 */
export class CustomProvider implements AIProvider {
  id = 'custom';
  name = 'Custom Provider';

  constructor(private secretStorage: vscode.SecretStorage) {}

  async generate(prompt: string, context: AIContext): Promise<AIResponse> {
    const config = vscode.workspace.getConfiguration('cmdify.ai');
    const model = config.get<string>('model') || 'gpt-4o-mini';
    const endpoint = config.get<string>('customEndpoint');

    if (!endpoint) {
      throw new Error('Custom endpoint not configured. Use "Cmdify: Configure AI Provider" to set it up.');
    }

    const apiKey = await this.secretStorage.get('cmdify.custom');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if API key is provided
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: getSystemPrompt(context) },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from custom provider');
    }

    return parseAIResponse(content);
  }
}
