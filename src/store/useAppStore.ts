// src/store/useAppStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DecryptedPenerimaWithRelations } from '@/types';

interface AppState {
  selectedPenerima: DecryptedPenerimaWithRelations | null;
  setSelectedPenerima: (penerima: DecryptedPenerimaWithRelations | null) => void;
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
