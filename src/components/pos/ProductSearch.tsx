import React, { useState, useRef, useEffect } from 'react';
import { Search, Scan, Package } from 'lucide-react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
}

export function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus en el input al cargar
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Buscar por código de barras si parece ser uno
      if (/^\d{8,}$/.test(searchTerm)) {
        const response = await productService.getProductByBarcode(searchTerm);
        if (response.success && response.data) {
          onProductSelect(response.data);
          setQuery('');
          setShowResults(false);
          return;
        }
      }

      // Buscar productos por nombre/código
      const response = await productService.getProducts({
        search: searchTerm,
        limit: 10
      });

      if (response.success && response.data?.products) {
        setSearchResults(response.data.products);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    setTimeout(() => {
      if (value === query) {
        handleSearch(value);
      }
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    }
    if (e.key === 'Escape') {
      setQuery('');
      setShowResults(false);
    }
  };

  const selectProduct = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setShowResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className="w-full pl-10 pr-12 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Buscar producto por nombre o código de barras..."
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <LoadingSpinner size="small" />
          ) : (
            <Scan className="text-gray-400 w-5 h-5" />
          )}
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => selectProduct(product)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.nombre}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.codigo_barras} • ${product.precio_venta_usd}
                      {product.stock_actual !== undefined && (
                        <span className={`ml-2 ${product.stock_actual > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Stock: {product.stock_actual}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
              No se encontraron productos
            </div>
          )}
        </div>
      )}
    </div>
  );
}