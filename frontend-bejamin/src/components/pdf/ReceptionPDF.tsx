import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { BonCommande } from '../../types/bon-commande';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0];
  if (parts && /^\d{4}-\d{2}-\d{2}$/.test(parts)) {
    const [y, m, d] = parts.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

function formatMontant(value: number, currency?: string): string {
  const num = Number(value) || 0;
  const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return currency ? `${formatted} ${currency}` : formatted;
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
  label: { width: 110, fontSize: 8, color: '#888' },
  value: { flex: 1, fontSize: 8, color: '#333' },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 6, borderRadius: 2 },
  tableHeaderCell: { color: '#fff', fontSize: 7.5, fontWeight: 'bold' },
  colCode: { width: '18%' },
  colProduit: { width: '34%' },
  colLot: { width: '20%' },
  colQte: { width: '10%', textAlign: 'right' },
  colPrix: { width: '18%', textAlign: 'right' },
  tableRow: { flexDirection: 'row', padding: 5, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 7.5, color: '#333' },
  tableCellRight: { fontSize: 7.5, color: '#333', textAlign: 'right' },
  totalSection: { marginTop: 12, borderTop: '1 solid #ddd', paddingTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 3 },
  totalLabel: { fontSize: 9, color: '#666', marginRight: 20, width: 100, textAlign: 'right' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', width: 120, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 35, right: 35, borderTop: '1 solid #ddd', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
});

export interface ReceptionLigne {
  id: number;
  date: string | null;
  id_ligne: number;
  produit: string;
  code_article: string;
  numero_lot: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  statut: string;
}

export interface ReceptionPDFData {
  reference_reception: string;
  date: string | null;
  quantite: number;
  montant: number;
  lignes: ReceptionLigne[];
}

interface Props {
  bon: BonCommande;
  reception: ReceptionPDFData;
}

export function ReceptionPDF({ bon, reception }: Props) {
  const deviseCode = bon.devise?.code || 'USD';
  const totalQte = reception.quantite;
  const totalMontant = reception.montant;

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
            <Text style={styles.title}>Bon de Réception</Text>
            <Text style={styles.subtitle}>N° {reception.reference_reception}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Date: {formatDate(reception.date)}</Text>
            <Text style={styles.infoText}>Bon de commande: {bon.numero_commande}</Text>
            <Text style={styles.infoText}>Statut: {bon.statut}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.row}><Text style={styles.label}>Fournisseur:</Text><Text style={styles.value}>{bon.partenaire?.nom || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Destination:</Text><Text style={styles.value}>{bon.magasin_destination?.nom || '-'}</Text></View>
          {bon.commentaire ? (
            <View style={styles.row}><Text style={styles.label}>Commentaire:</Text><Text style={styles.value}>{bon.commentaire}</Text></View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produits reçus</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colCode]}>Code</Text>
              <Text style={[styles.tableHeaderCell, styles.colProduit]}>Produit</Text>
              <Text style={[styles.tableHeaderCell, styles.colLot]}>Lot</Text>
              <Text style={[styles.tableHeaderCell, styles.colQte]}>Qté</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrix]}>Prix unit.</Text>
            </View>
            {reception.lignes.map((l, i) => (
              <View key={l.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.colCode]}>{l.code_article || '-'}</Text>
                <Text style={[styles.tableCell, styles.colProduit]}>{l.produit || '-'}</Text>
                <Text style={[styles.tableCell, styles.colLot]}>{l.numero_lot || '-'}</Text>
                <Text style={[styles.tableCellRight, styles.colQte]}>{l.quantite}</Text>
                <Text style={[styles.tableCellRight, styles.colPrix]}>{formatMontant(l.prix_unitaire, deviseCode)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Quantité totale:</Text>
            <Text style={styles.totalValue}>{totalQte}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant total:</Text>
            <Text style={styles.totalValue}>{formatMontant(totalMontant, deviseCode)}</Text>
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
