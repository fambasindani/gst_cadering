import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 25, fontSize: 8, fontFamily: 'Helvetica' },
  header: { marginBottom: 12, borderBottom: '2 solid #1e3a5f', paddingBottom: 8 },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  companyInfo: { fontSize: 7, color: '#555', lineHeight: 1.4 },
  title: { fontSize: 12, fontWeight: 'bold', color: '#1e3a5f', marginTop: 3, marginBottom: 2 },
  subtitle: { fontSize: 7.5, color: '#666', marginBottom: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statBox: { flex: 1, alignItems: 'center', padding: 6, border: '1 solid #e0e0e0', borderRadius: 3, marginHorizontal: 3 },
  statValue: { fontSize: 12, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  statLabel: { fontSize: 7, color: '#888' },
  sectionTitle: { fontSize: 8.5, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 4, paddingBottom: 2, borderBottom: '1 solid #ddd' },
  table: { marginTop: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', paddingVertical: 3, paddingHorizontal: 0 },
  tableHeaderCell: { color: '#fff', fontSize: 6.5, fontWeight: 'bold', paddingHorizontal: 2 },
  tableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 0, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 6.5, color: '#333', paddingHorizontal: 2 },
  tableCellRight: { fontSize: 6.5, color: '#333', textAlign: 'right', paddingHorizontal: 2 },
  footer: { position: 'absolute', bottom: 25, left: 25, right: 25, borderTop: '1 solid #ddd', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: '#999' },
  totalSection: { marginTop: 8, borderTop: '1 solid #ddd', paddingTop: 5, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 2 },
  totalLabel: { fontSize: 8, color: '#666', marginRight: 12, width: 110, textAlign: 'right' },
  totalValue: { fontSize: 8, fontWeight: 'bold', color: '#1e3a5f', width: 110, textAlign: 'right' },
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
  period?: string;
  orientation?: 'portrait' | 'landscape';
  columns: Column[];
  rows: Record<string, string>[];
  stats?: Stat[];
  totals?: { label: string; value: string }[];
}

export function RapportTablePDF({ title, subtitle, period, orientation = 'portrait', columns, rows, stats, totals }: RapportTablePDFProps) {
  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        {(subtitle || period) && <Text style={styles.subtitle}>{subtitle ? `${subtitle}${period ? ` — ${period}` : ''}` : period}</Text>}

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
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
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
