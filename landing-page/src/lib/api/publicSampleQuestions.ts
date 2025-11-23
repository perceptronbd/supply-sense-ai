export async function fetchPublicSampleQuestions(): Promise<string[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/table-metadata/public-sample-questions`;

    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error('Failed to fetch sample questions');

    const json = await res.json();

    return json?.data || [];
  } catch (err) {
    console.error('Error fetching public sample questions:', err);
    return [];
  }
}
