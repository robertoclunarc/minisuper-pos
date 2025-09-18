import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  Paper,
  Alert,
} from '@mui/material';
import {
  Receipt,
  Print,
  CheckCircle,
  Close,
} from '@mui/icons-material';
import { Sale } from '../../types';
import { saleService } from '../../services/saleService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  onPrint: () => void;
}

interface ReceiptData {
  empresa: {
    nombre: string;
    direccion: string;
    telefono: string;
    rif: string;
  };
  venta: {
    numero: string;
    fecha: string;
    cajero: string;
    caja: string;
  };
  items: Array<{
    codigo: string;
    nombre: string;
    cantidad: number;
    precio_unitario_usd: number;
    precio_unitario_ves: number;
    subtotal_usd: number;
    subtotal_ves: number;
  }>;
  totales: {
    subtotal_usd: number;
    subtotal_ves: number;
    descuento_usd: number;
    descuento_ves: number;
    impuesto_usd: number;
    impuesto_ves: number;
    total_usd: number;
    total_ves: number;
  };
  pago: {
    metodo: string;
    recibido_usd: number;
    recibido_ves: number;
    cambio_usd: number;
    cambio_ves: number;
    tasa_cambio: number;
  };
  footer: {
    mensaje: string;
    fecha_impresion: string;
  };
}

export function ReceiptDialog({ open, onClose, sale, onPrint }: ReceiptDialogProps) {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open && sale) {
      console.log('🧾 ReceiptDialog opened with sale:', sale);
      loadReceiptData();
    }
  }, [open, sale]);

  const loadReceiptData = async () => {
    if (!sale) {
      console.error('❌ No sale provided to ReceiptDialog');
      setError('No se proporcionó información de la venta');
      return;
    }

    // ✅ VERIFICAR QUE EL ID EXISTE
    if (!sale.id) {
      console.error('❌ Sale ID is missing:', sale);
      setError('ID de venta no encontrado');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Loading receipt for sale ID:', sale.id);
      const response = await saleService.getSaleReceipt(sale.id);
      
      if (response.success && response.data) {
        setReceiptData(response.data);
        console.log('✅ Receipt data loaded successfully');
      } else {
        setError('Error cargando datos del recibo');
      }
    } catch (error: any) {
      console.error('❌ Error loading receipt data:', error);
      setError('Error cargando el recibo: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'efectivo_usd': 'Efectivo USD',
      'efectivo_ves': 'Efectivo VES',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia',
      'pago_movil': 'Pago Móvil',
      'mixto': 'Mixto'
    };
    return methods[method] || method;
  };

  const handlePrint = () => {
    onPrint();
    const receiptElement = document.getElementById('receipt-content');
    if (receiptElement) {
      const printWindow = window.open('', '_blank');
      printWindow!.document.write(`
        <html>
          <head>
            <title>Recibo de Venta</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .line { border-bottom: 1px dashed #000; margin: 5px 0; }
              .item { display: flex; justify-content: space-between; margin: 2px 0; }
            </style>
          </head>
          <body>
            ${receiptElement.innerHTML}
          </body>
        </html>
      `);
      printWindow!.document.close();
      printWindow!.print();
    }
  };

  // ✅ MOSTRAR ERROR SI NO HAY VENTA O ID
  if (!sale) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="error">
            No se proporcionó información de la venta
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!sale.id) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="error">
            ID de venta no encontrado. Sale ID: {JSON.stringify(sale.id)}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Cargando recibo...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="error">
            {error}
          </Alert>
          <Box mt={2}>
            <Typography variant="body2">
              Información de debug:
            </Typography>
            <Typography variant="caption" component="pre">
              Sale ID: {sale.id}
              {'\n'}Sale Object: {JSON.stringify(sale, null, 2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
          <Button onClick={loadReceiptData} variant="outlined">
            Reintentar
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!receiptData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>No se pudieron cargar los datos del recibo</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
          <Button onClick={loadReceiptData} variant="outlined">
            Reintentar
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CheckCircle color="success" />
          Venta Completada
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Mensaje de éxito */}
          <Paper sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              ¡Venta procesada exitosamente!
            </Typography>
            <Typography variant="body2">
              Recibo #{sale.numero_venta}
            </Typography>
          </Paper>

          {/* Recibo */}
          <Paper variant="outlined" sx={{ p: 2 }} id="receipt-content">
            <Box sx={{ fontFamily: 'monospace', fontSize: '14px' }}>
              {/* Header */}
              <Box textAlign="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  {receiptData.empresa.nombre}
                </Typography>
                <Typography variant="body2">
                  {receiptData.empresa.direccion}
                </Typography>
                <Typography variant="body2">
                  Tel: {receiptData.empresa.telefono}
                </Typography>
                <Typography variant="body2">
                  RIF: {receiptData.empresa.rif}
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Información de venta */}
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Recibo:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {receiptData.venta.numero}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Fecha:</Typography>
                  <Typography variant="body2">
                    {format(new Date(receiptData.venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Cajero:</Typography>
                  <Typography variant="body2">{receiptData.venta.cajero}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Caja:</Typography>
                  <Typography variant="body2">{receiptData.venta.caja}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1 }} />

              {/* Items */}
              <Typography variant="body2" fontWeight="bold" mb={1}>
                PRODUCTOS:
              </Typography>
              {receiptData.items.map((item, index) => (
                <Box key={index} mb={1}>
                  <Typography variant="body2" fontWeight="bold">
                    {item.nombre}
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">
                      {item.cantidad} x ${Number(item.precio_unitario_usd || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                     ${Number(item.subtotal_usd || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary">
                      {item.cantidad} x Bs {Number(item.precio_unitario_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Bs {Number(item.subtotal_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 1 }} />

              {/* Totales */}
              <Stack spacing={0.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">
                    ${Number(receiptData.totales.subtotal_usd || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">IVA (16%):</Typography>
                  <Typography variant="body2">
                    ${Number(receiptData.totales.impuesto_usd || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" fontWeight="bold">TOTAL USD:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${Number(receiptData.totales.total_usd || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" fontWeight="bold">TOTAL VES:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Bs {Number(receiptData.totales.total_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1 }} />

              {/* Pago */}
              <Stack spacing={0.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Método:</Typography>
                  <Typography variant="body2">
                    {getPaymentMethodLabel(receiptData.pago.metodo)}
                  </Typography>
                </Box>
                {receiptData.pago.recibido_usd > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Recibido USD:</Typography>
                    <Typography variant="body2">
                      ${Number(receiptData.pago.recibido_usd || 0).toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {receiptData.pago.recibido_ves > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Recibido VES:</Typography>
                    <Typography variant="body2">
                      Bs {Number(receiptData.pago.recibido_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                )}
                {receiptData.pago.cambio_usd > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Cambio USD:</Typography>
                    <Typography variant="body2">
                      ${Number(receiptData.pago.cambio_usd || 0).toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {receiptData.pago.cambio_ves > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Cambio VES:</Typography>
                    <Typography variant="body2">
                      Bs {Number(receiptData.pago.cambio_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                )}
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Tasa USD/VES:</Typography>
                  <Typography variant="body2">
                    {Number(receiptData.pago.tasa_cambio || 1).toLocaleString('es-VE', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1 }} />

              {/* Footer */}
              <Box textAlign="center">
                <Typography variant="body2">
                  {receiptData.footer.mensaje}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Impreso: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} startIcon={<Close />}>
          Cerrar
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<Print />}
        >
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}