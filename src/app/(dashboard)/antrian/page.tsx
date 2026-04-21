// src/app/(dashboard)/antrian/page.tsx
'use client';

import { useState } from 'react';
import { tbl_penerima } from '@prisma/client';
import { AntrianTable } from '@/components/verifikasi/AntrianTable';
import { DetailPanel } from '@/components/verifikasi/DetailPanel';
import { useAppStore } from '@/store/useAppStore';

export default function AntrianPage() {
  const { selectedPenerima, setSelectedPenerima } = useAppStore();
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleRowClick = (penerima: tbl_penerima | null) => {
    setSelectedPenerima(penerima);
  };

  const handleVerificationSuccess = () => {
    setSelectedPenerima(null); // Clear selected penerima to refresh view
    // Optionally trigger a re-fetch of the table data
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] flex-col md:flex-row gap-4">
      {/* Left Panel - Table (480px width) */}
      <div className="md:w-[480px] flex-none">
        <AntrianTable
          onRowClick={handleRowClick}
          selectedPenerimaId={selectedPenerima?.id || null}
        />
      </div>

      {/* Right Panel - Detail */}
      <div className="flex-1">
        <DetailPanel
          penerima={selectedPenerima}
          onVerificationSuccess={handleVerificationSuccess}
          isLoading={isDetailLoading}
          onLoadingChange={setIsDetailLoading}
        />
      </div>
    </div>
  );
}
