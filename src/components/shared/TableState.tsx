import { WarningCircle, SpinnerGap } from '@phosphor-icons/react';
import { TableCell, TableRow } from '@/components/ui/table';

interface TableStateProps {
  colSpan: number;
  state: 'loading' | 'empty' | 'error';
  message?: string;
}

export function TableState({ colSpan, state, message }: TableStateProps) {
  const content =
    state === 'loading'
      ? {
          icon: <SpinnerGap className="h-4 w-4 animate-spin" />,
          text: message || 'Memuat data...',
        }
      : state === 'error'
        ? {
            icon: <WarningCircle className="h-4 w-4" />,
            text: message || 'Terjadi kesalahan saat memuat data.',
          }
        : {
            icon: null,
            text: message || 'Tidak ada data.',
          };

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          {content.icon}
          <span>{content.text}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}
