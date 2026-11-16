import axios from 'axios';
import { WebsiteSource, Expo, FetchLog, DashboardStats, PaginationMeta, ExpoFilterState } from '../types';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<{ success: boolean; data: DashboardStats }>('/expos/dashboard/stats');
    return res.data.data;
  },

  // Sources
  getSources: async (): Promise<WebsiteSource[]> => {
    const res = await apiClient.get<{ success: boolean; data: WebsiteSource[] }>('/sources');
    return res.data.data;
  },

  getSourceById: async (id: string): Promise<WebsiteSource> => {
    const res = await apiClient.get<{ success: boolean; data: WebsiteSource }>(`/sources/${id}`);
    return res.data.data;
  },

  createSource: async (data: Partial<WebsiteSource>): Promise<WebsiteSource> => {
    const res = await apiClient.post<{ success: boolean; data: WebsiteSource }>('/sources', data);
    return res.data.data;
  },

  updateSource: async (id: string, data: Partial<WebsiteSource>): Promise<WebsiteSource> => {
    const res = await apiClient.put<{ success: boolean; data: WebsiteSource }>(`/sources/${id}`, data);
    return res.data.data;
  },

  deleteSource: async (id: string): Promise<void> => {
    await apiClient.delete(`/sources/${id}`);
  },

  toggleSourceActive: async (id: string): Promise<WebsiteSource> => {
    const res = await apiClient.patch<{ success: boolean; data: WebsiteSource }>(`/sources/${id}/toggle`);
    return res.data.data;
  },

  triggerSourceFetch: async (id: string): Promise<any> => {
    const res = await apiClient.post(`/sources/${id}/fetch`);
    return res.data;
  },

  triggerFetchAll: async (): Promise<any> => {
    const res = await apiClient.post('/sources/fetch-all');
    return res.data;
  },

  testSourcePreview: async (payload: { url: string; parserKey?: string; selectorConfig?: any }): Promise<{
    success: boolean;
    parserUsed: string;
    parserKey: string;
    htmlLength: number;
    totalFound: number;
    sampleItems: any[];
    message?: string;
  }> => {
    const res = await apiClient.post('/sources/test-preview', payload);
    return res.data;
  },

  getAvailableParsers: async (): Promise<{ key: string; name: string; description: string }[]> => {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/sources/parsers');
    return res.data.data;
  },

  // Expos
  getExpos: async (filters: Partial<ExpoFilterState>): Promise<{ data: Expo[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
        params.append(key, String(value));
      }
    });
    const res = await apiClient.get<{ success: boolean; data: Expo[]; meta: PaginationMeta }>(`/expos?${params.toString()}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  getExpoById: async (id: string): Promise<Expo> => {
    const res = await apiClient.get<{ success: boolean; data: Expo }>(`/expos/${id}`);
    return res.data.data;
  },

  deleteExpo: async (id: string): Promise<void> => {
    await apiClient.delete(`/expos/${id}`);
  },

  getExpoFilters: async (): Promise<{ industries: string[]; countries: string[]; cities: string[] }> => {
    const res = await apiClient.get<{ success: boolean; data: any }>('/expos/filters');
    return res.data.data;
  },

  // History
  getHistoryLogs: async (page = 1, limit = 15, status?: string, sourceId?: string): Promise<{ data: FetchLog[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'ALL') params.append('status', status);
    if (sourceId && sourceId !== 'ALL') params.append('sourceId', sourceId);

    const res = await apiClient.get<{ success: boolean; data: FetchLog[]; meta: PaginationMeta }>(`/history?${params.toString()}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  getHistoryLogById: async (id: string): Promise<FetchLog> => {
    const res = await apiClient.get<{ success: boolean; data: FetchLog }>(`/history/${id}`);
    return res.data.data;
  },

  clearHistoryLogs: async (): Promise<void> => {
    await apiClient.delete('/history');
  },

  // Export
  exportExcel: async (filters?: Partial<ExpoFilterState>): Promise<void> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/export/excel?${params.toString()}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-expos-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  exportCsv: async (filters?: Partial<ExpoFilterState>): Promise<void> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-expos-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
