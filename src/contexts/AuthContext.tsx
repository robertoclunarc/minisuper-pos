import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState } from '../types';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state };
    case 'LOGIN_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [loading, setLoading] = React.useState(true);

  // ✅ useCallback para login
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login({ username, password });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        authService.setAuthData(user, token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });
        return true;
      }
      
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ useCallback para logout
  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // ✅ Verificar token almacenado solo una vez al montar
  useEffect(() => {
    console.log('🚀 AuthProvider mounted, checking stored token...');
    
    const checkStoredAuth = () => {
      const token = authService.getStoredToken();
      const user = authService.getStoredUser();
      
      if (token && user) {
        console.log('✅ Found stored auth data for user:', user.username);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });
      } else {
        console.log('ℹ️ No stored auth data found');
      }
      
      setLoading(false);
    };

    checkStoredAuth();
  }, []); // ✅ Solo una vez al montar

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}