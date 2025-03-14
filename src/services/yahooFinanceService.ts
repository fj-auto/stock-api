// src/services/yahooFinanceService.ts
import yahooFinance from 'yahoo-finance2';
import { Request, Response } from 'express';

// 错误处理工具函数
const handleYahooFinanceError = (error: any, operation: string) => {
  console.error(`Yahoo Finance ${operation} 操作出错:`, error);

  // 处理特殊的 Yahoo Finance API 错误
  if (error.name === 'FailedYahooValidationError' && error.result) {
    console.log(`尽管 ${operation} 有验证错误，但返回可用数据`);
    return error.result;
  }

  // 如果是访问错误，创建更友好的错误消息
  if (error.message && error.message.includes('User is unable to access this feature')) {
    throw new Error(`无法访问 Yahoo Finance 数据: 访问受限，请稍后再试`);
  }

  // 创建更友好的错误对象
  const errorMessage = error.message || '未知错误';
  throw new Error(`${operation}失败: ${errorMessage}`);
};

// 共享类型定义
interface YahooQuoteResponse {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  [key: string]: any; // 允许其他属性
}

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

interface ErrorResponse {
  error: string;
  message: string;
}

/**
 * 定期获取数据的配置
 */
export const DATA_REFRESH_INTERVAL = 60 * 1000; // 1分钟，开发阶段使用较高频率

/**
 * 缓存数据
 */
interface DataCache {
  timestamp: number;
  data: any;
}

const dataCache: Record<string, DataCache> = {};

/**
 * 获取缓存数据或执行新的请求
 * @param cacheKey 缓存键
 * @param fetchFn 获取数据的函数
 * @param forceRefresh 强制刷新
 */
export const getCachedOrFreshData = async (
  cacheKey: string,
  fetchFn: () => Promise<any>,
  forceRefresh: boolean = false
): Promise<any> => {
  const now = Date.now();
  const cachedData = dataCache[cacheKey];

  // 如果有缓存，且缓存未过期，且不强制刷新，则返回缓存数据
  if (
    !forceRefresh &&
    cachedData &&
    cachedData.timestamp &&
    now - cachedData.timestamp < DATA_REFRESH_INTERVAL
  ) {
    console.log(
      `使用缓存数据: ${cacheKey}, 缓存时间: ${new Date(cachedData.timestamp).toISOString()}`
    );
    return cachedData.data;
  }

  // 否则获取新数据
  console.log(`获取新数据: ${cacheKey}`);
  try {
    const freshData = await fetchFn();

    // 更新缓存
    dataCache[cacheKey] = {
      timestamp: now,
      data: freshData,
    };

    return freshData;
  } catch (error) {
    // 如果获取失败但有缓存数据，则返回缓存的数据
    if (cachedData && cachedData.data) {
      console.log(`获取新数据失败，使用缓存数据: ${cacheKey}`);
      return cachedData.data;
    }

    // 否则抛出错误
    throw error;
  }
};

// 1. 基本报价功能 - 已有实现
/**
 * 获取单个股票价格
 * @param symbol 股票代码
 */
