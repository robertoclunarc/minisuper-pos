import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Alert,
  Box,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Paper,
  IconButton,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Payment,
  AttachMoney,
  CreditCard,
  AccountBalance,
  PhoneIphone,
  Add,
  Delete,
  Calculate,
} from '@mui/icons-material';
import { saleService } from '../../services/saleService';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { SaleItem, Sale, PaymentDetail } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  cartItems: SaleItem[];
  totals: {
    subtotalUSD: number;
    subtotalVES: number;
    impuestoUSD: number;
    impuestoVES: number;
    totalUSD: number;
    totalVES: number;
  };
  exchangeRate: number;
  onSuccess: (sale: Sale) => void;
}

const paymentMethods = [
  { value: 'efectivo_usd', label: 'Efectivo USD', icon: <AttachMoney />, requiresReference: false },
  { value: 'efectivo_ves', label: 'Efectivo VES', icon: <AttachMoney />, requiresReference: false },
  { value: 'tarjeta', label: 'Tarjeta', icon: <CreditCard />, requiresReference: true },
  { value: 'transferencia', label: 'Transferencia', icon: <AccountBalance />, requiresReference: true },
  { value: 'pago_movil', label: 'Pago Móvil', icon: <PhoneIphone />, requiresReference: true },
];

interface PaymentEntry extends PaymentDetail {
  tempId: string; // Para identificar en el frontend
}

