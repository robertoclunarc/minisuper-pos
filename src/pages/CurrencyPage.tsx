import React, { useState, useEffect } from 'react';
import {
  Container,  Typography,  Box,  Button,  Card,  CardContent,  TextField,  Table,  TableBody,
  TableCell,  TableContainer,  TableHead,  TableRow,  TablePagination,  IconButton,  Chip,
  Stack,  Alert,  Dialog,  DialogTitle,  DialogContent,  DialogActions,  Divider,  FormControl,
  InputLabel,  Select,  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Refresh,
  TrendingUp,
  TrendingDown,
  CurrencyExchange,
  History,
  Search,
  AttachMoney,
} from '@mui/icons-material';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { currencyService, CurrencyHistoryFilters, ManualRateData } from '../services/currencyService';
import { ExchangeRate } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface CurrencyStats {
  promedio_periodo: number;
  variacion_porcentual: number;
  tasa_minima: { valor: number; fecha: string };
  tasa_maxima: { valor: number; fecha: string };
  tendencia: 'alcista' | 'bajista' | 'estable';
  volatilidad: number;
}

const initialFormData: ManualRateData = {
  fecha: format(new Date(), 'yyyy-MM-dd'),
  tasa_bcv: 0,
  tasa_paralelo: 0,
  usd_ves: 0,
  fuente: 'manual',
};