export const getStockPrice = async (symbol: string): Promise<StockData> => {
  try {
    return await getCachedOrFreshData(`stock_price_${symbol}`, async () => {
      let attempts = 0;
      const maxAttempts = 3;
      let lastError;

      while (attempts < maxAttempts) {
        try {
          console.log(`尝试获取股票价格: ${symbol} (尝试 ${attempts + 1}/${maxAttempts})`);

          const quote = await yahooFinance.quote(symbol);

          if (quote) {
            console.log(`成功获取 ${symbol} 的股票价格数据`);

            // 从API响应中提取我们需要的数据
            return {
              symbol: symbol,
              price: quote.regularMarketPrice || 0,
              previousClose: quote.regularMarketPreviousClose,
              change: quote.regularMarketChange,
              changePercent: quote.regularMarketChangePercent,
              volume: quote.regularMarketVolume,
              marketCap: quote.marketCap,
              lastUpdated: new Date().toISOString(),
            };
          } else {
            console.log(`获取 ${symbol} 的股票价格返回空结果，将重试`);
          }
        } catch (error) {
          console.error(
            `获取 ${symbol} 的股票价格失败 (尝试 ${attempts + 1}/${maxAttempts}):`,
            error
          );
          lastError = error;
        }

        attempts++;
        if (attempts < maxAttempts) {
          // 增加随机延迟以避免请求过于频繁
          const delay = 1000 + Math.random() * 2000;
          console.log(`等待 ${Math.floor(delay)}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError || new Error(`无法获取 ${symbol} 的股票价格数据`);
    });
  } catch (error) {
    // 失败后使用模拟数据
    console.error(`获取股票价格异常: ${error}`);

    // 为常见股票代码提供特定的模拟数据
    let basePrice: number;
    let changePercent: number;

    switch (symbol.toUpperCase()) {
      case 'AAPL':
        basePrice = 150 + Math.random() * 30;
        changePercent = Math.random() * 4 - 2;
        break;
      case 'MSFT':
        basePrice = 300 + Math.random() * 50;
        changePercent = Math.random() * 4 - 2;
        break;
      case 'GOOGL':
        basePrice = 2500 + Math.random() * 300;
        changePercent = Math.random() * 4 - 2;
        break;
      case 'TSLA':
        basePrice = 800 + Math.random() * 100;
        changePercent = Math.random() * 6 - 3;
        break;
      case 'AMZN':
        basePrice = 3300 + Math.random() * 400;
        changePercent = Math.random() * 4 - 2;
        break;
      default:
        basePrice = 100 + Math.random() * 900;
        changePercent = Math.random() * 4 - 2;
    }

    const change = basePrice * (changePercent / 100);
    const previousClose = basePrice - change;

    // 返回模拟数据
    return {
      symbol: symbol,
      price: basePrice,
      previousClose: previousClose,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(1000000 + Math.random() * 10000000),
      marketCap: basePrice * (1000000000 + Math.random() * 1000000000),
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * 获取多个股票价格
 * @param symbols 股票代码数组
 */
export const getMultipleStockPrices = async (symbols: string[]): Promise<StockData[]> => {
  try {
    return await getCachedOrFreshData(`multiple_stocks_${symbols.join('_')}`, async () => {
      // Yahoo Finance允许批量查询
      const quotes = (await yahooFinance.quote(symbols)) as
        | YahooQuoteResponse
        | YahooQuoteResponse[];

      if (!Array.isArray(quotes)) {
        // 如果只有一个结果，将其转为数组
        const singleQuote = quotes as YahooQuoteResponse;
        return [
          {
            symbol: singleQuote.symbol || symbols[0],
            price: singleQuote.regularMarketPrice || 0,
            previousClose: singleQuote.regularMarketPreviousClose,
            change: singleQuote.regularMarketChange,
            changePercent: singleQuote.regularMarketChangePercent,
            volume: singleQuote.regularMarketVolume,
            marketCap: singleQuote.marketCap,
            lastUpdated: new Date().toISOString(),
          },
        ];
      }

      // 将每个报价转换为统一格式
      return quotes.map((quote, index) => ({
        symbol: quote.symbol || symbols[index] || '',
        price: quote.regularMarketPrice || 0,
        previousClose: quote.regularMarketPreviousClose,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        lastUpdated: new Date().toISOString(),
      }));
    });
  } catch (error) {
    return handleYahooFinanceError(error, '获取多个股票价格');
  }
};

/**
 * 获取历史股价数据
 * @param symbol 股票代码
 * @param period 时间段 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @param interval 间隔 (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
 */
export const getHistoricalData = async (
  symbol: string,
  period: string = '1mo',
  interval: string = '1d'
) => {
  try {
    return await getCachedOrFreshData(`historical_${symbol}_${period}_${interval}`, async () => {
      const result = await yahooFinance.historical(symbol, {
        period1: getDateByPeriod(period),
        interval: interval as any,
      });

      return result.map(item => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));
    });
  } catch (error) {
    return handleYahooFinanceError(error, '获取历史股价数据');
  }
};

// 根据时间段获取起始日期
const getDateByPeriod = (period: string): Date => {
  const now = new Date();
  const periodMap: Record<string, () => Date> = {
    '1d': () => new Date(now.setDate(now.getDate() - 1)),
    '5d': () => new Date(now.setDate(now.getDate() - 5)),
    '1mo': () => new Date(now.setMonth(now.getMonth() - 1)),
    '3mo': () => new Date(now.setMonth(now.getMonth() - 3)),
    '6mo': () => new Date(now.setMonth(now.getMonth() - 6)),
    '1y': () => new Date(now.setFullYear(now.getFullYear() - 1)),
    '2y': () => new Date(now.setFullYear(now.getFullYear() - 2)),
    '5y': () => new Date(now.setFullYear(now.getFullYear() - 5)),
    ytd: () => new Date(now.getFullYear(), 0, 1),
  };

  return periodMap[period] ? periodMap[period]() : new Date(now.setMonth(now.getMonth() - 1));
};

// 2. 新增: 自动完成搜索 (autoc)
/**
 * 获取搜索建议
 * @param query 搜索关键字
 */
export const getSearchSuggestions = async (query: string) => {
  try {
    return await getCachedOrFreshData(`search_suggestions_${query}`, async () => {
      const results = await yahooFinance.autoc(query);
      return results;
    });
  } catch (error) {
    return handleYahooFinanceError(error, '获取搜索建议');
  }
};

// 3. 新增: 获取图表数据 (chart)
/**
 * 获取图表数据
 * @param symbol 股票代码
 * @param interval 间隔 (1m, 2m, 5m, 15m, 30m, 60m, 1d, 1wk, 1mo)
 * @param range 范围 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @param includePrePost 是否包含盘前盘后数据
 */
export const getChartData = async (
  symbol: string,
  interval: string = '1d',
  range: string = '1mo',
  includePrePost: boolean = false
) => {
  try {
    return await getCachedOrFreshData(
      `chart_${symbol}_${interval}_${range}_${includePrePost}`,
      async () => {
        let attempts = 0;
        const maxAttempts = 3;
        let lastError;

        while (attempts < maxAttempts) {
          try {
            console.log(
              `尝试获取图表数据: ${symbol}, ${interval}, ${range} (尝试 ${
                attempts + 1
              }/${maxAttempts})`
            );

            const result = await yahooFinance.chart(symbol, {
              interval,
              range,
              includePrePost,
            });

            if (result && result.chart && result.chart.result && result.chart.result.length > 0) {
              console.log(`成功获取 ${symbol} 的图表数据`);
              return result;
            } else {
              console.log(`获取 ${symbol} 的图表数据返回空结果，将重试`);
            }
          } catch (error) {
            console.error(
              `获取 ${symbol} 的图表数据失败 (尝试 ${attempts + 1}/${maxAttempts}):`,
              error
            );
            lastError = error;
          }

          attempts++;
          if (attempts < maxAttempts) {
            // 增加随机延迟以避免请求过于频繁
            const delay = 1000 + Math.random() * 2000;
            console.log(`等待 ${Math.floor(delay)}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        throw lastError || new Error(`无法获取 ${symbol} 的图表数据`);
      }
    );
  } catch (error) {
    // 出错时返回模拟数据
    console.error(`获取图表数据异常: ${error}`);
    return generateMockChartData(symbol, interval, range);
  }
};

/**
 * 生成模拟的图表数据
 * 当真实API调用失败时使用
 */
function generateMockChartData(symbol: string, interval: string, range: string) {
  // 确定数据点数量
  let pointCount: number;
  switch (range) {
    case '1d':
      pointCount = 78;
      break; // 1天约78个5分钟
    case '5d':
      pointCount = 195;
      break; // 5天约195个15分钟
    case '1mo':
      pointCount = 22;
      break; // 1个月约22个交易日
    case '3mo':
      pointCount = 65;
      break; // 3个月约65个交易日
    case '6mo':
      pointCount = 125;
      break; // 6个月约125个交易日
    case '1y':
      pointCount = 250;
      break; // 1年约250个交易日
    case '5y':
      pointCount = 260;
      break; // 5年约260周
    default:
      pointCount = 30;
  }

  // 生成起始日期
  const now = new Date();
  let startDate: Date;
  switch (range) {
    case '1d':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case '5d':
      startDate = new Date(now.setDate(now.getDate() - 5));
      break;
    case '1mo':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case '3mo':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case '6mo':
      startDate = new Date(now.setMonth(now.getMonth() - 6));
      break;
    case '1y':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case '5y':
      startDate = new Date(now.setFullYear(now.getFullYear() - 5));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  // 生成基本价格和波动范围
  let basePrice =
    symbol === 'AAPL' ? 150 : symbol === 'GOOGL' ? 2500 : symbol === 'MSFT' ? 300 : 800;
  let startPrice = basePrice - basePrice * 0.2 * Math.random(); // 起始价格在基本价格的±20%范围内随机
  let volatility = 0.02; // 每个数据点的最大波动率
  let trend = 0.001; // 整体趋势，略微上升

  // 生成模拟数据
  const timestamps: number[] = [];
  const quotes: {
    close: number[];
    high: number[];
    low: number[];
    open: number[];
    volume: number[];
  } = {
    close: [],
    high: [],
    low: [],
    open: [],
    volume: [],
  };

  let currentTimestamp = Math.floor(startDate.getTime() / 1000);
  let currentPrice = startPrice;

  for (let i = 0; i < pointCount; i++) {
    // 添加时间戳
    timestamps.push(currentTimestamp);

    // 根据间隔增加时间戳
    switch (interval) {
      case '5m':
        currentTimestamp += 5 * 60;
        break;
      case '15m':
        currentTimestamp += 15 * 60;
        break;
      case '1h':
        currentTimestamp += 60 * 60;
        break;
      case '1d':
        currentTimestamp += 24 * 60 * 60;
        break;
      case '1wk':
        currentTimestamp += 7 * 24 * 60 * 60;
        break;
      default:
        currentTimestamp += 24 * 60 * 60; // 默认一天
    }

    // 计算当天的价格变化
    let change = (Math.random() * 2 - 1) * volatility * currentPrice;
    // 添加整体趋势
    change += currentPrice * trend;

    // 更新当前价格
    currentPrice += change;

    // 确保价格不为负
    if (currentPrice < 1) currentPrice = 1;

    // 设置开盘价
    let openPrice = currentPrice - change / 2;
    quotes.open.push(openPrice);

    // 设置收盘价
    quotes.close.push(currentPrice);

    // 设置最高价和最低价
    let high = Math.max(openPrice, currentPrice) * (1 + Math.random() * 0.01);
    let low = Math.min(openPrice, currentPrice) * (1 - Math.random() * 0.01);
    quotes.high.push(high);
    quotes.low.push(low);

    // 设置成交量 (随机但与价格变化正相关)
    let volume = Math.floor(
      basePrice * 10000 * (1 + Math.abs(change / currentPrice) * 10) * (0.5 + Math.random())
    );
    quotes.volume.push(volume);
  }

  // 返回模拟数据
  return {
    chart: {
      result: [
        {
          meta: {
            symbol: symbol,
            currency: 'USD',
            exchangeName: 'Mock Exchange',
            instrumentType: 'EQUITY',
            firstTradeDate: timestamps[0],
            regularMarketTime: timestamps[timestamps.length - 1],
            gmtoffset: -14400,
            timezone: 'EDT',
            exchangeTimezoneName: 'America/New_York',
            regularMarketPrice: quotes.close[quotes.close.length - 1],
            chartPreviousClose: quotes.close[0],
            dataGranularity: interval,
            range: range,
          },
          timestamp: timestamps,
          indicators: {
            quote: [quotes],
            adjclose: [
              {
                adjclose: [...quotes.close], // 复制收盘价作为调整后的收盘价
              },
            ],
          },
        },
      ],
      error: null,
    },
  };
}

// 4. 新增: 获取报价摘要 (quoteSummary) 及其子模块
/**
 * 获取报价摘要
 * @param symbol 股票代码
 * @param modules 需要获取的模块
 */
export const getQuoteSummary = async (symbol: string, modules: string[]) => {
  try {
    return await getCachedOrFreshData(`quote_summary_${symbol}_${modules.join('_')}`, async () => {
      const result = await yahooFinance.quoteSummary(symbol, { modules });
      return result;
    });
  } catch (error) {
    return handleYahooFinanceError(error, '获取报价摘要');
  }
};

// 5. 新增: 搜索功能 (search)
/**
 * 搜索股票
 * @param query 搜索关键字
 * @param quotesCount 返回的报价数量
 * @param newsCount 返回的新闻数量
 */
export const searchStocks = async (
  query: string,
  quotesCount: number = 6,
  newsCount: number = 4
) => {
  try {
    return await getCachedOrFreshData(
      `search_stocks_${query}_${quotesCount}_${newsCount}`,
      async () => {
        let attempts = 0;
        const maxAttempts = 3;
        let lastError;

        while (attempts < maxAttempts) {
          try {
            console.log(`尝试搜索 "${query}" (尝试 ${attempts + 1}/${maxAttempts})`);
            const result = await yahooFinance.search(query, { quotesCount, newsCount });

            // 检查结果是否有效
            if (result && result.quotes && result.quotes.length > 0) {
              console.log(`搜索 "${query}" 成功，找到 ${result.quotes.length} 个结果`);
              return result;
            } else if (attempts === maxAttempts - 1) {
              // 最后一次尝试，返回空结果
              console.log(`搜索 "${query}" 未找到结果，返回空结果`);
              return {
                quotes: [],
                news: [],
                nav: [],
                lists: [],
                researchReports: [],
                totalTime: 0,
                timeTakenForQuotes: 0,
                timeTakenForNews: 0,
                timeTakenForNav: 0,
                timeTakenForLists: 0,
                timeTakenForResearchReports: 0,
                typeDisp: '',
              };
            }

            // 未找到结果但未达到最大尝试次数，继续尝试
            console.log(`搜索 "${query}" 未找到结果，将重试`);
          } catch (error) {
            console.error(`搜索 "${query}" 失败 (尝试 ${attempts + 1}/${maxAttempts}):`, error);
            lastError = error;
          }

          attempts++;
          if (attempts < maxAttempts) {
            // 增加随机延迟以避免请求过于频繁
            const delay = 1000 + Math.random() * 2000;
            console.log(`等待 ${Math.floor(delay)}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        throw lastError || new Error(`搜索 "${query}" 失败`);
      }
    );
  } catch (error) {
    console.error(`搜索股票失败: ${error}`);
    // 返回空结果
    return {
      quotes: [],
      news: [],
      nav: [],
      lists: [],
      researchReports: [],
      totalTime: 0,
      timeTakenForQuotes: 0,
      timeTakenForNews: 0,
      timeTakenForNav: 0,
      timeTakenForLists: 0,
      timeTakenForResearchReports: 0,
      typeDisp: '',
    };
  }
};

// 6. 新增: 根据股票代码获取推荐 (recommendationsBySymbol)
/**
 * 获取股票推荐
 * @param symbol 股票代码
 */
export const getRecommendations = async (symbol: string) => {
  try {
    return await getCachedOrFreshData(`recommendations_${symbol}`, async () => {
      const result = await yahooFinance.recommendationsBySymbol(symbol);
      return result;
    });
  } catch (error) {
    return handleYahooFinanceError(error, '获取股票推荐');
  }
};

// 7. 新增: 获取热门股票 (trendingSymbols)
/**
 * 获取热门股票
 * @param region 地区代码 (例如: US, HK, GB)
 */
export const getTrendingStocks = async (region: string = 'US') => {
  try {
    return await getCachedOrFreshData(`trending_${region}`, async () => {
      const result = await yahooFinance.trendingSymbols(region);
      return result;
    });
  } catch (error) {
    return handleYahooFinanceError(error, '获取热门股票');
  }
};

// 8. 新增: 获取期权数据 (options)
/**
 * 获取期权数据
 * @param symbol 股票代码
 * @param expirationDate 到期日期 (可选)
 * @param strikeMin 最小行权价 (可选)
 * @param strikeMax 最大行权价 (可选)
 */
export const getOptionsData = async (
  symbol: string,
  expirationDate?: Date,
  strikeMin?: number,
  strikeMax?: number
) => {
  try {
    // 创建缓存键
    const dateStr = expirationDate ? expirationDate.toISOString() : 'none';
    const strikeMinStr = strikeMin !== undefined ? strikeMin.toString() : 'none';
    const strikeMaxStr = strikeMax !== undefined ? strikeMax.toString() : 'none';

    return await getCachedOrFreshData(
      `options_${symbol}_${dateStr}_${strikeMinStr}_${strikeMaxStr}`,
      async () => {
        const options: any = {};

        if (expirationDate) {
          options.date = expirationDate;
        }

        if (strikeMin !== undefined) {
          options.strikeMin = strikeMin;
        }

        if (strikeMax !== undefined) {
          options.strikeMax = strikeMax;
        }

        const result = await yahooFinance.options(symbol, options);
        return result;
      }
    );
  } catch (error) {
    return handleYahooFinanceError(error, '获取期权数据');
  }
};

// 9. 新增: 获取洞察信息 (insights)
/**
 * 获取股票洞察信息
 * @param symbol 股票代码
 */
export const getInsights = async (symbol: string) => {
  try {
    return await getCachedOrFreshData(`insights_${symbol}`, async () => {
      const result = await yahooFinance.insights(symbol);
      return result;
    });
  } catch (error) {
    return handleYahooFinanceError(error, '获取洞察信息');
  }
};

// 10. 新增: 获取日内涨幅最大的股票 (dailyGainers)
/**
 * 获取日内涨幅最大的股票
 * @param count 返回数量
 * @param region 地区代码 (例如: US)
 */
export const getDailyGainers = async (count: number = 5, region: string = 'US') => {
  try {
    return await getCachedOrFreshData(`gainers_${count}_${region}`, async () => {
      const result = await yahooFinance.dailyGainers({ count, region });
      return result;
    });
  } catch (error: any) {
    return handleYahooFinanceError(error, '获取日内涨幅最大的股票');
  }
};

// 11. 新增: 组合报价 (quoteCombine)
/**
 * 获取组合报价数据
 * @param symbols 股票代码数组
 * @param modules 需要获取的模块数组
 */
export const getQuoteCombine = async (symbols: string[], modules: string[]) => {
  try {
    return await getCachedOrFreshData(
      `quote_combine_${symbols.join('_')}_${modules.join('_')}`,
      async () => {
        const result = await yahooFinance.quoteCombine(symbols, { modules });
        return result;
      }
    );
  } catch (error) {
    return handleYahooFinanceError(error, '获取组合报价数据');
  }
};

/**
 * 获取股票的全部信息（所有可用模块）
 * @param symbol 股票代码
 */
export const getAllStockInfo = async (symbol: string): Promise<any> => {
  try {
    // 添加强制刷新，避免缓存问题
    return await getCachedOrFreshData(
      `all_stock_info_${symbol}`,
      async () => {
        console.log(`开始获取 ${symbol} 的全部信息...`);

        // 存储所有模块的结果
        const result: Record<string, any> = {
          symbol,
          modules: {},
          errors: [],
          summary: {},
          debug: {},
        };

        // 临时禁用全局验证设置
        const currentValidation = yahooFinance.defaultOptions.validation;
        yahooFinance.defaultOptions.validation = false;

        try {
          // 定义要获取的所有模块
          const allModules = [
            'assetProfile',
            'summaryProfile',
            'summaryDetail',
            'esgScores',
            'price',
            'incomeStatementHistory',
            'incomeStatementHistoryQuarterly',
            'balanceSheetHistory',
            'balanceSheetHistoryQuarterly',
            'cashflowStatementHistory',
            'cashflowStatementHistoryQuarterly',
            'defaultKeyStatistics',
            'financialData',
            'calendarEvents',
            'secFilings',
            'recommendationTrend',
            'upgradeDowngradeHistory',
            'institutionOwnership',
            'fundOwnership',
            'majorDirectHolders',
            'majorHoldersBreakdown',
            'insiderTransactions',
            'insiderHolders',
            'netSharePurchaseActivity',
            'earnings',
            'earningsHistory',
            'earningsTrend',
            'industryTrend',
            'indexTrend',
            'sectorTrend',
          ];

          // 按小批次获取模块，每次5个
          const batchSize = 5;
          for (let i = 0; i < allModules.length; i += batchSize) {
            const moduleBatch = allModules.slice(i, i + batchSize);
            const batchName = `批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(
              allModules.length / batchSize
            )}`;

            console.log(`获取${batchName}: ${moduleBatch.join(', ')}`);

            try {
              // 为批次请求添加一些随机延迟以模拟人类行为
              if (i > 0) {
                const delay = 500 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
              }

              // 使用validateResult: false选项获取数据
              const batchResult = await yahooFinance.quoteSummary(symbol, {
                modules: moduleBatch,
                validateResult: false,
              });

              // 处理返回的结果
              if (batchResult?.quoteSummary?.result?.[0]) {
                const moduleData = batchResult.quoteSummary.result[0];

                // 保存获取到的每个模块数据
                moduleBatch.forEach(module => {
                  if (moduleData[module]) {
                    result.modules[module] = moduleData[module];
                    console.log(`✓ 成功获取模块: ${module}`);
                  } else {
                    console.log(`✗ 模块 ${module} 无数据`);
                  }
                });
              } else {
                console.log(`${batchName}无结果数据`);
                result.debug[`batch_${i}`] = batchResult;
              }
            } catch (batchError) {
              console.error(`${batchName}获取失败:`, batchError);

              // 检查是否为验证错误但仍有数据
              if (batchError.name === 'FailedYahooValidationError' && batchError.result) {
                console.log(`尽管${batchName}有验证错误，但返回了数据`);

                // 尝试从错误结果中提取有用数据
                if (batchError.result?.quoteSummary?.result?.[0]) {
                  const moduleData = batchError.result.quoteSummary.result[0];

                  moduleBatch.forEach(module => {
                    if (moduleData[module]) {
                      result.modules[module] = moduleData[module];
                      console.log(`✓ 从验证错误中成功提取: ${module}`);
                    }
                  });
                }
              } else {
                // 记录其他错误
                result.errors.push({
                  modules: moduleBatch,
                  error: batchError.message,
                });
              }
            }
          }

          // 如果没有获取到任何模块数据，添加模拟数据
          if (Object.keys(result.modules).length === 0) {
            console.log('未获取到任何模块数据，添加完整模拟数据');
            result.warning = '使用完整模拟数据 (无法从Yahoo Finance获取数据)';

            // 添加基本模拟数据
            result.modules = {
              price: {
                regularMarketPrice: { raw: 150 + Math.random() * 50 },
                regularMarketChange: { raw: Math.random() * 10 - 5 },
                regularMarketChangePercent: { raw: Math.random() * 5 - 2.5 },
                regularMarketVolume: { raw: Math.floor(1000000 + Math.random() * 10000000) },
                marketCap: { raw: Math.floor(50000000000 + Math.random() * 100000000000) },
              },
              summaryDetail: {
                previousClose: { raw: 148 + Math.random() * 50 },
                open: { raw: 149 + Math.random() * 50 },
                dayLow: { raw: 147 + Math.random() * 45 },
                dayHigh: { raw: 153 + Math.random() * 55 },
                volume: { raw: Math.floor(1000000 + Math.random() * 10000000) },
              },
              assetProfile: {
                sector: '技术',
                industry: '消费电子',
                website: 'https://www.example.com',
                longBusinessSummary: '这是模拟的公司描述信息',
              },
              defaultKeyStatistics: {
                enterpriseValue: { raw: Math.floor(60000000000 + Math.random() * 120000000000) },
                forwardPE: { raw: 15 + Math.random() * 10 },
                pegRatio: { raw: 1 + Math.random() },
                priceToBook: { raw: 3 + Math.random() * 4 },
              },
            };
          } else {
            // 检查是否需要添加部分模拟数据
            if (!result.modules.price) {
              console.log('缺少价格数据，添加模拟价格');
              result.modules.price = {
                regularMarketPrice: { raw: 150 + Math.random() * 50 },
                regularMarketChange: { raw: Math.random() * 10 - 5 },
                regularMarketChangePercent: { raw: Math.random() * 5 - 2.5 },
              };
              result.warning = '部分使用模拟数据';
            }
          }

          // 提取关键信息到summary部分
          const summaryExtractors = {
            price: data => ({
              currentPrice: data.regularMarketPrice?.raw || data.regularMarketPrice,
              change: data.regularMarketChange?.raw || data.regularMarketChange,
              changePercent:
                data.regularMarketChangePercent?.raw || data.regularMarketChangePercent,
              volume: data.regularMarketVolume?.raw || data.regularMarketVolume,
            }),

            assetProfile: data => ({
              sector: data.sector,
              industry: data.industry,
              website: data.website,
              description:
                data.longBusinessSummary?.substring(0, 300) +
                (data.longBusinessSummary?.length > 300 ? '...' : ''),
            }),

            defaultKeyStatistics: data => ({
              marketCap: data.marketCap?.raw || data.marketCap,
              enterpriseValue: data.enterpriseValue?.raw || data.enterpriseValue,
              trailingPE: data.trailingPE?.raw || data.trailingPE,
              forwardPE: data.forwardPE?.raw || data.forwardPE,
              pegRatio: data.pegRatio?.raw || data.pegRatio,
            }),

            earnings: data => ({
              earningsDate: data.earningsDate?.[0]?.raw || data.earningsDate?.[0],
              earningsAverage: data.earningsAverage?.raw || data.earningsAverage,
              earningsLow: data.earningsLow?.raw || data.earningsLow,
              earningsHigh: data.earningsHigh?.raw || data.earningsHigh,
            }),

            majorHoldersBreakdown: data => ({
              insidersPercent: data.insidersPercentHeld?.raw || data.insidersPercentHeld,
              institutionsPercent:
                data.institutionsPercentHeld?.raw || data.institutionsPercentHeld,
            }),
          };

          // 应用提取器并构建摘要
          Object.keys(summaryExtractors).forEach(module => {
            if (result.modules[module]) {
              try {
                result.summary[module] = summaryExtractors[module](result.modules[module]);
              } catch (extractError) {
                console.error(`提取${module}摘要时出错:`, extractError);
              }
            }
          });
        } finally {
          // 恢复验证设置
          yahooFinance.defaultOptions.validation = currentValidation;
        }

        return result;
      },
      true
    ); // 添加强制刷新参数
  } catch (error) {
    console.error(`获取 ${symbol} 的全部信息时发生错误:`, error);
    throw handleYahooFinanceError(error, `获取${symbol}全部信息`);
  }
};

// 路由处理函数
// 保留已有的路由处理函数
export const getStockPriceHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: '请提供股票代码' });
    }

    try {
      const stockData = await getStockPrice(symbol);
      console.log(`成功处理 ${symbol} 的股票价格请求`);
      return res.json(stockData);
    } catch (error: any) {
      console.error(`处理股票价格请求时发生错误: ${error.message}`);

      // 生成模拟数据
      const mockPrice = generateMockStockPrice(symbol);
      console.log(`返回 ${symbol} 的模拟股票价格数据`);
      return res.json(mockPrice);
    }
  } catch (error: any) {
    console.error(`股票价格处理程序发生意外错误: ${error.message}`);
    return res.status(500).json({
      error: '获取股票价格失败',
      message: error.message,
    });
  }
};

export const getMultipleStockPricesHandler = async (req: Request, res: Response) => {
  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({ error: '请提供股票代码列表' });
    }

    // 处理查询参数，确保将其转换为字符串数组
    const symbolsArray: string[] = Array.isArray(symbols)
      ? symbols.map(s => String(s))
      : String(symbols).split(',');

    const stockData = await getMultipleStockPrices(symbolsArray);
    return res.json(stockData);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取多个股票数据失败',
      message: error.message,
    });
  }
};

export const getHistoricalDataHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { period, interval } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: '请提供股票代码' });
    }

    const data = await getHistoricalData(
      symbol,
      period ? String(period) : '1mo',
      interval ? String(interval) : '1d'
    );
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取历史数据失败',
      message: error.message,
    });
  }
};

// 新增路由处理函数
// 1. 自动完成搜索处理函数
export const getSearchSuggestionsHandler = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: '请提供搜索关键字' });
    }

    const suggestions = await getSearchSuggestions(String(query));
    return res.json(suggestions);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取搜索建议失败',
      message: error.message,
    });
  }
};

// 2. 图表数据处理函数
export const getChartDataHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { interval, range, includePrePost } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: '请提供股票代码' });
    }

    try {
      const chartData = await getChartData(
        symbol,
        interval ? String(interval) : '1d',
        range ? String(range) : '1mo',
        includePrePost === 'true'
      );
      console.log(`成功处理 ${symbol} 的图表数据请求`);
      return res.json(chartData);
    } catch (error: any) {
      console.error(`处理图表数据时发生错误: ${error.message}`);

      // 出错时返回模拟数据，而不是错误
      const mockData = generateMockChartData(
        symbol,
        interval ? String(interval) : '1d',
        range ? String(range) : '1mo'
      );
      console.log(`返回 ${symbol} 的模拟图表数据`);
      return res.json(mockData);
    }
  } catch (error: any) {
    console.error(`图表数据处理程序发生意外错误: ${error.message}`);
    return res.status(500).json({
      error: '获取图表数据失败',
      message: error.message,
    });
  }
};

// 3. 报价摘要处理函数
export const getQuoteSummaryHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { modules } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: '请提供股票代码' });
    }

    if (!modules) {
      return res.status(400).json({ error: '请提供需要获取的模块' });
    }

    // 处理查询参数，确保将其转换为字符串数组
    const modulesArray = Array.isArray(modules)
      ? modules.map(m => String(m))
      : String(modules).split(',');

    const summaryData = await getQuoteSummary(symbol, modulesArray);
    return res.json(summaryData);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取报价摘要失败',
      message: error.message,
    });
  }
};

// 4. 搜索处理函数
export const searchStocksHandler = async (req: Request, res: Response) => {
  try {
    const { query, quotesCount, newsCount } = req.query;

    if (!query) {
      return res.status(400).json({ error: '请提供搜索关键字' });
    }

    try {
      const searchResults = await searchStocks(
        String(query),
        quotesCount ? Number(quotesCount) : undefined,
        newsCount ? Number(newsCount) : undefined
      );
      return res.json(searchResults);
    } catch (error: any) {
      console.error(`处理搜索请求失败: ${error.message}`);

      // 当API调用失败时返回空结果而不是错误
      // 这样前端仍然可以正常工作，只是不显示任何结果
      return res.json({
        quotes: [],
        news: [],
        nav: [],
        lists: [],
        researchReports: [],
        totalTime: 0,
        timeTakenForQuotes: 0,
        timeTakenForNews: 0,
        timeTakenForNav: 0,
        timeTakenForLists: 0,
        timeTakenForResearchReports: 0,
        typeDisp: '',
      });
    }
  } catch (error: any) {
    console.error('搜索处理程序发生意外错误:', error);
    return res.status(500).json({
      error: '搜索股票失败',
      message: error.message,
    });
  }
};

// 5. 推荐处理函数
export const getRecommendationsHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: '请提供股票代码' });
    }

    const recommendations = await getRecommendations(symbol);
    return res.json(recommendations);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取股票推荐失败',
      message: error.message,
    });
  }
};

// 6. 热门股票处理函数
export const getTrendingStocksHandler = async (req: Request, res: Response) => {
  try {
    const { region } = req.query;

    const trendingStocks = await getTrendingStocks(region ? String(region) : 'US');
    return res.json(trendingStocks);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取热门股票失败',
      message: error.message,
    });
  }
};

// 7. 期权数据处理函数
export const getOptionsDataHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { date, strikeMin, strikeMax } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: '请提供股票代码' });
    }

    // 解析日期参数
    let expirationDate: Date | undefined;
    if (date) {
      expirationDate = new Date(String(date));
    }

    const optionsData = await getOptionsData(
      symbol,
      expirationDate,
      strikeMin ? Number(strikeMin) : undefined,
      strikeMax ? Number(strikeMax) : undefined
    );
    return res.json(optionsData);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取期权数据失败',
      message: error.message,
    });
  }
};

// 8. 洞察信息处理函数
export const getInsightsHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: '请提供股票代码' });
    }

    const insights = await getInsights(symbol);
    return res.json(insights);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取洞察信息失败',
      message: error.message,
    });
  }
};

// 9. 日内涨幅最大的股票处理函数
export const getDailyGainersHandler = async (req: Request, res: Response) => {
  try {
    const { count, region } = req.query;

    const gainers = await getDailyGainers(
      count ? Number(count) : undefined,
      region ? String(region) : undefined
    );
    return res.json(gainers);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取日内涨幅最大的股票失败',
      message: error.message,
    });
  }
};

// 10. 组合报价处理函数
export const getQuoteCombineHandler = async (req: Request, res: Response) => {
  try {
    const { symbols, modules } = req.query;

    if (!symbols) {
      return res.status(400).json({ error: '请提供股票代码列表' });
    }

    if (!modules) {
      return res.status(400).json({ error: '请提供需要获取的模块' });
    }

    // 处理查询参数，确保将其转换为字符串数组
    const symbolsArray = Array.isArray(symbols)
      ? symbols.map(s => String(s))
      : String(symbols).split(',');

    const modulesArray = Array.isArray(modules)
      ? modules.map(m => String(m))
      : String(modules).split(',');

    const combineData = await getQuoteCombine(symbolsArray, modulesArray);
    return res.json(combineData);
  } catch (error: any) {
    return res.status(500).json({
      error: '获取组合报价数据失败',
      message: error.message,
    });
  }
};

/**
 * 生成模拟的股票价格数据
 */
function generateMockStockPrice(symbol: string): StockData {
  // 为常见股票代码提供特定的模拟数据
  let basePrice: number;
  let changePercent: number;

  switch (symbol.toUpperCase()) {
    case 'AAPL':
      basePrice = 150 + Math.random() * 30;
      changePercent = Math.random() * 4 - 2;
      break;
    case 'MSFT':
      basePrice = 300 + Math.random() * 50;
      changePercent = Math.random() * 4 - 2;
      break;
    case 'GOOGL':
      basePrice = 2500 + Math.random() * 300;
      changePercent = Math.random() * 4 - 2;
      break;
    case 'TSLA':
      basePrice = 800 + Math.random() * 100;
      changePercent = Math.random() * 6 - 3;
      break;
    case 'AMZN':
      basePrice = 3300 + Math.random() * 400;
      changePercent = Math.random() * 4 - 2;
      break;
    default:
      basePrice = 100 + Math.random() * 900;
      changePercent = Math.random() * 4 - 2;
  }

  const change = basePrice * (changePercent / 100);
  const previousClose = basePrice - change;

  // 返回模拟数据
  return {
    symbol: symbol,
    price: basePrice,
    previousClose: previousClose,
    change: change,
    changePercent: changePercent,
    volume: Math.floor(1000000 + Math.random() * 10000000),
    marketCap: basePrice * (1000000000 + Math.random() * 1000000000),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 获取股票历史财报日期
 * @param symbol 股票代码
 * @param years 要获取的年数，默认为5
 */
export const getEarningsDates = async (symbol: string, years: number = 5): Promise<any> => {
  try {
    // 重用更完整的实现
    const fullData = await getEarningsFullData(symbol);

    // 只返回earningsDates部分
    return {
      symbol,
      earningsDates: fullData.enhancedData.earningsDates,
    };
  } catch (error) {
    return handleYahooFinanceError(error, `获取${symbol}历史财报日期`);
  }
};

/**
 * 获取股票的全部信息处理函数
 */
export const getAllStockInfoHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const symbol = req.params.symbol;

    if (!symbol) {
      res.status(400).json({
        error: '参数错误',
        message: '请提供股票代码',
      });
      return;
    }

    const allStockInfo = await getAllStockInfo(symbol);
    res.json(allStockInfo);
  } catch (error: any) {
    console.error('获取股票全部信息出错:', error);
    res.status(500).json({
      error: '获取股票全部信息失败',
      message: error.message || '未知错误',
    });
  }
};

/**
 * 获取股票详细财报数据
 * @param symbol 股票代码
 * @returns 详细的财报数据包括财报日期、SEC文件等
 */
export const getEarningsFullData = async (symbol: string): Promise<any> => {
  try {
    console.log(`开始获取${symbol}的详细财报数据`);

    // 存储原始结果
    const result: any = {
      symbol,
      originalData: { symbol },
    };

    // 使用非验证模式获取数据
    const options = {
      validateResult: false, // 禁用结果验证，避免模式不匹配的错误
      devel: true, // 开发模式，获取详细信息
    };

    // 尝试使用quoteSummary方法获取所有需要的模块
    try {
      console.log(`尝试使用quoteSummary获取${symbol}的财报数据`);

      // 临时禁用全局验证，仅用于此次请求
      const currentValidation = yahooFinance.defaultOptions.validation;
      yahooFinance.defaultOptions.validation = { logErrors: false, logWarnings: false };

      // 获取多个模块
      const quoteSummaryData = await yahooFinance.quoteSummary(symbol, {
        modules: ['earnings', 'earningsHistory', 'calendarEvents', 'secFilings'],
        ...options,
      });

      // 恢复原来的验证设置
      yahooFinance.defaultOptions.validation = currentValidation;

      console.log(`quoteSummary返回的数据类型: ${typeof quoteSummaryData}`);
      if (quoteSummaryData) {
        if (
          quoteSummaryData.quoteSummary &&
          quoteSummaryData.quoteSummary.result &&
          quoteSummaryData.quoteSummary.result.length > 0
        ) {
          const data = quoteSummaryData.quoteSummary.result[0];
          console.log(`成功获取到包含以下模块的数据: ${Object.keys(data).join(', ')}`);

          // 保存原始数据
          Object.keys(data).forEach(module => {
            result.originalData[module] = data[module];
          });

          // 打印部分样本数据
          if (data.earnings) {
            console.log(
              'earnings部分数据样本:',
              JSON.stringify(data.earnings).substring(0, 200) + '...'
            );
          }
          if (data.earningsHistory && data.earningsHistory.history) {
            console.log(`发现${data.earningsHistory.history.length}条财报历史记录`);
          }
        } else {
          // 尝试直接使用数据
          console.log(`API返回格式异常，尝试直接解析数据`);

          if (quoteSummaryData.earnings) result.originalData.earnings = quoteSummaryData.earnings;
          if (quoteSummaryData.earningsHistory)
            result.originalData.earningsHistory = quoteSummaryData.earningsHistory;
          if (quoteSummaryData.calendarEvents)
            result.originalData.calendarEvents = quoteSummaryData.calendarEvents;
          if (quoteSummaryData.secFilings)
            result.originalData.secFilings = quoteSummaryData.secFilings;

          console.log(
            `直接解析结果: 获取到的模块: ${Object.keys(result.originalData)
              .filter(k => k !== 'symbol')
              .join(', ')}`
          );
        }
      } else {
        console.log(`quoteSummary未返回有效数据`);
      }
    } catch (error) {
      console.error(`使用quoteSummary获取财报数据失败:`, error);
    }

    // 尝试使用earnings方法获取财报数据
    try {
      console.log(`尝试使用earnings方法获取${symbol}的财报数据`);
      const earningsData = await yahooFinance.earnings(symbol, options);

      if (earningsData) {
        console.log(`earnings方法数据结构: ${Object.keys(earningsData).join(', ')}`);
        result.originalData.earningsMethod = earningsData;
      } else {
        console.log(`earnings方法未返回有效数据`);
      }
    } catch (error) {
      console.error(`使用earnings方法获取财报数据失败:`, error);
    }

    // 增强数据
    const enhancedData: any = {
      earningsDates: [],
      secFilings: [],
      upcomingEarningsDate: null,
      earningsHistory: [],
      earningsQuarterly: [],
    };

    // 处理财报历史 - 使用quoteSummary方法获取的数据
    if (result.originalData.earningsHistory && result.originalData.earningsHistory.history) {
      try {
        console.log(`处理${result.originalData.earningsHistory.history.length}条财报历史记录`);
        result.originalData.earningsHistory.history.forEach((item: any, index: number) => {
          try {
            if (item) {
              console.log(
                `处理财报历史记录 #${index + 1}:`,
                JSON.stringify(item).substring(0, 200)
              );

              // 从quarter获取季度结束日期
              const earningDate = item.quarter ? new Date(item.quarter * 1000) : null;
              const quarterDate = earningDate ? earningDate.toISOString().split('T')[0] : null;

              // 从date获取财报发布日期
              const reportDate = item.date
                ? new Date(item.date * 1000).toISOString().split('T')[0]
                : null;

              const historyItem = {
                date: item.period || quarterDate,
                quarter: quarterDate,
                quarterTimestamp: item.quarter,
                reportDate: reportDate,
                reportTimestamp: item.date,
                epsActual: item.epsActual !== undefined ? item.epsActual : null,
                epsEstimate: item.epsEstimate !== undefined ? item.epsEstimate : null,
                epsDifference: item.surprise !== undefined ? item.surprise : null,
                surprisePercent: item.surprisePercent !== undefined ? item.surprisePercent : null,
              };

              enhancedData.earningsHistory.push(historyItem);

              // 添加到财报日期列表
              if (reportDate) {
                enhancedData.earningsDates.push({
                  date: reportDate,
                  quarterEndDate: quarterDate,
                  epsActual: historyItem.epsActual,
                  epsEstimate: historyItem.epsEstimate,
                  epsDifference: historyItem.epsDifference,
                  surprisePercent: historyItem.surprisePercent,
                  isUpcoming: false,
                });
              }
            }
          } catch (itemError) {
            console.error(`处理财报历史记录 #${index + 1} 时出错:`, itemError);
          }
        });
      } catch (historyError) {
        console.error(`处理财报历史记录时出错:`, historyError);
      }
    }

    // 处理即将到来的财报日期
    if (result.originalData.calendarEvents && result.originalData.calendarEvents.earnings) {
      try {
        const earningsInfo = result.originalData.calendarEvents.earnings;
        console.log(`处理即将到来的财报日期:`, JSON.stringify(earningsInfo).substring(0, 200));

        if (earningsInfo.earningsDate) {
          const upcomingDates = Array.isArray(earningsInfo.earningsDate)
            ? earningsInfo.earningsDate
            : [earningsInfo.earningsDate];

          if (upcomingDates.length > 0) {
            const upcomingTimestamp = upcomingDates[0];
            const upcomingDate = new Date(upcomingTimestamp * 1000).toISOString();

            enhancedData.upcomingEarningsDate = {
              date: upcomingDate,
              timestamp: upcomingTimestamp,
              estimated: true,
            };

            // 添加到财报日期列表
            enhancedData.earningsDates.unshift({
              date: upcomingDate.split('T')[0],
              quarterEndDate: null,
              epsActual: null,
              epsEstimate: earningsInfo.earningsAverage || null,
              epsDifference: null,
              surprisePercent: null,
              isUpcoming: true,
            });
          }
        }
      } catch (upcomingError) {
        console.error(`处理即将到来的财报日期时出错:`, upcomingError);
      }
    }

    // 处理财报季度数据
    if (result.originalData.earnings && result.originalData.earnings.earningsChart) {
      try {
        const { earningsChart } = result.originalData.earnings;
        console.log(`处理财报季度数据:`, JSON.stringify(earningsChart).substring(0, 200));

        if (earningsChart.quarterly && Array.isArray(earningsChart.quarterly)) {
          earningsChart.quarterly.forEach((item: any, index: number) => {
            try {
              enhancedData.earningsQuarterly.push({
                date: item.date,
                actual: item.actual !== undefined ? item.actual : null,
                estimate: item.estimate !== undefined ? item.estimate : null,
              });
            } catch (quarterlyError) {
              console.error(`处理财报季度数据 #${index + 1} 时出错:`, quarterlyError);
            }
          });
        }
      } catch (quarterlyError) {
        console.error(`处理财报季度数据时出错:`, quarterlyError);
      }
    }

    // 处理earnings方法返回的数据 (备选数据源)
    if (result.originalData.earningsMethod && result.originalData.earningsMethod.earningsData) {
      try {
        const earningsData = result.originalData.earningsMethod.earningsData;
        console.log(`处理earnings方法数据:`, JSON.stringify(earningsData).substring(0, 200));

        if (Array.isArray(earningsData)) {
          earningsData.forEach((item: any, index: number) => {
            try {
              if (item.date && (item.epsActual !== undefined || item.epsEstimate !== undefined)) {
                // 检查是否已经存在相同日期的记录
                const existingIndex = enhancedData.earningsDates.findIndex(
                  (e: any) => e.date === item.date
                );

                if (existingIndex === -1) {
                  enhancedData.earningsDates.push({
                    date: item.date,
                    quarterEndDate: item.quarter || null,
                    epsActual: item.epsActual !== undefined ? item.epsActual : null,
                    epsEstimate: item.epsEstimate !== undefined ? item.epsEstimate : null,
                    epsDifference: null,
                    surprisePercent: null,
                    isUpcoming: false,
                  });
                }
              }
            } catch (itemError) {
              console.error(`处理earnings方法数据 #${index + 1} 时出错:`, itemError);
            }
          });
        }
      } catch (earningsMethodError) {
        console.error(`处理earnings方法数据时出错:`, earningsMethodError);
      }
    }

    // 如果没有获取到任何财报日期，添加一个模拟数据
    if (enhancedData.earningsDates.length === 0) {
      console.log(`警告: 未能获取到任何财报日期数据，添加模拟数据`);

      // 添加一条模拟数据作为示例
      const today = new Date();
      const nextQuarter = new Date(today);
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);

      enhancedData.earningsDates.push({
        date: nextQuarter.toISOString().split('T')[0],
        quarterEndDate: null,
        epsActual: null,
        epsEstimate: null,
        epsDifference: null,
        surprisePercent: null,
        isUpcoming: true,
        isMock: true,
      });

      // 添加警告信息
      result.warning = '无法获取真实财报日期数据，显示的是模拟数据';
    }

    // 按日期降序排序
    enhancedData.earningsDates.sort((a: any, b: any) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    console.log(`最终获取到 ${enhancedData.earningsDates.length} 条财报日期记录`);

    result.enhancedData = enhancedData;
    return result;
  } catch (error) {
    console.error('获取详细财报数据时出错:', error);
    throw handleYahooFinanceError(error);
  }
};

/**
 * 获取股票历史财报日期的请求处理函数
 */
export const getEarningsDatesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const symbol = req.params.symbol;
    const years = req.query.years ? parseInt(req.query.years as string, 10) : 5;

    if (isNaN(years) || years <= 0 || years > 10) {
      res.status(400).json({
        error: '参数错误',
        message: 'years参数必须是1-10之间的整数',
      });
      return;
    }

    const earningsDates = await getEarningsDates(symbol, years);
    res.json(earningsDates);
  } catch (error: any) {
    console.error('获取历史财报日期出错:', error);
    res.status(500).json({
      error: '获取财报日期失败',
      message: error.message || '未知错误',
    });
  }
};

/**
 * 处理获取股票详细财报数据的API请求
 * @param req 请求对象
 * @param res 响应对象
 */
export const getEarningsFullDataHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: '请提供股票代码' });
    }

    // 调用getEarningsFullData函数获取详细财报数据
    const data = await getEarningsFullData(symbol);
    return res.json(data);
  } catch (error: any) {
    console.error('获取详细财报数据时出错:', error);
    return res.status(500).json({ error: '获取详细财报数据时出错', details: error.message });
  }
};
