import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { EntreeRecette } from '../../types/fiche-technique';
import { formatCurrency } from '../../lib/format';

const styles = StyleSheet.create({
  page: { padding: 35, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 16, borderBottom: '2 solid #1e3a5f', paddingBottom: 10 },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  companyInfo: { fontSize: 7, color: '#555', lineHeight: 1.4 },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, marginTop: 4 },
  titleBox: { flex: 1 },
  title: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f' },
  subtitle: { fontSize: 8, color: '#666', marginTop: 2 },
  infoBox: { alignItems: 'flex-end', flex: 1 },
  infoText: { fontSize: 8, color: '#444', lineHeight: 1.5 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 5, paddingBottom: 3, borderBottom: '1 solid #ddd' },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { width: 130, fontSize: 8, color: '#888' },
  value: { flex: 1, fontSize: 8, color: '#333' },
  summaryBox: { flexDirection: 'row', gap: 8, marginTop: 4 },
  summaryCard: { flex: 1, border: '1 solid #e0e0e0', borderRadius: 4, padding: 6, backgroundColor: '#fafafa' },
  summaryCardTitle: { fontSize: 7, color: '#999', marginBottom: 2 },
  summaryCardValue: { fontSize: 10, fontWeight: 'bold', color: '#1e3a5f' },
  totalSection: { marginTop: 10, borderTop: '1 solid #ddd', paddingTop: 6, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 2 },
  totalLabel: { fontSize: 9, color: '#666', marginRight: 15, width: 120, textAlign: 'right' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', width: 110, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 35, right: 35, borderTop: '1 solid #ddd', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
});

export function EntreeRecettePDF({ recette }: { recette: EntreeRecette }) {
  const fiche = recette.fiche_technique;
  const nombrePortions = Number(recette.nombre_portions) || 0;
  const nombrePassages = Number(recette.nombre_passages) || 0;
  const coutUnitaire = Number(fiche?.cout_unitaire) || 0;
  const coutTotalPortions = coutUnitaire * nombrePortions;
  const dateFormatee = recette.date_production
    ? new Date(recette.date_production).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '-';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
        </View>

        <View style={styles.titleSection}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Rapport d'entrée recette</Text>
            <Text style={styles.subtitle}>N° {recette.id} — {dateFormatee}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Client: {recette.partenaire?.nom || '-'}</Text>
            <Text style={styles.infoText}>Portions (passagers): {nombrePortions}</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Recette</Text>
            <Text style={styles.summaryCardValue}>{fiche?.nom || '-'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Portions</Text>
            <Text style={styles.summaryCardValue}>{nombrePortions}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Passages</Text>
            <Text style={styles.summaryCardValue}>{nombrePassages}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Coût total</Text>
            <Text style={styles.summaryCardValue}>{formatCurrency(coutTotalPortions)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.row}><Text style={styles.label}>Client:</Text><Text style={styles.value}>{recette.partenaire?.nom || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Fiche recette:</Text><Text style={styles.value}>{fiche?.code ? `[${fiche.code}] ` : ''}{fiche?.nom || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nombre de portions:</Text><Text style={styles.value}>{nombrePortions}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nombre de passages:</Text><Text style={styles.value}>{nombrePassages}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Date production:</Text><Text style={styles.value}>{dateFormatee}</Text></View>
          {recette.commentaire ? (
            <View style={styles.row}><Text style={styles.label}>Commentaire:</Text><Text style={styles.value}>{recette.commentaire}</Text></View>
          ) : null}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Coût unitaire:</Text>
            <Text style={styles.totalValue}>{formatCurrency(coutUnitaire)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Coût total ({nombrePortions} portions):</Text>
            <Text style={styles.totalValue}>{formatCurrency(coutTotalPortions)}</Text>
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
