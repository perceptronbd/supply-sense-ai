import { type LanguageModelV1, createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AI_MODEL_NAME } from '@supplysense/constant';

/**
 * Returns an initialized OpenRouter instance using the environment API key.
 */
export class GetOpenRouter {
  private readonly openrouter: ReturnType<typeof createOpenRouter>;
  private readonly model: LanguageModelV1;

  constructor() {
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    if (!process.env['OPENROUTER_API_KEY']) {
      throw new Error('OPENROUTER_API_KEY is not defined in the environment variables.');
    }

    this.openrouter = createOpenRouter({
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      apiKey: process.env['OPENROUTER_API_KEY'],
    });
    this.model = this.openrouter(AI_MODEL_NAME);
  }

  public getModel() {
    return this.model;
  }
}
