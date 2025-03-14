// src/hooks/useYahooFinance.ts
import { useState, useEffect, useCallback } from 'react';
import { yahooFinanceClient } from '../client/yahooFinanceClient';

/**
 * 自定义Hook: 获取股票价格
 * @param symbol 股票代码
 * @param refreshInterval 自动刷新间隔 (毫秒), 0表示不自动刷新
 */
export function useStockPrice(symbol: string, refreshInterval: number = 0) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      const result = await yahooFinanceClient.getStockPrice(symbol);
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // 初始加载和符号变化时重新加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 设置自动刷新
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchData, refreshInterval]);

  // 手动刷新方法
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refetch };
}

/**
 * 自定义Hook: 获取历史价格数据
 * @param symbol 股票代码
 * @param period 时间段
 * @param interval 间隔
 */
export function useHistoricalData(symbol: string, period: string = '1mo', interval: string = '1d') {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      const result = await yahooFinanceClient.getHistoricalData(symbol, period, interval);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
    } finally {
      setLoading(false);
    }
  }, [symbol, period, interval]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * 自定义Hook: 获取多个股票价格
 * @param symbols 股票代码数组
 * @param refreshInterval 自动刷新间隔 (毫秒), 0表示不自动刷新
 */
export function useMultipleStockPrices(symbols: string[], refreshInterval: number = 0) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 将符号数组转换为字符串以用作依赖项
  const symbolsKey = symbols.sort().join(',');

  const fetchData = useCallback(async () => {
    if (!symbols.length) return;

    try {
      setLoading(true);
      const result = await yahooFinanceClient.getMultipleStockPrices(symbols);
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
    } finally {
      setLoading(false);
    }
  }, [symbolsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchData, refreshInterval]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refetch };
}

/**
 * 自定义Hook: 获取股票报价摘要
 * @param symbol 股票代码
 * @param modules 需要获取的模块
 */
export function useQuoteSummary(symbol: string, modules: string[]) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // 将模块数组转换为字符串以用作依赖项
  const modulesKey = modules.sort().join(',');

  const fetchData = useCallback(async () => {
    if (!symbol || !modules.length) return;

    try {
      setLoading(true);
      const result = await yahooFinanceClient.getQuoteSummary(symbol, modules);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
    } finally {
      setLoading(false);
    }
  }, [symbol, modulesKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * 自定义Hook: 股票搜索
 * @param initialQuery 初始搜索关键字
 */
export function useStockSearch() {
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(
    async (query: string, quotesCount: number = 6, newsCount: number = 4) => {
      if (!query.trim()) {
        setResults(null);
        return;
      }

      try {
        setLoading(true);
        const result = await yahooFinanceClient.searchStocks(query, quotesCount, newsCount);
        setResults(result);
        setError(null);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('未知错误'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { results, loading, error, search };
}

/**
 * 自定义Hook: 获取热门股票
 * @param region 地区，默认为'US'
 * @param refreshInterval 自动刷新间隔 (毫秒), 0表示不自动刷新
 */
export function useTrendingStocks(region: string = 'US', refreshInterval: number = 0) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await yahooFinanceClient.getTrendingSymbols(region);
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取热门股票时出错'));
    } finally {
      setLoading(false);
    }
  }, [region]);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 设置自动刷新
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchData, refreshInterval]);

  // 手动刷新方法
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refetch };
}

/**
 * 自定义Hook: 获取股票洞察信息
 * @param symbol 股票代码
 */
export function useStockInsights(symbol: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      const result = await yahooFinanceClient.getInsights(symbol);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * 自定义Hook: 获取图表数据
 * @param symbol 股票代码
 * @param interval 间隔
 * @param range 范围
 * @param includePrePost 是否包含盘前盘后数据
 */
export function useChartData(
  symbol: string,
  interval: string = '1d',
  range: string = '1mo',
  includePrePost: boolean = false
) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      const result = await yahooFinanceClient.getChartData(symbol, interval, range, includePrePost);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, range, includePrePost]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * 自定义Hook: 获取股票历史财报日期
 * @param symbol 股票代码
 * @param years 要获取的年数，默认为5
 */
export function useEarningsDates(symbol: string, years: number = 5) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      const result = await yahooFinanceClient.getEarningsDates(symbol, years);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
    } finally {
      setLoading(false);
    }
  }, [symbol, years]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * 自定义Hook: 获取日涨幅最大的股票
 * @param count 要获取的股票数量
 * @param region 地区，默认为'US'
 * @param refreshInterval 自动刷新间隔 (毫秒), 0表示不自动刷新
 */
export function useDailyGainers(
  count: number = 5,
  region: string = 'US',
  refreshInterval: number = 0
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await yahooFinanceClient.getDailyGainers(count, region);
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取日涨幅最大股票时出错'));
    } finally {
      setLoading(false);
    }
  }, [count, region]);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 设置自动刷新
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchData, refreshInterval]);

  // 手动刷新方法
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refetch };
}
