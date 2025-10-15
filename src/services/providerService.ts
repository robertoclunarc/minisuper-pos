import { apiService } from './api';
import { ApiResponse, Provider, Providers } from '../types';

export interface ProviderFilters {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean;
}

export interface ProviderFormData {
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}

export interface ProviderListResponse {
  providers: Provider[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

class ProviderService {
  async getProviders(): Promise<ApiResponse<Providers>> {
    return apiService.get<ApiResponse<Providers>>('/providers');
  }

  async getProvidersFilter(filters: ProviderFilters = {}): Promise<ApiResponse<ProviderListResponse | Provider[]>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const url = params.toString() ? `/providers?${params.toString()}` : '/providers';
    return apiService.get<ApiResponse<any>>(url);
  }

  async getProviderById(id: number): Promise<ApiResponse<Provider>> {
    return apiService.get<ApiResponse<Provider>>(`/providers/${id}`);
  }

  async createProvider(data: ProviderFormData): Promise<ApiResponse<Provider>> {
    return apiService.post<ApiResponse<Provider>>('/providers', data);
  }

  // ✅ ACTUALIZAR PROVEEDOR
  async updateProvider(id: number, data: Partial<ProviderFormData>): Promise<ApiResponse<Provider>> {
    return apiService.put<ApiResponse<Provider>>(`/providers/${id}`, data);
  }

  // ✅ ELIMINAR PROVEEDOR (SOFT DELETE)
  async deleteProvider(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<ApiResponse<void>>(`/providers/${id}`);
  }

  // ✅ OBTENER ESTADÍSTICAS DE PROVEEDORES
  async getProviderStats(): Promise<ApiResponse<{
    total_proveedores: number;
    proveedores_activos: number;
    proveedores_inactivos: number;
    productos_por_proveedor: Array<{
      proveedor_id: number;
      proveedor_nombre: string;
      total_productos: number;
    }>;
  }>> {
    return apiService.get<ApiResponse<any>>('/providers/statistics');
  }
}

export const providerService = new ProviderService();