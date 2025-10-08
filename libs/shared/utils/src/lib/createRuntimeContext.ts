import { RuntimeContext } from '@mastra/core/runtime-context';

export const createRuntimeContext = <T extends Record<string, unknown>>(
  contextData: T
): RuntimeContext<unknown> => {
  const runtimeContext = new RuntimeContext<unknown>();

  Object.entries(contextData).forEach(([key, value]) => {
    //@ts-expect-error the runtime context set method is not type safe
    runtimeContext.set(key as keyof T, value as T[keyof T]);
  });

  return runtimeContext;
};
