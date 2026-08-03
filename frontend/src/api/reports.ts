import { apiClient } from './client';
import type { UsageType } from '../types';

interface ReportParams {
  usageType?: UsageType;
  from?: string; // yyyy-MM-dd
  to?: string;
}

async function downloadFile(url: string, params: ReportParams, fallbackFilename: string) {
  const { data, headers } = await apiClient.get(url, {
    params,
    responseType: 'blob',
  });

  const disposition: string | undefined = headers['content-disposition'];
  const match = disposition?.match(/filename="(.+)"/);
  const filename = match?.[1] ?? fallbackFilename;

  const blobUrl = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function downloadCsvReport(params: ReportParams) {
  return downloadFile('/reports/subscriptions/csv', params, 'subscriptions-report.csv');
}

export function downloadPdfReport(params: ReportParams) {
  return downloadFile('/reports/subscriptions/pdf', params, 'subscriptions-report.pdf');
}
