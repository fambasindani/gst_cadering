import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { FicheTechnique } from '../../types/fiche-technique';
import { formatCurrency } from '../../lib/format';

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
  colCode: { width: '14%' },
  colNom: { width: '36%' },
  colMagasin: { width: '20%' },
  colRendement: { width: '14%', textAlign: 'right' },
  colCoutTotal: { width: '16%', textAlign: 'right' },
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

export function RapportRecettePDF({ fiches }: { fiches: FicheTechnique[] }) {
  const totalCout = fiches.reduce((s, f) => s + Number(f.cout_total), 0);
  const totalRendement = fiches.reduce((s, f) => s + Number(f.rendement), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
        </View>

        <Text style={styles.title}>Rapport des recettes</Text>
        <Text style={styles.subtitle}>{fiches.length} fiche{fiches.length > 1 ? 's' : ''} de recette{fiches.length > 1 ? 's' : ''}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{fiches.length}</Text>
            <Text style={styles.statLabel}>Fiches</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatCurrency(totalCout)}</Text>
            <Text style={styles.statLabel}>Coût total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalRendement}</Text>
            <Text style={styles.statLabel}>Rendement total</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Détail des fiches de recette</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colCode]}>Code</Text>
            <Text style={[styles.tableHeaderCell, styles.colNom]}>Nom</Text>
            <Text style={[styles.tableHeaderCell, styles.colMagasin]}>Magasin</Text>
            <Text style={[styles.tableHeaderCell, styles.colRendement]}>Rendement</Text>
            <Text style={[styles.tableHeaderCell, styles.colCoutTotal]}>Coût total</Text>
          </View>
          {fiches.map((f, i) => (
            <View key={f.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colCode]}>{f.code}</Text>
              <Text style={[styles.tableCell, styles.colNom]}>{f.nom}</Text>
              <Text style={[styles.tableCell, styles.colMagasin]}>{f.magasin?.nom || '-'}</Text>
              <Text style={[styles.tableCellRight, styles.colRendement]}>{f.rendement}</Text>
              <Text style={[styles.tableCellRight, styles.colCoutTotal]}>{formatCurrency(f.cout_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total fiches:</Text>
            <Text style={styles.totalValue}>{fiches.length}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Coût total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalCout)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
          <Text style={styles.footerText}>Page 1/1</Text>
        </View>
      </Page>
    </Document>
  );
}
