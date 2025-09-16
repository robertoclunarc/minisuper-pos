import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCartOutlined,
  Clear,
} from '@mui/icons-material';
import { SaleItem } from '../../types';

interface SaleCartProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  exchangeRate: number;
}

export function SaleCart({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  exchangeRate 
}: SaleCartProps) {
  
  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <ShoppingCartOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Carrito vacío
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Busca productos para agregar a la venta
        </Typography>
      </Box>
    );
  }

  const handleQuantityChange = (productId: number, newQuantity: string) => {
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity >= 0) {
      onUpdateQuantity(productId, quantity);
    }
  };

  return (
    <Box>
      {/* Header con botón limpiar carrito */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="textSecondary">
          {items.length} producto{items.length !== 1 ? 's' : ''}
        </Typography>
        <Button
          size="small"
          startIcon={<Clear />}
          onClick={onClearCart}
          color="error"
          variant="outlined"
        >
          Limpiar
        </Button>
      </Stack>

      {/* Lista de productos */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        <Stack spacing={1}>
          {items.map((item) => {
            const product = item.producto!;
            const unitPriceUSD = product.precio_venta_usd;
            const unitPriceVES = unitPriceUSD * exchangeRate;
            const subtotalUSD = unitPriceUSD * item.cantidad;
            const subtotalVES = unitPriceVES * item.cantidad;

            return (
              <Paper
                key={item.producto_id}
                variant="outlined"
                sx={{ p: 2 }}
              >
                <Stack spacing={2}>
                  {/* Información del producto */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {product.nombre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {product.codigo_barras}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        ${unitPriceUSD.toFixed(2)} USD
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Bs {unitPriceVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Controles de cantidad */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.producto_id, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                      >
                        <Remove />
                      </IconButton>
                      
                      <TextField
                        size="small"
                        value={item.cantidad}
                        onChange={(e) => handleQuantityChange(item.producto_id, e.target.value)}
                        inputProps={{
                          style: { textAlign: 'center', width: '60px' },
                          min: 1,
                          max: product.stock_actual || 999
                        }}
                        type="number"
                      />
                      
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.producto_id, item.cantidad + 1)}
                        disabled={product.stock_actual !== undefined && item.cantidad >= product.stock_actual}
                      >
                        <Add />
                      </IconButton>
                    </Stack>

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveItem(item.producto_id)}
                    >
                      <Delete />
                    </IconButton>
                  </Stack>

                  {/* Subtotales */}
                  <Box>
                    <Divider sx={{ mb: 1 }} />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" fontWeight="bold">
                        Subtotal:
                      </Typography>
                      <Stack alignItems="flex-end">
                        <Typography variant="body2" fontWeight="bold">
                          ${subtotalUSD.toFixed(2)} USD
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Bs {subtotalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}