import React from 'react';
import { User, LogOut, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Header() {
  const { user, logout } = useAuth();
  const { currentCashRegister, exchangeRate } = useCashRegister();
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <div className="bg-primary-500 text-white p-2 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sistema POS
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Minisuper
              </p>
            </div>
          </div>

          {/* Información central */}
          <div className="flex items-center space-x-6">
            {/* Tasa de cambio */}
            {exchangeRate?.usd_ves != null && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Tasa USD/VES</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  { exchangeRate.usd_ves.toLocaleString('es-VE', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
            )}

            {/* Estado de caja */}
            {currentCashRegister && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Caja Abierta</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {currentCashRegister.caja.nombre}
                </p>
                <p className="text-xs text-gray-400">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {format(new Date(currentCashRegister.fecha_apertura), 'HH:mm', { locale: es })}
                </p>
              </div>
            )}

            {/* Fecha y hora actual */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(), 'EEEE', { locale: es })}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {format(new Date(), 'dd/MM/yyyy')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(), 'HH:mm:ss')}
              </p>
            </div>
          </div>

          {/* Usuario y logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.nombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.rol}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}