import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,  
  IconButton,
  Chip,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Inventory,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  CalendarToday,
  AttachMoney,
} from '@mui/icons-material';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import { providerService } from '../services/providerService';
import { InventoryBatch, Product, Provider } from '../types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface InventoryFilters {
  search: string;
  producto_id?: number;
  proveedor_id?: number;
  estado?: 'disponible' | 'por_vencer' | 'vencido' | '';
  fecha_vencimiento_desde?: string;
  fecha_vencimiento_hasta?: string;
}

interface BatchFormData {
  producto_id: number | null;
  proveedor_id: number | null;
  numero_lote: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  precio_costo_usd: number;
  tasa_cambio_registro: number;
  fecha_vencimiento?: string;
  fecha_ingreso: string;
}

const initialFormData: BatchFormData = {
  producto_id: null,
  proveedor_id: null,
  numero_lote: '',
  cantidad_inicial: 0,
  cantidad_actual: 0,
  precio_costo_usd: 0,
  tasa_cambio_registro: 0,
  fecha_vencimiento: '',
  fecha_ingreso: format(new Date(), 'yyyy-MM-dd'),
};

export function InventoryPage() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
  });

  // Form dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(null);
  const [formData, setFormData] = useState<BatchFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; batch: InventoryBatch | null }>({
    open: false,
    batch: null,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadBatches();
  }, [page, rowsPerPage, filters]);

  const loadInitialData = async () => {
    try {
      const [productsRes, providersRes] = await Promise.all([
        productService.getProducts({ limit: 1000, }),
        providerService.getProviders(),
      ]);

      if (productsRes.success) setProducts(productsRes.data?.products || []);
      if (providersRes.success) setProviders(providersRes.data?.providers || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        producto_id: filters.producto_id || undefined,
        proveedor_id: filters.proveedor_id || undefined,
        estado: filters.estado || undefined,
        fecha_vencimiento_desde: filters.fecha_vencimiento_desde || undefined,
        fecha_vencimiento_hasta: filters.fecha_vencimiento_hasta || undefined,
      };

      const response = await inventoryService.getBatches(params);

      if (response.success && response.data) {
        setBatches(response.data.batches || []);
        setTotalItems(response.data.pagination?.total_items || 0);
      } else {
        setError('Error cargando lotes de inventario');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof InventoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleOpenDialog = (batch?: InventoryBatch) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({
        producto_id: batch.producto_id,
        proveedor_id: batch.proveedor_id,
        numero_lote: batch.numero_lote!,
        cantidad_inicial: Number(batch.cantidad_inicial),
        cantidad_actual: Number(batch.cantidad_actual),
        precio_costo_usd: Number(batch.precio_costo_usd),
        tasa_cambio_registro: Number(batch.tasa_cambio_registro),
        fecha_vencimiento: batch.fecha_vencimiento ? format(parseISO(batch.fecha_vencimiento), 'yyyy-MM-dd') : '',
        fecha_ingreso: format(parseISO(batch.fecha_ingreso!), 'yyyy-MM-dd'),
      });
    } else {
      setEditingBatch(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBatch(null);
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async () => {
    try {
      setFormLoading(true);
      setError('');

      if (!formData.producto_id) {
        setError('Debe seleccionar un producto');
        return;
      }

      if (!formData.proveedor_id) {
        setError('Debe seleccionar un proveedor');
        return;
      }

      if (!formData.numero_lote.trim()) {
        setError('El número de lote es requerido');
        return;
      }

      if (formData.cantidad_inicial <= 0) {
        setError('La cantidad inicial debe ser mayor a 0');
        return;
      }

      if (formData.precio_costo_usd <= 0) {
        setError('El precio de costo debe ser mayor a 0');
        return;
      }

      if (formData.tasa_cambio_registro <= 0) {
        setError('La tasa de cambio debe ser mayor a 0');
        return;
      }

      const response = editingBatch
        ? await inventoryService.updateBatch(
            editingBatch.id!,
            {
              ...formData,
              producto_id: formData.producto_id ?? 0,
              proveedor_id: formData.proveedor_id ?? 0,
              id: editingBatch.id,
            }
          )
        : await inventoryService.createBatch({
            ...formData,
            producto_id: formData.producto_id ?? 0,
            proveedor_id: formData.proveedor_id ?? 0,
          });

      if (response.success) {
        setSuccess(editingBatch ? 'Lote actualizado exitosamente' : 'Lote creado exitosamente');
        handleCloseDialog();
        loadBatches();
      } else {
        setError(response.message || 'Error procesando la solicitud');
      }
    } catch (error: any) {
        console.error('Error submitting form:', error);
      setError(error.response?.data?.message || 'Error procesando la solicitud');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.batch) return;

    try {
      setLoading(true);
      const response = await inventoryService.deleteBatch(deleteDialog.batch.id!);

      if (response.success) {
        setSuccess('Lote eliminado exitosamente');
        setDeleteDialog({ open: false, batch: null });
        loadBatches();
      } else {
        setError(response.message || 'Error eliminando lote');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error eliminando lote');
    } finally {
      setLoading(false);
    }
  };

  const getBatchStatus = (batch: InventoryBatch) => {
    if (Number(batch.cantidad_actual) <= 0) {
      return { color: 'default' as const, label: 'Agotado', icon: <ErrorIcon /> };
    }

    if (batch.fecha_vencimiento) {
      const today = new Date();
      const expiryDate = parseISO(batch.fecha_vencimiento);
      const daysUntilExpiry = differenceInDays(expiryDate, today);

      if (daysUntilExpiry < 0) {
        return { color: 'error' as const, label: 'Vencido', icon: <ErrorIcon /> };
      } else if (daysUntilExpiry <= 30) {
        return { color: 'warning' as const, label: 'Por Vencer', icon: <Warning /> };
      }
    }

    return { color: 'success' as const, label: 'Disponible', icon: <CheckCircle /> };
  };

  const selectedProduct = products.find(prod => prod.id === filters.producto_id);
  const selectedProvider = providers.find(prov => prov.id === filters.proveedor_id);

  return (
    <Layout>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" display="flex" alignItems="center" gap={1}>
              <Inventory color="primary" />
              Gestión de Inventario
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Lote
            </Button>
          </Box>

          {/* Alerts */}
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

          {/* Filters */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filtros de Búsqueda
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="end">
                  <TextField
                    label="Buscar"
                    placeholder="Número de lote, producto..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    size="small"
                    sx={{ minWidth: 250 }}
                  />

                  <Autocomplete
                    size="small"
                    options={products}
                    getOptionLabel={(option) => option.nombre}
                    value={selectedProduct || null}
                    onChange={(_, newValue) => handleFilterChange('producto_id', newValue?.id)}
                    renderInput={(params) => <TextField {...params} label="Producto" />}
                    sx={{ minWidth: 200 }}
                  />

                  <Autocomplete
                    size="small"
                    options={providers}
                    getOptionLabel={(option) => option.nombre}
                    value={selectedProvider || null}
                    onChange={(_, newValue) => handleFilterChange('proveedor_id', newValue?.id)}
                    renderInput={(params) => <TextField {...params} label="Proveedor" />}
                    sx={{ minWidth: 200 }}
                  />

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={filters.estado || ''}
                      onChange={(e) => handleFilterChange('estado', e.target.value || undefined)}
                      label="Estado"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="disponible">Disponible</MenuItem>
                      <MenuItem value="por_vencer">Por Vencer</MenuItem>
                      <MenuItem value="vencido">Vencido</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadBatches}
                    disabled={loading}
                  >
                    Actualizar
                  </Button>
                </Stack>

                {/* Date filters */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Vencimiento Desde"
                    type="date"
                    value={filters.fecha_vencimiento_desde || ''}
                    onChange={(e) => handleFilterChange('fecha_vencimiento_desde', e.target.value || undefined)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  <TextField
                    label="Vencimiento Hasta"
                    type="date"
                    value={filters.fecha_vencimiento_hasta || ''}
                    onChange={(e) => handleFilterChange('fecha_vencimiento_hasta', e.target.value || undefined)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lote</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio Costo</TableCell>
                      <TableCell align="center">Fecha Ingreso</TableCell>
                      <TableCell align="center">Vencimiento</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <LoadingSpinner message="Cargando inventario..." />
                        </TableCell>
                      </TableRow>
                    ) : batches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography color="textSecondary">No se encontraron lotes</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      batches.map((batch) => {
                        const status = getBatchStatus(batch);
                        return (
                          <TableRow key={batch.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                                {batch.numero_lote}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {batch.producto?.nombre || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {batch.producto?.codigo_barras}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {batch.proveedor?.nombre || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {Number(batch.cantidad_actual)} / {Number(batch.cantidad_inicial)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {batch.producto?.unidad_medida || 'unidad'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                ${Number(batch.precio_costo_usd).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Tasa: {Number(batch.tasa_cambio_registro).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {format(parseISO(batch.fecha_ingreso!), 'dd/MM/yyyy', { locale: es })}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {batch.fecha_vencimiento ? (
                                <Box>
                                  <Typography variant="body2">
                                    {format(parseISO(batch.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                                  </Typography>
                                  {(() => {
                                    const days = differenceInDays(parseISO(batch.fecha_vencimiento), new Date());
                                    return (
                                      <Typography 
                                        variant="caption" 
                                        color={days < 0 ? 'error' : days <= 30 ? 'warning.main' : 'textSecondary'}
                                      >
                                        {days < 0 ? `Venció hace ${Math.abs(days)} días` : `${days} días restantes`}
                                      </Typography>
                                    );
                                  })()}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No vence
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={status.label}
                                color={status.color}
                                size="small"
                                icon={status.icon}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(batch)}
                                  title="Editar lote"
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteDialog({ open: true, batch })}
                                  title="Eliminar lote"
                                >
                                  <Delete />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalItems}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </CardContent>
          </Card>
        </Stack>

        {/* Batch Form Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingBatch ? 'Editar Lote' : 'Nuevo Lote'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Autocomplete
                    options={products}
                    getOptionLabel={(option) => `${option.codigo_barras} - ${option.nombre}`}
                    value={products.find(prod => prod.id === formData.producto_id) || null}
                    onChange={(_, newValue) => setFormData(prev => ({ ...prev, producto_id: newValue?.id || null }))}
                    renderInput={(params) => (
                        <TextField {...params} label="Producto" required />
                    )}
                    renderOption={(props, option) => (
                        <Box component="li" {...props}>
                        <Box>
                            <Typography variant="body2" fontWeight="medium">
                            {option.nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                            {option.codigo_barras} • {option.categoria?.nombre}
                            </Typography>
                        </Box>
                        </Box>
                    )}
                    fullWidth
                    />

                    <Autocomplete
                    options={providers}
                    getOptionLabel={(option) => option.nombre}
                    value={providers.find(prov => prov.id === formData.proveedor_id) || null}
                    onChange={(_, newValue) => setFormData(prev => ({ ...prev, proveedor_id: newValue?.id || null }))}
                    renderInput={(params) => (
                        <TextField {...params} label="Proveedor" required />
                    )}
                    fullWidth
                    />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        label="Número de Lote"
                        value={formData.numero_lote}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_lote: e.target.value }))}
                        required
                        fullWidth
                        placeholder="Ej: LOT-2024-001"
                    />

                    <TextField
                        label="Cantidad Actual"
                        type="number"
                        value={formData.cantidad_actual}
                        onChange={(e) => setFormData(prev => ({ ...prev, cantidad_actual: Number(e.target.value) }))}
                        inputProps={{ min: '1' }}
                        required
                        fullWidth
                        />
                </Stack>        

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Cantidad Inicial"
                  type="number"
                  value={formData.cantidad_inicial}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad_inicial: Number(e.target.value) }))}
                  inputProps={{ min: '1' }}
                  required
                  fullWidth
                />

                <TextField
                  label="Precio de Costo (USD)"
                  type="number"
                  value={formData.precio_costo_usd}
                  onChange={(e) => setFormData(prev => ({ ...prev, precio_costo_usd: Number(e.target.value) }))}
                  InputProps={{
                    startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  inputProps={{ step: '0.01', min: '0' }}
                  required
                  fullWidth
                />

                <TextField
                  label="Tasa de Cambio"
                  type="number"
                  value={formData.tasa_cambio_registro}
                  onChange={(e) => setFormData(prev => ({ ...prev, tasa_cambio_registro: Number(e.target.value) }))}
                  inputProps={{ step: '0.01', min: '0' }}
                  required
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Fecha de Ingreso"
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />

                <TextField
                  label="Fecha de Vencimiento (Opcional)"
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  fullWidth
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={formLoading}
            >
              {formLoading ? <LoadingSpinner size={20} /> : editingBatch ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, batch: null })}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Está seguro que desea eliminar el lote "{deleteDialog.batch?.numero_lote}"?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, batch: null })}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}