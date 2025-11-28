import * as vscode from 'vscode';
import { AIProvider, AIContext, AIResponse, getSystemPrompt, parseAIResponse } from '../../services/ai';

/**
 * Azure OpenAI provider for command generation
 */
export class AzureOpenAIProvider implements AIProvider {
  id = 'azure';
  name = 'Azure OpenAI';

  constructor(private secretStorage: vscode.SecretStorage) {}

  async generate(prompt: string, context: AIContext): Promise<AIResponse> {
    const apiKey = await this.secretStorage.get('cmdify.azure');
    if (!apiKey) {
      throw new Error('Azure OpenAI API key not configured. Use "Cmdify: Configure AI Provider" to set it up.');
    }

    const config = vscode.workspace.getConfiguration('cmdify.ai');
    const model = config.get<string>('model') || 'gpt-4o-mini';
    const endpoint = config.get<string>('customEndpoint');

    if (!endpoint) {
      throw new Error('Azure OpenAI endpoint not configured. Use "Cmdify: Configure AI Provider" to set it up.');
    }

    // Azure OpenAI uses deployment names in the URL
    const apiUrl = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=2024-02-15-preview`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
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
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Azure OpenAI');
    }

    return parseAIResponse(content);
  }
}
