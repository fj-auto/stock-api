import React from 'react';
interface StockChartProps {
    data?: any[];
    period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';
    showVolume?: boolean;
    symbol?: string;
    initialPeriod?: string;
    initialInterval?: string;
}
export declare const StockChart: React.FC<StockChartProps>;
export {};
