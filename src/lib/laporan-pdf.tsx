import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

interface ProgramBreakdownItem {
  jenis_bantuan: string;
  _count: {
    id: number;
  };
  _sum: {
    nominal_bantuan: number | null;
  };
}

export interface DetailPenyaluranItem {
  id: string;
  nama_lengkap: string;
  nik: string;
  jenis_bantuan: string;
  nominal_bantuan: number;
  bukti_penyaluran: string | null;
  tanggal_penyaluran: Date;
}

export interface LaporanPdfData {
  periode: string;
  jenisBantuan: string;
  wilayah: string;
  totalPenerima: number;
  totalAnggaran: number;
  totalTersalurkanCount: number;
  totalDitolakCount: number;
  totalProsesCount: number;
  percentTersalurkan: number;
  programBreakdown: ProgramBreakdownItem[];
  detailPenyaluran?: DetailPenyaluranItem[];
  generatedAt: Date;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#d7e3f7',
  },
  kicker: {
    color: '#1f63db',
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 5,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 9,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  filterGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d7e3f7',
  },
  filterItem: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#d7e3f7',
  },
  filterItemLast: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 10,
  },
  label: {
    color: '#64748b',
    fontSize: 8,
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontWeight: 700,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -6,
    marginRight: -6,
  },
  kpiCard: {
    width: '50%',
    paddingLeft: 6,
    paddingRight: 6,
    marginBottom: 12,
  },
  kpiInner: {
    borderWidth: 1,
    borderColor: '#d7e3f7',
    padding: 10,
    minHeight: 58,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: 700,
    marginTop: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: '#d7e3f7',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d7e3f7',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
  },
  tableCellProgram: {
    width: '36%',
    padding: 8,
  },
  tableCellCount: {
    width: '24%',
    padding: 8,
    textAlign: 'right',
  },
  tableCellNominal: {
    width: '40%',
    padding: 8,
    textAlign: 'right',
  },
  tableCellNama: {
    width: '30%',
    padding: 6,
  },
  tableCellProgramDetail: {
    width: '15%',
    padding: 6,
  },
  tableCellNominalDetail: {
    width: '20%',
    padding: 6,
    textAlign: 'right',
  },
  tableCellBukti: {
    width: '35%',
    padding: 6,
    fontSize: 7,
    color: '#2563eb',
  },
  tableHeaderText: {
    fontWeight: 700,
    color: '#334155',
  },
  emptyState: {
    padding: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 32,
    right: 32,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    color: '#64748b',
    fontSize: 8,
    textAlign: 'right',
  },
});

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatCurrency(value: number | null) {
  return currencyFormatter.format(value || 0);
}

function LaporanPdfDocument({ report }: { report: LaporanPdfData }) {
  const kpis = [
    { label: 'Total Penerima', value: report.totalPenerima.toLocaleString('id-ID') },
    { label: 'Total Anggaran Tersalurkan', value: formatCurrency(report.totalAnggaran) },
    { label: 'Penyaluran Berhasil', value: report.totalTersalurkanCount.toLocaleString('id-ID') },
    { label: 'Penyaluran Gagal', value: report.totalDitolakCount.toLocaleString('id-ID') },
    { label: 'Sedang Diproses', value: report.totalProsesCount.toLocaleString('id-ID') },
    { label: 'Persentase Tersalurkan', value: `${report.percentTersalurkan.toFixed(2)}%` },
  ];

  return (
    <Document
      title="Laporan Penyaluran Bantuan TULUS"
      author="TULUS"
      subject="Laporan penyaluran bantuan sosial"
      creator="TULUS"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>TULUS</Text>
          <Text style={styles.title}>Laporan Penyaluran Bantuan</Text>
          <Text style={styles.subtitle}>Dibuat pada {dateTimeFormatter.format(report.generatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter Laporan</Text>
          <View style={styles.filterGrid}>
            <View style={styles.filterItem}>
              <Text style={styles.label}>Periode</Text>
              <Text style={styles.value}>{report.periode}</Text>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.label}>Jenis Bantuan</Text>
              <Text style={styles.value}>{report.jenisBantuan}</Text>
            </View>
            <View style={styles.filterItemLast}>
              <Text style={styles.label}>Wilayah</Text>
              <Text style={styles.value}>{report.wilayah}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <View style={styles.kpiGrid}>
            {kpis.map((item) => (
              <View key={item.label} style={styles.kpiCard}>
                <View style={styles.kpiInner}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.kpiValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Per Program</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCellProgram, styles.tableHeaderText]}>Jenis Bantuan</Text>
              <Text style={[styles.tableCellCount, styles.tableHeaderText]}>Jumlah</Text>
              <Text style={[styles.tableCellNominal, styles.tableHeaderText]}>Total Nominal</Text>
            </View>
            {report.programBreakdown.length === 0 ? (
              <Text style={styles.emptyState}>Tidak ada data breakdown program.</Text>
            ) : (
              report.programBreakdown.map((item, index) => {
                const isLast = index === report.programBreakdown.length - 1;

                return (
                  <View key={item.jenis_bantuan} style={isLast ? styles.tableRowLast : styles.tableRow}>
                    <Text style={styles.tableCellProgram}>{item.jenis_bantuan}</Text>
                    <Text style={styles.tableCellCount}>{item._count.id.toLocaleString('id-ID')}</Text>
                    <Text style={styles.tableCellNominal}>{formatCurrency(item._sum.nominal_bantuan)}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {report.detailPenyaluran && report.detailPenyaluran.length > 0 && (
          <View style={styles.section} break>
            <Text style={styles.sectionTitle}>Detail Penyaluran (Bukti)</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCellNama, styles.tableHeaderText]}>Penerima</Text>
                <Text style={[styles.tableCellProgramDetail, styles.tableHeaderText]}>Program</Text>
                <Text style={[styles.tableCellNominalDetail, styles.tableHeaderText]}>Nominal</Text>
                <Text style={[styles.tableCellBukti, styles.tableHeaderText]}>Link Bukti (Foto/Nota)</Text>
              </View>
              {report.detailPenyaluran.map((item, index) => {
                const isLast = index === report.detailPenyaluran!.length - 1;
                return (
                  <View key={item.id} style={isLast ? styles.tableRowLast : styles.tableRow}>
                    <View style={styles.tableCellNama}>
                      <Text style={{ fontWeight: 700 }}>{item.nama_lengkap}</Text>
                      <Text style={{ fontSize: 7, color: '#64748b' }}>{item.nik}</Text>
                    </View>
                    <Text style={styles.tableCellProgramDetail}>{item.jenis_bantuan}</Text>
                    <Text style={styles.tableCellNominalDetail}>{formatCurrency(item.nominal_bantuan)}</Text>
                    <Text style={styles.tableCellBukti}>
                      {item.bukti_penyaluran ? item.bukti_penyaluran : '-'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

export function renderLaporanPdf(report: LaporanPdfData) {
  return renderToBuffer(<LaporanPdfDocument report={report} />);
}
