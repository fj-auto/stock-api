import React from 'react';
interface StockWatchlistProps {
    onSelectStock: (symbol: string) => void;
    refreshInterval?: number;
}
export declare const StockWatchlist: React.FC<StockWatchlistProps>;
export {};
