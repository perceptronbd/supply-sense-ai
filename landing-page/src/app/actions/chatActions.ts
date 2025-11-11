'use server';

import { sendPublicChatMessage } from '../../lib/utils/chatUtils';

export async function sendPublicMessage(message: string) {
  return await sendPublicChatMessage(message);
}
