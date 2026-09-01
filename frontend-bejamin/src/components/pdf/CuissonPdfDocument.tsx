import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { CuissonTracabilite } from '../../types/cuisson';

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
  footerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, fontSize: 7, borderTopWidth: 0.5, borderTopColor: '#1e3a5f', paddingTop: 6 },
  footerColumn: { width: '48%' },
  footerRightColumn: { width: '48%', textAlign: 'right' },
  nbText: { marginTop: 4, fontSize: 6.5, color: '#555' },
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

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

interface Props {
  data: CuissonTracabilite[];
}

export function CuissonPdfDocument({ data }: Props) {
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
          <Text style={styles.title}>Cuisson / Refroidissement rapide - Traçabilité</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>Date</Text>
            <Text style={[styles.tableColHeader, { width: '8%' }]}>Produit</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>Décongél.</Text>
            <Text style={[styles.tableColHeader, { width: '4%' }]}>Couleur</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>Qté avt</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>Qté après</Text>
            <Text style={[styles.tableColHeader, { width: '4%' }]}>DLC</Text>
            <Text style={[styles.tableColHeader, { width: '6%' }]}>Lot interne</Text>
            <Text style={[styles.tableColHeader, { width: '6%' }]}>Lot créé</Text>
            <Text style={[styles.tableColHeader, { width: '4%' }]}>Mode</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>Fin cuisson</Text>
            <Text style={[styles.tableColHeader, { width: '4%' }]}>T°C cœur cuisson</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>Début refroid.</Text>
            <Text style={[styles.tableColHeader, { width: '5%' }]}>Fin refroid.</Text>
            <Text style={[styles.tableColHeader, { width: '4%' }]}>T°C cœur refroid.</Text>
            <Text style={[styles.tableColHeader, { width: '8%' }]}>Opérateur</Text>
            <Text style={[styles.tableColHeader, { width: '8%' }]}>Client</Text>
          </View>

          {data.map((row, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{formatDate(row.date_operation)}</Text>
              <Text style={[styles.tableCol, { width: '8%' }]}>{row.lot?.produit?.nom || '-'}</Text>
              <Text style={[styles.tableCol, { width: '5%' }]}>{row.mise_en_decongelation || ''}</Text>
              <Text style={[styles.tableCol, { width: '4%', textAlign: 'center' }]}>{row.code_couleur || ''}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{row.quantite_avant_cuisson || ''}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{row.quantite_apres_cuisson || ''}</Text>
              <Text style={[styles.tableCol, { width: '4%', textAlign: 'center' }]}>{row.dlc_dluo || ''}</Text>
              <Text style={[styles.tableCol, { width: '6%', textAlign: 'center' }]}>{row.lot?.numero_lot || '-'}</Text>
              <Text style={[styles.tableCol, { width: '6%', textAlign: 'center' }]}>{row.numero_lot_cree || ''}</Text>
              <Text style={[styles.tableCol, { width: '4%', textAlign: 'center' }]}>{row.mode_cuisson || ''}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{formatTime(row.heure_fin_cuisson)}</Text>
              <Text style={[styles.tableCol, { width: '4%', textAlign: 'center' }]}>{row.temperature_coeur_cuisson != null ? String(row.temperature_coeur_cuisson) : ''}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{formatTime(row.heure_debut_refroidissement)}</Text>
              <Text style={[styles.tableCol, { width: '5%', textAlign: 'center' }]}>{formatTime(row.heure_fin_refroidissement)}</Text>
              <Text style={[styles.tableCol, { width: '4%', textAlign: 'center' }]}>{row.temperature_coeur_refroidissement != null ? String(row.temperature_coeur_refroidissement) : ''}</Text>
              <Text style={[styles.tableCol, { width: '8%' }]}>{row.utilisateur?.full_name || ''}</Text>
              <Text style={[styles.tableCol, { width: '8%' }]}>{row.partenaire?.nom || ''}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerContainer}>
          <View style={styles.footerColumn}>
            <Text>Volaille = +74°C</Text>
            <Text>Viande cuite à cœur et Ovoproduits pasteurisés = +70°C</Text>
            <Text>Produits à base d'œuf en coquille = +74°C</Text>
            <Text>Poisson et crustacés = +65°C</Text>
          </View>
          <View style={styles.footerRightColumn}>
            <Text style={{ fontWeight: 'bold' }}>Refroidissement rapide en moins de 2 heures à moins de 5°C</Text>
            <Text style={styles.nbText}>En cas de non-conformité, prévenir votre responsable hiérarchique ou hygiène</Text>
            <Text style={styles.nbText}>NB : Après refroidissement à l'eau froide ou aux glaçons, les produits doivent passer en cellule de refroidissement</Text>
          </View>
        </View>

        <Text style={styles.footer}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
      </Page>
    </Document>
  );
}
