// src/context/StockContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StockContextType {
  watchlist: string[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
}

const StockContext = createContext<StockContextType>({
  watchlist: [],
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isInWatchlist: () => false,
});

export const useStockContext = () => useContext(StockContext);

interface StockProviderProps {
  children: ReactNode;
}

export const StockProvider: React.FC<StockProviderProps> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // 初始化加载自选股列表
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('stock-watchlist');
    if (savedWatchlist) {
      try {
        const parsed = JSON.parse(savedWatchlist);
        if (Array.isArray(parsed)) {
          setWatchlist(parsed);
        }
      } catch (error) {
        console.error('Failed to parse watchlist from localStorage', error);
      }
    }
  }, []);

  // 保存自选股列表
  useEffect(() => {
    localStorage.setItem('stock-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.includes(symbol);
  };

  return (
    <StockContext.Provider
      value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}
    >
      {children}
    </StockContext.Provider>
  );
};
