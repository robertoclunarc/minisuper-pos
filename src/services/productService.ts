import { apiService } from './api';
import { ApiResponse, Product, ProductsResponse, ProductFilters, ProductListResponse, ProductFormData } from '../types';

class ProductService {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoria_id?: number;
    proveedor_id?: number;
  }): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiService.get<ProductsResponse>(`/products?${queryParams.toString()}`);
  }

  async getProductByBarcode(barcode: string): Promise<ApiResponse<Product>> {
    return apiService.get<ApiResponse<Product>>(`/products/barcode/${barcode}`);
  }

  async getProductById(id: number): Promise<ApiResponse<Product>> {
    return apiService.get<ApiResponse<Product>>(`/products/${id}`);
  }

  async searchProductsForFilters(query: string, type: 'codigo' | 'descripcion' = 'codigo'): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('type', type);
    
    return apiService.get<ApiResponse<Product[]>>(`/products/search-filters?${params.toString()}`);
  }

  async getProductsList(filters: ProductFilters = {}): Promise<ApiResponse<ProductListResponse>> {
    const params = new URLSearchParams();
    console.log('Filters in getProductsList:', filters);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const productList = apiService.get<ApiResponse<ProductListResponse>>(`/products?${params.toString()}`);
    console.log('Product list response:', productList);
    return productList;
  }

  // ✅ CREAR PRODUCTO
  async createProduct(data: ProductFormData): Promise<ApiResponse<Product>> {
    return apiService.post<ApiResponse<Product>>('/products', data);
  }

  // ✅ ACTUALIZAR PRODUCTO
  async updateProduct(id: number, data: ProductFormData): Promise<ApiResponse<Product>> {
    return apiService.put<ApiResponse<Product>>(`/products/${id}`, data);
  }

  // ✅ ELIMINAR PRODUCTO (SOFT DELETE)
  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<ApiResponse<void>>(`/products/${id}`);
  }  

  // ✅ OBTENER PRODUCTOS PARA POS (SI NO EXISTE)
  async getProductsForPOS(search?: string): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    
    return apiService.get<ApiResponse<Product[]>>(`/products/pos?${params.toString()}`);
  }
}

export const productService = new ProductService();