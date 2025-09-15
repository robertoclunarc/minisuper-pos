import { apiService } from './api';
import { ApiResponse, Product, ProductsResponse } from '../types';

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
}

export const productService = new ProductService();