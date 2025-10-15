import { api } from '../utils/api';

export type ChatMessageRequest = {
  message: string;
};

export type ChatMessageResponse = {
  response: string;
  source?: string;
  timestamp?: string;
  success?: boolean;
};

export type ChatHelpResponse = {
  message: string;
  availableTopics: string[];
  exampleQuestions: string[];
  tips: string[];
};

export type ChatUsageResponse = {
  rateLimitingEnabled: boolean;
  limits: { maxPerHour: number; maxPerDay: number };
  usage: {
    hourly: { used: number; remaining: number; resetTime: string };
    daily: { used: number; remaining: number; resetTime: string };
  };
  ipAddress?: string;
  timestamp?: string;
};

export async function sendChatMessage(message: string): Promise<ChatMessageResponse> {
  // Backend returns 200 with success=false on failures; pass through for UI handling
  const res = await api.post<ChatMessageResponse>('Chat/message', { message } satisfies ChatMessageRequest);
  return res;
}

export async function getChatHelp(): Promise<ChatHelpResponse> {
  return await api.get<ChatHelpResponse>('Chat/help');
}

export async function getChatUsage(): Promise<ChatUsageResponse> {
  return await api.get<ChatUsageResponse>('Chat/usage');
}
