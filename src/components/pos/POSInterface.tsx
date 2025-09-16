import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  ShoppingCart,
  Payment,
  Receipt,
  Close,
} from '@mui/icons-material';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { Product, SaleItem, Sale } from '../../types';
import { ProductSearch } from './ProductSearch';
import { SaleCart } from './SaleCart';
import { PaymentDialog } from './PaymentDialog';
import { ReceiptDialog } from './ReceiptDialog';
import { CloseCashRegisterDialog } from './CloseCashRegisterDialog';

export function POSInterface() {
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showCloseCashDialog, setShowCloseCashDialog] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [error, setError] = useState('');

  const { currentCashRegister, exchangeRate } = useCashRegister();

  // Calcular totales del carrito
  const cartTotals = React.useMemo(() => {
    const subtotalUSD = cartItems.reduce((total, item) => {
      const price = item.producto?.precio_venta_usd || 0;
      return total + (price * item.cantidad);
    }, 0);

    const rate = exchangeRate?.usd_ves || 1;
    const subtotalVES = subtotalUSD * rate;

    // IVA 16%
    const taxRate = 0.16;
    const impuestoUSD = subtotalUSD * taxRate;
    const impuestoVES = subtotalVES * taxRate;

    const totalUSD = subtotalUSD + impuestoUSD;
    const totalVES = subtotalVES + impuestoVES;

    return {
      subtotalUSD,
      subtotalVES,
      impuestoUSD,
      impuestoVES,
      totalUSD,
      totalVES,
      itemCount: cartItems.reduce((total, item) => total + item.cantidad, 0)
    };
  }, [cartItems, exchangeRate]);

  const handleAddProduct = (product: Product, quantity: number = 1) => {
    setError('');
    
    // Verificar stock disponible
    if (product.stock_actual !== undefined && product.stock_actual < quantity) {
      setError(`Stock insuficiente. Disponible: ${product.stock_actual}`);
      return;
    }

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.producto_id === product.id);
      
      if (existingItemIndex >= 0) {
        // Actualizar cantidad del producto existente
        const newItems = [...prevItems];
        const newQuantity = newItems[existingItemIndex].cantidad + quantity;
        
        // Verificar stock al agregar más cantidad
        if (product.stock_actual !== undefined && product.stock_actual < newQuantity) {
          setError(`Stock insuficiente. Disponible: ${product.stock_actual}`);
          return prevItems;
        }
        
        newItems[existingItemIndex].cantidad = newQuantity;
        return newItems;
      } else {
        // Agregar nuevo producto
        return [...prevItems, {
          producto_id: product.id,
          cantidad: quantity,
          producto: product
        }];
      }
    });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.producto_id === productId) {
          // Verificar stock
          if (item.producto?.stock_actual !== undefined && item.producto.stock_actual < newQuantity) {
            setError(`Stock insuficiente. Disponible: ${item.producto.stock_actual}`);
            return item;
          }
          return { ...item, cantidad: newQuantity };
        }
        return item;
      })
    );
    setError('');
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.producto_id !== productId));
    setError('');
  };

  const handleClearCart = () => {
    setCartItems([]);
    setError('');
  };

  const handlePaymentSuccess = (sale: Sale) => {
    setCompletedSale(sale);
    setCartItems([]);
    setShowPaymentDialog(false);
    setShowReceiptDialog(true);
    setError('');
  };

  const handlePrintReceipt = () => {
    // Implementar impresión del recibo
    window.print();
  };

  const canProcessSale = cartItems.length > 0 && currentCashRegister;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Panel izquierdo - Búsqueda y productos */}
        {/*<Grid xs={12} md={8}>*/}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Stack spacing={3}>
            {/* Búsqueda de productos */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Buscar Productos
                </Typography>
                <ProductSearch onProductSelect={handleAddProduct} />
              </CardContent>
            </Card>

            {/* Información de la caja */}
            {currentCashRegister && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información de Caja
                  </Typography>
                  <Grid container spacing={2}>
                    <Stack spacing={3}>
                      <Typography variant="body2" color="textSecondary">
                        Caja Actual
                      </Typography>
                      <Typography variant="h6">
                        {currentCashRegister.caja.nombre}
                      </Typography>
                    </Stack>
                    <Stack spacing={3}>
                      <Typography variant="body2" color="textSecondary">
                        Hora de Apertura
                      </Typography>
                      <Typography variant="h6">
                        {new Date(currentCashRegister.fecha_apertura).toLocaleTimeString()}
                      </Typography>
                    </Stack>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Stack>  
        {/*</Grid>*/}

        {/* Panel derecho - Carrito y acciones */}
        <Grid container spacing={2}>
          <Stack spacing={3}>
            {/* Carrito de compras */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <ShoppingCart />
                  Carrito de Compras
                  {cartTotals.itemCount > 0 && (
                    <Typography variant="body2" color="primary">
                      ({cartTotals.itemCount} items)
                    </Typography>
                  )}
                </Typography>
                
                <SaleCart
                  items={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  exchangeRate={exchangeRate?.usd_ves || 1}
                />
              </CardContent>
            </Card>

            {/* Totales */}
            {cartItems.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen de Venta
                  </Typography>
                  
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Subtotal USD:</Typography>
                      <Typography fontWeight="bold">
                        ${cartTotals.subtotalUSD.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Subtotal VES:</Typography>
                      <Typography fontWeight="bold">
                        Bs {cartTotals.subtotalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">
                        IVA (16%):
                      </Typography>
                      <Typography variant="body2">
                        ${cartTotals.impuestoUSD.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Total USD:</Typography>
                      <Typography variant="h6" color="primary" className="pos-number">
                        ${cartTotals.totalUSD.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Total VES:</Typography>
                      <Typography variant="h6" color="primary" className="pos-number">
                        Bs {cartTotals.totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Errores */}
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Acciones */}
            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                disabled={!canProcessSale}
                onClick={() => setShowPaymentDialog(true)}
                startIcon={<Payment />}
                fullWidth
              >
                Procesar Pago
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setShowCloseCashDialog(true)}
                startIcon={<Close />}
                fullWidth
              >
                Cerrar Caja
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      {/* Diálogos */}
      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        cartItems={cartItems}
        totals={cartTotals}
        exchangeRate={exchangeRate?.usd_ves || 1}
        onSuccess={handlePaymentSuccess}
      />

      <ReceiptDialog
        open={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        sale={completedSale}
        onPrint={handlePrintReceipt}
      />

      <CloseCashRegisterDialog
        open={showCloseCashDialog}
        onClose={() => setShowCloseCashDialog(false)}
      />
    </Box>
  );
}