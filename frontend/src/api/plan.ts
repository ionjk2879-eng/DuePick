import { apiClient } from './client';

export interface Plan {
  planType: 'FREE' | 'PRO';
  isPro: boolean;
  expiresAt: string | null;
}

export async function fetchMyPlan() {
  const { data } = await apiClient.get<Plan>('/plans/me');
  return data;
}

export async function upgradeToPro() {
  const { data } = await apiClient.post<Plan>('/plans/upgrade');
  return data;
}
