import * as vscode from 'vscode';
import {
  AIProvider,
  AIContext,
  AIResponse,
  getSystemPrompt,
  parseAIResponse,
} from '../../services/ai';
import { getAIConfig, generateOpenAICompatible, makeAPIRequest } from './base';

/**
 * Supported API formats for custom providers
 */
export type CustomAPIFormat = 'openai' | 'google' | 'generic';

/**
 * Get custom provider configuration
 */
function getCustomConfig(): {
  endpoint: string;
  model: string;
  apiFormat: CustomAPIFormat;
  apiKeyHeader: string;
} {
  const config = vscode.workspace.getConfiguration('cmdify.ai');
  const aiConfig = getAIConfig('custom-model');

  return {
    endpoint: aiConfig.customEndpoint || '',
    model: aiConfig.model,
    // Support legacy 'gemini' format name as 'google'
    apiFormat:
      config.get<string>('customApiFormat') === 'gemini'
        ? 'google'
        : config.get<CustomAPIFormat>('customApiFormat') || 'openai',
    apiKeyHeader: config.get<string>('customApiKeyHeader') || 'Authorization',
  };
}

/**
 * Google-style API request format (generateContent endpoint)
 */
interface GoogleStyleRequest {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Google-style API response format
 */
interface GoogleStyleResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

/**
 * Generate using Google-style API format (generateContent)
 */
async function generateGoogleStyle(
  endpoint: string,
  headers: Record<string, string>,
  prompt: string,
  context: AIContext
): Promise<AIResponse> {
  const fullPrompt = `${getSystemPrompt(context)}\n\nUser request: ${prompt}`;

  const body: GoogleStyleRequest = {
    contents: [
      {
        parts: [{ text: fullPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
    },
  };

  const data = await makeAPIRequest<GoogleStyleResponse>(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    },
    'Custom'
  );

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('No response from API');
  }

  return parseAIResponse(content);
}

/**
 * Generate using generic text API format
 * Expects: { prompt: string } -> { response: string } or { text: string }
 */
async function generateGeneric(
  endpoint: string,
  headers: Record<string, string>,
  prompt: string,
  context: AIContext
): Promise<AIResponse> {
  const fullPrompt = `${getSystemPrompt(context)}\n\nUser request: ${prompt}`;

  const data = await makeAPIRequest<Record<string, unknown>>(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        temperature: 0.3,
        max_tokens: 500,
      }),
    },
    'Custom'
  );

  // Try to extract text from common response formats
  const content =
    (data.response as string) ||
    (data.text as string) ||
    (data.output as string) ||
    (data.result as string) ||
    (data.content as string) ||
    (data.generated_text as string);

  if (!content) {
    throw new Error('No response from custom provider. Unexpected response format.');
  }

  return parseAIResponse(content);
}

/**
 * Custom provider supporting multiple API formats
 */
export class CustomProvider implements AIProvider {
  id = 'custom';
  name = 'Custom Provider';

  constructor(private secretStorage: vscode.SecretStorage) {}

  async generate(prompt: string, context: AIContext): Promise<AIResponse> {
    const customConfig = getCustomConfig();

    if (!customConfig.endpoint) {
      throw new Error(
        'Custom endpoint not configured. Use "Cmdify: Configure AI Provider" to set it up.'
      );
    }

    const apiKey = await this.secretStorage.get('cmdify.custom');
    const headers: Record<string, string> = {};

    // Add API key header if provided
    if (apiKey) {
      if (customConfig.apiKeyHeader === 'X-goog-api-key') {
        headers['X-goog-api-key'] = apiKey;
      } else if (customConfig.apiKeyHeader === 'X-API-Key') {
        headers['X-API-Key'] = apiKey;
      } else {
        // Default: Bearer token
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    switch (customConfig.apiFormat) {
      case 'google':
        return generateGoogleStyle(customConfig.endpoint, headers, prompt, context);

      case 'generic':
        return generateGeneric(customConfig.endpoint, headers, prompt, context);

      case 'openai':
      default:
        return generateOpenAICompatible(
          customConfig.endpoint,
          headers,
          customConfig.model,
          prompt,
          context,
          'Custom'
        );
    }
  }
}
