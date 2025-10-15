import { apiService } from './api';
import { ApiResponse, ExchangeRate } from '../types';

export interface CurrencyHistoryFilters {
  page?: number;
  limit?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  fuente?: string;
}

export interface ManualRateData {
  fecha: string;
  tasa_bcv?: number;
  tasa_paralelo?: number;
  usd_ves?: number;
  fuente?: string;
  id?: number;
}

export interface CurrencyHistoryResponse {
  rates: ExchangeRate[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  statistics: {
    promedio_mes: number;
    variacion_porcentual: number;
    tasa_minima: number;
    tasa_maxima: number;
  };
}

class CurrencyService {
  async getCurrentRate(): Promise<ApiResponse<ExchangeRate>> {
    const currency = await apiService.get<ApiResponse<ExchangeRate>>('/currency/current');
    console.log('getCurrentRate:', currency);
    return currency
  }

  async convertCurrency(amount: number, from: 'USD' | 'VES', to: 'USD' | 'VES'): Promise<ApiResponse<{ converted_amount: number; rate: number }>> {
    const currency = await apiService.get<ApiResponse<{ converted_amount: number; rate: number }>>(`/currency/convert?amount=${amount}&from=${from}&to=${to}`);
    console.log('Converted currency:', currency);
    return currency
  }

  // ✅ REFRESCAR TASA DESDE API EXTERNA
  async refreshRate(): Promise<ApiResponse<ExchangeRate>> {
    return apiService.post<ApiResponse<ExchangeRate>>('/currency/refresh');
  }

  // ✅ CREAR TASA MANUAL
  async createManualRate(data: ManualRateData): Promise<ApiResponse<ExchangeRate>> {
    return apiService.post<ApiResponse<ExchangeRate>>('/currency/create', data);
  }

  // ✅ ACTUALIZAR TASA EXISTENTE
  async updateRate(id: number, data: Partial<ManualRateData>): Promise<ApiResponse<ExchangeRate>> {
    return apiService.put<ApiResponse<ExchangeRate>>('/currency/update', { id, ...data });
  }

  // ✅ OBTENER HISTORIAL DE TASAS
  async getHistory(filters: CurrencyHistoryFilters = {}): Promise<ApiResponse<CurrencyHistoryResponse>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return apiService.get<ApiResponse<CurrencyHistoryResponse>>(`/currency/history?${params.toString()}`);
  }

  // ✅ OBTENER ESTADÍSTICAS DE TASAS
  async getCurrencyStats(days: number = 30): Promise<ApiResponse<{
    promedio_periodo: number;
    variacion_porcentual: number;
    tasa_minima: { valor: number; fecha: string };
    tasa_maxima: { valor: number; fecha: string };
    tendencia: 'alcista' | 'bajista' | 'estable';
    volatilidad: number;
  }>> {
    return apiService.get<ApiResponse<any>>(`/currency/statistics?days=${days}`);
  }
}

export const currencyService = new CurrencyService();