export function CurrencyPage() {
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [stats, setStats] = useState<CurrencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filters, setFilters] = useState<CurrencyHistoryFilters>({
    fecha_desde: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    fecha_hasta: format(new Date(), 'yyyy-MM-dd'),
  });

  // Form dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [formData, setFormData] = useState<ManualRateData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);

  // Refresh loading
  const [refreshLoading, setRefreshLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [page, rowsPerPage, filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [currentRes, statsRes] = await Promise.all([
        currencyService.getCurrentRate(),
        currencyService.getCurrencyStats(30),
      ]);

      if (currentRes.success && currentRes.data) setCurrentRate(currentRes.data);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        fecha_desde: filters.fecha_desde,
        fecha_hasta: filters.fecha_hasta,
        fuente: filters.fuente,
      };

      const response = await currencyService.getHistory(params);
      
      if (response.success && response.data) {
        setRates(response.data.rates || []);
        setTotalItems(response.data.pagination?.total_items || 0);
      } else {
        setError('Error cargando historial de tasas');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CurrencyHistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleRefreshRate = async () => {
    try {
      setRefreshLoading(true);
      setError('');

      const response = await currencyService.refreshRate();
      
      if (response.success && response.data) {
        
        setSuccess('Tasa actualizada desde API externa exitosamente');
        setCurrentRate(response.data);
        loadHistory();
      } else {
        setError(response.message || 'Error actualizando tasa');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error actualizando tasa');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleOpenDialog = (rate?: ExchangeRate) => { 
    console.log('Editing rate:', rate);   
    if (rate) {
      setEditingRate(rate);
      setFormData({
        fecha: rate.fecha || '',
        tasa_bcv: Number(rate.tasa_bcv),
        tasa_paralelo: Number(rate.tasa_paralelo),
        fuente: rate.fuente || 'manual',
      });
    } else {
      setEditingRate(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRate(null);
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async () => {
    try {
      setFormLoading(true);
      setError('');

      if (!formData.fecha) {
        setError('La fecha es requerida');
        return;
      }

      const response = editingRate
        ? await currencyService.updateRate(editingRate.id!, formData)
        : await currencyService.createManualRate(formData);

      if (response.success) {
        setSuccess(editingRate ? 'Tasa actualizada exitosamente' : 'Tasa creada exitosamente');
        handleCloseDialog();
        loadHistory();
        loadInitialData(); // Refrescar tasa actual si es necesario
      } else {
        setError(response.message || 'Error procesando la solicitud');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error procesando la solicitud');
    } finally {
      setFormLoading(false);
    }
  };

  const getTrendIcon = (tendencia?: string) => {
    switch (tendencia) {
      case 'alcista':
        return <TrendingUp color="error" />;
      case 'bajista':
        return <TrendingDown color="success" />;
      default:
        return <CurrencyExchange color="info" />;
    }
  };

  const getTrendColor = (tendencia?: string) => {
    switch (tendencia) {
      case 'alcista':
        return 'error';
      case 'bajista':
        return 'success';
      default:
        return 'info';
    }
  };

  const getSourceLabel = (fuente?: string) => {
    if (fuente?.includes('manual')) return 'Manual';
    if (fuente?.includes('bcv')) return 'BCV';
    if (fuente?.includes('api')) return fuente;
    return fuente || 'Desconocido';
  };

  const getSourceColor = (fuente?: string) => {
    if (fuente?.includes('manual')) return 'secondary';
    if (fuente?.includes('bcv')) return 'primary';
    if (fuente?.includes('api')) return 'info';
    return 'default';
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" display="flex" alignItems="center" gap={1}>
              <CurrencyExchange color="primary" />
              Gestión de Tasas de Cambio
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={refreshLoading ? <LoadingSpinner size={20} /> : <Refresh />}
                onClick={handleRefreshRate}
                disabled={refreshLoading}
              >
                {refreshLoading ? 'Actualizando...' : 'Actualizar desde API'}
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Nueva Tasa
              </Button>
            </Stack>
          </Box>

          {/* Alerts */}
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            {/* Tasa Actual */}
            <Box flex={1}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <CurrencyExchange color="primary" />
                    Tasa Actual
                  </Typography>
                  {currentRate ? (
                    <Box>
                      <Typography variant="h3" color="primary.main" fontWeight="bold">
                        {Number(currentRate.tasa_bcv).toLocaleString('es-VE', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })} Bs
                      </Typography>
                      <Typography variant="h6" color="textSecondary">
                        1 USD = {Number(currentRate.tasa_bcv).toFixed(2)} VES
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Fecha:</Typography>
                          <Typography variant="body2">
                            {currentRate.fecha && format(parseISO(currentRate.fecha!), 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Fuente:</Typography>
                          <Chip 
                            label={getSourceLabel(currentRate.fuente)} 
                            size="small"
                            color={getSourceColor(currentRate.fuente) as any}
                          />
                        </Box>
                        {currentRate.tasa_bcv && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Tasa BCV:</Typography>
                            <Typography variant="body2">
                              {Number(currentRate.tasa_bcv).toFixed(2)} Bs
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  ) : (
                    <Box display="flex" justifyContent="center" py={4}>
                      <LoadingSpinner message="Cargando tasa actual..." />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Estadísticas */}
            <Box flex={1}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <TrendingUp color="primary" />
                    Estadísticas (30 días)
                  </Typography>
                  {stats ? (
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Tendencia:</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTrendIcon(stats.tendencia)}
                          <Chip 
                            label={stats.tendencia?.toUpperCase() || 'ESTABLE'} 
                            size="small"
                            color={getTrendColor(stats.tendencia) as any}
                          />
                        </Box>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Promedio:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {stats.promedio_periodo.toFixed(2)} Bs
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Variación:</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={stats.variacion_porcentual >= 0 ? 'error.main' : 'success.main'}
                        >
                          {stats.variacion_porcentual >= 0 ? '+' : ''}
                          {stats.variacion_porcentual.toFixed(2)}%
                        </Typography>
                      </Box>
                      
                      <Divider />
                      
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Mínima:</Typography>
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            {stats.tasa_minima.valor.toFixed(2)} Bs
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format(parseISO(stats.tasa_minima.fecha), 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Máxima:</Typography>
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight="medium" color="error.main">
                            {stats.tasa_maxima.valor.toFixed(2)} Bs
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format(parseISO(stats.tasa_maxima.fecha), 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Volatilidad:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {stats.volatilidad.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Stack>
                  ) : (
                    <Box display="flex" justifyContent="center" py={4}>
                      <LoadingSpinner message="Cargando estadísticas..." />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Stack>

          {/* Filters */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <History />
                Historial de Tasas
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="end">
                <TextField
                  label="Fecha Desde"
                  type="date"
                  value={filters.fecha_desde || ''}
                  onChange={(e) => handleFilterChange('fecha_desde', e.target.value || undefined)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
                
                <TextField
                  label="Fecha Hasta"
                  type="date"
                  value={filters.fecha_hasta || ''}
                  onChange={(e) => handleFilterChange('fecha_hasta', e.target.value || undefined)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Fuente</InputLabel>
                  <Select
                    value={filters.fuente || ''}
                    onChange={(e) => handleFilterChange('fuente', e.target.value || undefined)}
                    label="Fuente"
                  >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="bcv">BCV</MenuItem>
                    <MenuItem value="api">API Externa</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={loadHistory}
                  disabled={loading}
                >
                  Buscar
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>                      
                      <TableCell align="right">Tasa BCV</TableCell>
                      <TableCell align="right">Tasa Paralelo</TableCell>
                      <TableCell align="center">Fuente</TableCell>
                      <TableCell align="center">Variación</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <LoadingSpinner message="Cargando historial..." />
                        </TableCell>
                      </TableRow>
                    ) : rates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="textSecondary">No se encontraron registros</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rates.map((rate, index) => {
                        const prevRate = rates[index + 1];
                        const variation = prevRate ? 
                          ((Number(rate.tasa_bcv) - Number(prevRate.tasa_bcv)) / Number(prevRate.tasa_bcv)) * 100 : 
                          0;
                        
                        return (
                          <TableRow key={rate.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {format(parseISO(rate.fecha!), 'dd/MM/yyyy', { locale: es })}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {format(parseISO(rate.created_at!), 'HH:mm', { locale: es })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold" color="primary.main">
                                {Number(rate.tasa_bcv).toLocaleString('es-VE', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2 
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {rate.tasa_paralelo ? Number(rate.tasa_paralelo).toFixed(2) : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={getSourceLabel(rate.fuente)} 
                                size="small"
                                color={getSourceColor(rate.fuente) as any}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {prevRate ? (
                                <Chip
                                  label={`${variation >= 0 ? '+' : ''}${variation.toFixed(2)}%`}
                                  size="small"
                                  color={variation >= 0 ? 'error' : 'success'}
                                  icon={variation >= 0 ? <TrendingUp /> : <TrendingDown />}
                                />
                              ) : (
                                <Typography variant="body2" color="textSecondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {rate.fuente?.includes('manual') && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(rate)}
                                  title="Editar tasa"
                                >
                                  <Edit />
                                </IconButton>
                              )}
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

        {/* Rate Form Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRate ? 'Editar Tasa de Cambio' : 'Nueva Tasa de Cambio'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                disabled={!!editingRate} // No permitir cambiar fecha al editar
              />              

              <TextField
                label="Tasa BCV (Opcional)"
                type="number"
                value={formData.tasa_bcv}
                onChange={(e) => setFormData(prev => ({ ...prev, tasa_bcv: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: <Typography variant="body2" color="textSecondary">Bs</Typography>,
                }}
                inputProps={{ step: '0.01', min: '0' }}
                fullWidth
                helperText="Tasa oficial del Banco Central de Venezuela"
              />

              <TextField
                label="Tasa Paralelo (Opcional)"
                type="number"
                value={formData.tasa_paralelo}
                onChange={(e) => setFormData(prev => ({ ...prev, tasa_paralelo: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: <Typography variant="body2" color="textSecondary">Bs</Typography>,
                }}
                inputProps={{ step: '0.01', min: '0' }}
                fullWidth
                helperText="Tasa del mercado paralelo"
              />

              <FormControl fullWidth>
                <InputLabel>Fuente</InputLabel>
                <Select
                  value={formData.fuente}
                  onChange={(e) => setFormData(prev => ({ ...prev, fuente: e.target.value }))}
                  label="Fuente"
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="bcv">BCV</MenuItem>
                  <MenuItem value="api">API Externa</MenuItem>
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
              {formLoading ? <LoadingSpinner size={20} /> : editingRate ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}