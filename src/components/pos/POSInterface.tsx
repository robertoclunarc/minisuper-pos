import React, { useState, useEffect } from 'react';
import { ProductSearch } from './ProductSearch';
import { Cart } from './Cart';
import { PaymentModal } from './PaymentModal';
import { CashRegisterSetup } from './CashRegisterSetup';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { Product, SaleItem } from '../../types';
import { saleService } from '../../services/saleService';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function POSInterface() {
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashSetup, setShowCashSetup] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { isOpen, currentCashRegister, loading } = useCashRegister();

  useEffect(() => {
    if (!loading && !isOpen) {
      setShowCashSetup(true);
    }
  }, [loading, isOpen]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const addProductToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.producto_id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.producto_id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prev, {
          producto_id: product.id,
          cantidad: 1,
          producto: product
        }];
      }
    });

    showNotification('success', `${product.nombre} agregado al carrito`);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.producto_id === productId
          ? { ...item, cantidad: quantity }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.producto_id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handlePaymentComplete = async (paymentData: any) => {
    try {
      if (!currentCashRegister) {
        throw new Error('No hay caja registradora abierta');
      }

      const saleData = {
        caja_id: currentCashRegister.caja_id,
        items: cartItems.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad
        })),
        ...paymentData
      };

      const response = await saleService.createSale(saleData);

      if (response.success) {
        showNotification('success', 'Venta completada exitosamente');
        setCartItems([]);
        setShowPaymentModal(false);
      } else {
        throw new Error(response.message || 'Error procesando la venta');
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Error completando la venta');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando sistema POS...</p>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Caja Registradora Cerrada
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Debes abrir una caja registradora para comenzar a vender
        </p>
        <button
          onClick={() => setShowCashSetup(true)}
          className="btn btn-primary"
        >
          Abrir Caja Registradora
        </button>
        
        <CashRegisterSetup
          isOpen={showCashSetup}
          onClose={() => setShowCashSetup(false)}
          onSuccess={() => {
            setShowCashSetup(false);
            showNotification('success', 'Caja abierta exitosamente');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificaciones */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Búsqueda de productos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Agregar Productos
        </h2>
        <ProductSearch onProductSelect={addProductToCart} />
      </div>

      {/* Carrito y controles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Cart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
          />
        </div>

        <div className="space-y-4">
          {/* Botones de acción */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Acciones
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cartItems.length === 0}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Procesar Pago
              </button>
              
              <button
                onClick={clearCart}
                disabled={cartItems.length === 0}
                className="w-full btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Limpiar Carrito
              </button>
            </div>
          </div>

          {/* Información de la caja */}
          {currentCashRegister && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                Caja Actual
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {currentCashRegister.caja.nombre}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Abierta desde: {new Date(currentCashRegister.fecha_apertura).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        items={cartItems}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}