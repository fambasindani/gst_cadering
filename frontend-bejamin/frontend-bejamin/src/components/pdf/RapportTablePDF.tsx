import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 35, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 16, borderBottom: '2 solid #1e3a5f', paddingBottom: 10 },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  companyInfo: { fontSize: 7, color: '#555', lineHeight: 1.4 },
  title: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f', marginTop: 4, marginBottom: 3 },
  subtitle: { fontSize: 8, color: '#666', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center', padding: 8, border: '1 solid #e0e0e0', borderRadius: 3, marginHorizontal: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  statLabel: { fontSize: 7.5, color: '#888' },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 5, paddingBottom: 3, borderBottom: '1 solid #ddd' },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 5 },
  tableHeaderCell: { color: '#fff', fontSize: 7.5, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', padding: 4, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 7.5, color: '#333' },
  tableCellRight: { fontSize: 7.5, color: '#333', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 35, right: 35, borderTop: '1 solid #ddd', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
  totalSection: { marginTop: 10, borderTop: '1 solid #ddd', paddingTop: 6, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 2 },
  totalLabel: { fontSize: 9, color: '#666', marginRight: 15, width: 100, textAlign: 'right' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', width: 100, textAlign: 'right' },
});

export interface Column {
  key: string;
  label: string;
  width: string;
  align?: 'left' | 'right';
  render: (row: Record<string, string>) => string;
}

interface Stat {
  label: string;
  value: string;
}

interface RapportTablePDFProps {
  title: string;
  subtitle?: string;
  columns: Column[];
  rows: Record<string, string>[];
  stats?: Stat[];
  totals?: { label: string; value: string }[];
}

export function RapportTablePDF({ title, subtitle, columns, rows, stats, totals }: RapportTablePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {stats && stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <View key={i} style={styles.statBox}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Détail</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {columns.map((col) => (
              <Text key={col.key} style={[styles.tableHeaderCell, { width: col.width, textAlign: col.align || 'left' }]}>
                {col.label}
              </Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : undefined]}>
              {columns.map((col) => (
                <Text key={col.key} style={[{ width: col.width, textAlign: col.align || 'left' }, col.align === 'right' ? styles.tableCellRight : styles.tableCell]}>
                  {col.render(row)}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {totals && totals.length > 0 && (
          <View style={styles.totalSection}>
            {totals.map((t, i) => (
              <View key={i} style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t.label}</Text>
                <Text style={styles.totalValue}>{t.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
          <Text style={styles.footerText}>Page 1/1</Text>
        </View>
      </Page>
    </Document>
  );
}
