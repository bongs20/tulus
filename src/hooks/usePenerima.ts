// src/hooks/usePenerima.ts
import useSWR from 'swr';
import { tbl_penerima } from '@prisma/client';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UsePenerimaOptions {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface UsePenerimaResult {
  data: tbl_penerima[];
  total: number;
  isLoading: boolean;
  isError: any;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
}

export function usePenerima(options?: UsePenerimaOptions): UsePenerimaResult {
  const { status, search, page = 1, limit = 25 } = options || {};

  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `/api/penerima?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    data: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}