export function PaymentDialog({
  open,
  onClose,
  cartItems,
  totals,
  exchangeRate,
  onSuccess
}: PaymentDialogProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Partial<PaymentEntry>>({
    metodo_pago: 'efectivo_usd',
    monto_usd: 0,
    monto_ves: 0,
    referencia: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currentCashRegister } = useCashRegister();

  // Reset cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setPayments([]);
      setCurrentPayment({
        metodo_pago: 'efectivo_usd',
        monto_usd: 0,
        monto_ves: 0,
        referencia: '',
        observaciones: ''
      });
      setError('');
    }
  }, [open]);

  // Calcular totales de pagos
  const paymentTotals = React.useMemo(() => {
    const totalPaidUSD = payments.reduce((sum, p) => sum + p.monto_usd, 0);
    const totalPaidVES = payments.reduce((sum, p) => sum + p.monto_ves, 0);
    const totalPaidInUSD = totalPaidUSD + (totalPaidVES / exchangeRate);
    
    const remainingUSD = Math.max(0, totals.totalUSD - totalPaidInUSD);
    const remainingVES = remainingUSD * exchangeRate;
    
    const changeUSD = Math.max(0, totalPaidInUSD - totals.totalUSD);
    const changeVES = changeUSD * exchangeRate;

    return {
      totalPaidUSD,
      totalPaidVES,
      totalPaidInUSD,
      remainingUSD,
      remainingVES,
      changeUSD,
      changeVES,
      isComplete: totalPaidInUSD >= totals.totalUSD
    };
  }, [payments, totals.totalUSD, exchangeRate]);

  const addPayment = () => {
    setError('');

    // Validaciones
    if (!currentPayment.metodo_pago) {
      setError('Selecciona un método de pago');
      return;
    }

    const usdAmount = Number(currentPayment.monto_usd) || 0;
    const vesAmount = Number(currentPayment.monto_ves) || 0;

    if (usdAmount <= 0 && vesAmount <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    // Verificar referencia si es requerida
    const method = paymentMethods.find(m => m.value === currentPayment.metodo_pago);
    if (method?.requiresReference && !currentPayment.referencia?.trim()) {
      setError(`La referencia es requerida para ${method.label}`);
      return;
    }

    // Verificar que no exceda el total
    const newTotalInUSD = paymentTotals.totalPaidInUSD + usdAmount + (vesAmount / exchangeRate);
    if (newTotalInUSD > totals.totalUSD * 1.1) { // Permitir 10% extra para casos especiales
      setError('El monto excede significativamente el total');
      return;
    }

    const newPayment: PaymentEntry = {
      tempId: Date.now().toString(),
      metodo_pago: currentPayment.metodo_pago!,
      monto_usd: usdAmount,
      monto_ves: vesAmount,
      referencia: currentPayment.referencia?.trim() || undefined,
      observaciones: currentPayment.observaciones?.trim() || undefined
    };

    setPayments(prev => [...prev, newPayment]);

    // Reset form pero mantener método si es efectivo
    const nextMethod = currentPayment.metodo_pago?.includes('efectivo') 
      ? currentPayment.metodo_pago 
      : 'efectivo_usd';

    setCurrentPayment({
      metodo_pago: nextMethod,
      monto_usd: 0,
      monto_ves: 0,
      referencia: '',
      observaciones: ''
    });
  };

  const removePayment = (tempId: string) => {
    setPayments(prev => prev.filter(p => p.tempId !== tempId));
    setError('');
  };

  const fillRemainingAmount = () => {
    if (paymentTotals.remainingUSD > 0) {
      if (currentPayment.metodo_pago === 'efectivo_usd') {
        setCurrentPayment(prev => ({
          ...prev,
          monto_usd: Number(paymentTotals.remainingUSD.toFixed(2))
        }));
      } else if (currentPayment.metodo_pago === 'efectivo_ves') {
        setCurrentPayment(prev => ({
          ...prev,
          monto_ves: Number(paymentTotals.remainingVES.toFixed(2))
        }));
      } else {
        // Para otros métodos, llenar en USD
        setCurrentPayment(prev => ({
          ...prev,
          monto_usd: Number(paymentTotals.remainingUSD.toFixed(2))
        }));
      }
    }
  };

  const handlePayment = async () => {
    setError('');

    if (!currentCashRegister) {
      setError('No hay una caja abierta');
      return;
    }

    if (payments.length === 0) {
      setError('Agrega al menos una forma de pago');
      return;
    }

    if (!paymentTotals.isComplete) {
      setError(`Falta pagar $${paymentTotals.remainingUSD.toFixed(2)} USD`);
      return;
    }

    try {
      setLoading(true);

      const saleData = {
        caja_id: currentCashRegister.caja_id,
        items: cartItems.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad
        })),
        pagos: payments.map(payment => ({
          metodo_pago: payment.metodo_pago,
          monto_usd: payment.monto_usd,
          monto_ves: payment.monto_ves,
          referencia: payment.referencia,
          observaciones: payment.observaciones
        })),
        descuento_usd: 0,
        descuento_ves: 0
      };

      console.log('💳 Processing multiple payments:', saleData);

      const response = await saleService.createSale(saleData);

      if (response.success && response.data) {
        console.log('✅ Sale completed:', response.data);
        
        const saleData = response.data.venta || response.data;
        
        // Check for 'id' or fallback to another identifier if needed
        if (!('id' in saleData) || !saleData.id) {
          console.error('❌ Sale ID is missing!', saleData);
          setError('Error: ID de venta no encontrado');
          return;
        }
        
        onSuccess(saleData as Sale);
      } else {
        setError('Error procesando la venta');
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      setError(error.response?.data?.message || 'Error procesando el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPayments([]);
      setCurrentPayment({
        metodo_pago: 'efectivo_usd',
        monto_usd: 0,
        monto_ves: 0,
        referencia: '',
        observaciones: ''
      });
      setError('');
      onClose();
    }
  };

  const getMethodLabel = (method: string) => {
    return paymentMethods.find(m => m.value === method)?.label || method;
  };

  const getMethodIcon = (method: string) => {
    return paymentMethods.find(m => m.value === method)?.icon || <Payment />;
  };

  const requiresReference = paymentMethods.find(m => m.value === currentPayment.metodo_pago)?.requiresReference;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Payment color="primary" />
          Procesar Pago - Métodos Múltiples
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mt: 2 }}>
          {/* Panel izquierdo - Resumen de venta */}
          <Box sx={{ flex: 1 }}>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resumen de Venta
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Subtotal:</Typography>
                  <Typography>${totals.subtotalUSD.toFixed(2)} USD</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>IVA (16%):</Typography>
                  <Typography>${totals.impuestoUSD.toFixed(2)} USD</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    ${totals.totalUSD.toFixed(2)} USD
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">
                    En VES:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Bs {totals.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Progreso de pago */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Estado del Pago
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Pagado:</Typography>
                  <Typography color="success.main" fontWeight="bold">
                    ${paymentTotals.totalPaidInUSD.toFixed(2)} USD
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Restante:</Typography>
                  <Typography color={paymentTotals.remainingUSD > 0 ? "error.main" : "success.main"}>
                    ${paymentTotals.remainingUSD.toFixed(2)} USD
                  </Typography>
                </Box>
                {paymentTotals.changeUSD > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Cambio:</Typography>
                    <Typography color="warning.main" fontWeight="bold">
                      ${paymentTotals.changeUSD.toFixed(2)} USD
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* Barra de progreso visual */}
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 10,
                    bgcolor: 'grey.300',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.min(100, (paymentTotals.totalPaidInUSD / totals.totalUSD) * 100)}%`,
                      height: '100%',
                      bgcolor: paymentTotals.isComplete ? 'success.main' : 'primary.main',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                  {((paymentTotals.totalPaidInUSD / totals.totalUSD) * 100).toFixed(1)}% completado
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Panel derecho - Formas de pago */}
          <Box sx={{ flex: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Agregar nueva forma de pago */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Agregar Forma de Pago
              </Typography>

              <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                <FormLabel component="legend">Método de Pago</FormLabel>
                <RadioGroup
                  value={currentPayment.metodo_pago}
                  onChange={(e) => setCurrentPayment(prev => ({ 
                    ...prev, 
                    metodo_pago: e.target.value,
                    referencia: '' // Reset referencia al cambiar método
                  }))}
                  row
                >
                  {paymentMethods.map((method) => (
                    <FormControlLabel
                      key={method.value}
                      value={method.value}
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {method.icon}
                          <Typography variant="body2">{method.label}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  label="Monto USD"
                  type="number"
                  value={currentPayment.monto_usd || ''}
                  onChange={(e) => setCurrentPayment(prev => ({ 
                    ...prev, 
                    monto_usd: Number(e.target.value) || 0 
                  }))}
                  inputProps={{ step: '0.01', min: '0' }}
                  InputProps={{
                    startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  size="small"
                />
                <TextField
                  label="Monto VES"
                  type="number"
                  value={currentPayment.monto_ves || ''}
                  onChange={(e) => setCurrentPayment(prev => ({ 
                    ...prev, 
                    monto_ves: Number(e.target.value) || 0 
                  }))}
                  inputProps={{ step: '0.01', min: '0' }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>Bs</Typography>,
                  }}
                  size="small"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fillRemainingAmount}
                  startIcon={<Calculate />}
                  disabled={paymentTotals.remainingUSD <= 0}
                >
                  Completar
                </Button>
              </Stack>

              {requiresReference && (
                <TextField
                  fullWidth
                  label="Referencia"
                  value={currentPayment.referencia || ''}
                  onChange={(e) => setCurrentPayment(prev => ({ 
                    ...prev, 
                    referencia: e.target.value 
                  }))}
                  placeholder="Número de referencia, últimos 4 dígitos de tarjeta, etc."
                  size="small"
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                fullWidth
                label="Observaciones (Opcional)"
                value={currentPayment.observaciones || ''}
                onChange={(e) => setCurrentPayment(prev => ({ 
                  ...prev, 
                  observaciones: e.target.value 
                }))}
                multiline
                rows={2}
                size="small"
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={addPayment}
                startIcon={<Add />}
                disabled={(!currentPayment.monto_usd && !currentPayment.monto_ves) || (requiresReference && !currentPayment.referencia?.trim())}
              >
                Agregar Pago
              </Button>
            </Paper>

            {/* Lista de pagos agregados */}
            {payments.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Formas de Pago Agregadas ({payments.length})
                </Typography>
                <Stack spacing={1}>
                  {payments.map((payment) => (
                    <Card key={payment.tempId} variant="outlined">
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={1}>
                            {getMethodIcon(payment.metodo_pago)}
                            <Box>
                              <Typography variant="subtitle2">
                                {getMethodLabel(payment.metodo_pago)}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {payment.monto_usd > 0 && (
                                  <Chip 
                                    label={`$${payment.monto_usd.toFixed(2)} USD`} 
                                    size="small" 
                                    color="primary" 
                                  />
                                )}
                                {payment.monto_ves > 0 && (
                                  <Chip 
                                    label={`Bs ${payment.monto_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`} 
                                    size="small" 
                                    color="secondary" 
                                  />
                                )}
                              </Stack>
                              {payment.referencia && (
                                <Typography variant="caption" color="textSecondary">
                                  Ref: {payment.referencia}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removePayment(payment.tempId)}
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={loading || payments.length === 0 || !paymentTotals.isComplete}
          startIcon={loading ? <LoadingSpinner size={20} /> : <Payment />}
        >
          {loading ? 'Procesando...' : `Confirmar Pago (${payments.length} ${payments.length === 1 ? 'método' : 'métodos'})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}