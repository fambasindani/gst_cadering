import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Facture } from '../../types/facturation';
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
  label: { width: 120, fontSize: 8, color: '#888' },
  value: { flex: 1, fontSize: 8, color: '#333' },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 6, borderRadius: 2 },
  tableHeaderCell: { color: '#fff', fontSize: 7.5, fontWeight: 'bold' },
  colProduit: { width: '28%' },
  colLot: { width: '14%' },
  colQte: { width: '10%', textAlign: 'right' },
  colPrix: { width: '16%', textAlign: 'right' },
  colRemise: { width: '10%', textAlign: 'center' },
  colTotal: { width: '22%', textAlign: 'right' },
  tableRow: { flexDirection: 'row', padding: 5, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 7.5, color: '#333' },
  tableCellRight: { fontSize: 7.5, color: '#333', textAlign: 'right' },
  tableCellCenter: { fontSize: 7.5, color: '#333', textAlign: 'center' },
  totalSection: { marginTop: 12, borderTop: '1 solid #ddd', paddingTop: 8, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 3 },
  totalLabel: { fontSize: 9, color: '#666', marginRight: 20, width: 100, textAlign: 'right' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', width: 120, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 35, right: 35, borderTop: '1 solid #ddd', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
  statutBadge: { fontSize: 7.5, padding: '2 6', borderRadius: 2, color: '#fff', marginTop: 3, alignSelf: 'flex-start' },
});

const statutColors: Record<string, string> = {
  BROUILLON: '#f59e0b',
  EMISE: '#3b82f6',
  PAYEE: '#10b981',
  ANNULEE: '#ef4444',
};

const statutLabels: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EMISE: 'Émise',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
};

export function FacturePDF({ facture }: { facture: Facture }) {
  const lignes = facture.lignes || [];
  const deviseCode = facture.devise?.code || 'USD';

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
            <Text style={styles.title}>Facture</Text>
            <Text style={styles.subtitle}>N° {facture.numero_facture}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Date: {formatDate(facture.date_facture)}</Text>
            <Text style={styles.infoText}>Échéance: {formatDate(facture.date_echeance)}</Text>
            <Text style={[styles.statutBadge, { backgroundColor: statutColors[facture.statut] || '#999' }]}>
              {statutLabels[facture.statut] || facture.statut}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.row}><Text style={styles.label}>Raison sociale:</Text><Text style={styles.value}>{facture.client?.nom || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Ville:</Text><Text style={styles.value}>{facture.ville?.nom || '-'}</Text></View>
          {facture.bon_commande ? (
            <View style={styles.row}><Text style={styles.label}>Bon de commande:</Text><Text style={styles.value}>{facture.bon_commande.numero_commande}</Text></View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des prestations</Text>
          {lignes.length === 0 ? (
            <Text style={{ fontSize: 8, color: '#999', marginTop: 8 }}>Aucune ligne</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colProduit]}>Produit</Text>
                <Text style={[styles.tableHeaderCell, styles.colLot]}>Lot</Text>
                <Text style={[styles.tableHeaderCell, styles.colQte]}>Qté</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrix]}>P.U. HT</Text>
                <Text style={[styles.tableHeaderCell, styles.colRemise]}>Remise</Text>
                <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total HT</Text>
              </View>
              {lignes.map((l, i) => {
                const totalLigne = l.quantite * l.prix_unitaire_ht * (1 - (l.remise || 0) / 100);
                return (
                  <View key={l.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : undefined]}>
                    <Text style={[styles.tableCell, styles.colProduit]}>{l.produit?.nom || 'Produit #' + l.id_produit}</Text>
                    <Text style={[styles.tableCell, styles.colLot]}>{l.lot?.numero_lot || '-'}</Text>
                    <Text style={[styles.tableCellRight, styles.colQte]}>{l.quantite}</Text>
                    <Text style={[styles.tableCellRight, styles.colPrix]}>{formatCurrency(l.prix_unitaire_ht, deviseCode)}</Text>
                    <Text style={[styles.tableCellCenter, styles.colRemise]}>{l.remise || 0}%</Text>
                    <Text style={[styles.tableCellRight, styles.colTotal]}>{formatCurrency(totalLigne, deviseCode)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant HT:</Text>
            <Text style={styles.totalValue}>{formatCurrency(facture.montant_ht, deviseCode)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant TTC:</Text>
            <Text style={styles.totalValue}>{formatCurrency(facture.montant_ttc, deviseCode)}</Text>
          </View>
          {facture.total_paye != null ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total payé:</Text>
              <Text style={[styles.totalValue, { color: '#10b981' }]}>{formatCurrency(facture.total_paye, deviseCode)}</Text>
            </View>
          ) : null}
          {facture.solde != null ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Solde:</Text>
              <Text style={[styles.totalValue, { color: facture.solde > 0 ? '#ef4444' : '#10b981' }]}>{formatCurrency(facture.solde, deviseCode)}</Text>
            </View>
          ) : null}
        </View>

        {facture.commentaire ? (
          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Commentaire</Text>
            <Text style={{ fontSize: 8, color: '#555' }}>{facture.commentaire}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
          <Text style={styles.footerText}>Page 1/1</Text>
        </View>
      </Page>
    </Document>
  );
}
