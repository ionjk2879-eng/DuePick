import { apiClient } from './client';
import type { Subscription, SubscriptionInput } from '../types';

export async function fetchSubscriptions() {
  const { data } = await apiClient.get<Subscription[]>('/subscriptions');
  return data;
}

export async function createSubscription(input: SubscriptionInput) {
  const { data } = await apiClient.post<Subscription>('/subscriptions', input);
  return data;
}

export async function updateSubscription(id: number, input: SubscriptionInput) {
  const { data } = await apiClient.put<Subscription>(`/subscriptions/${id}`, input);
  return data;
}

export async function deleteSubscription(id: number) {
  await apiClient.delete(`/subscriptions/${id}`);
}
