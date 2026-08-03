import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { RapportFicheTechniqueData } from '../../types/fiche-technique-menu';
import { formatCurrency } from '../../lib/format';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: 'Helvetica' },
  header: { marginBottom: 12, borderBottom: '2 solid #1e3a5f', paddingBottom: 8 },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  companyInfo: { fontSize: 6.5, color: '#555', lineHeight: 1.4 },
  title: { fontSize: 12, fontWeight: 'bold', color: '#1e3a5f', marginTop: 4, marginBottom: 2 },
  subtitle: { fontSize: 7.5, color: '#666', marginBottom: 10 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  infoBox: { width: '16%', border: '1 solid #e5e5e5', borderRadius: 3, padding: 5, marginRight: 6, marginBottom: 5 },
  infoLabel: { fontSize: 5.5, color: '#888', marginBottom: 2, textTransform: 'uppercase' },
  infoValue: { fontSize: 8, fontWeight: 'bold', color: '#1e3a5f' },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 4, paddingBottom: 3, borderBottom: '1 solid #ddd', marginTop: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 3 },
  itemName: { fontSize: 8.5, fontWeight: 'bold', color: '#333' },
  itemCode: { fontSize: 6.5, color: '#888', fontFamily: 'Courier' },
  itemMeta: { fontSize: 7, color: '#555' },
  table: { marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 4 },
  tableHeaderCell: { color: '#fff', fontSize: 6.5, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', padding: 3.5, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 6.5, color: '#333' },
  tableCellRight: { fontSize: 6.5, color: '#333', textAlign: 'right' },
  tableCellMono: { fontSize: 6.5, color: '#1e3a5f', fontFamily: 'Courier' },
  partieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e3a5f', padding: 5, marginTop: 8 },
  partieTitle: { fontSize: 8.5, fontWeight: 'bold', color: '#fff' },
  partieCount: { fontSize: 7, color: '#cbd5e1' },
  colCode: { width: '12%' },
  colDesignation: { width: '30%' },
  colU: { width: '6%', textAlign: 'center' },
  colQtePort: { width: '12%' },
  colQteTot: { width: '13%' },
  colPU: { width: '13%' },
  colCout: { width: '14%' },
  colCodeP: { width: '13%' },
  colDesignationP: { width: '50%' },
  colPct: { width: '14%', textAlign: 'right' },
  colCoutP: { width: '23%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', padding: 4, backgroundColor: '#eef1f5', alignItems: 'center' },
  totalCell: { fontSize: 7, fontWeight: 'bold', color: '#1e3a5f' },
  totalsBox: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  totalBox: { flex: 1, border: '1 solid #c9d4e0', backgroundColor: '#f4f7fa', borderRadius: 3, padding: 8, alignItems: 'center', marginHorizontal: 4 },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  totalLabel: { fontSize: 6.5, color: '#888' },
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, borderTop: '1 solid #ddd', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6, color: '#999' },
});

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

const fmt = (n: number | string | null | undefined, decimals = 2) =>
  Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function FicheTechniqueRapportPDF({ data }: { data: RapportFicheTechniqueData }) {
  const { menu, parties, totalArticles, coutTotalFiche, coutParPassagerTotal } = data;
  const passagers = Number(data.rapport.nombre_passagers) || 0;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
          <Text style={styles.title}>Fiche technique — {menu.nom}</Text>
          <Text style={styles.subtitle}>Code : {menu.code} — Rapport N° {data.rapport.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Cycle</Text><Text style={styles.infoValue}>{menu.cycle || '-'}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Périodicité</Text><Text style={styles.infoValue}>{menu.periodicite || '-'}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Validité</Text><Text style={styles.infoValue}>{menu.validite || '-'}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Client</Text><Text style={styles.infoValue}>{menu.partenaire?.nom || '-'}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Compagnie</Text><Text style={styles.infoValue}>{data.rapport.partenaire?.nom || '-'}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{formatDate(data.rapport.date_rapport)}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Magasin</Text><Text style={styles.infoValue}>{menu.magasin?.nom || '-'}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Passagers</Text><Text style={styles.infoValue}>{fmt(passagers, 0)}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Coût par passager</Text><Text style={styles.infoValue}>{formatCurrency(coutParPassagerTotal)}</Text></View>
        </View>

        {parties.map((partie) => (
          <View key={partie.id} wrap={false}>
            <View style={styles.partieHeader}>
              <Text style={styles.partieTitle}>{partie.nom}</Text>
              <Text style={styles.partieCount}>{partie.items.length} item(s)</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colCodeP]}>Code article</Text>
                <Text style={[styles.tableHeaderCell, styles.colDesignationP]}>Désignation</Text>
                <Text style={[styles.tableHeaderCell, styles.colPct]}>% passagers</Text>
                <Text style={[styles.tableHeaderCell, styles.colCoutP]}>Coût total</Text>
              </View>
              {partie.items.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableCellMono, styles.colCodeP]}>{item.code}</Text>
                  <Text style={[styles.tableCell, styles.colDesignationP]}>{item.designation}</Text>
                  <Text style={[styles.tableCellRight, styles.colPct]}>{fmt(item.pourcentage)} %</Text>
                  <Text style={[styles.tableCellRight, styles.colCoutP]}>{formatCurrency(item.coutTotal)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Récapitulatif des articles consommés</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colCode]}>Code article</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesignation]}>Désignation</Text>
            <Text style={[styles.tableHeaderCell, styles.colU]}>U</Text>
            <Text style={[styles.tableHeaderCell, styles.colQteTot]}>Quantité totale</Text>
            <Text style={[styles.tableHeaderCell, styles.colPU]}>Prix unitaire</Text>
            <Text style={[styles.tableHeaderCell, styles.colCout]}>Coût total</Text>
          </View>
          {totalArticles.map((a, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellMono, styles.colCode]}>{a.code_article || '-'}</Text>
              <Text style={[styles.tableCell, styles.colDesignation]}>{a.nom}</Text>
              <Text style={[styles.tableCell, styles.colU]}>{a.unite}</Text>
              <Text style={[styles.tableCellRight, styles.colQteTot]}>{fmt(a.quantiteTotale, 3)}</Text>
              <Text style={[styles.tableCellRight, styles.colPU]}>{formatCurrency(a.prixUnitaire)}</Text>
              <Text style={[styles.tableCellRight, styles.colCout]}>{formatCurrency(a.coutTotal)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalCell, styles.colCode]}>TOTAL</Text>
            <Text style={[styles.totalCell, { width: '74%' }]} />
            <Text style={[styles.totalCell, styles.colCout]}>{formatCurrency(coutTotalFiche)}</Text>
          </View>
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalBox}><Text style={styles.totalValue}>{fmt(passagers, 0)}</Text><Text style={styles.totalLabel}>Passagers</Text></View>
          <View style={styles.totalBox}><Text style={styles.totalValue}>{formatCurrency(coutParPassagerTotal)}</Text><Text style={styles.totalLabel}>Coût par passager</Text></View>
          <View style={styles.totalBox}><Text style={styles.totalValue}>{formatCurrency(coutTotalFiche)}</Text><Text style={styles.totalLabel}>Coût total</Text></View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
          <Text style={styles.footerText} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
