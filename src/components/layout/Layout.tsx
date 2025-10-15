import React, { ReactNode } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Chip, 
  Avatar,
  Button,
  Menu,
  MenuItem,
  //Divider
} from '@mui/material';
import { 
  Logout, 
  Person, 
  AccessTime, 
  CurrencyExchange,
  Menu as MenuIcon,
  Assessment,
  Pallet,
  Inventory,
  PointOfSale,
  Category,
  Business,
  ExpandMore,
  Settings,
 // Dashboard
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { currentCashRegister, exchangeRate } = useCashRegister();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const [settingsMenuAnchor, setSettingsMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
  };

  const isSettingsPath = () => {
    return ['/categories', '/providers', '/currency'].includes(location.pathname);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          {/* Logo y navegación */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ mr: 3 }}>
              Sistem POS
            </Typography>

            {/* Menú de navegación para pantallas grandes */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button
                color="inherit"
                startIcon={<PointOfSale />}
                onClick={() => navigateTo('/pos')}
                variant={isCurrentPath('/pos') ? 'outlined' : 'text'}
                sx={{ 
                  borderColor: isCurrentPath('/pos') ? 'white' : 'transparent',
                  color: 'white'
                }}
              >
                POS
              </Button>
              <Button
                  color="inherit"
                  startIcon={<Settings />}
                  endIcon={<ExpandMore />}
                  onClick={handleSettingsMenuOpen}
                  variant={isSettingsPath() ? 'outlined' : 'text'}
                  sx={{ 
                    borderColor: isSettingsPath() ? 'white' : 'transparent',
                    color: 'white'
                  }}
                >
                  Config.
                </Button>
                <Menu
                  anchorEl={settingsMenuAnchor}
                  open={Boolean(settingsMenuAnchor)}
                  onClose={handleSettingsMenuClose}
                >
                  <MenuItem onClick={() => navigateTo('/categories')}>
                    <Category sx={{ mr: 2 }} />
                    Categories
                  </MenuItem>
                  <MenuItem onClick={() => navigateTo('/providers')}>
                    <Business sx={{ mr: 2 }} />
                    Providers
                  </MenuItem>
                  <MenuItem onClick={() => navigateTo('/currency')}>
                    <CurrencyExchange sx={{ mr: 2 }} />
                    Currency
                  </MenuItem>
                </Menu>
              <Button
                color="inherit"
                startIcon={<Assessment />}
                onClick={() => navigateTo('/reports')}
                variant={isCurrentPath('/reports') ? 'outlined' : 'text'}
                sx={{ 
                  borderColor: isCurrentPath('/reports') ? 'white' : 'transparent',
                  color: 'white'
                }}
              >
                Reports
              </Button>
              <Button
                color="inherit"
                startIcon={<Pallet />}
                onClick={() => navigateTo('/products')}
                variant={isCurrentPath('/products') ? 'outlined' : 'text'}
                sx={{ 
                  borderColor: isCurrentPath('/products') ? 'white' : 'transparent',
                  color: 'white'
                }}
              >
                Products
              </Button>
              <Button
                color="inherit"
                startIcon={<Inventory />}
                onClick={() => navigateTo('/inventory')}
                variant={isCurrentPath('/inventory') ? 'outlined' : 'text'}
                sx={{ 
                  borderColor: isCurrentPath('/inventory') ? 'white' : 'transparent',
                  color: 'white'
                }}
              >
                Inventary
              </Button>
            </Box>

            {/* Menú hamburguesa para móviles */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => navigateTo('/pos')}>
                  <PointOfSale sx={{ mr: 2 }} />
                  POS
                </MenuItem>
                <MenuItem onClick={() => navigateTo('/currency')}>
                  <CurrencyExchange sx={{ mr: 2 }} />
                  Tasas
                </MenuItem>
                <MenuItem onClick={() => navigateTo('/categories')}>
                  <Assessment sx={{ mr: 2 }} />
                  Categorias
                </MenuItem>
                <MenuItem onClick={() => navigateTo('/providers')}>
                  <Assessment sx={{ mr: 2 }} />
                  Proveedores
                </MenuItem>
                <MenuItem onClick={() => navigateTo('/reports')}>
                  <Assessment sx={{ mr: 2 }} />
                  Reportes
                </MenuItem>
                <MenuItem onClick={() => navigateTo('/products')}>
                  <Pallet sx={{ mr: 2 }} />
                  Productos
                </MenuItem>
                <MenuItem onClick={() => navigateTo('/inventory')}>
                  <Inventory sx={{ mr: 2 }} />
                  Inventario
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Información central */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 3 }}>
            
            {exchangeRate && exchangeRate.usd_ves && (
              <Chip
                icon={<CurrencyExchange />}
                label={`USD/VES: ${Number(exchangeRate.usd_ves).toLocaleString('es-VE', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}`}
                color="secondary"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
                size="small"
              />
            )} 

            {/* Estado de caja */}
            {currentCashRegister && currentCashRegister.caja && (
              <Chip
                label={`Caja: ${currentCashRegister.caja.nombre}`}
                color="success"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
                size="small"
              />
            )}

            {/* Fecha y hora */}
            <Chip
              icon={<AccessTime />}
              label={format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
              size="small"
            />
          </Box>

          {/* Usuario */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              <Person />
            </Avatar>
            
            {/* ✅ VERIFICAR QUE user EXISTE ANTES DE USARLO */}
            {user && (
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ color: 'white', lineHeight: 1 }}>
                  {user.nombre || 'Usuario'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>
                  {user.rol === 'admin' ? 'Administrador' : 'Cajero'}
                </Typography>
              </Box>
            )}
            
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