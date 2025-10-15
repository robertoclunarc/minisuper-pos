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
import { ReportsPage } from './pages/ReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { CurrencyPage } from './pages/CurrencyPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProvidersPage } from './pages/ProvidersPage';

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
            <CashRegisterProvider>
              <POSPage />
            </CashRegisterProvider>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/currency" 
        element={
          isAuthenticated ? (
            <CashRegisterProvider>
              <CurrencyPage />
            </CashRegisterProvider>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/reports" 
        element={
          isAuthenticated ? (
            <CashRegisterProvider>
              <ReportsPage />
            </CashRegisterProvider>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/products" 
        element={
          isAuthenticated ? (
            <CashRegisterProvider>
              <ProductsPage />
            </CashRegisterProvider>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/categories" 
        element={
          isAuthenticated ? (
            <CashRegisterProvider>
              <CategoriesPage />
            </CashRegisterProvider>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      
      <Route 
        path="/providers" 
        element={
          isAuthenticated ? (
            <CashRegisterProvider>
              <ProvidersPage />
            </CashRegisterProvider>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      <Route 
        path="/inventory" 
        element={
          isAuthenticated ? (
            <CashRegisterProvider>
              <InventoryPage />
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