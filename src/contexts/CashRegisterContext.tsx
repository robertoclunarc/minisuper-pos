import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
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

  const refreshStatus = async () => {
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
        // Si no hay error específico, asumir que no hay caja abierta
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
      
      // Si es error 404 o similar, significa que no hay caja abierta
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
  };

  const refreshExchangeRate = async () => {
    try {
      console.log('💱 Refreshing exchange rate...');
      const response = await currencyService.getCurrentRate();
      if (response.success && response.data) {
        dispatch({
          type: 'SET_EXCHANGE_RATE',
          payload: response.data
        });
        console.log('✅ Exchange rate updated:', response.data.usd_ves);
      }
    } catch (error) {
      console.error('❌ Error getting exchange rate:', error);
      // No bloquear por error de tasa de cambio
    }
  };

  const openCashRegister = async (data: any): Promise<boolean> => {
    try {
      console.log('🔓 Opening cash register with data:', data);
      const response = await cashRegisterService.openCashRegister(data);
      if (response.success && response.data) {
        dispatch({
          type: 'SET_CASH_REGISTER',
          payload: {
            isOpen: true,
            cashRegister: response.data,
          }
        });
        console.log('✅ Cash register opened successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error opening cash register:', error);
      return false;
    }
  };

  const closeCashRegister = async (data: any): Promise<boolean> => {
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
  };

  useEffect(() => {
    console.log('🚀 CashRegisterProvider mounted, initializing...');
    refreshStatus();
    refreshExchangeRate();
  }, []);

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