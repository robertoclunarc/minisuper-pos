import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { Close, Schedule } from '@mui/icons-material';

interface CloseCashRegisterDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CloseCashRegisterDialog({ open, onClose }: CloseCashRegisterDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Close color="primary" />
          Cerrar Caja Registradora
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" icon={<Schedule />}>
          <Typography variant="body1" gutterBottom>
            Función en desarrollo
          </Typography>
          <Typography variant="body2">
            El módulo de cierre de caja se implementará en la siguiente fase.
            Por ahora, la caja permanecerá abierta hasta que se implemente esta funcionalidad.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}