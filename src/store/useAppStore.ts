// src/store/useAppStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { tbl_penerima } from '@prisma/client';

interface AppState {
  selectedPenerima: tbl_penerima | null;
  setSelectedPenerima: (penerima: tbl_penerima | null) => void;
  // Add other global states as needed
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      selectedPenerima: null,
      setSelectedPenerima: (penerima) => set({ selectedPenerima: penerima }),
    }),
    { name: 'TulusAppStore' }
  )
);
