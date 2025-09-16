import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { cashRegisterService } from '../../services/cashRegisterService';
import { CashRegister } from '../../types';
import { Calculator, DollarSign } from 'lucide-react';

interface CashRegisterSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CashRegisterSetup({ isOpen, onClose, onSuccess }: CashRegisterSetupProps) {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [selectedCashRegister, setSelectedCashRegister] = useState<number | null>(null);
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
      const response = await cashRegisterService.getCashRegisters();
      if (response.success && response.data) {
        // Filtrar solo cajas cerradas
        const availableCashRegisters = response.data.filter(
          cashRegister => cashRegister.estado === 'cerrado'
        );
        setCashRegisters(availableCashRegisters);
      }
    } catch (error) {
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
        caja_id: selectedCashRegister,
        monto_inicial_usd: usdAmount,
        monto_inicial_ves: vesAmount,
        observaciones: observations || undefined
      });

      if (success) {
        onSuccess();
        onClose();
        // Reset form
        setSelectedCashRegister(null);
        setInitialAmountUSD('0');
        setInitialAmountVES('0');
        setObservations('');
      } else {
        setError('Error abriendo la caja');
      }
    } catch (error) {
      setError('Error abriendo la caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Abrir Caja Registradora" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Selección de caja */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar Caja
          </label>
          {loadingCashRegisters ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cashRegisters.map((cashRegister) => (
                <button
                  key={cashRegister.id}
                  type="button"
                  onClick={() => setSelectedCashRegister(cashRegister.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedCashRegister === cashRegister.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-500 text-white p-2 rounded">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {cashRegister.nombre}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Caja #{cashRegister.numero_caja}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!loadingCashRegisters && cashRegisters.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay cajas disponibles para abrir
            </p>
          )}
        </div>

        {/* Montos iniciales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto Inicial USD
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialAmountUSD}
                onChange={(e) => setInitialAmountUSD(e.target.value)}
                className="input pl-10"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto Inicial VES
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">
                Bs
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialAmountVES}
                onChange={(e) => setInitialAmountVES(e.target.value)}
                className="input pl-10"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Tasa de cambio actual */}
        {exchangeRate && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tasa de cambio actual:</strong> 1 USD = {exchangeRate.usd_ves.toLocaleString('es-VE', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })} VES
            </p>
          </div>
        )}

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observaciones (Opcional)
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            placeholder="Notas sobre la apertura de caja..."
          />
        </div>

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
            disabled={loading || !selectedCashRegister}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span>Abriendo...</span>
              </>
            ) : (
              <span>Abrir Caja</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}