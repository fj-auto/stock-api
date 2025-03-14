/**
 * 自定义Hook: 获取股票价格
 * @param symbol 股票代码
 * @param refreshInterval 自动刷新间隔 (毫秒), 0表示不自动刷新
 */
export declare function useStockPrice(symbol: string, refreshInterval?: number): {
    data: any;
    loading: boolean;
    error: Error | null;
    lastUpdated: Date | null;
    refetch: () => void;
};
/**
 * 自定义Hook: 获取历史价格数据
 * @param symbol 股票代码
 * @param period 时间段
 * @param interval 间隔
 */
export declare function useHistoricalData(symbol: string, period?: string, interval?: string): {
    data: any[];
    loading: boolean;
    error: Error | null;
    refetch: () => void;
};
/**
 * 自定义Hook: 获取多个股票价格
 * @param symbols 股票代码数组
 * @param refreshInterval 自动刷新间隔 (毫秒), 0表示不自动刷新
 */
export declare function useMultipleStockPrices(symbols: string[], refreshInterval?: number): {
    data: any[];
    loading: boolean;
    error: Error | null;
    lastUpdated: Date | null;
    refetch: () => void;
};
/**
 * 自定义Hook: 获取股票报价摘要
 * @param symbol 股票代码
 * @param modules 需要获取的模块
 */
export declare function useQuoteSummary(symbol: string, modules: string[]): {
    data: any;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
};
/**
 * 自定义Hook: 股票搜索
 * @param initialQuery 初始搜索关键字
 */
export declare function useStockSearch(): {
    results: any;
    loading: boolean;
    error: Error | null;
    search: (query: string, quotesCount?: number, newsCount?: number) => Promise<any>;
};
/**
 * 自定义Hook: 获取热门股票
 * @param region 地区代码
 * @param refreshInterval 自动刷新间隔 (毫秒), 0表示不自动刷新
 */
export declare function useTrendingStocks(region?: string, refreshInterval?: number): {
    data: any;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
};
/**
 * 自定义Hook: 获取日内涨幅最大的股票
 * @param count 返回数量
 * @param region 地区代码
 * @param refreshInterval 自动刷新间隔 (毫秒), 0表示不自动刷新
 */
export declare function useDailyGainers(count?: number, region?: string, refreshInterval?: number): {
    data: any;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
};
/**
 * 自定义Hook: 获取股票洞察信息
 * @param symbol 股票代码
 */
export declare function useStockInsights(symbol: string): {
    data: any;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
};
/**
 * 自定义Hook: 获取图表数据
 * @param symbol 股票代码
 * @param interval 间隔
 * @param range 范围
 * @param includePrePost 是否包含盘前盘后数据
 */
export declare function useChartData(symbol: string, interval?: string, range?: string, includePrePost?: boolean): {
    data: any;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
};
/**
 * 自定义Hook: 获取股票历史财报日期
 * @param symbol 股票代码
 * @param years 要获取的年数，默认为5
 */
export declare function useEarningsDates(symbol: string, years?: number): {
    data: any;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
};
