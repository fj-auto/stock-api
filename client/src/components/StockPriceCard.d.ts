import React from 'react';
interface StockPriceCardProps {
    symbol: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
    onSelect?: (symbol: string) => void;
    showWatchlistButton?: boolean;
    stock?: any;
    onClick?: () => void;
    onRemoveFromWatchlist?: () => void;
}
export declare const StockPriceCard: React.FC<StockPriceCardProps>;
export {};
