export const AI_MODEL_NAMES = {
  DEEPSEEK: 'deepseek/deepseek-chat',
  Z_AI: 'z-ai/glm-4.5',
  GPT_4_NANO: 'openai/gpt-4.1-nano',
} as const;

export type TAiModelNames = (typeof AI_MODEL_NAMES)[keyof typeof AI_MODEL_NAMES];

export const AI_MODEL_TOKENS_PER_CREDIT = 1000;

export const AI_MODEL_COSTS = {
  [AI_MODEL_NAMES.DEEPSEEK]: {
    input: 0.18,
    output: 0.72,
  },
  [AI_MODEL_NAMES.Z_AI]: {
    input: 0.1,
    output: 0.8,
  },
  [AI_MODEL_NAMES.GPT_4_NANO]: {
    input: 0.1,
    output: 0.4,
  },
} as const;
