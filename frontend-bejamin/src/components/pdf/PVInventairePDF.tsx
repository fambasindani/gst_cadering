import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Inventaire, PeriodeInventaire } from '../../types/validation';

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
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 18, borderBottom: '2 solid #1e3a5f', paddingBottom: 12 },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 3 },
  companyInfo: { fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  titleBlock: { marginTop: 12, marginBottom: 16, alignItems: 'center' },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 3 },
  subtitle: { fontSize: 9, color: '#666' },
  infoSection: { marginBottom: 14 },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 120, fontSize: 8.5, color: '#888' },
  infoValue: { flex: 1, fontSize: 8.5, color: '#333' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 6, paddingBottom: 3, borderBottom: '1 solid #ddd' },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 6, borderRadius: 2 },
  th: { color: '#fff', fontSize: 7.5, fontWeight: 'bold' },
  thN: { width: '5%' },
  thCode: { width: '13%' },
  thProduit: { width: '22%' },
  thMagasin: { width: '14%' },
  thTheorique: { width: '9%', textAlign: 'right' },
  thPhysique: { width: '9%', textAlign: 'right' },
  thEcart: { width: '9%', textAlign: 'right' },
  thEcartSaisie: { width: '9%', textAlign: 'right' },
  thCommentaire: { width: '10%' },
  tr: { flexDirection: 'row', padding: 5, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  trAlt: { backgroundColor: '#f9f9f9' },
  td: { fontSize: 7.5, color: '#333' },
  tdRight: { fontSize: 7.5, color: '#333', textAlign: 'right' },
  tdCenter: { fontSize: 7.5, color: '#333', textAlign: 'center' },
  tdN: { width: '5%' },
  tdCode: { width: '13%' },
  tdProduit: { width: '22%' },
  tdMagasin: { width: '14%' },
  tdTheorique: { width: '9%', textAlign: 'right' },
  tdPhysique: { width: '9%', textAlign: 'right' },
  tdEcart: { width: '9%', textAlign: 'right' },
  tdEcartSaisie: { width: '9%', textAlign: 'right' },
  tdCommentaire: { width: '10%' },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  statBox: { flex: 1, padding: 8, borderRadius: 4, border: '1 solid #e5e7eb', alignItems: 'center' },
  statLabel: { fontSize: 7.5, color: '#888', marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#1e3a5f' },
  statValueGreen: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
  statValueRed: { fontSize: 14, fontWeight: 'bold', color: '#dc2626' },
  signaturesSection: { marginTop: 30, borderTop: '1 solid #ddd', paddingTop: 16 },
  sigTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 16, textAlign: 'center' },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sigBlock: { width: '30%', alignItems: 'center' },
  sigLine: { borderBottom: '1 solid #333', width: '100%', marginBottom: 4 },
  sigLabel: { fontSize: 8, color: '#666', marginTop: 4 },
  sigDate: { fontSize: 7, color: '#999', marginTop: 2 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1 solid #ddd', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
});

function ecartLabel(val: number): string {
  if (val > 0) return `+${val}`;
  return String(val);
}

interface Props {
  periode: PeriodeInventaire;
  data: Inventaire[];
}

export function PVInventairePDF({ periode, data }: Props) {
  const totalTheorique = data.reduce((s, i) => s + (i.stock_theorique || 0), 0);
  const totalPhysique = data.reduce((s, i) => s + (i.stock_physique_compte || 0), 0);
  const totalEcart = data.reduce((s, i) => s + ((i.ecart_saisie ?? i.ecart) || 0), 0);
  const ecartsPositifs = data.filter((i) => (i.ecart_saisie ?? i.ecart) > 0).length;
  const ecartsNegatifs = data.filter((i) => (i.ecart_saisie ?? i.ecart) < 0).length;
  const sansEcart = data.filter((i) => (i.ecart_saisie ?? i.ecart) === 0).length;

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

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

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Procès Verbal d'Ajustement d'Inventaire</Text>
          <Text style={styles.subtitle}>Fait à Kinshasa, le {today}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Période :</Text>
            <Text style={styles.infoValue}>{periode.libelle}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Période du :</Text>
            <Text style={styles.infoValue}>{formatDate(periode.date_debut)} au {formatDate(periode.date_fin)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Magasin :</Text>
            <Text style={styles.infoValue}>{periode.magasin?.nom || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre de produits :</Text>
            <Text style={styles.infoValue}>{data.length}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Détail des ajustements</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.thN]}>N°</Text>
              <Text style={[styles.th, styles.thCode]}>Code</Text>
              <Text style={[styles.th, styles.thProduit]}>Produit</Text>
              <Text style={[styles.th, styles.thMagasin]}>Magasin</Text>
              <Text style={[styles.th, styles.thTheorique]}>Théo.</Text>
              <Text style={[styles.th, styles.thPhysique]}>Phys.</Text>
              <Text style={[styles.th, styles.thEcart]}>Écart</Text>
              <Text style={[styles.th, styles.thEcartSaisie]}>Écart saisie</Text>
              <Text style={[styles.th, styles.thCommentaire]}>Observation</Text>
            </View>
            {data.map((inv, i) => {
              const ecartVal = inv.ecart_saisie ?? inv.ecart;
              return (
                <View key={inv.id} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]}>
                  <Text style={[styles.td, styles.tdN]}>{i + 1}</Text>
                  <Text style={[styles.td, styles.tdCode]}>{inv.produit?.code_article || '-'}</Text>
                  <Text style={[styles.td, styles.tdProduit]}>{inv.produit?.nom || '-'}</Text>
                  <Text style={[styles.td, styles.tdMagasin]}>{inv.magasin?.nom || '-'}</Text>
                  <Text style={[styles.tdRight, styles.tdTheorique]}>{inv.stock_theorique}</Text>
                  <Text style={[styles.tdRight, styles.tdPhysique]}>{inv.stock_physique_compte}</Text>
                  <Text style={[styles.tdRight, styles.tdEcart]}>{ecartLabel(ecartVal)}</Text>
                  <Text style={[styles.tdRight, styles.tdEcartSaisie]}>{ecartLabel(inv.ecart_saisie ?? inv.ecart)}</Text>
                  <Text style={[styles.td, styles.tdCommentaire]}>{inv.commentaire || '-'}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Stock théorique total</Text>
            <Text style={styles.statValue}>{totalTheorique}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Stock physique total</Text>
            <Text style={styles.statValue}>{totalPhysique}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Écart total</Text>
            <Text style={totalEcart > 0 ? styles.statValueGreen : totalEcart < 0 ? styles.statValueRed : styles.statValue}>{ecartLabel(totalEcart)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Excédent(s)</Text>
            <Text style={styles.statValueGreen}>{ecartsPositifs}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Manquant(s)</Text>
            <Text style={styles.statValueRed}>{ecartsNegatifs}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Sans écart</Text>
            <Text style={styles.statValue}>{sansEcart}</Text>
          </View>
        </View>

        <View style={styles.signaturesSection}>
          <Text style={styles.sigTitle}>Signatures</Text>
          <View style={styles.sigRow}>
            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Le Préparateur</Text>
              <Text style={styles.sigDate}>Nom & signature</Text>
            </View>
            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Le Contrôleur</Text>
              <Text style={styles.sigDate}>Nom & signature</Text>
            </View>
            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Le Responsable</Text>
              <Text style={styles.sigDate}>Nom & signature</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
          <Text style={styles.footerText}>PV Inventaire — {periode.libelle}</Text>
        </View>
      </Page>
    </Document>
  );
}
