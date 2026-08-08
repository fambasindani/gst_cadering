export interface TauxConversion {
  id: number;
  code_devise: string;
  nom: string | null;
  taux: number;
  date_application: string;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TauxConversionFormData {
  code_devise: string;
  nom: string;
  taux: string;
  date_application: string;
  actif: boolean;
}

export interface TauxConversionListResponse {
  success: boolean;
  data: {
    data: TauxConversion[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface TauxConversionResponse {
  success: boolean;
  data: TauxConversion;
  message: string;
}

export interface TauxConversionActuelResponse {
  success: boolean;
  data: TauxConversion | null;
  message: string;
}
