import { z } from 'zod';

const QuestionsSchema = z.array(z.string());

export async function fetchPublicSampleQuestions(): Promise<string[]> {
  try {
    if (!process.env.BACKEND_API_URL) {
      throw new Error('BACKEND_API_URL is not configured');
    }
    const url = `${process.env.BACKEND_API_URL}/table-metadata/public-sample-questions`;

    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error('Failed to fetch sample questions');

    const json = await res.json();

    const parsed = QuestionsSchema.safeParse(json?.data);

    if (!parsed.success) {
      console.error('Invalid sample questions format:', parsed.error);
      return [];
    }

    return parsed.data;
  } catch (err) {
    console.error('Error fetching public sample questions:', err);
    return [];
  }
}
