import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import { AttachMoney, Store } from '@mui/icons-material';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { cashRegisterService } from '../../services/cashRegisterService';
import { CashRegister } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CashRegisterSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CashRegisterSetup({ isOpen, onClose, onSuccess }: CashRegisterSetupProps) {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [selectedCashRegister, setSelectedCashRegister] = useState<string>('');
  const [initialAmountUSD, setInitialAmountUSD] = useState<string>('0');
  const [initialAmountVES, setInitialAmountVES] = useState<string>('0');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCashRegisters, setLoadingCashRegisters] = useState(true);
  const [error, setError] = useState('');

  const { openCashRegister, exchangeRate } = useCashRegister();

  useEffect(() => {
    if (isOpen) {
      loadCashRegisters();
    }
  }, [isOpen]);

  const loadCashRegisters = async () => {
    try {
      setLoadingCashRegisters(true);
      console.log('🔄 Loading cash registers...');
      
      const response = await cashRegisterService.getCashRegisters();
      console.log('📊 Cash registers response:', response);
      
      if (response.success && response.data) {
        const availableCashRegisters = response.data.filter(
          cashRegister => cashRegister.estado === 'cerrado' || !cashRegister.estado
        );
        setCashRegisters(availableCashRegisters);
        console.log('✅ Available cash registers:', availableCashRegisters);
      }
    } catch (error) {
      console.error('❌ Error loading cash registers:', error);
      setError('Error cargando cajas registradoras');
    } finally {
      setLoadingCashRegisters(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCashRegister) {
      setError('Selecciona una caja registradora');
      return;
    }

    const usdAmount = parseFloat(initialAmountUSD);
    const vesAmount = parseFloat(initialAmountVES);

    if (isNaN(usdAmount) || usdAmount < 0) {
      setError('Monto inicial en USD debe ser un número válido');
      return;
    }

    if (isNaN(vesAmount) || vesAmount < 0) {
      setError('Monto inicial en VES debe ser un número válido');
      return;
    }

    try {
      setLoading(true);
      const success = await openCashRegister({
        caja_id: parseInt(selectedCashRegister),
        monto_inicial_usd: usdAmount,
        monto_inicial_ves: vesAmount,
        observaciones: observations || undefined
      });

      if (success) {
        onSuccess();
        onClose();
        setSelectedCashRegister('');
        setInitialAmountUSD('0');
        setInitialAmountVES('0');
        setObservations('');
      } else {
        setError('Error abriendo la caja');
      }
    } catch (error) {
      setError('Error abriendo la caja:' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Store color="primary" />
          Abrir Caja Registradora
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {/* Selección de caja */}
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Seleccionar Caja</FormLabel>
            {loadingCashRegisters ? (
              <Box display="flex" justifyContent="center" py={4}>
                <LoadingSpinner />
              </Box>
            ) : (
              <RadioGroup
                value={selectedCashRegister}
                onChange={(e) => setSelectedCashRegister(e.target.value)}
              >
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {cashRegisters.map((cashRegister) => (
                    <Card 
                      key={cashRegister.id}
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedCashRegister === cashRegister.id.toString() ? 2 : 1,
                        borderColor: selectedCashRegister === cashRegister.id.toString() ? 'primary.main' : 'divider',
                      }}
                      onClick={() => setSelectedCashRegister(cashRegister.id.toString())}
                    >
                      <CardContent>
                        <FormControlLabel
                          value={cashRegister.id.toString()}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {cashRegister.nombre}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Caja #{cashRegister.numero_caja}
                              </Typography>
                            </Box>
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </RadioGroup>
            )}
            {!loadingCashRegisters && cashRegisters.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No hay cajas disponibles para abrir
              </Alert>
            )}
          </FormControl>

          {/* Montos iniciales */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Monto Inicial USD"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={initialAmountUSD}
              onChange={(e) => setInitialAmountUSD(e.target.value)}
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              fullWidth
              label="Monto Inicial VES"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={initialAmountVES}
              onChange={(e) => setInitialAmountVES(e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>Bs</Typography>,
              }}
            />
          </Stack>

          {/* Tasa de cambio actual */}
          {exchangeRate?.usd_ves != null && (
            <Alert severity="info">
              <strong>Tasa de cambio actual:</strong> 1 USD = {exchangeRate.usd_ves.toLocaleString('es-VE', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })} VES
            </Alert>
          )}

          {/* Observaciones */}
          <TextField
            fullWidth
            label="Observaciones (Opcional)"
            multiline
            rows={3}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Notas sobre la apertura de caja..."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedCashRegister}
          startIcon={loading ? <LoadingSpinner size={20} /> : <Store />}
        >
          {loading ? 'Abriendo...' : 'Abrir Caja'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}