import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AI_MODEL_NAME } from '@supplysense/constant';

/**
 * Returns an initialized OpenRouter instance using the environment API key.
 */
export class GetOpenRouter {
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

  public getModel(modelName?: string) {
    // Use provided model name or fallback to default
    const selectedModel = modelName || AI_MODEL_NAME;
    return this.openrouter(selectedModel);
  }
}
