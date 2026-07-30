import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { FicheTechnique } from '../../types/fiche-technique';
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
  label: { width: 110, fontSize: 8, color: '#888' },
  value: { flex: 1, fontSize: 8, color: '#333' },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 5 },
  tableHeaderCell: { color: '#fff', fontSize: 7.5, fontWeight: 'bold' },
  colIngredient: { width: '34%' },
  colQte: { width: '18%', textAlign: 'right' },
  colUnite: { width: '16%', textAlign: 'center' },
  colPu: { width: '16%', textAlign: 'right' },
  colCout: { width: '16%', textAlign: 'right' },
  tableRow: { flexDirection: 'row', padding: 4, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 7.5, color: '#333' },
  tableCellRight: { fontSize: 7.5, color: '#333', textAlign: 'right' },
  tableCellCenter: { fontSize: 7.5, color: '#333', textAlign: 'center' },
  totalSection: { marginTop: 10, borderTop: '1 solid #ddd', paddingTop: 6, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 2 },
  totalLabel: { fontSize: 9, color: '#666', marginRight: 15, width: 100, textAlign: 'right' },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f', width: 100, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 35, right: 35, borderTop: '1 solid #ddd', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#999' },
  description: { fontSize: 8, color: '#555', lineHeight: 1.4, marginTop: 2 },
});

export function FicheTechniquePDF({ fiche }: { fiche: FicheTechnique }) {
  const lignes = fiche.lignes || [];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
        </View>

        <View style={styles.titleSection}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Fiche Technique</Text>
            <Text style={styles.subtitle}>{fiche.code} - {fiche.nom}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Coût total: {formatCurrency(fiche.cout_total)}</Text>
            <Text style={styles.infoText}>Coût unitaire: {formatCurrency(fiche.cout_unitaire)}</Text>
            <Text style={styles.infoText}>Rendement: {fiche.rendement} portion(s)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.row}><Text style={styles.label}>Code:</Text><Text style={styles.value}>{fiche.code}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nom:</Text><Text style={styles.value}>{fiche.nom}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Produit fini:</Text><Text style={styles.value}>{fiche.produitFini?.nom || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Ville:</Text><Text style={styles.value}>{fiche.ville?.nom || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Rendement:</Text><Text style={styles.value}>{fiche.rendement} portion(s)</Text></View>
          {fiche.description ? (
            <View style={styles.row}><Text style={styles.label}>Description:</Text><Text style={styles.description}>{fiche.description}</Text></View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingrédients</Text>
          {lignes.length === 0 ? (
            <Text style={{ fontSize: 8, color: '#999', marginTop: 8 }}>Aucun ingrédient</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colIngredient]}>Ingrédient</Text>
                <Text style={[styles.tableHeaderCell, styles.colQte]}>Quantité</Text>
                <Text style={[styles.tableHeaderCell, styles.colUnite]}>Unité</Text>
                <Text style={[styles.tableHeaderCell, styles.colPu]}>Prix unit.</Text>
                <Text style={[styles.tableHeaderCell, styles.colCout]}>Coût</Text>
              </View>
              {lignes.map((l, i) => (
                <View key={l.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, styles.colIngredient]}>{l.ingredient?.nom || '-'}</Text>
                  <Text style={[styles.tableCellRight, styles.colQte]}>{l.quantite_ingredient}</Text>
                  <Text style={[styles.tableCellCenter, styles.colUnite]}>{l.unite?.symbole || '-'}</Text>
                  <Text style={[styles.tableCellRight, styles.colPu]}>{formatCurrency(l.prix_unitaire)}</Text>
                  <Text style={[styles.tableCellRight, styles.colCout]}>{formatCurrency(l.cout_total)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Coût total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(fiche.cout_total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Coût unitaire:</Text>
            <Text style={styles.totalValue}>{formatCurrency(fiche.cout_unitaire)}</Text>
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
