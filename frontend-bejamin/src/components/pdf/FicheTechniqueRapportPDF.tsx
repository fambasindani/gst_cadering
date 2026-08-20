import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { RapportFicheTechniqueData } from '../../types/fiche-technique-menu';
import { formatCurrency } from '../../lib/format';

const COL_W = { code: 90, designation: 250, u: 45, qte: 130, pu: 130, cout: 141 };

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: 'Helvetica' },
  header: { marginBottom: 10, borderBottom: '2 solid #1e3a5f', paddingBottom: 8 },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  companyInfo: { fontSize: 6.5, color: '#555', lineHeight: 1.4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 2 },
  title: { fontSize: 12, fontWeight: 'bold', color: '#1e3a5f' },
  titleMeta: { flexDirection: 'row', marginTop: 1, marginBottom: 8 },
  metaChip: { fontSize: 7.5, color: '#1e3a5f', fontFamily: 'Courier', marginRight: 8 },
  clientBox: { borderWidth: 1, borderColor: '#1e3a5f', backgroundColor: '#eef2f7', borderRadius: 4, padding: 8, marginBottom: 10 },
  clientLabel: { fontSize: 6, color: '#1e3a5f', marginBottom: 2, textTransform: 'uppercase' },
  clientValue: { fontSize: 11, fontWeight: 'bold', color: '#1e3a5f' },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 4, paddingBottom: 3, borderBottom: '1 solid #ddd', marginTop: 8 },
  table: { marginTop: 2, width: COL_W.code + COL_W.designation + COL_W.u + COL_W.qte + COL_W.pu + COL_W.cout },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f' },
  tableHeaderCell: { color: '#fff', fontSize: 6.5, fontWeight: 'bold', paddingVertical: 4, paddingHorizontal: 3 },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 6.5, color: '#333', paddingVertical: 3.5, paddingHorizontal: 3 },
  tableCellRight: { fontSize: 6.5, color: '#333', textAlign: 'right', paddingVertical: 3.5, paddingHorizontal: 3 },
  tableCellMono: { fontSize: 6.5, color: '#1e3a5f', fontFamily: 'Courier', paddingVertical: 3.5, paddingHorizontal: 3 },
  colCode: { width: COL_W.code },
  colDesignation: { width: COL_W.designation },
  colU: { width: COL_W.u, textAlign: 'center' },
  colQteTot: { width: COL_W.qte, textAlign: 'right' },
  colPU: { width: COL_W.pu, textAlign: 'right' },
  colCout: { width: COL_W.cout, textAlign: 'right' },
  totalRow: { flexDirection: 'row', backgroundColor: '#eef1f5', alignItems: 'center' },
  totalCell: { fontSize: 7, fontWeight: 'bold', color: '#1e3a5f', paddingVertical: 4, paddingHorizontal: 3 },
  totalsBox: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  totalBox: { flex: 1, border: '1 solid #c9d4e0', backgroundColor: '#f4f7fa', borderRadius: 3, padding: 8, alignItems: 'center', marginHorizontal: 4 },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  totalLabel: { fontSize: 6.5, color: '#888' },
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, borderTop: '1 solid #ddd', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6, color: '#999' },
});

const fmt = (n: number | string | null | undefined, decimals = 2) =>
  Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export function FicheTechniqueRapportPDF({ data }: { data: RapportFicheTechniqueData }) {
  const { menu, totalArticles, coutTotalFiche, coutParPassagerTotal } = data;
  const passagers = Number(data.rapport.nombre_passagers) || 0;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Fiche technique — {menu.nom}</Text>
        </View>
        <View style={styles.titleMeta}>
          <Text style={styles.metaChip}>Code : {menu.code}</Text>
          <Text style={styles.metaChip}>N° {data.rapport.id}</Text>
        </View>

        <View style={styles.clientBox}>
          <Text style={styles.clientLabel}>Client</Text>
          <Text style={styles.clientValue}>{data.rapport.partenaire?.nom || menu.partenaire?.nom || '-'}</Text>
        </View>

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
            <Text style={[styles.totalCell, { width: COL_W.designation + COL_W.u + COL_W.qte + COL_W.pu }]} />
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
