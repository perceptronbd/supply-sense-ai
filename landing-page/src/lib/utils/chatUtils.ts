interface ChatApiResponse {
  success: boolean;
  data: {
    message: string;
    sessionId: string;
    type: string;
    timestamp: string;
    data: {
      visualizationType: string;
      formattedData: Array<{ [key: string]: unknown }> | string | null;
      summary: string;
    };
  };
}

/**
 * Send a message to the public chat API
 * @param message The user's message
 * @returns Promise with the API response
 */
export async function sendPublicChatMessage(message: string): Promise<{
  success: boolean;
  message: string;
  timestamp: string;
}> {
  try {
    const url = `${process.env.BACKEND_API_URL}/chat/public/message`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`Chat API error: ${response.status} ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatApiResponse = await response.json();

    if (data.success) {
      return {
        success: true,
        message: data.data.data.summary || data.data.message,
        timestamp: data.data.timestamp,
      };
    } else {
      return {
        success: false,
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Error sending chat message:', error);

    // Provide a user-friendly error message
    let userMessage = 'Sorry, I am unable to connect. Please check your connection and try again.';

    // If it's our custom error with status info, include that
    if (error instanceof Error && error.message.startsWith('HTTP error!')) {
      userMessage = 'Sorry, there was a server error. Please try again later.';
    }

    return {
      success: false,
      message: userMessage,
      timestamp: new Date().toISOString(),
    };
  }
}
