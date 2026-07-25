import { api } from './api';
import type {
  RapportResponse,
  BonCommandeRapport,
  BonLivraisonRapport,
  RapportStockData,
  VariationStockData,
  ClientRapport,
  RapportSortieData,
  AchatFullData,
  FournisseurRapport,
  InventaireRapportData,
  ConsommationsClientsData,
} from '../types/rapport';

export const rapportService = {
  bonCommande: (params?: Record<string, string>) =>
    api.get<RapportResponse<BonCommandeRapport>>('/rapports/bon-commande', { params }),

  bonLivraison: (params?: Record<string, string>) =>
    api.get<RapportResponse<BonLivraisonRapport>>('/rapports/bon-livraison', { params }),

  rapportStock: (params?: Record<string, string>) =>
    api.get<RapportResponse<RapportStockData>>('/rapports/stock', { params }),

  variationStock: (params?: Record<string, string>) =>
    api.get<RapportResponse<VariationStockData>>('/rapports/variation-stock', { params }),

  rapportClient: (params?: Record<string, string>) =>
    api.get<RapportResponse<ClientRapport[]>>('/rapports/client', { params }),

  rapportSortie: (params?: Record<string, string>) =>
    api.get<RapportResponse<RapportSortieData>>('/rapports/sortie', { params }),

  achatFull: (params?: Record<string, string>) =>
    api.get<RapportResponse<AchatFullData>>('/rapports/achat-full', { params }),

  rapportFournisseur: (params?: Record<string, string>) =>
    api.get<RapportResponse<FournisseurRapport[]>>('/rapports/fournisseur', { params }),

  inventaireTheorique: (params?: Record<string, string>) =>
    api.get<RapportResponse<InventaireRapportData>>('/rapports/inventaire-theorique', { params }),

  consommationsClients: (params?: Record<string, string>) =>
    api.get<RapportResponse<ConsommationsClientsData>>('/rapports/consommations-clients', { params }),
};
