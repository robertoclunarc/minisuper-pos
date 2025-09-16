import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import { Layout } from '../components/layout/Layout';
import { CashRegisterSetup } from '../components/pos/CashRegisterSetup';
import { POSInterface } from '../components/pos/POSInterface';
import { useCashRegister } from '../contexts/CashRegisterContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function POSPage() {
  const [showCashSetup, setShowCashSetup] = useState(false);
  const { isOpen, loading, refreshStatus } = useCashRegister();

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (!loading && !isOpen) {
      setShowCashSetup(true);
    }
  }, [loading, isOpen]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Verificando estado de caja..." />;
  }

  return (
    <Layout>
      <Container maxWidth="xl">
        {isOpen ? (
          <POSInterface />
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            minHeight="60vh"
          >
            <CashRegisterSetup
              isOpen={showCashSetup}
              onClose={() => setShowCashSetup(false)}
              onSuccess={() => {
                setShowCashSetup(false);
                refreshStatus();
              }}
            />
          </Box>
        )}
      </Container>
    </Layout>
  );
}