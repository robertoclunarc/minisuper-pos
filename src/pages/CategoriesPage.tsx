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
  Category as CategoryIcon,
  Inventory,
} from '@mui/icons-material';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { categoryService, CategoryFilters, CategoryFormData } from '../services/categoryService';
import { Category } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const initialFormData: CategoryFormData = {
  nombre: '',
  descripcion: '',
  activo: true,
};

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    activo: true,
  });

  // Form dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });

  useEffect(() => {
    loadCategories();
  }, [page, rowsPerPage, filters]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        activo: filters.activo,
      };

      const response = await categoryService.getCategoriesFilter(params);
      console.log(response);
      if (response.success && response.data) {
        // Manejar respuesta con o sin paginación
        if (Array.isArray(response.data)) {
          setCategories(response.data);
          setTotalItems(response.data.length);
        } else {
          setCategories(response.data.categories || []);
          setTotalItems(response.data.pagination?.total_items || 0);
        }
      } else {
        setError('Error cargando categorías');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CategoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nombre: category.nombre,
        descripcion: category.descripcion || '',
        activo: category.activo,
      });
    } else {
      setEditingCategory(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async () => {
    try {
      setFormLoading(true);
      setError('');

      if (!formData.nombre.trim()) {
        setError('El nombre de la categoría es requerido');
        return;
      }

      const response = editingCategory
        ? await categoryService.updateCategory(editingCategory.id, formData)
        : await categoryService.createCategory(formData);

      if (response.success) {
        setSuccess(editingCategory ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
        handleCloseDialog();
        loadCategories();
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
    if (!deleteDialog.category) return;

    try {
      setLoading(true);
      const response = await categoryService.deleteCategory(deleteDialog.category.id);

      if (response.success) {
        setSuccess('Categoría eliminada exitosamente');
        setDeleteDialog({ open: false, category: null });
        loadCategories();
      } else {
        setError(response.message || 'Error eliminando categoría');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error eliminando categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" display="flex" alignItems="center" gap={1}>
              <CategoryIcon color="primary" />
              Gestión de Categorías
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Nueva Categoría
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
                  placeholder="Nombre de categoría..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  size="small"
                  sx={{ minWidth: 250 }}
                />

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.activo ? "true" : "false"}
                    onChange={(e) => handleFilterChange('activo', e.target.value === "true")}
                    label="Estado"
                  >
                    <MenuItem value="true">Activas</MenuItem>
                    <MenuItem value="false">Inactivas</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadCategories}
                  disabled={loading}
                >
                  Actualizar
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Fecha Creación</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <LoadingSpinner message="Cargando categorías..." />
                        </TableCell>
                      </TableRow>
                    ) : categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">No se encontraron categorías</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {category.nombre}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {category.descripcion || 'Sin descripción'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={category.activo ? 'Activa' : 'Inactiva'}
                              color={category.activo ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {format(parseISO(category.created_at!), 'dd/MM/yyyy', { locale: es })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(category)}
                                title="Editar categoría"
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteDialog({ open: true, category })}
                                title="Eliminar categoría"
                              >
                                <Delete />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
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

        {/* Category Form Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Nombre de la Categoría"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
                fullWidth
                autoFocus
                placeholder="Ej: Bebidas, Snacks, Lácteos..."
              />

              <TextField
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                multiline
                rows={3}
                fullWidth
                placeholder="Descripción detallada de la categoría..."
              />

              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.activo}
                  onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.value as boolean }))}
                  label="Estado"
                >
                  <MenuItem value="true">Activa</MenuItem>
                  <MenuItem value="false">Inactiva</MenuItem>
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
              {formLoading ? <LoadingSpinner size={20} /> : editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, category: null })}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Está seguro que desea eliminar la categoría "{deleteDialog.category?.nombre}"?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Esta acción marcará la categoría como inactiva y no se podrá deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, category: null })}>
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