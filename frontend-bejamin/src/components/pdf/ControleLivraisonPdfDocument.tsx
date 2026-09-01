import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { ControleLivraison } from '../../types/controle-livraison';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 8, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: '#1e3a5f' },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', textAlign: 'center', marginBottom: 3 },
  companyInfo: { fontSize: 7, textAlign: 'center', color: '#666', lineHeight: 1.3 },
  titleSection: { marginTop: 4, marginBottom: 10 },
  title: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a5f', textAlign: 'center' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 },
  metaItem: { width: '48%', border: '0.5 solid #1e3a5f', padding: 5, borderRadius: 2 },
  metaLabel: { fontSize: 7, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 1 },
  metaValue: { fontSize: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, marginTop: 4 },
  checkboxLabel: { fontSize: 8 },
  checkbox: { width: 8, height: 8, borderWidth: 1, borderColor: '#333', marginRight: 3 },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 0.5, borderColor: '#1e3a5f', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { borderStyle: 'solid', borderWidth: 0.5, borderColor: '#1e3a5f', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#1e3a5f', color: '#ffffff', padding: 4, textAlign: 'center', fontWeight: 'bold', fontSize: 7, justifyContent: 'center', alignItems: 'center' },
  tableCol: { borderStyle: 'solid', borderWidth: 0.5, borderColor: '#ddd', borderLeftWidth: 0, borderTopWidth: 0, padding: 3, justifyContent: 'center', fontSize: 8 },
  textCenter: { textAlign: 'center' },
  colPrestation: { width: '15%' },
  colPlatProduit: { width: '22%' },
  colCodeCouleur: { width: '11%' },
  colNumeroLot: { width: '12%' },
  colFinalHolding: { width: '12%' },
  colReceptionClient: { width: '12%' },
  colCommentaires: { width: '16%' },
  signatureSection: { flexDirection: 'row', marginTop: 12, borderTopWidth: 0.5, borderTopColor: '#1e3a5f', paddingTop: 8 },
  signatureBox: { flex: 1, border: '0.5 solid #999', padding: 6, marginHorizontal: 3, borderRadius: 2 },
  signatureLabel: { fontSize: 7, color: '#666', marginBottom: 8, textAlign: 'center' },
  signatureLine: { borderTop: '0.5 solid #333', marginTop: 25, paddingTop: 3 },
  rulesContainer: { marginTop: 8, fontSize: 7, lineHeight: 1.3, border: '0.5 solid #ddd', padding: 6, borderRadius: 2, backgroundColor: '#f8f9fa' },
  footer: { marginTop: 10, fontSize: 6.5, textAlign: 'center', color: '#999' },
});

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(2);
  return `${day}/${month}/${year}`;
}

interface Props {
  data: ControleLivraison[];
}

export function ControleLivraisonPdfDocument({ data }: Props) {
  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>
            Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC{'\n'}
            ID.NAT 01-856-N58TA1008392J | RCCM/CD/KIN/RCCM/13-BO66
          </Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>Contrôle livraison - Traçabilité</Text>
        </View>

        {data.length > 0 && (
          <View>
            <View style={styles.metaGrid}>
              {data[0].date_operation && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Date :</Text>
                  <Text style={styles.metaValue}>{formatDate(data[0].date_operation)}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Agent :</Text>
                <Text style={styles.metaValue}>{data[0].utilisateur?.full_name || '-'}</Text>
              </View>
            </View>
            <View style={styles.metaGrid}>
              {data[0].partenaire && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Client :</Text>
                  <Text style={styles.metaValue}>{data[0].partenaire.nom}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Heure :</Text>
                <Text style={styles.metaValue}>
                  {data[0].heure_debut ? `Début ${data[0].heure_debut}` : ''}
                  {data[0].heure_fin ? ` — Fin ${data[0].heure_fin}` : ''}
                </Text>
              </View>
            </View>
            {data[0].camion_propre !== null && data[0].camion_propre !== undefined && (
              <View style={styles.checkboxRow}>
                <Text style={styles.checkboxLabel}>Camion propre :</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.checkbox, data[0].camion_propre ? { backgroundColor: '#1e3a5f' } : {}]} />
                  <Text>Oui</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.checkbox, !data[0].camion_propre ? { backgroundColor: '#1e3a5f' } : {}]} />
                  <Text>Non</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColHeader, styles.colPrestation]}>Code prestation</Text>
            <Text style={[styles.tableColHeader, styles.colPlatProduit]}>Plat / Produit</Text>
            <Text style={[styles.tableColHeader, styles.colCodeCouleur]}>Code couleur</Text>
            <Text style={[styles.tableColHeader, styles.colNumeroLot]}>N° lot</Text>
            <Text style={[styles.tableColHeader, styles.colFinalHolding]}>T° Final Holding</Text>
            <Text style={[styles.tableColHeader, styles.colReceptionClient]}>T° Réception client</Text>
            <Text style={[styles.tableColHeader, styles.colCommentaires]}>Commentaires</Text>
          </View>

          {data.map((row, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCol, styles.colPrestation]}>{row.code_prestation_classe || ''}</Text>
              <Text style={[styles.tableCol, styles.colPlatProduit]}>{row.lot?.produit?.nom || ''}</Text>
              <Text style={[styles.tableCol, styles.colCodeCouleur]}>{row.code_couleur || ''}</Text>
              <Text style={[styles.tableCol, styles.colNumeroLot]}>{row.lot?.numero_lot || ''}</Text>
              <Text style={[styles.tableCol, styles.colFinalHolding, styles.textCenter]}>{row.final_holding_temperature != null ? String(row.final_holding_temperature) : ''}</Text>
              <Text style={[styles.tableCol, styles.colReceptionClient, styles.textCenter]}>{row.reception_client_temperature != null ? String(row.reception_client_temperature) : ''}</Text>
              <Text style={[styles.tableCol, styles.colCommentaires]}>{row.commentaires || ''}</Text>
            </View>
          ))}
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Superviseur</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Responsable qualité</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Remarque</Text>
          </View>
        </View>

        <View style={styles.rulesContainer}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Règles de température :</Text>
          <Text>• Température au Final Holding : cible +3°C, max +5°C</Text>
          <Text>• Température à réception chez le client : max +8°C (produits frais) / min +63°C (liaison chaude)</Text>
        </View>

        <Text style={styles.footer}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
      </Page>
    </Document>
  );
}
