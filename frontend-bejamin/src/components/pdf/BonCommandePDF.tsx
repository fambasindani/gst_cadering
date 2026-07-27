import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { BonCommande } from '../../types/bon-commande';
import { formatCurrency } from '../../lib/format';

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
  label: { width: 100, fontSize: 8, color: '#888' },
  value: { flex: 1, fontSize: 8, color: '#333' },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 6, borderRadius: 2 },
  tableHeaderCell: { color: '#fff', fontSize: 7.5, fontWeight: 'bold' },
  colCode: { width: '20%' },
  colProduit: { width: '30%' },
  colQte: { width: '12%', textAlign: 'right' },
  colPrix: { width: '16%', textAlign: 'right' },
  colTotal: { width: '22%', textAlign: 'right' },
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
  statutBadge: { fontSize: 7.5, padding: '2 6', borderRadius: 2, color: '#fff', marginTop: 3, alignSelf: 'flex-start' },
});

interface Props {
  bon: BonCommande;
}

const statutColors: Record<string, string> = {
  BROUILLON: '#f59e0b',
  ENVOYÉ: '#3b82f6',
  'REÇU PARTIELLEMENT': '#8b5cf6',
  REÇU: '#10b981',
  ANNULE: '#ef4444',
};

const statutLabels: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ENVOYÉ: 'Envoyé',
  'REÇU PARTIELLEMENT': 'Reçu partiellement',
  REÇU: 'Reçu',
  ANNULE: 'Annulé',
};

export function BonCommandePDF({ bon }: Props) {
  const lignes = bon.lignes || [];
  const total = lignes.reduce((sum, l) => sum + l.quantite_commandee * l.prix_unitaire_ht, 0);
  const deviseCode = bon.devise?.code || lignes[0]?.devise?.code || 'USD';

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
            <Text style={styles.title}>Bon de Commande</Text>
            <Text style={styles.subtitle}>N° {bon.numero_commande}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Date: {formatDate(bon.date_commande)}</Text>
            {bon.date_livraison_prevue ? (
              <Text style={styles.infoText}>Livraison prévue: {formatDate(bon.date_livraison_prevue)}</Text>
            ) : null}
            <Text style={[styles.statutBadge, { backgroundColor: statutColors[bon.statut] || '#999' }]}>
              {statutLabels[bon.statut] || bon.statut}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.row}><Text style={styles.label}>Fournisseur:</Text><Text style={styles.value}>{bon.partenaire?.nom || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Destination:</Text><Text style={styles.value}>{bon.ville_destination?.nom || '-'}</Text></View>
          {bon.commentaire ? (
            <View style={styles.row}><Text style={styles.label}>Commentaire:</Text><Text style={styles.value}>{bon.commentaire}</Text></View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lignes de commande</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colCode]}>Code</Text>
              <Text style={[styles.tableHeaderCell, styles.colProduit]}>Produit</Text>
              <Text style={[styles.tableHeaderCell, styles.colQte]}>Qté</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrix]}>Prix unit.</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total HT</Text>
            </View>
            {lignes.map((l, i) => (
              <View key={l.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : undefined]}>
                <Text style={[styles.tableCell, styles.colCode]}>{l.produit?.code_article || '-'}</Text>
                <Text style={[styles.tableCell, styles.colProduit]}>{l.produit?.nom || '-'}</Text>
                <Text style={[styles.tableCellRight, styles.colQte]}>{l.quantite_commandee}</Text>
                <Text style={[styles.tableCellRight, styles.colPrix]}>{formatCurrency(Number(l.prix_unitaire_ht))}</Text>
                <Text style={[styles.tableCellRight, styles.colTotal]}>
                  {formatCurrency(l.quantite_commandee * l.prix_unitaire_ht, l.devise?.code || deviseCode)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant total HT:</Text>
            <Text style={styles.totalValue}>{formatCurrency(total, deviseCode)}</Text>
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
