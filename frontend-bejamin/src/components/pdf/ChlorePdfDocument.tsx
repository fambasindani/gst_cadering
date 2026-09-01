import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { SuiviChlore } from '../../types/suivi-chlore';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 8, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: '#1e3a5f' },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', textAlign: 'center', marginBottom: 3 },
  companyInfo: { fontSize: 7, textAlign: 'center', color: '#666', lineHeight: 1.3 },
  titleSection: { marginTop: 6, marginBottom: 10 },
  title: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a5f', textAlign: 'center' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 6 },
  metaItem: { width: '48%', border: '0.5 solid #1e3a5f', padding: 5, borderRadius: 2 },
  metaLabel: { fontSize: 7, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 1 },
  metaValue: { fontSize: 8 },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 0.5, borderColor: '#1e3a5f', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { borderStyle: 'solid', borderWidth: 0.5, borderColor: '#1e3a5f', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#1e3a5f', color: '#ffffff', padding: 4, textAlign: 'center', fontWeight: 'bold', fontSize: 7, justifyContent: 'center', alignItems: 'center' },
  tableCol: { borderStyle: 'solid', borderWidth: 0.5, borderColor: '#ddd', borderLeftWidth: 0, borderTopWidth: 0, padding: 3, justifyContent: 'center', fontSize: 8 },
  textCenter: { textAlign: 'center' },
  signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#1e3a5f' },
  signatureBox: { width: '30%', border: '0.5 solid #999', padding: 6, borderRadius: 2 },
  signatureLabel: { fontSize: 7, color: '#666', marginBottom: 8, textAlign: 'center' },
  signatureLine: { borderTop: '0.5 solid #333', marginTop: 30, paddingTop: 3 },
  signatureName: { fontSize: 7, textAlign: 'center', marginTop: 2, color: '#666' },
  footer: { marginTop: 12, fontSize: 6.5, textAlign: 'center', color: '#999', borderTopWidth: 0.5, borderTopColor: '#1e3a5f', paddingTop: 6 },
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
  data: SuiviChlore[];
}

export function ChlorePdfDocument({ data }: Props) {
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
          <Text style={styles.title}>Suivi du dosage du chlore</Text>
        </View>

        {data.length > 0 && (
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date :</Text>
              <Text style={styles.metaValue}>{formatDate(data[0].date_operation)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Agent de contrôle :</Text>
              <Text style={styles.metaValue}>{data[0].utilisateur?.full_name || '-'}</Text>
            </View>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColHeader, { width: '18%' }]}>Produit</Text>
            <Text style={[styles.tableColHeader, { width: '14%' }]}>N° lot</Text>
            <Text style={[styles.tableColHeader, { width: '15%' }]}>Date</Text>
            <Text style={[styles.tableColHeader, { width: '18%' }]}>Concentration (ppm)</Text>
            <Text style={[styles.tableColHeader, { width: '18%' }]}>Temps trempage (min)</Text>
            <Text style={[styles.tableColHeader, { width: '35%' }]}>Commentaire / Action corrective</Text>
          </View>

          {data.map((row, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCol, { width: '18%' }]}>{row.lot?.produit?.nom || '-'}</Text>
              <Text style={[styles.tableCol, { width: '14%', textAlign: 'center' }]}>{row.lot?.numero_lot || '-'}</Text>
              <Text style={[styles.tableCol, { width: '15%', textAlign: 'center' }]}>{formatDate(row.date_operation)}</Text>
              <Text style={[styles.tableCol, { width: '18%', textAlign: 'center' }]}>{row.concentration_ppm != null ? String(row.concentration_ppm) : '-'}</Text>
              <Text style={[styles.tableCol, { width: '18%', textAlign: 'center' }]}>{row.temps_trempage_minutes != null ? String(row.temps_trempage_minutes) : '-'}</Text>
              <Text style={[styles.tableCol, { width: '35%' }]}>{row.commentaire_action_corrective || '-'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Contrôleur</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>{data.length > 0 ? (data[0].utilisateur?.full_name || '') : ''}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Responsable qualité</Text>
            <View style={styles.signatureLine}></View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Responsable HACCP</Text>
            <View style={styles.signatureLine}></View>
          </View>
        </View>

        <Text style={styles.footer}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
      </Page>
    </Document>
  );
}
