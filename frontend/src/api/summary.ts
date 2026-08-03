import { apiClient } from './client';

export interface CategoryTotal {
  category: string;
  monthlyTotal: number;
}

export interface MonthlyCount {
  month: string; // "2026-07"
  count: number;
}

export interface Summary {
  businessMonthlyTotal: number;
  personalMonthlyTotal: number;
  byAccountingCategory: CategoryTotal[];
  registrationTrend: MonthlyCount[];
}

export async function fetchSummary() {
  const { data } = await apiClient.get<Summary>('/subscriptions/summary');
  return data;
}
