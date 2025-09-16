import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { SaleItem } from '../../types';
import { CreditCard, DollarSign, Calculator } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SaleItem[];
  onPaymentComplete: (paymentData: any) => void;
}

export function PaymentModal({ isOpen, onClose, items, onPaymentComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo_usd');
  const [receivedAmountUSD, setReceivedAmountUSD] = useState<string>('');
  const [receivedAmountVES, setReceivedAmountVES] = useState<string>('');
  const [discountUSD, setDiscountUSD] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { exchangeRate } = useCashRegister();

  const calculateTotals = () => {
    const subtotalUSD = items.reduce((total, item) => {
      return total + (item.producto?.precio_venta_usd || 0) * item.cantidad;
    }, 0);

    const subtotalVES = subtotalUSD * (exchangeRate?.usd_ves || 1);
    const discountAmountUSD = parseFloat(discountUSD) || 0;
    const discountAmountVES = discountAmountUSD * (exchangeRate?.usd_ves || 1);
    const subtotalAfterDiscountUSD = subtotalUSD - discountAmountUSD;
    const subtotalAfterDiscountVES = subtotalVES - discountAmountVES;
    const taxRate = 0.16;
    const taxUSD = subtotalAfterDiscountUSD * taxRate;
    const taxVES = subtotalAfterDiscountVES * taxRate;
    const totalUSD = subtotalAfterDiscountUSD + taxUSD;
    const totalVES = subtotalAfterDiscountVES + taxVES;

    return {
      subtotalUSD,
      subtotalVES,
      discountAmountUSD,
      discountAmountVES,
      taxUSD,
      taxVES,
      totalUSD,
      totalVES
    };
  };

  const totals = calculateTotals();

  const calculateChange = () => {
    const receivedUSD = parseFloat(receivedAmountUSD) || 0;
    const receivedVES = parseFloat(receivedAmountVES) || 0;
    const totalReceivedUSD = receivedUSD + (receivedVES / (exchangeRate?.usd_ves || 1));
    const changeUSD = totalReceivedUSD - totals.totalUSD;
    const changeVES = changeUSD * (exchangeRate?.usd_ves || 1);

    return {
      changeUSD: Math.max(0, changeUSD),
      changeVES: Math.max(0, changeVES),
      sufficient: totalReceivedUSD >= totals.totalUSD
    };
  };

  const change = calculateChange();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (paymentMethod.includes('efectivo') && !change.sufficient) {
      setError('El monto recibido es insuficiente');
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        metodo_pago: paymentMethod,
        monto_recibido_usd: parseFloat(receivedAmountUSD) || 0,
        monto_recibido_ves: parseFloat(receivedAmountVES) || 0,
        descuento_usd: parseFloat(discountUSD) || 0,
        descuento_ves: (parseFloat(discountUSD) || 0) * (exchangeRate?.usd_ves || 1)
      };

      await onPaymentComplete(paymentData);
    } catch (error) {
      setError('Error procesando el pago');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'efectivo_usd', name: 'Efectivo USD', icon: DollarSign },
    { id: 'efectivo_ves', name: 'Efectivo VES', icon: DollarSign },
    { id: 'tarjeta', name: 'Tarjeta', icon: CreditCard },
    { id: 'transferencia', name: 'Transferencia', icon: Calculator },
    { id: 'pago_movil', name: 'Pago Móvil', icon: Calculator },
    { id: 'mixto', name: 'Mixto', icon: Calculator }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Procesar Pago" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Resumen de totales */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Resumen de la venta</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totals.subtotalUSD.toFixed(2)} USD</span>
            </div>
            {totals.discountAmountUSD > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento:</span>
                <span>-${totals.discountAmountUSD.toFixed(2)} USD</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>IVA (16%):</span>
              <span>${totals.taxUSD.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300 dark:border-gray-600">
              <span>Total:</span>
              <span className="text-primary-600 dark:text-primary-400">
                ${totals.totalUSD.toFixed(2)} USD
              </span>
            </div>
            <div className="text-center text-gray-600 dark:text-gray-400">
              Bs {totals.totalVES.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    paymentMethod === method.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium">{method.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Descuento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descuento (USD)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max={totals.subtotalUSD}
            value={discountUSD}
            onChange={(e) => setDiscountUSD(e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </div>

        {/* Montos recibidos para efectivo */}
        {paymentMethod.includes('efectivo') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recibido en USD
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={receivedAmountUSD}
                onChange={(e) => setReceivedAmountUSD(e.target.value)}
                className="input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recibido en VES
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={receivedAmountVES}
                onChange={(e) => setReceivedAmountVES(e.target.value)}
                className="input"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Cambio */}
        {paymentMethod.includes('efectivo') && (parseFloat(receivedAmountUSD) > 0 || parseFloat(receivedAmountVES) > 0) && (
          <div className={`p-4 rounded-lg ${change.sufficient ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <h4 className={`font-medium mb-2 ${change.sufficient ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {change.sufficient ? 'Cambio a devolver:' : 'Monto insuficiente'}
            </h4>
            {change.sufficient && (
              <div className="space-y-1">
                <p className="text-green-700 dark:text-green-300">
                  ${change.changeUSD.toFixed(2)} USD
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Bs {change.changeVES.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center space-x-2"
            disabled={loading || (paymentMethod.includes('efectivo') && !change.sufficient)}
          >
            {loading ? (
              <>
                <LoadingSpinner size={16} />
                <span>Procesando...</span>
              </>
            ) : (
              <span>Completar Venta</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}