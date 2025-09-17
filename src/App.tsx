import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CashRegisterProvider } from './contexts/CashRegisterContext';
import { theme } from './theme/theme';
import { LoginPage } from './pages/LoginPage';
import { POSPage } from './pages/POSPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando aplicación..." />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/pos" />} 
      />
      <Route 
        path="/pos" 
        element={
          isAuthenticated ? (
            // ✅ SOLO cargar CashRegisterProvider cuando esté autenticado
            <CashRegisterProvider>
              <POSPage />
            </CashRegisterProvider>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/pos" : "/login"} />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;