'use client';

import { get, set, del, keys } from 'idb-keyval';
import type { OrderDraftInput } from '@teletrade/shared';

const PREFIX = 'tt.draft.';

export async function saveDraft(localId: string, payload: OrderDraftInput) {
  await set(`${PREFIX}${localId}`, { savedAt: Date.now(), payload });
}

export async function getDraft(localId: string): Promise<OrderDraftInput | null> {
  const row = await get<{ payload: OrderDraftInput }>(`${PREFIX}${localId}`);
  return row?.payload ?? null;
}

export async function clearDraft(localId: string) {
  await del(`${PREFIX}${localId}`);
}

export async function listDraftKeys(): Promise<string[]> {
  const all = await keys();
  return all
    .map((k) => String(k))
    .filter((k) => k.startsWith(PREFIX))
    .map((k) => k.slice(PREFIX.length));
}
