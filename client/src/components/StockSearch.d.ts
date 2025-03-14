import React from 'react';
interface StockSearchProps {
    onSelectStock: (symbol: string) => void;
    placeholder?: string;
}
export declare const StockSearch: React.FC<StockSearchProps>;
export {};
