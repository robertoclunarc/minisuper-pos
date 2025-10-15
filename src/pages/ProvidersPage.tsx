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
  Business,
  Phone,
  Email,
  LocationOn,
  Person,
} from '@mui/icons-material';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { providerService, ProviderFilters, ProviderFormData } from '../services/providerService';
import { Provider } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const initialFormData: ProviderFormData = {
  nombre: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
};

export function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filters, setFilters] = useState<ProviderFilters>({
    search: '',
    activo: true,
  });

  // Form dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; provider: Provider | null }>({
    open: false,
    provider: null,
  });

  useEffect(() => {
    loadProviders();
  }, [page, rowsPerPage, filters]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        activo: filters.activo,
      };

      const response = await providerService.getProvidersFilter(params);

      if (response.success && response.data) {
        // Manejar respuesta con o sin paginación
        if (Array.isArray(response.data)) {
          setProviders(response.data);
          setTotalItems(response.data.length);
        } else {
          setProviders(response.data.providers || []);
          setTotalItems(response.data.pagination?.total_items || 0);
        }
      } else {
        setError('Error cargando proveedores');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ProviderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleOpenDialog = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        nombre: provider.nombre,
        contacto: provider.contacto || '',
        telefono: provider.telefono || '',
        email: provider.email || '',
        direccion: provider.direccion || '',
        activo: provider.activo,
      });
    } else {
      setEditingProvider(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProvider(null);
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async () => {
    try {
      setFormLoading(true);
      setError('');

      if (!formData.nombre.trim()) {
        setError('El nombre del proveedor es requerido');
        return;
      }

      // Validar email si se proporciona
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('El formato del email no es válido');
        return;
      }

      const response = editingProvider
        ? await providerService.updateProvider(editingProvider.id, formData)
        : await providerService.createProvider(formData);

      if (response.success) {
        setSuccess(editingProvider ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente');
        handleCloseDialog();
        loadProviders();
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
    if (!deleteDialog.provider) return;

    try {
      setLoading(true);
      const response = await providerService.deleteProvider(deleteDialog.provider.id);

      if (response.success) {
        setSuccess('Proveedor eliminado exitosamente');
        setDeleteDialog({ open: false, provider: null });
        loadProviders();
      } else {
        setError(response.message || 'Error eliminando proveedor');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error eliminando proveedor');
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
              <Business color="primary" />
              Gestión de Proveedores
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Proveedor
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
                  placeholder="Nombre, contacto, teléfono..."
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
                    value={filters.activo}
                    onChange={(e) => handleFilterChange('activo', e.target.value)}
                    label="Estado"
                  >
                    <MenuItem value="true">Activos</MenuItem>
                    <MenuItem value="false">Inactivos</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadProviders}
                  disabled={loading}
                >
                  Actualizar
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Providers Table */}
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Empresa</TableCell>
                      <TableCell>Contacto</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Dirección</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Fecha Creación</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <LoadingSpinner message="Cargando proveedores..." />
                        </TableCell>
                      </TableRow>
                    ) : providers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="textSecondary">No se encontraron proveedores</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      providers.map((provider) => (
                        <TableRow key={provider.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Business color="primary" />
                              <Typography variant="body2" fontWeight="medium">
                                {provider.nombre}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {provider.contacto && <Person fontSize="small" />}
                              <Typography variant="body2">
                                {provider.contacto || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {provider.telefono && <Phone fontSize="small" />}
                              <Typography variant="body2">
                                {provider.telefono || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {provider.email && <Email fontSize="small" />}
                              <Typography variant="body2">
                                {provider.email || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {provider.direccion && <LocationOn fontSize="small" />}
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: 150,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={provider.direccion}
                              >
                                {provider.direccion || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={provider.activo ? 'Activo' : 'Inactivo'}
                              color={provider.activo ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {format(parseISO(provider.created_at!), 'dd/MM/yyyy', { locale: es })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(provider)}
                                title="Editar proveedor"
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteDialog({ open: true, provider })}
                                title="Eliminar proveedor"
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

        {/* Provider Form Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Nombre de la Empresa"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
                fullWidth
                autoFocus
                placeholder="Ej: Distribuidora ABC, Importadora XYZ..."
                InputProps={{
                  startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Persona de Contacto"
                  value={formData.contacto}
                  onChange={(e) => setFormData(prev => ({ ...prev, contacto: e.target.value }))}
                  fullWidth
                  placeholder="Nombre del contacto principal"
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <TextField
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  fullWidth
                  placeholder="Ej: +58 412-1234567"
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Stack>

              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                fullWidth
                placeholder="contacto@empresa.com"
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                multiline
                rows={2}
                fullWidth
                placeholder="Dirección completa de la empresa..."
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.activo}
                  onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.value as boolean }))}
                  label="Estado"
                >
                  <MenuItem value="true">Activo</MenuItem>
                  <MenuItem value="false">Inactivo</MenuItem>
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
              {formLoading ? <LoadingSpinner size={20} /> : editingProvider ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, provider: null })}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Está seguro que desea eliminar el proveedor "{deleteDialog.provider?.nombre}"?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Esta acción marcará el proveedor como inactivo y no se podrá deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, provider: null })}>
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