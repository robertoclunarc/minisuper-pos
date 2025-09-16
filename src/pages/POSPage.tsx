import React from 'react';
import { Layout } from '../components/layout/Layout';
import { POSInterface } from '../components/pos/POSInterface';
import { CashRegisterProvider } from '../contexts/CashRegisterContext';

export function POSPage() {
  return (
    <CashRegisterProvider>
      <Layout>
        <POSInterface />
      </Layout>
    </CashRegisterProvider>
  );
}