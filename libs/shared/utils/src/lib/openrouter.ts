import { createOpenRouter } from '@openrouter/ai-sdk-provider';

/**
 * Returns an initialized OpenRouter instance using the environment API key.
 */
export class GetOpenRouter {
  // biome-ignore lint/suspicious/noExplicitAny: OpenRouter provider type has private/protected properties that conflict with exported class
  private readonly openrouter: any;

  constructor() {
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    if (!process.env['OPENROUTER_API_KEY']) {
      throw new Error('OPENROUTER_API_KEY is not defined in the environment variables.');
    }

    this.openrouter = createOpenRouter({
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      apiKey: process.env['OPENROUTER_API_KEY'],
    });
  }

  public getModel(modelName: string) {
    return this.openrouter(modelName, {
      reasoning: {
        enabled: false,
        max_tokens: 10000,
      },
    });
  }
}
