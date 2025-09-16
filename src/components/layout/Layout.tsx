import React, { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Chip, Avatar } from '@mui/material';
import { Logout, Person, AccessTime, CurrencyExchange } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { currentCashRegister, exchangeRate } = useCashRegister();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          {/* Logo y título */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema POS - Minisuper
          </Typography>

          {/* Información central */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 3 }}>
            {/* Tasa de cambio */}
            {exchangeRate?.usd_ves != null && (
              <Chip
                icon={<CurrencyExchange />}
                label={`USD/VES: ${exchangeRate.usd_ves.toLocaleString('es-VE', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}`}
                color="secondary"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
            )}

            {/* Estado de caja */}
            {currentCashRegister && (
              <Chip
                label={`Caja: ${currentCashRegister.caja.nombre}`}
                color="success"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
            )}

            {/* Fecha y hora */}
            <Chip
              icon={<AccessTime />}
              label={format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
          </Box>

          {/* Usuario */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              <Person />
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'white', lineHeight: 1 }}>
                {user?.nombre}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>
                {user?.rol === 'admin' ? 'Administrador' : 'Cajero'}
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={logout} title="Cerrar sesión">
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}