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

  useEffect(() => {
    if (open && sale) {
      loadReceiptData();
    }
  }, [open, sale]);

  const loadReceiptData = async () => {
    if (!sale) return;

    try {
      setLoading(true);
      const response = await saleService.getSaleReceipt(sale.id);
      
      if (response.success && response.data) {
        setReceiptData(response.data);
      }
    } catch (error) {
      console.error('Error loading receipt data:', error);
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
    // Enfocar el recibo para imprimir
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

  if (!sale || !receiptData) {
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
                      {item.cantidad} x ${item.precio_unitario_usd.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${item.subtotal_usd.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary">
                      {item.cantidad} x Bs {item.precio_unitario_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Bs {item.subtotal_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
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
                    ${receiptData.totales.subtotal_usd.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">IVA (16%):</Typography>
                  <Typography variant="body2">
                    ${receiptData.totales.impuesto_usd.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" fontWeight="bold">TOTAL USD:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${receiptData.totales.total_usd.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" fontWeight="bold">TOTAL VES:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Bs {receiptData.totales.total_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
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
                      ${receiptData.pago.recibido_usd.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {receiptData.pago.recibido_ves > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Recibido VES:</Typography>
                    <Typography variant="body2">
                      Bs {receiptData.pago.recibido_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                )}
                {receiptData.pago.cambio_usd > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Cambio USD:</Typography>
                    <Typography variant="body2">
                      ${receiptData.pago.cambio_usd.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {receiptData.pago.cambio_ves > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Cambio VES:</Typography>
                    <Typography variant="body2">
                      Bs {receiptData.pago.cambio_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                )}
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Tasa USD/VES:</Typography>
                  <Typography variant="body2">
                    {receiptData.pago.tasa_cambio.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
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