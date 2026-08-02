export interface PurgeStockResponse {
  success: boolean;
  message: string;
  data: {
    supprime: Record<string, number>;
  };
}
