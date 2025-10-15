import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { CashRegisterClose, ExchangeRate } from '../types';
import { cashRegisterService } from '../services/cashRegisterService';
import { currencyService } from '../services/currencyService';

interface CashRegisterState {
  isOpen: boolean;
  currentCashRegister: CashRegisterClose | null;
  exchangeRate: ExchangeRate | null;
  loading: boolean;
  error: string | null;
}

interface CashRegisterContextType extends CashRegisterState {
  openCashRegister: (data: any) => Promise<boolean>;
  closeCashRegister: (data: any) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  refreshExchangeRate: () => Promise<void>;
}

const CashRegisterContext = createContext<CashRegisterContextType | undefined>(undefined);

type CashRegisterAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CASH_REGISTER'; payload: { isOpen: boolean; cashRegister: CashRegisterClose | null } }
  | { type: 'SET_EXCHANGE_RATE'; payload: ExchangeRate }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLOSE_CASH_REGISTER' };

const initialState: CashRegisterState = {
  isOpen: false,
  currentCashRegister: null,
  exchangeRate: null,
  loading: true,
  error: null,
};

function cashRegisterReducer(state: CashRegisterState, action: CashRegisterAction): CashRegisterState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CASH_REGISTER':
      return {
        ...state,
        isOpen: action.payload.isOpen,
        currentCashRegister: action.payload.cashRegister,
        loading: false,
        error: null,
      };
    case 'SET_EXCHANGE_RATE':
      return { ...state, exchangeRate: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLOSE_CASH_REGISTER':
      return {
        ...state,
        isOpen: false,
        currentCashRegister: null,
      };
    default:
      return state;
  }
}

interface CashRegisterProviderProps {
  children: ReactNode;
}

export function CashRegisterProvider({ children }: CashRegisterProviderProps) {
  const [state, dispatch] = useReducer(cashRegisterReducer, initialState);
  
  const refreshStatus = useCallback(async () => {
    try {
      console.log('🔄 Refreshing cash register status...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await cashRegisterService.getCashRegisterStatus();
      console.log('📊 Cash register response:', response);
      
      if (response.success && response.data) {
        dispatch({
          type: 'SET_CASH_REGISTER',
          payload: {
            isOpen: response.data.is_open,
            cashRegister: response.data.cash_register,
          }
        });
        console.log('✅ Cash register status updated:', response.data.is_open);
      } else {
        dispatch({
          type: 'SET_CASH_REGISTER',
          payload: {
            isOpen: false,
            cashRegister: null,
          }
        });
        console.log('ℹ️ No open cash register found');
      }
    } catch (error: any) {
      console.error('❌ Error getting cash register status:', error);
      
      if (error.response?.status === 404 || error.response?.status === 400) {
        dispatch({
          type: 'SET_CASH_REGISTER',
          payload: {
            isOpen: false,
            cashRegister: null,
          }
        });
      } else {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Error al verificar estado de caja' 
        });
      }
    }
  }, []);

  // ✅ MEJORAR refreshExchangeRate con validaciones
  const refreshExchangeRate = useCallback(async () => {
    try {
      console.log('💱 Refreshing exchange rate...');
      const response = await currencyService.getCurrentRate();
      
      if (response.success && response.data) {
        // ✅ VALIDAR QUE LOS DATOS SEAN CORRECTOS
        const exchangeRateData = {
          ...response.data,
          usd_ves: Number(response.data.tasa_bcv) || 1 // Asegurar que sea un número válido
        };
        
        dispatch({
          type: 'SET_EXCHANGE_RATE',
          payload: exchangeRateData
        });
        console.log('✅ Exchange rate updated:', exchangeRateData.tasa_bcv);
      } else {
        console.warn('⚠️ No exchange rate data received, using default rate');
        // Usar tasa por defecto si no hay datos
        dispatch({
          type: 'SET_EXCHANGE_RATE',
          payload: {
            id: 0,
            fecha: new Date().toISOString().split('T')[0],
            tasa_bcv: 1,
            tasa_paralelo: 1,
            usd_ves: 1,
            fuente: 'default',
            created_at: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('❌ Error getting exchange rate:', error);
      // ✅ En caso de error, usar tasa por defecto para evitar crashes
      dispatch({
        type: 'SET_EXCHANGE_RATE',
        payload: {
          id: 0,
          fecha: new Date().toISOString().split('T')[0],
          tasa_bcv: 1,
          tasa_paralelo: 1,
          usd_ves: 1,
          fuente: 'error-fallback',
          created_at: new Date().toISOString()
        }
      });
    }
  }, []);

  const openCashRegister = useCallback(async (data: any): Promise<boolean> => {
    try {
      console.log('🔓 Frontend: Opening cash register with data:', data);
      console.log('🔑 Frontend: Current token:', localStorage.getItem('token'));
      console.log('👤 Frontend: Current user:', JSON.parse(localStorage.getItem('user') || '{}'));
      
      const response = await cashRegisterService.openCashRegister(data);
      if (response.success && response.data) {
        dispatch({
          type: 'SET_CASH_REGISTER',
          payload: {
            isOpen: true,
            cashRegister: response.data,
          }
        });
        console.log('✅ Frontend: Cash register opened successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('❌ Frontend: Error opening cash register:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      return false;
    }
  }, []);

  const closeCashRegister = useCallback(async (data: any): Promise<boolean> => {
    try {
      const response = await cashRegisterService.closeCashRegister(data);
      if (response.success) {
        dispatch({ type: 'CLOSE_CASH_REGISTER' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error closing cash register:', error);
      return false;
    }
  }, []);

  // ✅ useEffect que se ejecuta solo una vez al montar
  useEffect(() => {
    console.log('🚀 CashRegisterProvider mounted, initializing...');
    
    // ✅ Ejecutar ambas funciones en paralelo y solo una vez
    const initialize = async () => {
      await Promise.allSettled([
        refreshStatus(),
        refreshExchangeRate()
      ]);
    };

    initialize();
  }, []); // ✅ Array de dependencias vacío = solo una vez

  const value: CashRegisterContextType = {
    ...state,
    openCashRegister,
    closeCashRegister,
    refreshStatus,
    refreshExchangeRate,
  };

  return (
    <CashRegisterContext.Provider value={value}>
      {children}
    </CashRegisterContext.Provider>
  );
}

export function useCashRegister(): CashRegisterContextType {
  const context = useContext(CashRegisterContext);
  if (context === undefined) {
    throw new Error('useCashRegister must be used within a CashRegisterProvider');
  }
  return context;
}