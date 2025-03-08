// src/routes/AppRoutes.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import StockDetailPage from '../pages/StockDetailPage';
import MarketOverviewPage from '../pages/MarketOverviewPage';
import { StockProvider } from '../context/StockContext';
import { ThemeProvider } from '../context/ThemeProvider';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <StockProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="market" element={<MarketOverviewPage />} />
              <Route path="stock/:symbol" element={<StockDetailPage />} />
              <Route path="search" element={<HomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </StockProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
