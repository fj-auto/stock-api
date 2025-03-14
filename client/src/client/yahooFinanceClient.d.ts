interface StockData {
    symbol: string;
    price: number;
    previousClose?: number;
    change?: number;
    changePercent?: number;
    volume?: number;
    marketCap?: number;
    lastUpdated: string;
}
interface HistoricalDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
declare class YahooFinanceClient {
    private readonly baseURL;
    constructor(baseURL?: string);
    private handleError;
    getStockPrice(symbol: string): Promise<StockData>;
    getMultipleStockPrices(symbols: string[]): Promise<StockData[]>;
    getHistoricalData(symbol: string, period?: string, interval?: string): Promise<HistoricalDataPoint[]>;
    getSearchSuggestions(query: string): Promise<any>;
    getChartData(symbol: string, interval?: string, range?: string, includePrePost?: boolean): Promise<any>;
    getQuoteSummary(symbol: string, modules: string[]): Promise<any>;
    searchStocks(query: string, quotesCount?: number, newsCount?: number): Promise<any>;
    getRecommendations(symbol: string): Promise<any>;
    getTrendingStocks(region?: string): Promise<any>;
    getOptionsData(symbol: string, date?: string, strikeMin?: number, strikeMax?: number): Promise<any>;
    getInsights(symbol: string): Promise<any>;
    getDailyGainers(count?: number, region?: string): Promise<any>;
    getQuoteCombine(symbols: string[], modules: string[]): Promise<any>;
    getEarningsDates(symbol: string, years?: number): Promise<any>;
}
export declare const yahooFinanceClient: YahooFinanceClient;
export default YahooFinanceClient;
