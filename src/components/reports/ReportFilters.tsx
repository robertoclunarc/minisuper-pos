import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Autocomplete,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  Refresh,
  Search,
  BarcodeReader
} from '@mui/icons-material';
import { SalesReportFilters } from '../../services/reportService';
import { categoryService } from '../../services/categoryService';
import { providerService } from '../../services/providerService';
import { Category, Provider } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ProductSearchField } from './ProductSearchField';

interface ReportFiltersProps {
  filters: SalesReportFilters;
  onFiltersChange: (filters: SalesReportFilters) => void;
  onGenerateReport: () => void;
  loading?: boolean;
}

const paymentMethods = [
  { value: 'efectivo_usd', label: 'Efectivo USD' },
  { value: 'efectivo_ves', label: 'Efectivo VES' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'pago_movil', label: 'Pago Móvil' },
  { value: 'mixto', label: 'Pago Mixto' },
];

export function ReportFilters({ 
  filters, 
  onFiltersChange, 
  onGenerateReport, 
  loading = false 
}: ReportFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
        setLoadingFilters(true);

        const [categoriesResponse, providersResponse] = await Promise.all([
            categoryService.getCategories(),
            providerService.getProviders()
        ]);
        
        if (categoriesResponse.success && categoriesResponse.data?.categories) {
            setCategories(categoriesResponse.data.categories);
        } else {
            setCategories([]);
        }
        
        if (providersResponse.success && providersResponse.data?.providers) {
            setProviders(providersResponse.data.providers);
        } else {
            setProviders([]);
        }
    } catch (error) {
        console.error('Error loading filter data:', error);
        setCategories([]);
        setProviders([]);
    } finally {
        setLoadingFilters(false);
    }
  };

  const handleFilterChange = (key: keyof SalesReportFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      fecha_inicio: filters.fecha_inicio,
      fecha_fin: filters.fecha_fin,
      // Mantener solo las fechas, limpiar el resto
    });
  };

  const hasAdvancedFilters = Boolean(
    filters.categoria_id || 
    filters.proveedor_id || 
    filters.metodo_pago || 
    filters.usuario_id || 
    filters.producto_codigo || 
    filters.producto_descripcion
  );
  
  const selectedCategory = categories.find(cat => cat.id === filters.categoria_id);
  const selectedProvider = providers.find(prov => prov.id === filters.proveedor_id);
  const selectedPaymentMethod = paymentMethods.find(method => method.value === filters.metodo_pago);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <FilterList />
            Filtros de Búsqueda
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            {hasAdvancedFilters && (
              <Chip
                label="Filtros aplicados"
                color="primary"
                size="small"
                onDelete={clearFilters}
              />
            )}
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Filtros básicos (siempre visibles) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="end" mb={2}>
          <TextField
            label="Fecha Inicio"
            type="date"
            value={filters.fecha_inicio}
            onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            required
          />
          
          <TextField
            label="Fecha Fin"
            type="date"
            value={filters.fecha_fin}
            onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            required
          />
          
          <Button
            variant="contained"
            onClick={onGenerateReport}
            disabled={loading || !filters.fecha_inicio || !filters.fecha_fin}
            startIcon={loading ? <LoadingSpinner size={20} /> : <Refresh />}
            sx={{ minWidth: 140 }}
          >
            {loading ? 'Generando...' : 'Generar'}
          </Button>
        </Stack>

        {/* Filtros avanzados (colapsables) */}
        <Collapse in={expanded}>
          {loadingFilters ? (
            <Box display="flex" justifyContent="center" py={2}>
              <LoadingSpinner message="Cargando filtros..." />
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                Filtros Avanzados (Opcionales)
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom display="flex" alignItems="center" gap={1}>
                    <Search />
                    Filtros de Producto
                  </Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <ProductSearchField
                      label="Código de Barras"
                      placeholder="Buscar por código..."
                      value={filters.producto_codigo || ''}
                      onChange={(value) => handleFilterChange('producto_codigo', value || undefined)}
                      searchType="codigo"
                    />
                    
                    <ProductSearchField
                      label="Descripción del Producto"
                      placeholder="Buscar por nombre..."
                      value={filters.producto_descripcion || ''}
                      onChange={(value) => handleFilterChange('producto_descripcion', value || undefined)}
                      searchType="descripcion"
                    />
                  </Stack>
                </Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  {/* Filtro por categoría */}
                  <Autocomplete
                    size="small"
                    options={categories}
                    getOptionLabel={(option) => option.nombre}
                    value={selectedCategory || null}
                    onChange={(_, newValue) => {
                      handleFilterChange('categoria_id', newValue?.id);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Categoría" />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2">{option.nombre}</Typography>
                          {option.descripcion && (
                            <Typography variant="caption" color="textSecondary">
                              {option.descripcion}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    sx={{ minWidth: 200 }}
                  />

                  {/* Filtro por proveedor */}
                  <Autocomplete
                    size="small"
                    options={providers}
                    getOptionLabel={(option) => option.nombre}
                    value={selectedProvider || null}
                    onChange={(_, newValue) => {
                      handleFilterChange('proveedor_id', newValue?.id);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Proveedor" />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2">{option.nombre}</Typography>
                          {option.contacto && (
                            <Typography variant="caption" color="textSecondary">
                              {option.contacto}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    sx={{ minWidth: 200 }}
                  />

                  {/* Filtro por método de pago */}
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={filters.metodo_pago || ''}
                      onChange={(e) => handleFilterChange('metodo_pago', e.target.value || undefined)}
                      label="Método de Pago"
                    >
                      <MenuItem value="">
                        <em>Todos los métodos</em>
                      </MenuItem>
                      {paymentMethods.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                {/* Filtro por usuario ID (para administradores) */}
                <TextField
                  size="small"
                  label="ID de Usuario (Opcional)"
                  type="number"
                  value={filters.usuario_id || ''}
                  onChange={(e) => handleFilterChange('usuario_id', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Filtrar por usuario específico"
                  sx={{ maxWidth: 250 }}
                  helperText="Solo para administradores: filtrar ventas por cajero específico"
                />

                {/* Botón para limpiar filtros avanzados */}
                {hasAdvancedFilters && (
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={clearFilters}
                      startIcon={<Clear />}
                    >
                      Limpiar Filtros Avanzados
                    </Button>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Collapse>

        {/* Resumen de filtros aplicados */}
        {hasAdvancedFilters && (
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary" gutterBottom display="block">
              Filtros aplicados:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {selectedCategory && (
                <Chip
                  label={`Categoría: ${selectedCategory.nombre}`}
                  size="small"
                  onDelete={() => handleFilterChange('categoria_id', undefined)}
                />
              )}
              {selectedProvider && (
                <Chip
                  label={`Proveedor: ${selectedProvider.nombre}`}
                  size="small"
                  onDelete={() => handleFilterChange('proveedor_id', undefined)}
                />
              )}
              {selectedPaymentMethod && (
                <Chip
                  label={`Pago: ${selectedPaymentMethod.label}`}
                  size="small"
                  onDelete={() => handleFilterChange('metodo_pago', undefined)}
                />
              )}
              {filters.usuario_id && (
                <Chip
                  label={`Usuario ID: ${filters.usuario_id}`}
                  size="small"
                  onDelete={() => handleFilterChange('usuario_id', undefined)}
                />
              )}
              {filters.producto_codigo && (
                <Chip
                  icon={<BarcodeReader />}
                  label={`Código: ${filters.producto_codigo}`}
                  size="small"
                  onDelete={() => handleFilterChange('producto_codigo', undefined)}
                />
              )}
              {filters.producto_descripcion && (
                <Chip
                  icon={<Search />}
                  label={`Descripción: ${filters.producto_descripcion}`}
                  size="small"
                  onDelete={() => handleFilterChange('producto_descripcion', undefined)}
                />
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}