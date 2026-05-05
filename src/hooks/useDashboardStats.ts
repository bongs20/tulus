// src/hooks/useDashboardStats.ts
import useSWR from 'swr';
import type { KeyedMutator } from 'swr';
import { StatusPenyaluran, JenisBantuan } from '@prisma/client';

interface PerProgramStat {
  jenis_bantuan: JenisBantuan;
  _count: {
    id: number;
  };
  _sum: {
    nominal_bantuan: number | null;
  };
}

interface MonthlyTrendItem {
  month: string;
  count: number;
  sum: number;
}

interface RecentPenyaluran {
  id: string;
  jenis_bantuan: JenisBantuan;
  metode_penyaluran: string;
  nominal_bantuan: number;
  status_penyaluran: StatusPenyaluran;
  created_at: Date;
  penerima: {
    nama_lengkap: string;
    nik: string;
  };
}

interface DashboardStats {
  total_masuk: number;
  lolos_awal: number;
  disetujui: number;
  tersalurkan: number;
  total_anggaran: number;
  per_program: PerProgramStat[];
  monthly_trend: MonthlyTrendItem[];
  funnel_data: { name: string; value: number }[];
  recent_penyaluran: RecentPenyaluran[];
}

interface UseDashboardStatsResult {
  data: DashboardStats | undefined;
  isLoading: boolean;
  isError: Error | undefined;
  mutate: KeyedMutator<DashboardStats>;
}

const fetcher = async (url: string): Promise<DashboardStats> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Gagal memuat statistik dashboard.');
  }
  return response.json() as Promise<DashboardStats>;
};

export function useDashboardStats(): UseDashboardStatsResult {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats, Error>(
    '/api/dashboard/stats',
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds
    }
  );

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}
