import React, { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { productService } from '../../services/productService';
import { Product } from '../../types';

interface ProductSearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  searchType: 'codigo' | 'descripcion';
  size?: 'small' | 'medium';
}

export function ProductSearchField({
  label,
  placeholder,
  value,
  onChange,
  searchType,
  size = 'small'
}: ProductSearchFieldProps) {
  const [options, setOptions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // ✅ CREAR DEBOUNCE PERSONALIZADO CON useCallback Y setTimeout
  const searchProducts = useCallback(async (searchValue: string) => {
    if (searchValue.length >= 1) {
      setLoading(true);
      try {
        console.log(`🔍 Searching products (${searchType}):`, searchValue);
        const response = await productService.searchProductsForFilters(searchValue, searchType);
        if (response.success && response.data) {
          setOptions(response.data);
          console.log(`✅ Found ${response.data.length} products`);
        } else {
          setOptions([]);
        }
      } catch (error) {
        console.error('❌ Error searching products:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setOptions([]);
      setLoading(false);
    }
  }, [searchType]);

  // ✅ EFFECT PARA MANEJAR DEBOUNCE CON setTimeout
  useEffect(() => {
    // Cancelar búsqueda anterior si existe
    const timeoutId = setTimeout(() => {
      searchProducts(inputValue);
    }, 300); // 300ms de delay

    // Cleanup: cancelar timeout si el valor cambia antes de que se ejecute
    return () => {
      clearTimeout(timeoutId);
    };
  }, [inputValue, searchProducts]);

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    onChange(newInputValue);
  };

  const handleOptionSelect = (
    event: React.SyntheticEvent, 
    newValue: string | Product | null
  ) => {
    if (newValue) {
      let selectedValue = '';
      
      if (typeof newValue === 'string') {
        // Si es un string (texto libre)
        selectedValue = newValue;
      } else {
        // Si es un objeto Product
        selectedValue = searchType === 'codigo' ? newValue.codigo_barras : newValue.nombre;
      }
      
      setInputValue(selectedValue);
      onChange(selectedValue);
    }
  };

  return (
    <Autocomplete
      size={size}
      freeSolo
      options={options}
      loading={loading}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleOptionSelect}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return searchType === 'codigo' ? option.codigo_barras : option.nombre;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={
            loading 
              ? "Buscando..."
              : inputValue.length >= 1 
                ? `${options.length} resultado${options.length !== 1 ? 's' : ''} encontrado${options.length !== 1 ? 's' : ''}`
                : 'Escribe para buscar...'
          }
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {searchType === 'codigo' ? option.codigo_barras : option.nombre}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {searchType === 'codigo' ? option.nombre : option.codigo_barras}
            </Typography>
          </Box>
        </Box>
      )}
      noOptionsText={
        loading
          ? "Buscando productos..."
          : inputValue.length >= 1 
            ? "No se encontraron productos"
            : "Escribe para buscar productos..."
      }
      loadingText="Buscando productos..."
      sx={{ minWidth: 250 }}
    />
  );
}