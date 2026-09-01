import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Tracabilite } from '../../types/tracabilite';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0];
  if (parts && /^\d{4}-\d{2}-\d{2}$/.test(parts)) {
    const [y, m, d] = parts.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: 'Helvetica' },
  header: { marginBottom: 15, borderBottom: '2 solid #1e3a5f', paddingBottom: 10 },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  companyInfo: { fontSize: 7, color: '#555', lineHeight: 1.4 },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  title: { fontSize: 12, fontWeight: 'bold', color: '#1e3a5f' },
  subtitle: { fontSize: 7.5, color: '#666', marginTop: 2 },
  filtersBox: { marginBottom: 10, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 3 },
  filtersText: { fontSize: 7, color: '#555', lineHeight: 1.4 },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 5, borderRadius: 2 },
  tableHeaderCell: { color: '#fff', fontSize: 7, fontWeight: 'bold' },
  colRef: { width: 105, paddingLeft: 3, paddingRight: 3 },
  colLot: { width: 105, paddingLeft: 3, paddingRight: 3 },
  colProduit: { width: 130, paddingLeft: 3, paddingRight: 3 },
  colUtilisateur: { width: 100, paddingLeft: 3, paddingRight: 3 },
  colDept: { width: 85, paddingLeft: 3, paddingRight: 3 },
  colClient: { width: 100, paddingLeft: 3, paddingRight: 3 },
  colQte: { width: 60, textAlign: 'right', paddingLeft: 3, paddingRight: 3 },
  colDate: { width: 97, paddingLeft: 3, paddingRight: 3 },
  tableRow: { flexDirection: 'row', padding: 4, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 7, color: '#333' },
  tableCellRight: { fontSize: 7, color: '#333', textAlign: 'right' },
  totalSection: { marginTop: 10, borderTop: '1 solid #ddd', paddingTop: 6, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 2 },
  totalLabel: { fontSize: 8, color: '#666', marginRight: 15, width: 80, textAlign: 'right' },
  totalValue: { fontSize: 8, fontWeight: 'bold', color: '#1e3a5f', width: 80, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 25, left: 30, right: 30, borderTop: '1 solid #ddd', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: '#999' },
});

interface Props {
  data: Tracabilite[];
  filters: {
    dateDebut?: string;
    dateFin?: string;
    utilisateur?: string;
    search?: string;
  };
  total: number;
}

export function TracabiliteListPDF({ data, filters, total }: Props) {
  const hasFilters = filters.dateDebut || filters.dateFin || filters.utilisateur || filters.search;

  let filterText = '';
  const parts: string[] = [];
  if (filters.dateDebut) parts.push(`Du ${formatDate(filters.dateDebut)}`);
  if (filters.dateFin) parts.push(`Au ${formatDate(filters.dateFin)}`);
  if (filters.utilisateur) parts.push(`Utilisateur: ${filters.utilisateur}`);
  if (filters.search) parts.push(`Recherche: "${filters.search}"`);
  filterText = parts.join(' | ') || 'Tous les enregistrements';

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>
            Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC
          </Text>
        </View>

        <View style={styles.titleSection}>
          <View>
            <Text style={styles.title}>Traçabilité</Text>
            <Text style={styles.subtitle}>Liste des enregistrements ({total})</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.subtitle}>Date d'impression: {formatDate(new Date().toISOString())}</Text>
          </View>
        </View>

        {hasFilters && (
          <View style={styles.filtersBox}>
            <Text style={styles.filtersText}>Filtres: {filterText}</Text>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colRef]}>N° Traçabilité</Text>
            <Text style={[styles.tableHeaderCell, styles.colLot]}>Lot</Text>
            <Text style={[styles.tableHeaderCell, styles.colProduit]}>Produit</Text>
            <Text style={[styles.tableHeaderCell, styles.colUtilisateur]}>Utilisateur</Text>
            <Text style={[styles.tableHeaderCell, styles.colDept]}>Département</Text>
            <Text style={[styles.tableHeaderCell, styles.colClient]}>Client</Text>
            <Text style={[styles.tableHeaderCell, styles.colQte]}>Qté</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
          </View>
          {data.map((item, i) => (
            <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colRef]}>{item.numero_tracabilite}</Text>
              <Text style={[styles.tableCell, styles.colLot]}>{item.lot?.numero_lot || '-'}</Text>
              <Text style={[styles.tableCell, styles.colProduit]}>{item.lot?.produit?.nom || '-'}</Text>
              <Text style={[styles.tableCell, styles.colUtilisateur]}>{item.utilisateur?.full_name || '-'}</Text>
              <Text style={[styles.tableCell, styles.colDept]}>{item.departement?.nom || '-'}</Text>
              <Text style={[styles.tableCell, styles.colClient]}>{item.partenaire?.nom || '-'}</Text>
              <Text style={[styles.tableCellRight, styles.colQte]}>{item.quantite}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.tableCell, styles.colDate]}>{formatDate(item.date_tracabilite)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{data.length} enregistrement(s)</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Quantité totale:</Text>
            <Text style={styles.totalValue}>{data.reduce((s, item) => s + (item.quantite || 0), 0)}</Text>
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
