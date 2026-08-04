import { apiClient } from './client';
import type { Deal } from './deals';

export interface NotionStatus {
  connected: boolean;
  workspaceId: string | null;
  workspaceName: string | null;
  updatedAt: string | null;
}

export async function fetchNotionStatus(): Promise<NotionStatus> {
  return (await apiClient.get<NotionStatus>('/integrations/notion/status')).data;
}

export async function connectNotion(): Promise<void> {
  const { authorizationUrl } = (await apiClient.post<{ authorizationUrl: string }>('/integrations/notion/connect')).data;
  window.location.assign(authorizationUrl);
}

export async function disconnectNotion(): Promise<void> {
  await apiClient.delete('/integrations/notion');
}

export async function exportDealToNotion(id: number): Promise<Deal> {
  return (await apiClient.post<Deal>(`/deals/${id}/notion`)).data;
}
