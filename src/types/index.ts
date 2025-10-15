// Auth Types
export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: 'admin' | 'cajero';
  activo: boolean;
}

// Payment Types
export interface PaymentDetail {
  id?: number;
  metodo_pago: string;
  monto_usd: number;
  monto_ves: number;
  referencia?: string;
  observaciones?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/*export interface InventoryBatch {
  id?: number;
  producto_id: number,
  proveedor_id: number,
  numero_lote?: string,
  cantidad_inicial?: number,
  cantidad_actual?: number,
  precio_costo_usd?: number,
  tasa_cambio_registro?: number,
  usuario_id?: number,
  fecha_ingreso?: string,
  fecha_vencimiento?: string | null,
};*/

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

  created_at: string;
  updated_at?: string;  
  
  lotes?: InventoryBatch[];
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoria_id?: number;
  proveedor_id?: number;
  activo?: boolean;
}

export interface ProductFormData {
  codigo_barras: string;
  codigo_interno?: string;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  proveedor_id: number;
  precio_venta_usd: number;
  precio_costo_usd: number;
  stock_minimo?: number;
  unidad_medida?: string;
  activo?: boolean;
}

export interface ProductSearchResult {
  id: number;
  codigo_barras: string;
  nombre: string;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface Category {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  created_at?: string;
}

export interface Categories {
  categories: Category[];
  pagination: {
    current_page: number;
    total_pages: number;  
    total_items: number; 
    items_per_page: number;
  };
}

export interface Provider {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
  created_at?: string;
}

export interface Providers {
  providers: Provider[];
  pagination: {
    current_page: number;
    total_pages: number;  
    total_items: number; 
    items_per_page: number;
  };
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
  metodo_pago: string; // Resumen de métodos
  monto_recibido_usd: number;
  monto_recibido_ves: number;
  cambio_usd: number;
  cambio_ves: number;
  tasa_cambio_venta: number;
  estado: string;
  detalles: SaleDetail[];
  detalles_pago?: PaymentDetail[]; // ✅ NUEVA PROPIEDAD
  usuario: User;
  caja: CashRegister;
  
  // Alias para compatibilidad
  tasa_cambio?: number;
  //numero_factura?: string;
}

export interface NewSale {
  venta?: Sale;
  cambio?: {
    usd?: number,
    ves?: number
  },
  tasa_cambio?: ExchangeRate;
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
  id?: number;
  fecha?: string;
  tasa_bcv?: number;
  tasa_paralelo?: number;
  usd_ves?: number;
  last_update?: string;
  fuente?: string;
  created_at?: string;
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

export interface InventoryBatch {
  id?: number;
  producto_id: number;
  proveedor_id: number;
  numero_lote?: string;
  cantidad_inicial?: number;
  cantidad_actual?: number;
  precio_costo_usd?: number;
  tasa_cambio_registro?: number;
  fecha_vencimiento?: string | null;
  fecha_ingreso?: string;
  usuario_id?: number;
  created_at: string;
  updated_at?: string;
  
  // Relaciones
  producto?: Product;
  proveedor?: Provider;
  usuario?: User;
  
  // Campos calculados
  valor_total_usd?: number;
  dias_hasta_vencimiento?: number;
  estado?: 'disponible' | 'por_vencer' | 'vencido' | 'agotado';
}

export interface InventoryBatchFormData {
  product_id?: number,
  lote_id?: number,
  codigo_barras?: string,
  codigo_interno?: string,
  nombre?: string,
  categoria?: string,
  proveedor?: string,
  proveedor_id?: number,
  precio_venta_usd?: number,
  stock_minimo?: number,
  stock_total?: number,
  total_lotes?: number,
  lotes_disponibles?: number,
  lotes_vencidos?: number,
  valor_inventario_usd?: number,
  estado_stock?: 'disponible' | 'por_vencer' | 'vencido' | 'agotado';
  fecha_vencimiento?: string | null;
  fecha_ingreso?: string;
  unidad_medida?: string;
  tasa_cambio_registro?: number;
  usuario_id?: number;
}

export interface StockMovement {
  id: number;
  lote_id: number;
  tipo_movimiento: 'ingreso' | 'salida' | 'ajuste' | 'venta' | 'devolucion';
  cantidad_anterior: number;
  cantidad_movimiento: number;
  cantidad_nueva: number;
  motivo: string;
  referencia?: string; // Número de venta, ajuste, etc.
  fecha_movimiento: string;
  usuario_id: number;
  created_at: string;
  
  // Relaciones
  lote?: InventoryBatch;
  usuario?: User;
}