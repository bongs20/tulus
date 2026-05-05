// src/components/shared/StatusBadge.tsx
import { Badge, badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { StatusAkun, StatusVerifikasi, StatusPenyaluran, StatusSinkronisasi, StatusSanggahan } from '@prisma/client';

interface StatusBadgeProps {
  status: StatusAkun | StatusVerifikasi | StatusPenyaluran | StatusSinkronisasi | StatusSanggahan;
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const getBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case StatusAkun.AKTIF:
    case StatusVerifikasi.DISETUJUI:
    case StatusPenyaluran.BERHASIL:
    case StatusSinkronisasi.MATCH:
    case StatusSanggahan.SELESAI:
      return 'outline';
    case StatusAkun.TERKUNCI:
    case StatusVerifikasi.DITOLAK:
    case StatusPenyaluran.GAGAL:
    case StatusSinkronisasi.MISMATCH:
      return 'outline';
    case StatusVerifikasi.MENUNGGU:
    case StatusPenyaluran.MENUNGGU:
    case StatusSanggahan.PENDING:
      return 'outline';
    case StatusSinkronisasi.TERTUNDA:
      return 'outline';
    case StatusPenyaluran.DIPROSES:
    case StatusSanggahan.DITINJAU:
      return 'outline';
    case StatusAkun.NONAKTIF:
      return 'outline';
    default:
      return 'outline';
  }
};

const getBadgeClassName = (status: string) => {
  const baseClasses = 'border px-2.5 py-0.5 font-semibold';

  switch (status) {
    case StatusAkun.AKTIF:
    case StatusVerifikasi.DISETUJUI:
    case StatusPenyaluran.BERHASIL:
    case StatusSanggahan.SELESAI:
      return `${baseClasses} border-emerald-200 bg-emerald-100 text-emerald-800`;
    case StatusAkun.TERKUNCI:
    case StatusVerifikasi.DITOLAK:
    case StatusPenyaluran.GAGAL:
    case StatusSinkronisasi.MISMATCH:
      return `${baseClasses} border-red-200 bg-red-100 text-red-800`;
    case StatusVerifikasi.MENUNGGU:
    case StatusPenyaluran.MENUNGGU:
    case StatusSanggahan.PENDING:
      return `${baseClasses} border-amber-200 bg-amber-100 text-amber-800`;
    case StatusSinkronisasi.TERTUNDA:
      return `${baseClasses} border-indigo-200 bg-indigo-100 text-indigo-700`;
    case StatusPenyaluran.DIPROSES:
    case StatusSanggahan.DITINJAU:
    case StatusSinkronisasi.MATCH:
      return `${baseClasses} border-blue-200 bg-blue-100 text-blue-800`;
    case StatusAkun.NONAKTIF:
      return `${baseClasses} border-slate-200 bg-slate-100 text-slate-700`;
    default:
      return `${baseClasses} border-slate-200 bg-slate-100 text-slate-700`;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case StatusAkun.AKTIF:
      return 'Aktif';
    case StatusAkun.NONAKTIF:
      return 'Nonaktif';
    case StatusAkun.TERKUNCI:
      return 'Terkunci';
    case StatusVerifikasi.MENUNGGU:
      return 'Menunggu';
    case StatusVerifikasi.MATCH:
      return 'Match';
    case StatusVerifikasi.MISMATCH:
      return 'Mismatch';
    case StatusVerifikasi.DISETUJUI:
      return 'Disetujui';
    case StatusVerifikasi.DITOLAK:
      return 'Ditolak';
    case StatusPenyaluran.MENUNGGU:
      return 'Menunggu';
    case StatusPenyaluran.DIPROSES:
      return 'Diproses';
    case StatusPenyaluran.BERHASIL:
      return 'Berhasil';
    case StatusPenyaluran.GAGAL:
      return 'Gagal';
    case StatusSinkronisasi.MATCH:
      return 'Match';
    case StatusSinkronisasi.MISMATCH:
      return 'Mismatch';
    case StatusSinkronisasi.TERTUNDA:
      return 'Tertunda';
    case StatusSanggahan.PENDING:
      return 'Pending';
    case StatusSanggahan.DITINJAU:
      return 'Ditinjau';
    case StatusSanggahan.SELESAI:
      return 'Selesai';
    default:
      return status.replace(/_/g, ' ');
  }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={getBadgeVariant(status)} className={getBadgeClassName(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
