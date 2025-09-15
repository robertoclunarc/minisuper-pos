import { apiService } from './api';
import { ApiResponse, Sale, SaleItem } from '../types';

export interface CreateSaleData {
  caja_id: number;
  items: SaleItem[];
  metodo_pago: string;
  monto_recibido_usd?: number;
  monto_recibido_ves?: number;
  descuento_usd?: number;
  descuento_ves?: number;
}

class SaleService {
  async createSale(data: CreateSaleData): Promise<ApiResponse<Sale>> {
    return apiService.post<ApiResponse<Sale>>('/sales', data);
  }

  async getSaleById(id: number): Promise<ApiResponse<Sale>> {
    return apiService.get<ApiResponse<Sale>>(`/sales/${id}`);
  }

  async getSaleReceipt(id: number): Promise<ApiResponse<any>> {
    return apiService.get<ApiResponse<any>>(`/sales/${id}/receipt`);
  }

  async getDailySales(fecha?: string): Promise<ApiResponse<{ ventas: Sale[]; estadisticas: any }>> {
    const params = fecha ? `?fecha=${fecha}` : '';
    return apiService.get<ApiResponse<{ ventas: Sale[]; estadisticas: any }>>(`/sales/daily${params}`);
  }
}

export const saleService = new SaleService();