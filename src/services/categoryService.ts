import { apiService } from './api';
import { ApiResponse, Category, Categories } from '../types';

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean;
}

export interface CategoryFormData {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface CategoryListResponse {
  categories: Category[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

class CategoryService {
  async getCategories(): Promise<ApiResponse<Categories>> {
    return apiService.get<ApiResponse<Categories>>('/categories');
  }

  async getCategoriesFilter(filters: CategoryFilters = {}): Promise<ApiResponse<CategoryListResponse | Category[]>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const url = params.toString() ? `/categories?${params.toString()}` : '/categories';
    return apiService.get<ApiResponse<any>>(url);
  }

  async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    return apiService.get<ApiResponse<Category>>(`/categories/${id}`);
  }

  async createCategory(data: CategoryFormData): Promise<ApiResponse<Category>> {
    return apiService.post<ApiResponse<Category>>('/categories', data);
  }

  // ✅ ACTUALIZAR CATEGORÍA
  async updateCategory(id: number, data: Partial<CategoryFormData>): Promise<ApiResponse<Category>> {
    return apiService.put<ApiResponse<Category>>(`/categories/${id}`, data);
  }

  // ✅ ELIMINAR CATEGORÍA (SOFT DELETE)
  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<ApiResponse<void>>(`/categories/${id}`);
  }

  // ✅ OBTENER ESTADÍSTICAS DE CATEGORÍAS
  async getCategoryStats(): Promise<ApiResponse<{
    total_categorias: number;
    categorias_activas: number;
    categorias_inactivas: number;
    productos_por_categoria: Array<{
      categoria_id: number;
      categoria_nombre: string;
      total_productos: number;
    }>;
  }>> {
    return apiService.get<ApiResponse<any>>('/categories/statistics');
  }
}

export const categoryService = new CategoryService();