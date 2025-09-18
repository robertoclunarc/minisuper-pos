import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Payment,
  AttachMoney,
  CreditCard,
  AccountBalance,
  PhoneIphone,
} from '@mui/icons-material';
import { saleService } from '../../services/saleService';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { SaleItem, Sale } from '../../types';
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
  { value: 'efectivo_usd', label: 'Efectivo USD', icon: <AttachMoney /> },
  { value: 'efectivo_ves', label: 'Efectivo VES', icon: <AttachMoney /> },
  { value: 'tarjeta', label: 'Tarjeta', icon: <CreditCard /> },
  { value: 'transferencia', label: 'Transferencia', icon: <AccountBalance /> },
  { value: 'pago_movil', label: 'Pago Móvil', icon: <PhoneIphone /> },
];

export function PaymentDialog({
  open,
  onClose,
  cartItems,
  totals,
  exchangeRate,
  onSuccess
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState('efectivo_usd');
  const [receivedAmountUSD, setReceivedAmountUSD] = useState('');
  const [receivedAmountVES, setReceivedAmountVES] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currentCashRegister } = useCashRegister();

  // Calcular cambio
  const calculateChange = () => {
    const totalUSD = totals.totalUSD;
    const receivedUSD = parseFloat(receivedAmountUSD) || 0;
    const receivedVESinUSD = (parseFloat(receivedAmountVES) || 0) / exchangeRate;
    
    const totalReceivedUSD = receivedUSD + receivedVESinUSD;
    const changeUSD = totalReceivedUSD - totalUSD;
    const changeVES = changeUSD * exchangeRate;

    return {
      changeUSD: changeUSD > 0 ? changeUSD : 0,
      changeVES: changeVES > 0 ? changeVES : 0,
      totalReceivedUSD,
      isValidPayment: totalReceivedUSD >= totalUSD
    };
  };

  const change = calculateChange();

  const handlePayment = async () => {
    setError('');

    if (!currentCashRegister) {
      setError('No hay una caja abierta');
      return;
    }

    // Validar método de pago
    if (paymentMethod.includes('efectivo')) {
      if (!change.isValidPayment) {
        setError('El monto recibido es insuficiente');
        return;
      }
    }

    // Validar montos para efectivo
    if (paymentMethod === 'efectivo_usd' && (parseFloat(receivedAmountUSD) || 0) < totals.totalUSD) {
      setError('Monto insuficiente en USD');
      return;
    }

    if (paymentMethod === 'efectivo_ves' && (parseFloat(receivedAmountVES) || 0) < totals.totalVES) {
      setError('Monto insuficiente en VES');
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
        metodo_pago: paymentMethod,
        monto_recibido_usd: parseFloat(receivedAmountUSD) || 0,
        monto_recibido_ves: parseFloat(receivedAmountVES) || 0,
        descuento_usd: 0,
        descuento_ves: 0
      };

      console.log('💳 Processing payment:', saleData);

      const response = await saleService.createSale(saleData);

      if (response.success && response.data) {
        console.log('✅ Sale completed:', response.data);
        const saleData = response.data;
        console.log('🧾 Sale data for receipt:', saleData);
        if (!saleData?.venta?.id) {
          console.error('❌ Sale ID is missing!', saleData);
          setError('Error: ID de venta no encontrado');
          return;
        }
        onSuccess(saleData.venta);
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
      setPaymentMethod('efectivo_usd');
      setReceivedAmountUSD('');
      setReceivedAmountVES('');
      setError('');
      onClose();
    }
  };

  const requiresCashInput = paymentMethod.includes('efectivo');

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Payment color="primary" />
          Procesar Pago
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {/* Resumen de venta */}
          <Paper variant="outlined" sx={{ p: 2 }}>
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
                <Typography variant="h6">Total USD:</Typography>
                <Typography variant="h6" color="primary">
                  ${totals.totalUSD.toFixed(2)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total VES:</Typography>
                <Typography variant="h6" color="primary">
                  Bs {totals.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Método de pago */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Método de Pago</FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <Stack spacing={1} sx={{ mt: 1 }}>
                {paymentMethods.map((method) => (
                  <Paper
                    key={method.value}
                    variant="outlined"
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      border: paymentMethod === method.value ? 2 : 1,
                      borderColor: paymentMethod === method.value ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    <FormControlLabel
                      value={method.value}
                      control={<Radio />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          {method.icon}
                          {method.label}
                        </Box>
                      }
                    />
                  </Paper>
                ))}
              </Stack>
            </RadioGroup>
          </FormControl>

          {/* Entrada de montos para efectivo */}
          {requiresCashInput && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Monto Recibido
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Recibido USD"
                  type="number"
                  value={receivedAmountUSD}
                  onChange={(e) => setReceivedAmountUSD(e.target.value)}
                  inputProps={{ step: '0.01', min: '0' }}
                  InputProps={{
                    startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Recibido VES"
                  type="number"
                  value={receivedAmountVES}
                  onChange={(e) => setReceivedAmountVES(e.target.value)}
                  inputProps={{ step: '0.01', min: '0' }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>Bs</Typography>,
                  }}
                />

                {/* Mostrar cambio */}
                {(receivedAmountUSD || receivedAmountVES) && (
                  <Paper sx={{ p: 2, bgcolor: change.isValidPayment ? 'success.light' : 'error.light' }}>
                    <Typography variant="h6" gutterBottom>
                      Cambio a Devolver
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Cambio USD:</Typography>
                        <Typography fontWeight="bold">
                          ${change.changeUSD.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Cambio VES:</Typography>
                        <Typography fontWeight="bold">
                          Bs {change.changeVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      {!change.isValidPayment && (
                        <Typography variant="body2" color="error">
                          Monto insuficiente
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={loading || (requiresCashInput && !change.isValidPayment)}
          startIcon={loading ? <LoadingSpinner size={20} /> : <Payment />}
        >
          {loading ? 'Procesando...' : 'Confirmar Pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}