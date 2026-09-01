import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { AtelierTracabilite } from '../../types/atelier';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 7.5, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: '#1e3a5f' },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', textAlign: 'center', marginBottom: 3 },
  companyInfo: { fontSize: 7, textAlign: 'center', color: '#666', lineHeight: 1.3 },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  title: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a5f' },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 0.5, borderColor: '#1e3a5f', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { borderStyle: 'solid', borderWidth: 0.5, borderColor: '#1e3a5f', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#1e3a5f', color: '#ffffff', padding: 3, textAlign: 'center', fontWeight: 'bold', fontSize: 6.5, justifyContent: 'center', alignItems: 'center' },
  tableCol: { borderStyle: 'solid', borderWidth: 0.5, borderColor: '#ddd', borderLeftWidth: 0, borderTopWidth: 0, padding: 2.5, justifyContent: 'center', fontSize: 7 },
  textCenter: { textAlign: 'center' },
  rulesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, fontSize: 7 },
  ruleBox: { borderStyle: 'solid', borderWidth: 0.5, borderColor: '#1e3a5f', padding: 4, textAlign: 'center', width: '32%' },
  warningText: { marginTop: 8, fontSize: 7, textAlign: 'center', fontWeight: 'bold', color: '#c0392b' },
  footer: { marginTop: 10, fontSize: 6.5, textAlign: 'center', color: '#999' },
});

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

interface Props {
  data: AtelierTracabilite[];
  type: 'DRESSAGE' | 'MONTAGE';
}

export function AtelierPdfDocument({ data, type }: Props) {
  const title = type === 'DRESSAGE'
    ? 'Relevé de températures au Dressage - Traçabilité'
    : 'Relevé de températures au Montage - Traçabilité';
  const debutLabel = type === 'DRESSAGE' ? 'Début' : 'Début';
  const finLabel = type === 'DRESSAGE' ? 'Fin' : 'Fin';

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>
            Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC{'\n'}
            ID.NAT 01-856-N58TA1008392J | RCCM/CD/KIN/RCCM/13-BO66
          </Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColHeader, { width: '8%' }]}>Opérateur</Text>
            <Text style={[styles.tableColHeader, { width: '7%' }]}>Code prestation</Text>
            <Text style={[styles.tableColHeader, { width: '8%' }]}>Client</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>Qté</Text>
            <Text style={[styles.tableColHeader, { width: '12%' }]}>Produits utilisés</Text>
            <Text style={[styles.tableColHeader, { width: '7%' }]}>N° lot</Text>
            <Text style={[styles.tableColHeader, { width: '8%' }]}>Couleur / DLC</Text>
            <Text style={[styles.tableColHeader, { width: '7%' }]}>Cycle / Classe</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>{debutLabel} h</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>{debutLabel} T°</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>{finLabel} h</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>{finLabel} T°</Text>
            <Text style={[styles.tableColHeader, { width: '18%' }]}>Action corrective</Text>
          </View>

          {data.map((row, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCol, { width: '8%' }]}>{row.utilisateur?.full_name || ''}</Text>
              <Text style={[styles.tableCol, { width: '7%' }]}>{row.code_prestation || ''}</Text>
              <Text style={[styles.tableCol, { width: '8%' }]}>{row.partenaire?.nom || ''}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{row.quantite || ''}</Text>
              <Text style={[styles.tableCol, { width: '12%' }]}>{row.produits_utilises || ''}</Text>
              <Text style={[styles.tableCol, { width: '7%' }]}>{row.lot?.numero_lot || ''}</Text>
              <Text style={[styles.tableCol, { width: '8%' }]}>{row.code_couleur_produit_dlc || ''}</Text>
              <Text style={[styles.tableCol, { width: '7%' }]}>{row.cycle_classe || ''}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{formatTime(row.heure_debut)}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{row.temperature_surface_debut != null ? String(row.temperature_surface_debut) : ''}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{formatTime(row.heure_fin)}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{row.temperature_surface_fin != null ? String(row.temperature_surface_fin) : ''}</Text>
              <Text style={[styles.tableCol, { width: '18%' }]}>{row.action_corrective || ''}</Text>
            </View>
          ))}
        </View>

        <View style={styles.rulesContainer}>
          <View style={styles.ruleBox}>
            <Text>Si T° atelier &lt; +12°C :</Text>
            <Text style={{ fontWeight: 'bold', marginTop: 2 }}>Durée max = 90 min</Text>
          </View>
          <View style={styles.ruleBox}>
            <Text>Si T° atelier &gt; +12°C :</Text>
            <Text style={{ fontWeight: 'bold', marginTop: 2 }}>Durée max = 45 min</Text>
          </View>
          <View style={styles.ruleBox}>
            <Text style={{ fontWeight: 'bold', textAlign: 'center', marginTop: 4 }}>T° surface produit ne doit pas dépasser +8°C</Text>
          </View>
        </View>

        <Text style={styles.warningText}>
          En cas de non-conformité, prévenir immédiatement le responsable de service ou qualité
        </Text>

        <Text style={styles.footer}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
      </Page>
    </Document>
  );
}
