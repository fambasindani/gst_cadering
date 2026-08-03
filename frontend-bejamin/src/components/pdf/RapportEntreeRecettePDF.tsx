import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { EntreeRecette } from '../../types/fiche-technique';
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
  tableHeaderCell: { color: '#fff', fontSize: 7, fontWeight: 'bold' },
  colId: { width: '8%' },
  colDate: { width: '14%' },
  colClient: { width: '22%' },
  colRecette: { width: '28%' },
  colPassages: { width: '12%', textAlign: 'right' },
  colCout: { width: '16%', textAlign: 'right' },
  tableRow: { flexDirection: 'row', padding: 4, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 7, color: '#333' },
  tableCellRight: { fontSize: 7, color: '#333', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 35, right: 35, borderTop: '1 solid #ddd', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
  totalSection: { marginTop: 10, borderTop: '1 solid #ddd', paddingTop: 6, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 2 },
  totalLabel: { fontSize: 9, color: '#666', marginRight: 15, width: 120, textAlign: 'right' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', width: 110, textAlign: 'right' },
});

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

export function RapportEntreeRecettePDF({ recettes }: { recettes: EntreeRecette[] }) {
  const totalPortions = recettes.reduce((s, r) => s + (Number(r.nombre_portions) || 0), 0);
  const totalPassages = recettes.reduce((s, r) => s + (Number(r.nombre_passages) || 0), 0);
  const totalCout = recettes.reduce((s, r) => s + (Number(r.fiche_technique?.cout_unitaire) || 0) * (Number(r.nombre_portions) || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
        </View>

        <Text style={styles.title}>Rapport des entrées recette</Text>
        <Text style={styles.subtitle}>{recettes.length} entrée{recettes.length > 1 ? 's' : ''} recette</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recettes.length}</Text>
            <Text style={styles.statLabel}>Entrées</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalPortions}</Text>
            <Text style={styles.statLabel}>Portions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalPassages}</Text>
            <Text style={styles.statLabel}>Passages</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatCurrency(totalCout)}</Text>
            <Text style={styles.statLabel}>Coût total</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Détail des entrées recette</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colId]}>N°</Text>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colClient]}>Client</Text>
            <Text style={[styles.tableHeaderCell, styles.colRecette]}>Recette</Text>
            <Text style={[styles.tableHeaderCell, styles.colPassages]}>Portions</Text>
            <Text style={[styles.tableHeaderCell, styles.colCout]}>Coût total</Text>
          </View>
          {recettes.map((r, i) => (
            <View key={r.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colId]}>{r.id}</Text>
              <Text style={[styles.tableCell, styles.colDate]}>{formatDate(r.date_production)}</Text>
              <Text style={[styles.tableCell, styles.colClient]}>{r.partenaire?.nom || '-'}</Text>
              <Text style={[styles.tableCell, styles.colRecette]}>{r.fiche_technique?.nom || '-'}</Text>
              <Text style={[styles.tableCellRight, styles.colPassages]}>{r.nombre_portions ?? 0}</Text>
              <Text style={[styles.tableCellRight, styles.colCout]}>{formatCurrency((Number(r.fiche_technique?.cout_unitaire) || 0) * (Number(r.nombre_portions) || 0))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total entrées:</Text>
            <Text style={styles.totalValue}>{recettes.length}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total portions:</Text>
            <Text style={styles.totalValue}>{totalPortions}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total passages:</Text>
            <Text style={styles.totalValue}>{totalPassages}</Text>
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
