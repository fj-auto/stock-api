import React from 'react';
import { ThemeProvider } from './context/ThemeProvider';
import { StockProvider } from './context/StockContext';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <StockProvider>
        <AppRoutes />
      </StockProvider>
    </ThemeProvider>
  );
};

export default App;
