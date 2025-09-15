import { apiService } from './api';
import { ApiResponse, ExchangeRate } from '../types';

class CurrencyService {
  async getCurrentRate(): Promise<ApiResponse<ExchangeRate>> {
    return apiService.get<ApiResponse<ExchangeRate>>('/currency/current');
  }

  async convertCurrency(amount: number, from: 'USD' | 'VES', to: 'USD' | 'VES'): Promise<ApiResponse<{ converted_amount: number; rate: number }>> {
    return apiService.get<ApiResponse<{ converted_amount: number; rate: number }>>(`/currency/convert?amount=${amount}&from=${from}&to=${to}`);
  }
}

export const currencyService = new CurrencyService();