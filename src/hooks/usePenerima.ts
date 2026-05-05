// src/hooks/usePenerima.ts
import useSWR from 'swr';
import { DecryptedPenerimaWithRelations } from '@/types';

interface PenerimaResponse {
  data: DecryptedPenerimaWithRelations[];
  total: number;
}

const fetcher = async (url: string): Promise<PenerimaResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Gagal memuat data penerima.');
  }
  return response.json() as Promise<PenerimaResponse>;
};

interface UsePenerimaOptions {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  excludeDisalurkan?: boolean;
}

interface UsePenerimaResult {
  data: DecryptedPenerimaWithRelations[];
  total: number;
  isLoading: boolean;
  isError: Error | undefined;
  mutate: (data?: DecryptedPenerimaWithRelations[], shouldRevalidate?: boolean) => Promise<PenerimaResponse | undefined>;
}

export function usePenerima(options?: UsePenerimaOptions): UsePenerimaResult {
  const { status, search, page = 1, limit = 25, excludeDisalurkan } = options || {};

  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);
  if (excludeDisalurkan) queryParams.append('excludeDisalurkan', 'true');
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `/api/penerima?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<PenerimaResponse, Error>(url, fetcher);

  const mutatePenerima = (
    nextData?: DecryptedPenerimaWithRelations[],
    shouldRevalidate?: boolean
  ) => {
    if (!nextData) {
      return mutate(undefined, shouldRevalidate);
    }

    const removedCount = Math.max(0, (data?.data.length || 0) - nextData.length);
    const nextTotal = data ? Math.max(0, data.total - removedCount) : nextData.length;

    return mutate({ data: nextData, total: nextTotal }, shouldRevalidate);
  };

  return {
    data: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate: mutatePenerima,
  };
}
