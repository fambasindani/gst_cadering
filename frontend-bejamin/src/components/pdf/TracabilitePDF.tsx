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
  page: { padding: 35, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '2 solid #1e3a5f', paddingBottom: 12 },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 3 },
  companyInfo: { fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, marginTop: 5 },
  titleBox: { flex: 1 },
  title: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  subtitle: { fontSize: 8, color: '#666' },
  infoBox: { alignItems: 'flex-end', flex: 1 },
  infoText: { fontSize: 8, color: '#444', lineHeight: 1.6 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 5, paddingBottom: 3, borderBottom: '1 solid #ddd' },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { width: 120, fontSize: 8, color: '#888' },
  value: { flex: 1, fontSize: 8, color: '#333' },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 6, borderRadius: 2 },
  tableHeaderCell: { color: '#fff', fontSize: 7.5, fontWeight: 'bold' },
  colRef: { width: 100, paddingLeft: 3, paddingRight: 3 },
  colLot: { width: 100, paddingLeft: 3, paddingRight: 3 },
  colProduit: { width: 140, paddingLeft: 3, paddingRight: 3 },
  colQte: { width: 70, textAlign: 'right', paddingLeft: 3, paddingRight: 3 },
  colDate: { width: 115, paddingLeft: 3, paddingRight: 3 },
  tableRow: { flexDirection: 'row', padding: 5, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 7.5, color: '#333' },
  tableCellRight: { fontSize: 7.5, color: '#333', textAlign: 'right' },
  totalSection: { marginTop: 12, borderTop: '1 solid #ddd', paddingTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 3 },
  totalLabel: { fontSize: 9, color: '#666', marginRight: 20, width: 100, textAlign: 'right' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', width: 120, textAlign: 'right' },
  commentSection: { marginTop: 12, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 3 },
  commentLabel: { fontSize: 7.5, color: '#888', marginBottom: 3 },
  commentText: { fontSize: 8, color: '#333', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 30, left: 35, right: 35, borderTop: '1 solid #ddd', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
});

interface Props {
  data: Tracabilite;
}

export function TracabilitePDF({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>
            Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC{'\n'}
            ID.NAT 01-856-N58TA1008392J | RCCM/CD/KIN/RCCM/13-BO66
          </Text>
        </View>

        <View style={styles.titleSection}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Traçabilité</Text>
            <Text style={styles.subtitle}>N° {data.numero_tracabilite}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Date: {formatDate(data.date_tracabilite)}</Text>
            <Text style={styles.infoText}>Enregistré par: {data.utilisateur?.full_name || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Lot:</Text>
            <Text style={styles.value}>{data.lot?.numero_lot || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Produit:</Text>
            <Text style={styles.value}>{data.lot?.produit?.nom || '-'} {data.lot?.produit?.code_article ? `(${data.lot.produit.code_article})` : ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Magasin:</Text>
            <Text style={styles.value}>{data.lot?.magasin?.nom || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fournisseur (lot):</Text>
            <Text style={styles.value}>{data.lot?.partenaire?.nom || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Département:</Text>
            <Text style={styles.value}>{data.departement?.nom || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{data.partenaire?.nom || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantité:</Text>
            <Text style={styles.value}>{data.quantite}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colRef]}>N° Traçabilité</Text>
              <Text style={[styles.tableHeaderCell, styles.colLot]}>Lot</Text>
              <Text style={[styles.tableHeaderCell, styles.colProduit]}>Produit</Text>
              <Text style={[styles.tableHeaderCell, styles.colQte]}>Quantité</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colRef]}>{data.numero_tracabilite}</Text>
              <Text style={[styles.tableCell, styles.colLot]}>{data.lot?.numero_lot || '-'}</Text>
              <Text style={[styles.tableCell, styles.colProduit]}>{data.lot?.produit?.nom || '-'}</Text>
              <Text style={[styles.tableCellRight, styles.colQte]}>{data.quantite}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.tableCell, styles.colDate]}>{formatDate(data.date_tracabilite)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Quantité totale:</Text>
            <Text style={styles.totalValue}>{data.quantite}</Text>
          </View>
        </View>

        {data.commentaire && (
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Commentaire</Text>
            <Text style={styles.commentText}>{data.commentaire}</Text>
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
