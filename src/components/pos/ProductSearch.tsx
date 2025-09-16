import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Alert,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import {
  Search,
  QrCodeScanner,
  Add,
  Inventory,
} from '@mui/icons-material';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProductSearchProps {
  onProductSelect: (product: Product, quantity?: number) => void;
}

export function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<'general' | 'barcode'>('general');

  // Debounce para búsqueda
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        if (searchType === 'barcode') {
          searchByBarcode(searchTerm.trim());
        } else {
          searchProducts(searchTerm.trim());
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchType]);

  // Detectar si es código de barras (solo números y longitud >= 8)
  useEffect(() => {
    const isBarcode = /^\d{8,}$/.test(searchTerm.trim());
    setSearchType(isBarcode ? 'barcode' : 'general');
  }, [searchTerm]);

  const searchProducts = async (term: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await productService.getProducts({
        search: term,
        limit: 10
      });

      if (response.success && response.data?.products) {
        setSearchResults(response.data.products);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setError('Error buscando productos');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByBarcode = async (barcode: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await productService.getProductByBarcode(barcode);
      
      if (response.success && response.data) {
        setSearchResults([response.data]);
        // Auto-agregar producto si se encuentra por código de barras
        setTimeout(() => {
          onProductSelect(response.data!);
          setSearchTerm('');
          setSearchResults([]);
        }, 500);
      } else {
        setError('Producto no encontrado');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      setError('Producto no encontrado');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setSearchTerm('');
    setSearchResults([]);
    setError('');
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_actual === undefined) return null;
    
    if (product.stock_actual === 0) {
      return <Chip label="Sin Stock" color="error" size="small" />;
    } else if (product.stock_actual <= product.stock_minimo) {
      return <Chip label="Stock Bajo" color="warning" size="small" />;
    } else {
      return <Chip label={`Stock: ${product.stock_actual}`} color="success" size="small" />;
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={searchType === 'barcode' ? 'Escanea o escribe código de barras...' : 'Buscar por nombre, código...'}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {searchType === 'barcode' ? <QrCodeScanner /> : <Search />}
            </InputAdornment>
          ),
          endAdornment: loading && (
            <InputAdornment position="end">
              <LoadingSpinner size={20} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {searchResults.length > 0 && (
        <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <List dense>
            {searchResults.map((product) => (
              <ListItem
                key={product.id}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2">
                        {product.nombre}
                      </Typography>
                      {getStockStatus(product)}
                    </Stack>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Código: {product.codigo_barras}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        ${product.precio_venta_usd.toFixed(2)} USD
                      </Typography>
                      {product.categoria && (
                        <Typography variant="caption" color="textSecondary">
                          {product.categoria.nombre}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleProductSelect(product)}
                    disabled={product.stock_actual === 0}
                    color="primary"
                  >
                    <Add />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {searchTerm && !loading && searchResults.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Inventory sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="textSecondary">
            No se encontraron productos
          </Typography>
        </Box>
      )}
    </Box>
  );
}