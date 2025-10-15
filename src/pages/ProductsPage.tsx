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
  Paper,
  IconButton,
  Chip,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Inventory2,
  AttachMoney,
  Warning,
} from '@mui/icons-material';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { providerService } from '../services/providerService';
import { Product, Category, Provider, ProductFormData, ProductFilters } from '../types';

const initialFormData: ProductFormData = {
  codigo_barras: '',
  codigo_interno: '',
  nombre: '',
  descripcion: '',
  categoria_id: 0,
  proveedor_id: 0,
  precio_venta_usd: 0,
  precio_costo_usd: 0,
  stock_minimo: 0,
  unidad_medida: 'unidad',
  activo: true,
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    activo: true,
  });

  // Form dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, rowsPerPage, filters]);

  const loadInitialData = async () => {
    try {
      const [categoriesRes, providersRes] = await Promise.all([
        categoryService.getCategories(),
        providerService.getProviders(),
      ]);

      if (categoriesRes.success && categoriesRes?.data) setCategories(categoriesRes.data.categories || []);
      if (providersRes.success && providersRes?.data) setProviders(providersRes.data.providers || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        categoria_id: filters.categoria_id || undefined,
        proveedor_id: filters.proveedor_id || undefined,
        activo: filters.activo,
      };

      const response = await productService.getProductsList(params);

      if (response.success && response.data) {
        setProducts(response.data.products || []);
        setTotalItems(response.data.pagination?.total_items || 0);
      } else {
        setError('Error cargando productos');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page
  };

  const handleOpenDialog = (product?: Product) => {
    console.log('Editing product:', product);
    if (product) {
      setEditingProduct(product);
      setFormData({
        codigo_barras: product.codigo_barras,
        codigo_interno: product.codigo_interno || '',
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        categoria_id: product.categoria?.id || 0,
        proveedor_id: product.proveedor?.id || 0,
        precio_venta_usd: Number(product.precio_venta_usd),
        precio_costo_usd: Number(product.precio_costo_usd),
        stock_minimo: Number(product.stock_minimo),
        unidad_medida: product.unidad_medida,
        activo: product.activo,
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async () => {
    try {
      setFormLoading(true);
      setError('');

      if (!formData.nombre.trim()) {
        setError('El nombre del producto es requerido');
        return;
      }

      if (!formData.codigo_barras.trim()) {
        setError('El código de barras es requerido');
        return;
      }

      if (!formData.categoria_id) {
        setError('Debe seleccionar una categoría');
        return;
      }

      if (!formData.proveedor_id) {
        setError('Debe seleccionar un proveedor');
        return;
      }

      if (formData.precio_venta_usd <= 0) {
        setError('El precio de venta debe ser mayor a 0');
        return;
      }

      if (formData.precio_costo_usd <= 0) {
        setError('El precio de costo debe ser mayor a 0');
        return;
      }

      const response = editingProduct
        ? await productService.updateProduct(editingProduct.id, formData)
        : await productService.createProduct(formData);

      if (response.success) {
        setSuccess(editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        handleCloseDialog();
        loadProducts();
      } else {
        setError(response.message || 'Error procesando la solicitud');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error procesando la solicitud');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;

    try {
      setLoading(true);
      const response = await productService.deleteProduct(deleteDialog.product.id);

      if (response.success) {
        setSuccess('Producto eliminado exitosamente');
        setDeleteDialog({ open: false, product: null });
        loadProducts();
      } else {
        setError(response.message || 'Error eliminando producto');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error eliminando producto');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (product: Product) => {
    const stock = Number(product.stock_actual) || 0;
    const minimo = Number(product.stock_minimo) || 0;

    if (stock === 0) {
      return { color: 'error' as const, label: 'Sin Stock' };
    } else if (stock <= minimo) {
      return { color: 'warning' as const, label: 'Stock Bajo' };
    } else {
      return { color: 'success' as const, label: 'Stock Normal' };
    }
  };

  const selectedCategory = categories.find(cat => cat.id === filters.categoria_id);
  const selectedProvider = providers.find(prov => prov.id === filters.proveedor_id);

  return (
    <Layout>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" display="flex" alignItems="center" gap={1}>
              <Inventory2 color="primary" />
              Gestión de Productos
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Producto
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
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="end">
                <TextField
                  label="Buscar"
                  placeholder="Código, nombre del producto..."
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
                  options={categories}
                  getOptionLabel={(option) => option.nombre}
                  value={selectedCategory || null}
                  onChange={(_, newValue) => handleFilterChange('categoria_id', newValue?.id)}
                  renderInput={(params) => <TextField {...params} label="Categoría" />}
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

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.activo ? 1 : 0}
                    onChange={(e) => handleFilterChange('activo', e.target.value === 1)}
                    label="Estado"
                  >
                    <MenuItem value="1">Activos</MenuItem>
                    <MenuItem value="0">Inactivos</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadProducts}
                  disabled={loading}
                >
                  Actualizar
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell align="right">Precio Venta</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <LoadingSpinner message="Cargando productos..." />
                        </TableCell>
                      </TableRow>
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="textSecondary">No se encontraron productos</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => {
                        const stockStatus = getStockStatus(product);
                        return (
                          <TableRow key={product.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {product.codigo_barras}
                              </Typography>
                              {product.codigo_interno && (
                                <Typography variant="caption" color="textSecondary">
                                  {product.codigo_interno}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {product.nombre}
                              </Typography>
                              {product.descripcion && (
                                <Typography variant="caption" color="textSecondary">
                                  {product.descripcion}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {product.categoria?.nombre || 'Sin categoría'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {product.proveedor?.nombre || 'Sin proveedor'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium" color="success.main">
                                ${Number(product.precio_venta_usd).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Costo: ${Number(product.precio_costo_usd).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box display="flex" flexDirection="column" alignItems="flex-end">
                                <Typography variant="body2" fontWeight="medium">
                                  {Number(product.stock_minimo || 0)} {product.unidad_medida}
                                </Typography>
                                <Chip
                                  label={stockStatus.label}
                                  color={stockStatus.color}
                                  size="small"
                                  icon={Number(product.stock_minimo || 0) <= Number(product.stock_minimo) ? <Warning /> : undefined}
                                />
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={product.activo ? 'Activo' : 'Inactivo'}
                                color={product.activo ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(product)}
                                  title="Editar producto"
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteDialog({ open: true, product })}
                                  title="Eliminar producto"
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

        {/* Product Form Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Código de Barras"
                  value={formData.codigo_barras}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo_barras: e.target.value }))}
                  required
                  fullWidth
                />
                <TextField
                  label="Código Interno"
                  value={formData.codigo_interno}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo_interno: e.target.value }))}
                  fullWidth
                />
              </Stack>

              <TextField
                label="Nombre del Producto"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
                fullWidth
              />

              <TextField
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Autocomplete
                  options={categories}
                  getOptionLabel={(option) => option.nombre}
                  value={categories.find(cat => cat.id === formData.categoria_id) || null}
                  onChange={(_, newValue) => setFormData(prev => ({ ...prev, categoria_id: newValue?.id || 0 }))}
                  renderInput={(params) => (
                    <TextField {...params} label="Categoría" required />
                  )}
                  fullWidth
                />

                <Autocomplete
                  options={providers}
                  getOptionLabel={(option) => option.nombre}
                  value={providers.find(prov => prov.id === formData.proveedor_id) || null}
                  onChange={(_, newValue) => setFormData(prev => ({ ...prev, proveedor_id: newValue?.id || 0 }))}
                  renderInput={(params) => (
                    <TextField {...params} label="Proveedor" required />
                  )}
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Precio de Venta (USD)"
                  type="number"
                  value={formData.precio_venta_usd}
                  onChange={(e) => setFormData(prev => ({ ...prev, precio_venta_usd: Number(e.target.value) }))}
                  InputProps={{
                    startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  inputProps={{ step: '0.01', min: '0' }}
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
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Stock Mínimo"
                  type="number"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_minimo: Number(e.target.value) }))}
                  inputProps={{ min: '0' }}
                  fullWidth
                />
                <FormControl fullWidth>
                    <InputLabel>Unidad de Medida</InputLabel>
                    <Select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidad_medida: e.target.value }))}
                    label="Unidad de Medida"
                    >
                    <MenuItem value="kg">Kg</MenuItem>
                    <MenuItem value="unidad">unidad</MenuItem>
                    <MenuItem value="litro">Lts</MenuItem>
                    <MenuItem value="gramo">Grs</MenuItem>
                    <MenuItem value="ml">Ml</MenuItem>
                    </Select>
                </FormControl>
              </Stack>

              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.activo ? 1 : 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.value === 1 }))}
                  label="Estado"
                >
                  <MenuItem value="1">Activo</MenuItem>
                  <MenuItem value="0">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={formLoading}
            >
              {formLoading ? <LoadingSpinner size={20} /> : editingProduct ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, product: null })}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Está seguro que desea eliminar el producto "{deleteDialog.product?.nombre}"?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Esta acción marcará el producto como inactivo y no se podrá deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, product: null })}>
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