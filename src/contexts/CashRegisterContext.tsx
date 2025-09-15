import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CashRegisterClose, ExchangeRate } from '../types';
import { cashRegisterService } from '../services/cashRegisterService';
import { currencyService } from '../services/currencyService';

interface CashRegisterState {
  isOpen: boolean;
  currentCashRegister: CashRegisterClose | null;
  exchangeRate: ExchangeRate | null;
  loading: boolean;
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
  | { type: 'CLOSE_CASH_REGISTER' };

const initialState: CashRegisterState = {
  isOpen: false,
  currentCashRegister: null,
  exchangeRate: null,
  loading: true,
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
      };
    case 'SET_EXCHANGE_RATE':
      return { ...state, exchangeRate: action.payload };
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
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cashRegisterService.getCashRegisterStatus();
      
      if (response.success && response.data) {
        dispatch({
          type: 'SET_CASH_REGISTER',
          payload: {
            isOpen: response.data.is_open,
            cashRegister: response.data.cash_register,
          }
        });
      }
    } catch (error) {
      console.error('Error getting cash register status:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshExchangeRate = async () => {
    try {
      const response = await currencyService.getCurrentRate();
      if (response.success && response.data) {
        dispatch({
          type: 'SET_EXCHANGE_RATE',
          payload: response.data
        });
      }
    } catch (error) {
      console.error('Error getting exchange rate:', error);
    }
  };

  const openCashRegister = async (data: any): Promise<boolean> => {
    try {
      const response = await cashRegisterService.openCashRegister(data);
      if (response.success && response.data) {
        dispatch({
          type: 'SET_CASH_REGISTER',
          payload: {
            isOpen: true,
            cashRegister: response.data,
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opening cash register:', error);
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
      console.error('Error closing cash register:', error);
      return false;
    }
  };

  useEffect(() => {
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