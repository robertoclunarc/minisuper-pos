// Auth Types
export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: 'admin' | 'cajero';
  activo: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Product Types
export interface Product {
  id: number;
  codigo_barras: string;
  codigo_interno?: string;
  nombre: string;
  descripcion?: string;
  categoria?: Category;
  proveedor?: Provider;
  precio_venta_usd: number;
  precio_costo_usd: number;
  stock_minimo: number;
  unidad_medida: string;
  activo: boolean;
  stock_actual?: number;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Provider {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
}

// Cash Register Types
export interface CashRegister {
  id: number;
  numero_caja: number;
  nombre: string;
  activo: boolean;
  estado?: 'abierto' | 'cerrado';
  cierre_actual?: CashRegisterClose;
}

export interface CashRegisterClose {
  id: number;
  caja_id: number;
  usuario_id: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial_usd: number;
  monto_inicial_ves: number;
  monto_final_usd: number;
  monto_final_ves: number;
  total_ventas: number;
  total_transacciones: number;
  tasa_cambio_apertura: number;
  tasa_cambio_cierre?: number;
  estado: 'abierto' | 'cerrado';
  observaciones?: string;
  caja: CashRegister;
}

// Sale Types
export interface SaleItem {
  producto_id: number;
  cantidad: number;
  producto?: Product;
}

export interface Sale {
  id: number;
  numero_venta: string;
  fecha_venta: string;
  subtotal_usd: number;
  subtotal_ves: number;
  descuento_usd: number;
  descuento_ves: number;
  impuesto_usd: number;
  impuesto_ves: number;
  total_usd: number;
  total_ves: number;
  metodo_pago: string;
  monto_recibido_usd: number;
  monto_recibido_ves: number;
  cambio_usd: number;
  cambio_ves: number;
  tasa_cambio: number;
  estado: string;
  detalles: SaleDetail[];
  usuario: User;
  caja: CashRegister;
}

export interface SaleDetail {
  id: number;
  cantidad: number;
  precio_unitario_usd: number;
  precio_unitario_ves: number;
  subtotal_usd: number;
  subtotal_ves: number;
  producto: Product;
}

// Currency Types
export interface ExchangeRate {
  usd_ves: number;
  last_update: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

// ✅ TIPO CORREGIDO - PaginatedResponse
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    products?: T[];        // Para productos
    categories?: T[];      // Para categorías  
    providers?: T[];       // Para proveedores
    ventas?: T[];         // Para ventas
    items?: T[];          // Genérico para otros casos
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
  };
}

// ✅ ALTERNATIVA MÁS ESPECÍFICA - Tipos de respuesta por recurso
export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
  };
}

export interface ProvidersResponse {
  success: boolean;
  data: {
    providers: Provider[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
  };
}