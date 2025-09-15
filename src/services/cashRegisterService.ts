import { apiService } from './api';
import { ApiResponse, CashRegister, CashRegisterClose } from '../types';

export interface OpenCashRegisterData {
  caja_id: number;
  monto_inicial_usd?: number;
  monto_inicial_ves?: number;
  observaciones?: string;
}

export interface CloseCashRegisterData {
  monto_final_usd: number;
  monto_final_ves: number;
  observaciones?: string;
}

class CashRegisterService {
  async getCashRegisters(): Promise<ApiResponse<CashRegister[]>> {
    return apiService.get<ApiResponse<CashRegister[]>>('/cash-registers');
  }

  async openCashRegister(data: OpenCashRegisterData): Promise<ApiResponse<CashRegisterClose>> {
    return apiService.post<ApiResponse<CashRegisterClose>>('/cash-registers/open', data);
  }

  async closeCashRegister(data: CloseCashRegisterData): Promise<ApiResponse<CashRegisterClose>> {
    return apiService.post<ApiResponse<CashRegisterClose>>('/cash-registers/close', data);
  }

  async getCashRegisterStatus(): Promise<ApiResponse<{ is_open: boolean; cash_register: CashRegisterClose | null }>> {
    return apiService.get<ApiResponse<{ is_open: boolean; cash_register: CashRegisterClose | null }>>('/cash-registers/status');
  }
}

export const cashRegisterService = new CashRegisterService();