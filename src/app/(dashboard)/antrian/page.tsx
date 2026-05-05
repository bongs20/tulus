'use client';

import { useState } from 'react';
import { AntrianTable } from '@/components/verifikasi/AntrianTable';
import { DetailPanel } from '@/components/verifikasi/DetailPanel';
import { useAppStore } from '@/store/useAppStore';
import { DecryptedPenerimaWithRelations } from '@/types';

export default function AntrianPage() {
  const { selectedPenerima, setSelectedPenerima } = useAppStore();
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleRowClick = (penerima: DecryptedPenerimaWithRelations | null) => {
    setSelectedPenerima(penerima);
  };

  const handleVerificationSuccess = () => {
    setSelectedPenerima(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-semibold text-[#191b23]">Antrian Verifikasi Faktual</h2>
          <p className="text-sm text-slate-500">Kelola dan verifikasi data calon penerima bantuan sosial secara real-time.</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-6 overflow-hidden">
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:w-[380px]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#f2f3fd] px-4 py-3">
            <span className="text-xs font-bold text-slate-500">DAFTAR ANTRIAN</span>
            <span className="material-symbols-outlined text-[18px] text-slate-500">filter_list</span>
          </div>
          <div className="h-[calc(100%-48px)] overflow-y-auto">
            <AntrianTable onRowClick={handleRowClick} selectedPenerimaId={selectedPenerima?.id || null} />
          </div>
        </div>

        <div className="hidden min-h-0 flex-1 rounded-xl border border-slate-200 bg-white shadow-sm md:block">
          <DetailPanel
            penerima={selectedPenerima}
            onVerificationSuccess={handleVerificationSuccess}
            isLoading={isDetailLoading}
            onLoadingChange={setIsDetailLoading}
          />
        </div>
      </div>
    </div>
  );
}
