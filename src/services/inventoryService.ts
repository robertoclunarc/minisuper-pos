import { apiService } from './api';
import { ApiResponse, InventoryBatch, InventoryBatchFormData } from '../types';

// ✅ INTERFACES PARA EL SERVICIO DE INVENTARIO
export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  producto_id?: number;
  proveedor_id?: number;
  estado?: 'disponible' | 'por_vencer' | 'vencido';
  fecha_vencimiento_desde?: string;
  fecha_vencimiento_hasta?: string;
}

export interface BatchFormData {
  id?: number;
  producto_id: number;
  proveedor_id: number;
  numero_lote: string;
  cantidad_inicial: number;
  precio_costo_usd: number;
  tasa_cambio_registro: number;
  fecha_vencimiento?: string;
  fecha_ingreso: string;
}

export interface InventoryListResponse {
  batches: InventoryBatch[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  statistics?: {
    total_productos: number;
    total_lotes: number;
    valor_inventario_usd: number;
    productos_por_vencer: number;
    productos_vencidos: number;
  };
}

export interface StockMovement {
  id: number;
  lote_id: number;
  tipo_movimiento: 'ingreso' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string;
  fecha_movimiento: string;
  usuario_id: number;
  lote?: InventoryBatch;
  usuario?: {
    id: number;
    nombre: string;
  };
}

class InventoryService {
  // ✅ OBTENER LOTES CON FILTROS Y PAGINACIÓN
  async getBatches(filters: InventoryFilters = {}): Promise<ApiResponse<InventoryListResponse>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    const inventoryList = await apiService.get<ApiResponse<InventoryListResponse>>(`/inventory/batches?${params.toString()}`);
    console.log('Inventory list response:', inventoryList);
    return inventoryList
  }

  // ✅ OBTENER LOTE POR ID
  async getBatchById(id: number): Promise<ApiResponse<InventoryBatch>> {
    return apiService.get<ApiResponse<InventoryBatch>>(`/inventory/batches/${id}`);
  }

  // ✅ CREAR LOTE
  async createBatch(data: BatchFormData): Promise<ApiResponse<InventoryBatch>> {
    return apiService.post<ApiResponse<InventoryBatch>>('/inventory/batches', data);
  }

  // ✅ ACTUALIZAR LOTE
  async updateBatch(id: number, data: BatchFormData): Promise<ApiResponse<InventoryBatch>> {
    return apiService.put<ApiResponse<InventoryBatch>>(`/inventory/batches/${id}`, data);
  }

  // ✅ ELIMINAR LOTE
  async deleteBatch(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<ApiResponse<void>>(`/inventory/batches/${id}`);
  }

  // ✅ OBTENER ESTADÍSTICAS DE INVENTARIO
  async getInventoryStats(): Promise<ApiResponse<{
    total_productos: number;
    total_lotes: number;
    valor_inventario_usd: number;
    productos_por_vencer: number;
    productos_vencidos: number;
    productos_sin_stock: number;
    productos_stock_bajo: number;
  }>> {
    return apiService.get<ApiResponse<any>>('/inventory/statistics');
  }

  // ✅ OBTENER LOTES POR PRODUCTO
  async getBatchesByProduct(productId: number): Promise<ApiResponse<InventoryBatch[]>> {
    return apiService.get<ApiResponse<InventoryBatch[]>>(`/inventory/products/${productId}/batches`);
  }

  // ✅ REALIZAR AJUSTE DE INVENTARIO
  async adjustInventory(data: {
    lote_id: number;
    nueva_cantidad: number;
    motivo: string;
  }): Promise<ApiResponse<InventoryBatch>> {
    return apiService.post<ApiResponse<InventoryBatch>>('/inventory/adjust', data);
  }

  // ✅ OBTENER MOVIMIENTOS DE STOCK
  async getStockMovements(filters: {
    page?: number;
    limit?: number;
    lote_id?: number;
    producto_id?: number;
    tipo_movimiento?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  } = {}): Promise<ApiResponse<{
    movements: StockMovement[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
  }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return apiService.get<ApiResponse<any>>(`/inventory/movements?${params.toString()}`);
  }

  // ✅ OBTENER PRODUCTOS CON STOCK BAJO
  async getLowStockProducts(): Promise<ApiResponse<{
    id: number;
    nombre: string;
    codigo_barras: string;
    stock_actual: number;
    stock_minimo: number;
    categoria: string;
  }[]>> {
    return apiService.get<ApiResponse<any>>('/inventory/low-stock');
  }

  // ✅ OBTENER PRODUCTOS POR VENCER
  async getExpiringProducts(days: number = 30): Promise<ApiResponse<{
    id: number;
    numero_lote: string;
    producto_nombre: string;
    codigo_barras: string;
    cantidad_actual: number;
    fecha_vencimiento: string;
    dias_hasta_vencimiento: number;
  }[]>> {
    return apiService.get<ApiResponse<any>>(`/inventory/expiring?days=${days}`);
  }

  // ✅ GENERAR REPORTE DE INVENTARIO
  async generateInventoryReport(filters: {
    fecha_desde?: string;
    fecha_hasta?: string;
    categoria_id?: number;
    proveedor_id?: number;
    incluir_vencidos?: boolean;
    formato?: 'pdf' | 'excel' | 'csv';
  } = {}): Promise<ApiResponse<{
    url: string;
    filename: string;
  }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return apiService.get<ApiResponse<any>>(`/inventory/report?${params.toString()}`);
  }

  // ✅ IMPORTAR LOTES DESDE CSV/EXCEL
  async importBatches(file: File): Promise<ApiResponse<{
    imported: number;
    errors: Array<{
      row: number;
      error: string;
    }>;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiService.post<ApiResponse<any>>('/inventory/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // ✅ OBTENER TEMPLATE PARA IMPORTACIÓN
  async getImportTemplate(): Promise<ApiResponse<{
    url: string;
    filename: string;
  }>> {
    return apiService.get<ApiResponse<any>>('/inventory/import-template');
  }

  // ✅ OBTENER HISTÓRICO DE PRECIOS
  async getPriceHistory(productId: number, days: number = 90): Promise<ApiResponse<{
    fecha: string;
    precio_costo_usd: number;
    proveedor: string;
    numero_lote: string;
  }[]>> {
    return apiService.get<ApiResponse<any>>(`/inventory/products/${productId}/price-history?days=${days}`);
  }
}

export const inventoryService = new InventoryService();