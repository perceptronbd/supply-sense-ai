const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error = new Error('No error occurred but retry loop completed');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const waitTime = delayMs * 2 ** (attempt - 1);
        console.log(`Attempt ${attempt} failed. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      } else {
        console.error(`All ${maxRetries} attempts failed. Last error:`, lastError);
      }
    }
  }

  throw lastError;
}
