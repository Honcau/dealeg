import { config } from './config';

export interface DealCard {
  id: string; provider: string; category: string; code: string; hideCode: boolean;
  title: string; description: string; discount: string; discountValue: number;
  isVerified: boolean; expiresAt: string | null; url: string; createdAt: string;
}

export interface BotUser {
  id: number; platform: string; chatId: string; locale: string;
  categories: string[]; frequency: string; isActive: boolean;
}

export interface PendingSend {
  botUserId: number; chatId: string; locale: string; deal: DealCard;
}

/** Bot chỉ nói chuyện với app qua HTTP + 1 bearer token — không cần credential DB. */
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${config.apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const getPending = (limit = 200) =>
  api<PendingSend[]>(`/api/internal/bot/pending?limit=${limit}`);

export const getDeals = (locale: string, limit = 5) =>
  api<DealCard[]>(`/api/internal/deals?locale=${encodeURIComponent(locale)}&limit=${limit}`);

export const upsertUser = (body: { chatId: string; locale?: string; source?: string }) =>
  api<BotUser>('/api/internal/bot/users', { method: 'POST', body: JSON.stringify({ platform: 'telegram', ...body }) });

export const updateUser = (body: { chatId: string; locale?: string; isActive?: boolean; categories?: string[] }) =>
  api<BotUser>('/api/internal/bot/users', { method: 'PATCH', body: JSON.stringify({ platform: 'telegram', ...body }) });

export async function getUser(chatId: string): Promise<BotUser | null> {
  try {
    return await api<BotUser>(`/api/internal/bot/users?platform=telegram&chatId=${encodeURIComponent(chatId)}`);
  } catch {
    return null;   // 404 = chưa /start bao giờ
  }
}

export const recordSent = (sends: { botUserId: number; dealId: string; channel: string }[]) =>
  api<{ recorded: number }>('/api/internal/bot/sent', { method: 'POST', body: JSON.stringify({ sends }) });
