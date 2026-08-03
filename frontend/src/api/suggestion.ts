import { apiClient } from './client';
import type { UsageType } from '../types';

export interface SuggestionResult {
  matched: boolean;
  suggestedUsageType: UsageType | null;
  suggestedAccountingCategory: string | null;
  note: string;
}

export async function suggestCategory(serviceName: string) {
  const { data } = await apiClient.get<SuggestionResult>('/subscriptions/suggest', {
    params: { serviceName },
  });
  return data;
}
