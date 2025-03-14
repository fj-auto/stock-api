import React, { ReactNode } from 'react';
interface StockContextType {
    watchlist: string[];
    addToWatchlist: (symbol: string) => void;
    removeFromWatchlist: (symbol: string) => void;
    isInWatchlist: (symbol: string) => boolean;
}
export declare const useStockContext: () => StockContextType;
interface StockProviderProps {
    children: ReactNode;
}
export declare const StockProvider: React.FC<StockProviderProps>;
export {};
