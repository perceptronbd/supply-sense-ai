import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const testMetadataTool = createTool({
  id: 'test-metadata-tool',
  description: 'A simple tool to answer basic math questions for testing purposes.',
  inputSchema: z.object({
    question: z.string().describe('A simple math question, e.g., "What is 2 + 2?"'),
  }),
  outputSchema: z.object({
    answer: z.string(),
  }),
  //@ts-ignore
  async execute({ context }) {
    // Accept both direct and nested question property
    let question = context?.question;
    // If context is a string, treat it as the question
    if (!question && typeof context === 'string') {
      question = context;
    }
    if (!question || typeof question !== 'string') {
      return { answer: 'No question provided.' };
    }
    console.log('🚀 ~ question:', question);

    try {
      // Very basic math parser for demo purposes
      // Only supports +, -, *, /
      const match = question.match(/(-?\d+)\s*([+\-*/])\s*(-?\d+)/);
      if (match) {
        const a = Number(match[1]);
        const op = match[2];
        const b = Number(match[3]);
        let result: number;
        switch (op) {
          case '+':
            result = a + b;
            break;
          case '-':
            result = a - b;
            break;
          case '*':
            result = a * b;
            break;
          case '/':
            result = b !== 0 ? a / b : Number.NaN;
            break;
          default:
            return { answer: 'Unknown operation' };
        }
        console.log('🚀 ~ result:', result);
        return { answer: result.toString() };
      }
      // Handle square
      const squareMatch = question.match(/square of (\d+)/i);
      if (squareMatch) {
        const n = Number(squareMatch[1]);
        return { answer: (n * n).toString() };
      }
      return { answer: 'Sorry, I can only answer simple math questions.' };
    } catch {
      return { answer: 'Error processing question.' };
    }
  },
});
