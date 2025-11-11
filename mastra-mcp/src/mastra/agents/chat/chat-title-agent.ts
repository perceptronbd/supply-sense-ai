import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { AI_MODEL_NAMES } from '@supplysense/constant';
import { GetOpenRouter } from '@supplysense/utils';
import {
  CHAT_TITLE_AGENT_DESCRIPTION,
  CHAT_TITLE_AGENT_INSTRUCTION,
  CHAT_TITLE_AGENT_NAME,
} from '../../constants/system-instructions/chat-title';

const openrouter = new GetOpenRouter();

interface RuntimeContextData {
  userQuestion: string;
  aiResponse: string;
}

export const chatTitleAgent = new Agent({
  name: CHAT_TITLE_AGENT_NAME,
  description: CHAT_TITLE_AGENT_DESCRIPTION,
  instructions: async ({ runtimeContext }) => {
    const context = runtimeContext as RuntimeContext<RuntimeContextData>;
    const userQuestion = context.get('userQuestion');
    const aiResponse = context.get('aiResponse');

    console.log('userQuestion', userQuestion);
    console.log('aiResponse', aiResponse);

    return `You are a session title generation AI assistant. Your task is to analyze user questions and AI responses to create concise, descriptive session titles that capture the essence of the conversation. Focus on the main topic, data being analyzed, or business question being addressed.
    
    ## Context
    User Question: ${userQuestion}
    AI Response: ${aiResponse}
    
    ## Instructions
    ${CHAT_TITLE_AGENT_INSTRUCTION}
    `;
  },
  model: openrouter.getModel(AI_MODEL_NAMES.GPT_4_NANO),
});
