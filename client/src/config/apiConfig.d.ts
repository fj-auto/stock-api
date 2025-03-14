export declare const API_BASE_URL: string;
export declare const ENDPOINTS: {
    YAHOO: {
        STOCK: (symbol: string) => string;
        STOCKS: string;
        HISTORY: (symbol: string) => string;
        AUTOC: string;
        CHART: (symbol: string) => string;
        SUMMARY: (symbol: string) => string;
        SEARCH: string;
        RECOMMENDATIONS: (symbol: string) => string;
        TRENDING: string;
        OPTIONS: (symbol: string) => string;
        INSIGHTS: (symbol: string) => string;
        GAINERS: string;
        COMBINE: string;
        EARNINGS_DATES: (symbol: string, years?: number) => string;
        ALL_INFO: (symbol: string, refresh?: boolean) => string;
    };
};
