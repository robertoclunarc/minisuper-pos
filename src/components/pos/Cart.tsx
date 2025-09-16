import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { SaleItem } from '../../types';
import { useCashRegister } from '../../contexts/CashRegisterContext';

interface CartProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onClearCart }: CartProps) {
  const { exchangeRate } = useCashRegister();

  const calculateTotals = () => {
    const subtotalUSD = items.reduce((total, item) => {
      return total + (item.producto?.precio_venta_usd || 0) * item.cantidad;
    }, 0);

    const subtotalVES = subtotalUSD * (exchangeRate?.usd_ves || 1);
    const taxRate = 0.16; // 16% IVA
    const taxUSD = subtotalUSD * taxRate;
    const taxVES = subtotalVES * taxRate;
    const totalUSD = subtotalUSD + taxUSD;
    const totalVES = subtotalVES + taxVES;

    return {
      subtotalUSD,
      subtotalVES,
      taxUSD,
      taxVES,
      totalUSD,
      totalVES
    };
  };

  const totals = calculateTotals();

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="text-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            El carrito está vacío
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Busca productos para agregar a la venta
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg">
      {/* Header del carrito */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Carrito ({items.length} {items.length === 1 ? 'producto' : 'productos'})
        </h3>
        <button
          onClick={onClearCart}
          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm"
        >
          Limpiar todo
        </button>
      </div>

      {/* Items del carrito */}
      <div className="max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div key={item.producto_id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {item.producto?.nombre}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.producto?.codigo_barras}
                </p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  ${item.producto?.precio_venta_usd?.toFixed(2)} USD
                </p>
              </div>
              <button
                onClick={() => onRemoveItem(item.producto_id)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Controles de cantidad */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateQuantity(item.producto_id, Math.max(1, item.cantidad - 1))}
                  className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.producto_id, item.cantidad + 1)}
                  className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Subtotal del item */}
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  ${((item.producto?.precio_venta_usd || 0) * item.cantidad).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bs {((item.producto?.precio_venta_usd || 0) * item.cantidad * (exchangeRate?.usd_ves || 1)).toLocaleString('es-VE', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <div className="text-right">
              <div>${totals.subtotalUSD.toFixed(2)} USD</div>
              <div className="text-xs text-gray-500">
                Bs {totals.subtotalVES.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">IVA (16%):</span>
            <div className="text-right">
              <div>${totals.taxUSD.toFixed(2)} USD</div>
              <div className="text-xs text-gray-500">
                Bs {totals.taxVES.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
            <span className="text-gray-900 dark:text-white">Total:</span>
            <div className="text-right">
              <div className="text-primary-600 dark:text-primary-400">
                ${totals.totalUSD.toFixed(2)} USD
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Bs {totals.totalVES.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}