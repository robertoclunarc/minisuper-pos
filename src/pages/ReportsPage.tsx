import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  ShoppingCart,
  AttachMoney,
  Download,
  Analytics,
} from '@mui/icons-material';
import { Layout } from '../components/layout/Layout';
import { ReportFilters } from '../components/reports/ReportFilters';
import { reportService, SalesReportResponse, SalesReportFilters } from '../services/reportService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ReportsPage() {
  const [filters, setFilters] = useState<SalesReportFilters>({
    fecha_inicio: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
  });
  const [reportData, setReportData] = useState<SalesReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      setPage(0); // Reset pagination
      
      console.log('📊 Generating report with filters:', filters);
      
      const response = await reportService.getSalesReportByProduct(filters);
      
      if (response.success && response.data) {
        setReportData(response.data);
        console.log('✅ Report generated successfully');
      } else {
        setError('Error generando el reporte');
      }
    } catch (error: any) {
      console.error('❌ Error generating report:', error);
      setError(error.response?.data?.message || 'Error generando el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!reportData) return;
    
    const headers = [
      'Código',
      'Producto', 
      'Categoría',
      'Proveedor',
      'Cantidad Vendida',
      'Precio Promedio USD',
      'Total Ventas USD',
      'Total Ventas VES',
      'Transacciones',
      'Participación %'
    ];
    
    const csvContent = [
      headers.join(','),
      ...reportData.productos.map(product => [
        product.codigo_barras,
        `"${product.producto_nombre}"`,
        `"${product.categoria_nombre}"`,
        `"${product.proveedor_nombre}"`,
        product.total_cantidad,
        product.precio_promedio_usd,
        product.total_ventas_usd,
        product.total_ventas_ves,
        product.numero_transacciones,
        product.participacion_ventas
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-ventas-productos-${filters.fecha_inicio}-${filters.fecha_fin}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedProducts = reportData?.productos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  ) || [];

  return (
    <Layout>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={1}>
              <Assessment color="primary" />
              Reportes de Ventas por Producto
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Análisis detallado de ventas por producto con filtros avanzados
            </Typography>
          </Box>

          {/* Filtros */}
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onGenerateReport={generateReport}
            loading={loading}
          />

          {/* Error */}
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {/* Resultados del reporte */}
          {reportData && (
            <Stack spacing={3}>
              {/* Header del reporte */}
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                  <Analytics />
                  Período: {format(new Date(reportData.estadisticas.periodo.fecha_inicio), 'dd/MM/yyyy', { locale: es })} - {format(new Date(reportData.estadisticas.periodo.fecha_fin), 'dd/MM/yyyy', { locale: es })}
                </Typography>
                
                <Button
                  variant="outlined"
                  onClick={handleExportReport}
                  startIcon={<Download />}
                >
                  Exportar CSV
                </Button>
              </Box>

              {/* Estadísticas generales */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AttachMoney color="success" />
                      <Typography variant="h6">Ventas Totales</Typography>
                    </Box>
                    <Typography variant="h4" color="success.main">
                      ${reportData.estadisticas.totales.total_ventas_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Bs {reportData.estadisticas.totales.total_ventas_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Promedio: ${reportData.estadisticas.promedios.ventas_por_dia_usd.toFixed(2)}/día
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ShoppingCart color="primary" />
                      <Typography variant="h6">Productos</Typography>
                    </Box>
                    <Typography variant="h4" color="primary.main">
                      {reportData.estadisticas.totales.total_productos_vendidos.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {reportData.estadisticas.totales.productos_diferentes} productos diferentes
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Promedio: {Math.round(reportData.estadisticas.promedios.productos_por_dia)} unidades/día
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <TrendingUp color="secondary" />
                      <Typography variant="h6">Transacciones</Typography>
                    </Box>
                    <Typography variant="h4" color="secondary.main">
                      {reportData.estadisticas.totales.total_transacciones.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ticket promedio: ${reportData.estadisticas.totales.ticket_promedio_usd.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Promedio: {Math.round(reportData.estadisticas.promedios.transacciones_por_dia)} transacciones/día
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>

              {/* Información del período y filtros */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información del Reporte
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                    <Chip 
                      label={`${reportData.estadisticas.periodo.total_dias} días analizados`}
                      color="info"
                      variant="outlined"
                    />
                    {reportData.filtros_aplicados.categoria_id && (
                      <Chip label="Filtro: Categoría" color="primary" size="small" />
                    )}
                    {reportData.filtros_aplicados.proveedor_id && (
                      <Chip label="Filtro: Proveedor" color="primary" size="small" />
                    )}
                    {reportData.filtros_aplicados.metodo_pago && (
                      <Chip label={`Filtro: ${reportData.filtros_aplicados.metodo_pago}`} color="primary" size="small" />
                    )}
                    {reportData.filtros_aplicados.usuario_id && (
                      <Chip label={`Filtro: Usuario ${reportData.filtros_aplicados.usuario_id}`} color="primary" size="small" />
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Tabla de productos */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Detalle por Producto ({reportData.productos.length} productos encontrados)
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Producto</TableCell>
                          <TableCell>Categoría</TableCell>
                          <TableCell>Proveedor</TableCell>
                          <TableCell align="right">Cantidad</TableCell>
                          <TableCell align="right">Precio Prom.</TableCell>
                          <TableCell align="right">Total USD</TableCell>
                          <TableCell align="right">Total VES</TableCell>
                          <TableCell align="right">Transacciones</TableCell>
                          <TableCell align="right">Participación</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedProducts.map((product, index) => (
                          <TableRow 
                            key={product.producto_id} 
                            hover
                            sx={{ 
                              backgroundColor: index < 5 ? 'success.light' : 'inherit',
                              '&:hover': {
                                backgroundColor: index < 5 ? 'success.main' : 'action.hover',
                              }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {product.codigo_barras}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {product.producto_nombre}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {product.categoria_nombre}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {product.proveedor_nombre}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {product.total_cantidad.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                ${product.precio_promedio_usd.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium" color="success.main">
                                ${product.total_ventas_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="textSecondary">
                                Bs {product.total_ventas_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {product.numero_transacciones}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={`${product.participacion_ventas}%`}
                                size="small"
                                color={product.participacion_ventas > 5 ? "primary" : "default"}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <TablePagination
                    component="div"
                    count={reportData.productos.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                  />
                </CardContent>
              </Card>

              {/* Rankings */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      🏆 Top 5 Productos Más Vendidos
                    </Typography>
                    <Stack spacing={1}>
                      {reportData.estadisticas.rankings.productos_mas_vendidos.map((product, index) => (
                        <Box key={product.producto_id} display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {index + 1}. {product.producto_nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.total_cantidad} unidades • {product.numero_transacciones} transacciones
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="bold" color="success.main">                            
                            ${Number(product.total_ventas_usd || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
                
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="warning.main">
                      📉 Productos con Menores Ventas
                    </Typography>
                    <Stack spacing={1}>
                      {reportData.estadisticas.rankings.productos_menos_vendidos.map((product, index) => (
                        <Box key={product.producto_id} display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {product.producto_nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.total_cantidad} unidades • {product.numero_transacciones} transacciones
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="bold" color="warning.main">
                            ${Number(product.total_ventas_usd || 0).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Container>
    </Layout>
  );
}