import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: 'Helvetica' },
  header: { marginBottom: 12, borderBottom: '2 solid #1e3a5f', paddingBottom: 8 },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 2 },
  companyInfo: { fontSize: 7, color: '#555', lineHeight: 1.4 },
  title: { fontSize: 12, fontWeight: 'bold', color: '#1e3a5f', textAlign: 'center', marginTop: 3, marginBottom: 2 },
  period: { fontSize: 8, color: '#666', textAlign: 'center', marginBottom: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a5f', paddingVertical: 4, paddingHorizontal: 4 },
  tableHeaderCell: { color: '#fff', fontSize: 7.5, fontWeight: 'bold' },
  sectionRow: { flexDirection: 'row', backgroundColor: '#e8eef5', paddingVertical: 4, paddingHorizontal: 4, borderBottom: '1 solid #c9d6e4' },
  sectionLabel: { fontSize: 8, fontWeight: 'bold', color: '#1e3a5f' },
  row: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, borderBottom: '1 solid #f0f0f0', alignItems: 'center' },
  rowAlt: { backgroundColor: '#f9f9f9' },
  totalRow: { flexDirection: 'row', backgroundColor: '#e5e5e5', paddingVertical: 4, paddingHorizontal: 4, borderBottom: '1 solid #d0d0d0' },
  cell: { fontSize: 8, color: '#333' },
  cellLabel: { fontSize: 8, color: '#333' },
  cellRight: { fontSize: 8, color: '#333', textAlign: 'right' },
  cellObs: { fontSize: 7, color: '#888' },
  totalCellLabel: { fontSize: 8, fontWeight: 'bold', color: '#111' },
  totalCellRight: { fontSize: 8, fontWeight: 'bold', color: '#111', textAlign: 'right' },
  note: { fontSize: 7.5, color: '#555', marginTop: 8, fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 25, left: 30, right: 30, borderTop: '1 solid #ddd', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: '#999' },
});

const wLabel = '42%';
const wMontant = '22%';
const wObs = '36%';

interface VariationStockPDFProps {
  period: string;
  values: Record<string, string>;
}

export function VariationStockPDF({ period, values }: VariationStockPDFProps) {
  const v = (key: string) => values[key] || '';

  const caTotal = (Number(v('caFood')) || 0) + (Number(v('caHand')) || 0);
  const totalAchat = (Number(v('achatsFood')) || 0) + (Number(v('achatsLessiviels')) || 0);
  const totalConso = Number(v('consoFood')) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>FONDEG CATERING CONGO SA</Text>
          <Text style={styles.companyInfo}>Aéroport de Ndjili, Commune de Nsele, Kinshasa, RDC</Text>
        </View>

        <Text style={styles.title}>TABLEAU DE VARIATION STOCK</Text>
        {period && <Text style={styles.period}>{period}</Text>}

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: wLabel }]}>Désignation</Text>
          <Text style={[styles.tableHeaderCell, { width: wMontant, textAlign: 'right' }]}>Montant en $</Text>
          <Text style={[styles.tableHeaderCell, { width: wObs }]}>Observation</Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { width: wLabel }]}>CHIFFRE D'AFFAIRES (CA)</Text>
          <Text style={[styles.sectionLabel, { width: wMontant }]} />
          <Text style={[styles.sectionLabel, { width: wObs }]} />
        </View>

        <View style={styles.row}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>Chiffre d'affaires réalisé* FOOD</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('caFood')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]}>CA hors redevance aéroportuaire</Text>
        </View>
        <View style={[styles.row, styles.rowAlt]}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>Chiffre d'affaires Hand + divers</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('caHand')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]}>CA hors redevance aéroportuaire</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalCellLabel, { width: wLabel }]}>MONTANT CHIFFRE D'AFFAIRES REALISE</Text>
          <Text style={[styles.totalCellRight, { width: wMontant }]}>{caTotal.toFixed(2)}</Text>
          <Text style={[styles.totalCellLabel, { width: wObs }]} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { width: wLabel }]}>GESTION DES STOCKS ET ACHATS</Text>
          <Text style={[styles.sectionLabel, { width: wMontant }]} />
          <Text style={[styles.sectionLabel, { width: wObs }]} />
        </View>

        <View style={styles.row}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>Stock initial</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('stockInitial')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]} />
        </View>
        <View style={[styles.row, styles.rowAlt]}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>Achats Matières FOOD du mois*</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('achatsFood')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>Stock initial</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('stockInitial2')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]} />
        </View>
        <View style={[styles.row, styles.rowAlt]}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>Achats Matières et Lessiviels du mois*</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('achatsLessiviels')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]} />
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalCellLabel, { width: wLabel }]}>TOTAL ACHAT MOIS</Text>
          <Text style={[styles.totalCellRight, { width: wMontant }]}>{totalAchat.toFixed(2)}</Text>
          <Text style={[styles.totalCellLabel, { width: wObs }]} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>Valeur consommation matières FOOD du mois*</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('consoFood')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]} />
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalCellLabel, { width: wLabel }]}>TOTAL CONSOMMATION MOIS</Text>
          <Text style={[styles.totalCellRight, { width: wMontant }]}>{totalConso.toFixed(2)}</Text>
          <Text style={[styles.totalCellLabel, { width: wObs }]} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { width: wLabel }]}>NOTES ET VENTILATION ANALYTIQUE</Text>
          <Text style={[styles.sectionLabel, { width: wMontant }]} />
          <Text style={[styles.sectionLabel, { width: wObs }]} />
        </View>

        <View style={styles.totalRow}>
          <Text style={[styles.totalCellLabel, { width: wLabel }]}>CONSOMMATION NON-AERIENNE</Text>
          <Text style={[styles.totalCellRight, { width: wMontant }]}>{v('consoNonAerienne')}</Text>
          <Text style={[styles.totalCellLabel, { width: wObs }]} />
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalCellLabel, { width: wLabel }]}>CONSOMMATION AERIENNE</Text>
          <Text style={[styles.totalCellRight, { width: wMontant }]}>{v('consoAerienne')}</Text>
          <Text style={[styles.totalCellLabel, { width: wObs }]} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>RATIO ESTIME</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('ratio')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]} />
        </View>
        <View style={[styles.row, styles.rowAlt]}>
          <Text style={[styles.cellLabel, { width: wLabel }]}>CA FOOD ESTIME</Text>
          <Text style={[styles.cellRight, { width: wMontant }]}>{v('caFoodEstime')}</Text>
          <Text style={[styles.cellObs, { width: wObs }]} />
        </View>

        <Text style={styles.note}>* Prière annexer (liste des) factures</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FONDEG CATERING CONGO SA • Aéroport de Ndjili, Kinshasa</Text>
          <Text style={styles.footerText}>Page 1/1</Text>
        </View>
      </Page>
    </Document>
  );
}
