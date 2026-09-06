import { api } from './api';
import { downloadCsv } from '../lib/exportCsv';
import type {
  RapportResponse,
  BonCommandeRapport,
  BonLivraisonRapport,
  RapportStockData,
  RapportStockPhysiqueLogiqueData,
  VariationStockData,
  RapportClientData,
  RapportSortieData,
  AchatFullData,
  FournisseurRapport,
  InventaireRapportData,
  ConsommationsClientsData,
  ConsommationClientDetail,
  RuptureStockData,
  StockBasData,
} from '../types/rapport';
import type { VariationsPrixResponse } from '../types/dashboard';
import type { MouvementStock } from '../types/validation';

export const rapportService = {
  bonCommande: (params?: Record<string, string>) =>
    api.get<RapportResponse<BonCommandeRapport>>('/rapports/bon-commande', { params }),

  bonLivraison: (params?: Record<string, string>) =>
    api.get<RapportResponse<BonLivraisonRapport>>('/rapports/bon-livraison', { params }),

  bonLivraisonExport: (params?: Record<string, string>) =>
    downloadCsv('/rapports/bon-livraison/export', params ?? {}, 'rapport-bon-livraison.csv'),

  rapportStock: (params?: Record<string, string>) =>
    api.get<RapportResponse<RapportStockData>>('/rapports/stock', { params }),

  rapportStockPhysiqueLogique: (params?: Record<string, string>) =>
    api.get<RapportResponse<RapportStockPhysiqueLogiqueData>>('/rapports/stock-logique-physique', { params }),

  variationStock: (params?: Record<string, string>) =>
    api.get<RapportResponse<VariationStockData>>('/rapports/variation-stock', { params }),

  variationStockCalcul: (params?: Record<string, string>) =>
    api.get<RapportResponse<{
      stock_initial: number;
      achats_food: number;
      stock_initial_lessiviels: number;
      achats_lessiviels: number;
      conso_food: number;
      conso_aerienne: number;
      conso_non_aerienne: number;
    }>>('/rapports/variation-stock/calcul', { params }),

  rapportClient: (params?: Record<string, string>) =>
    api.get<RapportResponse<RapportClientData>>('/rapports/client', { params }),

  rapportSortie: (params?: Record<string, string>) =>
    api.get<RapportResponse<RapportSortieData>>('/rapports/sortie', { params }),

  achatFull: (params?: Record<string, string>) =>
    api.get<RapportResponse<AchatFullData>>('/rapports/achat-full', { params }),

  mouvementDetail: (id: number) =>
    api.get<{ success: boolean; data: MouvementStock }>(`/rapports/mouvement/${id}`),

  rapportFournisseur: (params?: Record<string, string>) =>
    api.get<RapportResponse<FournisseurRapport[]>>('/rapports/fournisseur', { params }),

  inventaireTheorique: (params?: Record<string, string>) =>
    api.get<RapportResponse<InventaireRapportData>>('/rapports/inventaire-theorique', { params }),

  consommationsClients: (params?: Record<string, string>) =>
    api.get<RapportResponse<ConsommationsClientsData>>('/rapports/consommations-clients', { params }),

  consommationClientDetail: (clientId: number, params?: Record<string, string>) =>
    api.get<{ success: boolean; data: ConsommationClientDetail }>('/rapports/consommations-clients/' + clientId, { params }),

  ruptureStock: (params?: Record<string, string>) =>
    api.get<RapportResponse<RuptureStockData>>('/rapports/rupture-stock', { params }),

  stockBas: (params?: Record<string, string>) =>
    api.get<RapportResponse<StockBasData>>('/rapports/stock-bas', { params }),

  variationsPrix: (params?: Record<string, string>) =>
    api.get<VariationsPrixResponse>('/rapports/variations-prix', { params }),
};
