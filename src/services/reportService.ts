import { apiService } from './api';
import { ApiResponse } from '../types';

export interface SalesReportFilters {
  fecha_inicio: string;
  fecha_fin: string;
  categoria_id?: number;
  proveedor_id?: number;
  metodo_pago?: string;
  usuario_id?: number;
  producto_codigo?: string; 
  producto_descripcion?: string;
}

export interface ProductSalesData {
  producto_id: number;
  codigo_barras: string;
  producto_nombre: string;
  categoria_nombre: string;
  proveedor_nombre: string;
  total_cantidad: number;
  precio_promedio_usd: number;
  total_ventas_usd: number;
  total_ventas_ves: number;
  numero_transacciones: number;
  primera_venta: string;
  ultima_venta: string;
  participacion_ventas: number;
}

export interface SalesReportStats {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
    total_dias: number;
  };
  totales: {
    total_productos_vendidos: number;
    total_ventas_usd: number;
    total_ventas_ves: number;
    total_transacciones: number;
    productos_diferentes: number;
    ticket_promedio_usd: number;
  };
  promedios: {
    ventas_por_dia_usd: number;
    productos_por_dia: number;
    transacciones_por_dia: number;
  };
  rankings: {
    productos_mas_vendidos: ProductSalesData[];
    productos_menos_vendidos: ProductSalesData[];
  };
}

export interface SalesReportResponse {
  productos: ProductSalesData[];
  estadisticas: SalesReportStats;
  filtros_aplicados: SalesReportFilters;
}

export interface DailySalesData {
  fecha: string;
  total_transacciones: number;
  total_ventas_usd: number;
  total_ventas_ves: number;
  ticket_promedio_usd: number;
}

export interface PaymentMethodSalesData {
  metodo: string;
  total_transacciones: number;
  total_ventas_usd: number;
}

class ReportService {
  async getSalesReportByProduct(filters: SalesReportFilters): Promise<ApiResponse<SalesReportResponse>> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiService.get<ApiResponse<SalesReportResponse>>(`/reports/sales/products?${queryParams.toString()}`);
  }

  async getSalesReportSummary(filters: Pick<SalesReportFilters, 'fecha_inicio' | 'fecha_fin'>): Promise<ApiResponse<{
    ventas_por_dia: DailySalesData[];
    ventas_por_metodo: PaymentMethodSalesData[];
  }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('fecha_inicio', filters.fecha_inicio);
    queryParams.append('fecha_fin', filters.fecha_fin);
    
    return apiService.get<ApiResponse<{
      ventas_por_dia: DailySalesData[];
      ventas_por_metodo: PaymentMethodSalesData[];
    }>>(`/reports/sales/summary?${queryParams.toString()}`);
  }
}

export const reportService = new ReportService();