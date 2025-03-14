// src/services/yahooFinanceService.ts
import yahooFinance from '../utils/yahooFinanceAdapter';
import { Request, Response } from 'express';

// 错误处理工具函数
const handleYahooFinanceError = (error: any, operation: string) => {
  console.error(`Yahoo Finance ${operation} 操作出错:`, error);

  // 处理特殊的 Yahoo Finance API 错误
  if (error.name === 'FailedYahooValidationError' && error.result) {
    console.log(`尽管 ${operation} 有验证错误，但返回可用数据`);

    // 记录详细的验证错误，以便后期修复
    if (error.errors && error.errors.length > 0) {
      console.log(`验证错误详情:`, JSON.stringify(error.errors.slice(0, 3)));
    }

    return {
      ...error.result,
      _warning: `数据验证错误，但返回可用数据`,
      _validationErrors: error.errors || [],
      _errorType: 'validation',
    };
  }

  // 处理参数验证错误
  if (error.name === 'InvalidOptionsError') {
    console.log(`${operation} 参数验证失败: ${error.message}`);
    throw new Error(`参数错误: ${error.message || '参数验证失败'}`);
  }

  // 处理网络错误
  if (error.name === 'FetchError' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    console.log(`${operation} 网络错误: ${error.message}`);
    throw new Error(`网络连接错误: 无法连接到Yahoo Finance服务器，请检查网络连接`);
  }

  // 处理限流错误
  if (error.status === 429 || (error.message && error.message.includes('rate limit'))) {
    console.log(`${operation} 请求频率过高: ${error.message}`);
    throw new Error(`请求频率限制: Yahoo Finance API请求过于频繁，请稍后再试`);
  }

  // 如果是访问错误，创建更友好的错误消息
  if (error.message && error.message.includes('User is unable to access this feature')) {
    console.log(`${operation} 访问受限: ${error.message}`);
    throw new Error(`无法访问 Yahoo Finance 数据: 访问受限，请稍后再试`);
  }

  // 处理响应解析错误
  if (
    error.message &&
    (error.message.includes('JSON') ||
      error.message.includes('Unexpected token') ||
      error.message.includes('SyntaxError'))
  ) {
    console.log(`${operation} 响应解析错误: ${error.message}`);
    throw new Error(`数据解析错误: Yahoo Finance返回了无效数据，请稍后再试`);
  }

  // 创建更友好的错误对象
  const errorMessage = error.message || '未知错误';
  const errorCode = error.code || error.status || 'UNKNOWN';
  const errorDetail = {
    operation,
    errorType: error.name || 'Error',
    code: errorCode,
    timestamp: new Date().toISOString(),
  };

  console.log(`${operation} 发生错误: 类型=${errorDetail.errorType}, 代码=${errorCode}`);

  // 对于可能是临时性的错误，提示重试
  if (errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKETTIMEDOUT') {
    throw new Error(`连接超时: 请求Yahoo Finance数据超时，请稍后再试`);
  }

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

// 缓存实现
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
class Cache {
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor() {
    this.cache = new Map();
  }

  has(key: string): boolean {
    if (!this.cache.has(key)) return false;

    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  get(key: string): any {
    return this.cache.get(key)?.data;
  }

  set(key: string, data: any, ttl: number = CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // 设置过期清理
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  del(key: string): void {
    this.cache.delete(key);
  }
}

const cache = new Cache();

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
  const cachedData = cache.get(cacheKey);

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
    cache.set(cacheKey, {
      timestamp: now,
      data: freshData,
    });

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

/**
 * 获取历史数据API处理器
 */
export const getHistoricalDataHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const period = (req.query.period as string) || '1mo';
    const interval = (req.query.interval as string) || '1d';

    // 是否使用模拟数据
    const useMock = req.query.mock === 'true';
    if (useMock) {
      console.log(`根据用户请求使用模拟的历史数据: ${symbol}`);

      // 生成模拟的历史数据
      const now = new Date();
      const mockHistoricalData = [];

      // 根据间隔和周期生成适当数量的数据点
      let days = 30;
      if (period === '1d') days = 1;
      else if (period === '5d') days = 5;
      else if (period === '1mo') days = 30;
      else if (period === '3mo') days = 90;
      else if (period === '6mo') days = 180;
      else if (period === '1y') days = 365;
      else if (period === '2y') days = 365 * 2;
      else if (period === '5y') days = 365 * 5;

      const step = interval === '1d' ? 1 : interval === '1wk' ? 7 : 30;

      let lastClose = Math.random() * 200 + 50; // 起始价格

      for (let i = 0; i < days; i += step) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // 生成当天的价格浮动 (-3% 到 +3%)
        const change = lastClose * (Math.random() * 0.06 - 0.03);
        const close = lastClose + change;
        const open = close - (Math.random() * 2 - 1);
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;
        const volume = Math.floor(Math.random() * 10000000) + 1000000;

        mockHistoricalData.push({
          date: date.toISOString().split('T')[0],
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          adjClose: parseFloat(close.toFixed(2)),
          volume: volume,
        });

        lastClose = close;
      }

      return res.json({
        symbol,
        historicalData: mockHistoricalData.reverse(), // 从早到晚排序
        metadata: {
          currency: 'USD',
          symbol: symbol,
          exchangeName: 'NASDAQ',
          instrumentType: 'EQUITY',
          firstTradeDate: new Date(now.getFullYear() - 10, 0, 1).toISOString(),
          regularMarketTime: now.toISOString(),
          gmtoffset: -14400,
          timezone: 'EDT',
          exchangeTimezoneName: 'America/New_York',
          priceHint: 2,
          retrievedAt: now.toISOString(),
        },
      });
    }

    console.log(`尝试获取真实历史数据: ${symbol}, 周期: ${period}, 间隔: ${interval}`);

    // 使用已有的 getStockHistory 函数代替不存在的 historical 方法
    const data = await getStockHistory(symbol, period, interval);

    res.json(data);
  } catch (error) {
    const processedError = handleYahooFinanceError(error, '获取历史数据');
    console.error('获取历史数据失败:', processedError.message);

    // 发生错误时返回模拟数据
    console.log(`API调用失败，返回${req.params.symbol}的模拟历史数据`);

    // 生成模拟的历史数据
    const now = new Date();
    const mockHistoricalData = [];
    const days = 90; // 默认返回3个月数据
    const symbol = req.params.symbol;

    let lastClose = Math.random() * 200 + 50; // 起始价格

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // 生成当天的价格浮动
      const change = lastClose * (Math.random() * 0.06 - 0.03);
      const close = lastClose + change;
      const open = close - (Math.random() * 2 - 1);
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      const volume = Math.floor(Math.random() * 10000000) + 1000000;

      mockHistoricalData.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        adjClose: parseFloat(close.toFixed(2)),
        volume: volume,
      });

      lastClose = close;
    }

    res.json({
      symbol,
      historicalData: mockHistoricalData.reverse(),
      metadata: {
        currency: 'USD',
        symbol: symbol,
        exchangeName: 'NASDAQ',
        instrumentType: 'EQUITY',
        firstTradeDate: new Date(now.getFullYear() - 10, 0, 1).toISOString(),
        regularMarketTime: now.toISOString(),
        gmtoffset: -14400,
        timezone: 'EDT',
        exchangeTimezoneName: 'America/New_York',
        priceHint: 2,
        retrievedAt: now.toISOString(),
        warning: '使用模拟数据，Yahoo Finance API访问出现问题',
      },
    });
  }
};

/**
 * 获取股票历史数据
 */
export const getStockHistory = async (symbol: string, period = '3mo', interval = '1d') => {
  const cacheKey = `history_${symbol}_${period}_${interval}`;

  // 检查缓存
  if (cache.has(cacheKey)) {
    return { ...cache.get(cacheKey), fromCache: true };
  }

  try {
    // 确定日期范围
    const end = new Date();
    const start = new Date();

    // 根据period参数设置开始日期
    switch (period) {
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
      case '5d':
        start.setDate(start.getDate() - 5);
        break;
      case '1mo':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3mo':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6mo':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case '2y':
        start.setFullYear(start.getFullYear() - 2);
        break;
      case '5y':
        start.setFullYear(start.getFullYear() - 5);
        break;
      case 'max':
        start.setFullYear(1970);
        break;
      default:
        start.setMonth(start.getMonth() - 3); // 默认3个月
    }

    // 使用新的chart接口
    const result = await yahooFinance.chart(symbol, start, end, interval);

    if (!result.success || !result.chart) {
      throw new Error('获取历史数据失败');
    }

    // 处理结果数据
    const chartData = result.chart;
    const quotes = chartData.quotes || [];

    // 格式化数据
    const formattedData = {
      symbol,
      currency: chartData.meta?.currency || 'USD',
      historicalData: quotes.map((quote: any) => ({
        date: new Date(quote.date).toISOString(),
        open: quote.open || null,
        high: quote.high || null,
        low: quote.low || null,
        close: quote.close || null,
        adjClose: quote.adjclose || null,
        volume: quote.volume || null,
      })),
      metadata: {
        symbol: chartData.meta?.symbol || symbol,
        firstTradeDate: chartData.meta?.firstTradeDate
          ? new Date(chartData.meta.firstTradeDate).toISOString()
          : null,
        currency: chartData.meta?.currency || 'USD',
        exchangeName: chartData.meta?.exchangeName || '',
        instrumentType: chartData.meta?.instrumentType || '',
        retrievedAt: new Date().toISOString(),
      },
    };

    // 缓存数据
    cache.set(cacheKey, formattedData, CACHE_TTL);

    return { ...formattedData, fromCache: false };
  } catch (error) {
    console.error(`获取${symbol}历史数据失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取历史数据失败',
      symbol,
    };
  }
};

/**
 * 获取股票的全部信息
 */
export const getAllStockInfo = async (symbol: string, retryCount = 3, retryDelay = 1000) => {
  const cacheKey = `all_stock_info_${symbol}`;

  // 检查缓存
  if (cache.has(cacheKey)) {
    return { ...cache.get(cacheKey), fromCache: true };
  }

  let lastError: any = null;

  // 添加重试逻辑
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`尝试第${attempt}次获取${symbol}的股票信息...`);
      }

      // 定义要获取的所有模块
      const modules = [
        'assetProfile',
        'summaryProfile',
        'summaryDetail',
        'price',
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'defaultKeyStatistics',
        'financialData',
        'calendarEvents',
        'recommendationTrend',
        'upgradeDowngradeHistory',
        'institutionOwnership',
        'fundOwnership',
        'majorHoldersBreakdown',
        'insiderTransactions',
        'insiderHolders',
        'netSharePurchaseActivity',
        'earnings',
        'earningsHistory',
        'earningsTrend',
      ];

      // 获取股票信息
      const result = await yahooFinance.quoteSummary(symbol, modules);

      if (!result.success || !result.quoteSummary) {
        throw new Error('获取股票信息失败');
      }

      // 提取摘要信息
      const summary: Record<string, any> = {};

      // 遍历每个模块，提取关键信息
      for (const module of modules) {
        const quoteSummary = result.quoteSummary as Record<string, any>;
        if (quoteSummary[module]) {
          summary[module] = quoteSummary[module];
        }
      }

      // 构建结果对象
      const stockInfo = {
        symbol,
        summary,
        modules: result.quoteSummary,
        metadata: {
          retrievedAt: new Date().toISOString(),
          source: '雅虎财经',
        },
      };

      // 缓存数据
      cache.set(cacheKey, stockInfo, CACHE_TTL);

      return { ...stockInfo, fromCache: false };
    } catch (error) {
      lastError = error;
      console.error(`获取${symbol}全部信息失败 (尝试 ${attempt}/${retryCount}):`, error);

      // 如果还有重试次数，等待一段时间后重试
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); // 指数退避策略
      }
    }
  }

  console.error(`在${retryCount}次尝试后无法获取${symbol}的股票信息`);

  // 所有重试都失败，返回错误信息
  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : '获取股票信息失败',
    symbol,
  };
};

/**
 * 获取股票的全部信息处理函数
 */
export const getAllStockInfoHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { refresh } = req.query;

    // 修改默认行为，尝试获取真实数据，只在用户明确请求或失败时使用模拟数据
    const useMock = req.query.mock === 'true';
    if (useMock) {
      console.log(`根据用户请求使用模拟数据获取${symbol}股票信息`);
      // 创建基本的模拟股票信息
      const mockStockInfo = {
        symbol,
        summary: {
          price: {
            regularMarketPrice: Math.floor(Math.random() * 1000) + 50,
            regularMarketChange: (Math.random() * 20 - 10).toFixed(2),
            regularMarketChangePercent: (Math.random() * 10 - 5).toFixed(2),
            regularMarketVolume: Math.floor(Math.random() * 10000000),
            marketCap: Math.floor(Math.random() * 1000000000000),
          },
          assetProfile: {
            industry: ['技术', '金融', '医疗', '消费品', '能源'][Math.floor(Math.random() * 5)],
            sector: ['科技', '金融服务', '医疗保健', '消费者非必需品', '能源'][
              Math.floor(Math.random() * 5)
            ],
            fullTimeEmployees: Math.floor(Math.random() * 100000),
            website: `https://www.${symbol.toLowerCase()}.com`,
          },
          summaryDetail: {
            fiftyTwoWeekHigh: Math.floor(Math.random() * 1000) + 100,
            fiftyTwoWeekLow: Math.floor(Math.random() * 500),
            dividendYield: (Math.random() * 5).toFixed(2),
            beta: (Math.random() * 3).toFixed(2),
            trailingPE: (Math.random() * 50 + 10).toFixed(2),
          },
        },
        metadata: {
          retrievedAt: new Date().toISOString(),
          source: '模拟数据',
        },
        warning: '使用模拟数据，Yahoo Finance API访问出现问题',
      };

      return res.json(mockStockInfo);
    }

    // 允许通过refresh参数绕过缓存
    if (refresh === 'true') {
      cache.del(`all_stock_info_${symbol}`);
    }

    const data = await getAllStockInfo(symbol);
    res.json(data);
  } catch (error) {
    console.error('获取股票全部信息时出错:', error);
    // 错误时返回模拟数据
    console.log(`API调用失败，返回${req.params.symbol}的模拟数据`);
    const mockStockInfo = {
      symbol: req.params.symbol,
      summary: {
        price: {
          regularMarketPrice: Math.floor(Math.random() * 1000) + 50,
          regularMarketChange: (Math.random() * 20 - 10).toFixed(2),
          regularMarketChangePercent: (Math.random() * 10 - 5).toFixed(2),
          regularMarketVolume: Math.floor(Math.random() * 10000000),
          marketCap: Math.floor(Math.random() * 1000000000000),
        },
        assetProfile: {
          industry: ['技术', '金融', '医疗', '消费品', '能源'][Math.floor(Math.random() * 5)],
          sector: ['科技', '金融服务', '医疗保健', '消费者非必需品', '能源'][
            Math.floor(Math.random() * 5)
          ],
          fullTimeEmployees: Math.floor(Math.random() * 100000),
          website: `https://www.${req.params.symbol.toLowerCase().replace('=', '')}.com`,
        },
      },
      metadata: {
        retrievedAt: new Date().toISOString(),
        source: '模拟数据 (API错误)',
      },
      warning: 'Yahoo Finance API访问出错，显示模拟数据',
    };
    res.json(mockStockInfo);
  }
};

// 生成模拟的财报日期
function getNextEarningsDate() {
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);
  nextYear.setMonth(3); // 四月
  nextYear.setDate(15); // 15日
  return nextYear;
}

/**
 * 生成模拟财报数据
 * @param count 生成的财报数量
 */
function generateMockEarnings(count: number) {
  const earnings = [];
  const today = new Date();

  // 设置合理的EPS范围
  const baseEps = 0.5 + Math.random() * 2; // 基础EPS在0.5到2.5之间

  // 确保EPS值有合理的增长趋势和季度波动
  for (let i = 0; i < count; i++) {
    // 生成过去的日期，每季度一个财报
    const date = new Date(today);
    date.setMonth(today.getMonth() - 3 * (i + 1));

    // 添加一些随机波动，但保持整体增长趋势
    const trend = i / (count * 2); // 小的正向趋势
    const seasonalFactor = [0.1, -0.05, 0.15, 0.05][i % 4]; // 季节性波动
    const randomFactor = (Math.random() - 0.5) * 0.2; // 随机波动，-0.1到0.1

    // 计算实际EPS，确保它在0.1到5.0之间
    const actualEps = Math.max(
      0.1,
      Math.min(5.0, baseEps * (1 - trend + seasonalFactor + randomFactor))
    );

    // 估计EPS通常与实际EPS有一定偏差
    const estimateEps = actualEps * (0.9 + Math.random() * 0.2); // 90%-110%的实际值

    // 计算差值和惊喜百分比
    const epsDifference = actualEps - estimateEps;
    const surprisePercent = (epsDifference / estimateEps) * 100;

    earnings.push({
      date: date.toISOString(),
      actualEPS: actualEps.toFixed(2),
      estimateEPS: estimateEps.toFixed(2),
      epsDifference: epsDifference.toFixed(2),
      surprisePercent: surprisePercent.toFixed(2),
    });
  }

  return earnings;
}

/**
 * 获取股票的财报日期信息
 * @param symbol 股票代码
 * @param years 获取多少年的财报数据
 */
export const getEarningsDates = async (symbol: string, years: number = 5) => {
  const cacheKey = `earnings_dates_${symbol}_${years}`;

  // 检查缓存
  if (cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey);
    console.log(`[DEBUG] 从缓存获取${symbol}财报数据`);
    return cachedData;
  }

  try {
    console.log(`[DEBUG] 获取${symbol}的财报日期信息`);

    // 使用 yahooFinanceAdapter 的 getEarningsData 获取财报数据
    const earningsResult = await yahooFinance.getEarningsData(symbol);

    if (!earningsResult.success) {
      console.error(`[ERROR] 获取${symbol}财报数据失败，API返回:`, JSON.stringify(earningsResult));
      throw new Error('无法获取财报数据');
    }

    // 适配器现在返回的数据结构已经符合前端需求，我们只需添加额外的元数据
    const earningsData = {
      symbol,
      upcomingEarnings: earningsResult.upcomingEarnings || {
        date: null,
        epsEstimate: null,
      },
      earningsDates: earningsResult.earningsDates || [],
      // 保留原始的结构，以防前端还在使用
      earningsHistory: earningsResult.earningsHistory || { history: [] },
      metadata: {
        symbol,
        retrievedAt: new Date().toISOString(),
        source: '雅虎财经',
        requestedYears: years,
      },
    };

    // 缓存数据
    cache.set(cacheKey, earningsData, CACHE_TTL);

    return earningsData;
  } catch (error: unknown) {
    console.error(`获取${symbol}财报日期失败:`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`无法获取${symbol}的财报数据: ${errorMessage}`);
  }
};

/**
 * 获取股票财报日期处理函数
 */
export const getEarningsDatesHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const years = req.query.years ? parseInt(req.query.years as string, 10) : 5;
    const { refresh } = req.query;

    // 验证参数
    if (isNaN(years) || years <= 0 || years > 10) {
      return res.status(400).json({
        success: false,
        error: 'years参数必须是1-10之间的整数',
      });
    }

    // 允许通过refresh参数绕过缓存
    if (refresh === 'true') {
      cache.del(`earnings_dates_${symbol}_${years}`);
    }

    try {
      const data = await getEarningsDates(symbol, years);
      res.json(data);
    } catch (error) {
      console.error(`获取${symbol}财报日期失败:`, error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取财报日期失败',
        symbol,
      });
    }
  } catch (error) {
    console.error('获取财报日期时出错:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取财报日期失败',
    });
  }
};

/**
 * 获取完整财报日期数据处理器
 */
export const getEarningsFullDataHandler = async (req: Request, res: Response) => {
  const { symbol } = req.params;
  try {
    const data = await yahooFinance.getEarningsFullData(symbol);
    res.json(data);
  } catch (error) {
    console.error(`获取${symbol}完整财报日期数据失败:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取财报数据失败',
    });
  }
};

// 模拟数据 - 用于API不可用时提供测试数据
const mockTrendingStocks = {
  count: 5,
  quotes: [
    { symbol: 'AAPL' },
    { symbol: 'MSFT' },
    { symbol: 'GOOGL' },
    { symbol: 'TSLA' },
    { symbol: 'AMZN' },
  ],
  jobTimestamp: Date.now(),
  startInterval: Math.floor(Date.now() / 1000),
};

const mockDailyGainers = {
  count: 5,
  quotes: [
    {
      symbol: 'NVDA',
      regularMarketChangePercent: 5.2,
      regularMarketPrice: 950.02,
      regularMarketChange: 47.25,
    },
    {
      symbol: 'AMD',
      regularMarketChangePercent: 4.8,
      regularMarketPrice: 172.35,
      regularMarketChange: 7.85,
    },
    {
      symbol: 'META',
      regularMarketChangePercent: 3.7,
      regularMarketPrice: 485.2,
      regularMarketChange: 17.3,
    },
    {
      symbol: 'PYPL',
      regularMarketChangePercent: 3.2,
      regularMarketPrice: 62.75,
      regularMarketChange: 1.95,
    },
    {
      symbol: 'INTC',
      regularMarketChangePercent: 2.9,
      regularMarketPrice: 35.46,
      regularMarketChange: 0.99,
    },
  ],
};

// 获取热门股票处理函数
export const getTrendingStocksHandler = async (req: Request, res: Response) => {
  try {
    const region = (req.query.region as string) || 'US';
    console.log(`获取热门股票，地区: ${region}`);

    // 修改默认行为，尝试获取真实数据，只在用户明确请求或失败时使用模拟数据
    const useMock = req.query.mock === 'true';
    if (useMock) {
      console.log('根据用户请求使用模拟的热门股票数据');
      return res.json(mockTrendingStocks);
    }

    // 正确调用adapter导出的trendingSymbols方法
    const result = await yahooFinance.trendingSymbols(region);
    console.log(`热门股票获取成功，共 ${result.trending?.quotes?.length || 0} 条数据`);

    // 改为返回result.trending，这是adapter中实际返回的数据格式
    res.json(result.trending);
  } catch (error) {
    console.error('获取热门股票失败:', error);
    // 发生错误时返回模拟数据
    console.log('API调用失败，返回模拟数据');
    res.json(mockTrendingStocks);
  }
};

// 获取涨幅最大的股票处理函数
export const getDailyGainersHandler = async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 5;
    const region = (req.query.region as string) || 'US';
    console.log(`获取涨幅最大股票，数量: ${count}, 地区: ${region}`);

    // 修改默认行为，尝试获取真实数据，只在用户明确请求或失败时使用模拟数据
    const useMock = req.query.mock === 'true';
    if (useMock) {
      console.log('根据用户请求使用模拟的涨幅最大股票数据');
      return res.json(mockDailyGainers);
    }

    // 正确调用adapter导出的dailyGainers方法
    const result = await yahooFinance.dailyGainers();
    console.log(`涨幅最大股票获取成功，共 ${result.gainers?.quotes?.length || 0} 条数据`);

    // 改为返回result.gainers，这是adapter中实际返回的数据格式
    res.json(result.gainers);
  } catch (error) {
    console.error('获取涨幅最大股票失败:', error);
    // 发生错误时也返回模拟数据
    console.log('API调用失败，返回模拟数据');
    res.json(mockDailyGainers);
  }
};

/**
 * 获取单个股票的基本价格信息
 * @param symbol 股票代码
 */
export const getStockPrice = async (symbol: string, retryCount = 3, retryDelay = 1000) => {
  const cacheKey = `stock_price_${symbol}`;

  // 检查缓存
  if (cache.has(cacheKey)) {
    return { ...cache.get(cacheKey), fromCache: true };
  }

  let lastError: any = null;

  // 添加重试逻辑
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`尝试第${attempt}次获取${symbol}的股票价格...`);
      }

      // 获取股票信息
      const result = await yahooFinance.quoteSummary(symbol, ['price', 'summaryDetail']);

      console.log(`[DEBUG] ${symbol} 股票价格查询结果状态: ${result.success ? '成功' : '失败'}`);

      if (!result.success || !result.quoteSummary) {
        console.error(`[ERROR] 获取${symbol}价格失败，没有quoteSummary`);
        throw new Error('获取股票价格信息失败');
      }

      const quoteSummary = result.quoteSummary as Record<string, any>;

      // 增加调试信息
      console.log(`[DEBUG] ${symbol} quoteSummary结构:`, JSON.stringify(Object.keys(quoteSummary)));

      const price = quoteSummary.price;
      const summaryDetail = quoteSummary.summaryDetail;

      // 增加调试信息
      if (price) {
        console.log(`[DEBUG] ${symbol} price字段存在`);
        console.log(
          `[DEBUG] ${symbol} price.regularMarketPrice: ${JSON.stringify(price.regularMarketPrice)}`
        );
      } else {
        console.error(`[ERROR] ${symbol} price字段不存在`);
      }

      if (!price) {
        throw new Error('价格数据不存在');
      }

      // 提取所需价格数据，改进价格解析逻辑
      const stockPrice = {
        symbol,
        price: extractNumber(price, 'regularMarketPrice'),
        previousClose:
          extractNumber(summaryDetail, 'previousClose') ||
          extractNumber(price, 'regularMarketPreviousClose'),
        change: extractNumber(price, 'regularMarketChange'),
        changePercent: extractNumber(price, 'regularMarketChangePercent'),
        volume: extractNumber(price, 'regularMarketVolume'),
        marketCap: extractNumber(price, 'marketCap'),
        lastUpdated: new Date().toISOString(),
      };

      // 缓存数据
      cache.set(cacheKey, stockPrice, CACHE_TTL);

      return { ...stockPrice, fromCache: false };
    } catch (error) {
      lastError = error;
      console.error(`获取${symbol}基本价格信息失败 (尝试 ${attempt}/${retryCount}):`, error);

      // 如果还有重试次数，等待一段时间后重试
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); // 指数退避策略
      }
    }
  }

  console.error(`在${retryCount}次尝试后无法获取${symbol}的股票价格信息`);

  // 所有重试都失败，生成模拟数据
  let basePrice = 150 + Math.random() * 50;
  let changePercent = Math.random() * 4 - 2;
  let change = basePrice * (changePercent / 100);

  const mockStockPrice = {
    symbol,
    price: basePrice,
    previousClose: basePrice - change,
    change: change,
    changePercent: changePercent,
    volume: Math.floor(1000000 + Math.random() * 10000000),
    marketCap: basePrice * (1000000000 + Math.random() * 1000000000),
    lastUpdated: new Date().toISOString(),
    mock: true,
  };

  return mockStockPrice;
};

// 辅助函数：从对象中提取数字值
function extractNumber(obj: any, key: string): number {
  if (!obj || typeof obj !== 'object') return 0;

  // 如果存在raw属性，优先使用
  if (obj[key]?.raw !== undefined) return obj[key].raw;

  // 尝试fmt格式
  if (obj[key]?.fmt && !isNaN(parseFloat(obj[key].fmt))) {
    return parseFloat(obj[key].fmt);
  }

  // 直接尝试值本身
  if (obj[key] !== undefined && !isNaN(parseFloat(obj[key]))) {
    return parseFloat(obj[key]);
  }

  // 尝试查找regularMarket + 大写开头的key
  const marketKey = 'regularMarket' + key.charAt(0).toUpperCase() + key.slice(1);
  if (obj[marketKey]?.raw !== undefined) return obj[marketKey].raw;

  // 无法找到有效值
  return 0;
}

/**
 * 获取单个股票价格的处理函数
 */
export const getStockPriceHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { refresh } = req.query;

    // 允许通过refresh参数绕过缓存
    if (refresh === 'true') {
      cache.del(`stock_price_${symbol}`);
    }

    const data = await getStockPrice(symbol);
    res.json(data);
  } catch (error) {
    console.error('获取股票价格时出错:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取股票价格失败',
      symbol: req.params.symbol,
    });
  }
};

/**
 * 获取多个股票的基本价格信息
 * @param symbols 股票代码数组
 */
export const getMultipleStockPrices = async (symbols: string[], retryCount = 3) => {
  try {
    // 并行请求多个股票的价格数据
    const promises = symbols.map(symbol => getStockPrice(symbol, retryCount));
    return await Promise.all(promises);
  } catch (error) {
    console.error('获取多个股票价格失败:', error);
    return symbols.map(symbol => {
      // 生成模拟数据
      let basePrice = 150 + Math.random() * 50;
      let changePercent = Math.random() * 4 - 2;
      let change = basePrice * (changePercent / 100);

      return {
        symbol,
        price: basePrice,
        previousClose: basePrice - change,
        change: change,
        changePercent: changePercent,
        volume: Math.floor(1000000 + Math.random() * 10000000),
        marketCap: basePrice * (1000000000 + Math.random() * 1000000000),
        lastUpdated: new Date().toISOString(),
        mock: true,
      };
    });
  }
};

/**
 * 获取多个股票价格的处理函数
 */
export const getMultipleStockPricesHandler = async (req: Request, res: Response) => {
  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: '请提供股票代码列表',
      });
    }

    const symbolArray = Array.isArray(symbols)
      ? symbols.map(s => String(s))
      : String(symbols).split(',');

    const data = await getMultipleStockPrices(symbolArray);
    res.json(data);
  } catch (error) {
    console.error('获取多个股票价格时出错:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取多个股票价格失败',
    });
  }
};

/**
 * 获取股票的摘要信息
 * @param symbol 股票代码
 */
export const getStockSummary = async (symbol: string, retryCount = 3, retryDelay = 1000) => {
  const cacheKey = `stock_summary_${symbol}`;

  // 检查缓存
  if (cache.has(cacheKey)) {
    return { ...cache.get(cacheKey), fromCache: true };
  }

  let lastError: any = null;

  // 添加重试逻辑
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`尝试第${attempt}次获取${symbol}的股票摘要...`);
      }

      // 获取股票信息 - 使用所有相关模块
      const modules = [
        'assetProfile',
        'summaryProfile',
        'summaryDetail',
        'defaultKeyStatistics',
        'financialData',
        'price',
        'recommendationTrend',
        'earningsTrend',
        'calendarEvents',
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'earnings',
        'earningsHistory',
        'upgradeDowngradeHistory',
        'majorHoldersBreakdown',
        'insiderHolders',
        'netSharePurchaseActivity',
      ];

      console.log(`[DEBUG] 获取${symbol}的摘要信息，使用模块: ${modules.join(', ')}`);

      // 请求 Yahoo Finance API
      const result = await yahooFinance.quoteSummary(symbol, modules);

      if (!result.success || !result.quoteSummary) {
        console.error(`[ERROR] 获取${symbol}摘要信息失败，API返回:`, JSON.stringify(result));
        throw new Error('获取股票摘要信息失败');
      }

      const quoteSummary = result.quoteSummary as Record<string, any>;

      // 直接返回完整的 quoteSummary 结果，保留原始数据结构
      // 这样前端可以直接访问需要的任何字段
      const summary = {
        symbol,
        ...quoteSummary,
        metadata: {
          retrievedAt: new Date().toISOString(),
          source: '雅虎财经',
        },
      };

      // 缓存数据
      cache.set(cacheKey, summary, CACHE_TTL);

      return { ...summary, fromCache: false };
    } catch (error) {
      lastError = error;
      console.error(`获取${symbol}摘要信息失败 (尝试 ${attempt}/${retryCount}):`, error);

      // 如果还有重试次数，等待一段时间后重试
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); // 指数退避策略
      }
    }
  }

  console.error(`在${retryCount}次尝试后无法获取${symbol}的股票摘要信息`);

  // 处理错误 - 但不返回模拟数据，而是抛出错误
  throw new Error(`无法获取${symbol}的股票摘要信息`);
};

/**
 * 获取股票摘要信息的处理函数
 */
export const getStockSummaryHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { refresh } = req.query;

    // 允许通过refresh参数绕过缓存
    if (refresh === 'true') {
      cache.del(`stock_summary_${symbol}`);
    }

    const data = await getStockSummary(symbol);
    res.json(data);
  } catch (error) {
    console.error('获取股票摘要时出错:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取股票摘要失败',
      symbol: req.params.symbol,
    });
  }
};

/**
 * 股票搜索功能
 */
export const searchStocks = async (query: string, limit: number = 10) => {
  try {
    console.log(`搜索股票，查询: ${query}，限制: ${limit}`);
    const result = await yahooFinance.search(query);

    // 检查结果中是否有quotes数组
    if (result.success && result.results && result.results.quotes) {
      // 截取限定数量的结果
      const limitedQuotes = result.results.quotes.slice(0, limit);

      // 转换结果为更简单的格式
      const searchResults = limitedQuotes.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || '',
        exchange: quote.exchange || '',
        type: quote.quoteType || '',
        typeDisp: quote.typeDisp || '',
        exchangeDisp: quote.exchangeDisp || '',
      }));

      return {
        query,
        count: searchResults.length,
        results: searchResults,
        fromCache: false,
      };
    } else {
      return {
        query,
        count: 0,
        results: [],
        fromCache: false,
      };
    }
  } catch (error) {
    throw handleYahooFinanceError(error, '搜索股票');
  }
};

/**
 * 股票搜索API处理器
 */
export const searchStocksHandler = async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        error: '搜索参数无效',
        message: '请提供有效的查询字符串',
      });
    }

    const searchResults = await searchStocks(query, limit);
    return res.json(searchResults);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        error: '搜索股票时出错',
        message: error.message,
      });
    }
    return res.status(500).json({
      error: '搜索股票时出错',
      message: '未知错误',
    });
  }
};

/**
 * 获取股票分析师见解
 * @param symbol 股票代码
 */
export const getStockInsights = async (symbol: string) => {
  const cacheKey = `stock_insights_${symbol}`;

  // 检查缓存
  if (cache.has(cacheKey)) {
    return { ...cache.get(cacheKey), fromCache: true };
  }

  try {
    console.log(`[DEBUG] 获取${symbol}的分析师见解数据`);

    // 使用 Yahoo Finance API 获取分析师见解相关数据
    const quoteSummaryResult = await yahooFinance.quoteSummary(symbol, [
      'recommendationTrend',
      'upgradeDowngradeHistory',
      'financialData',
      'earningsTrend',
    ]);

    if (!quoteSummaryResult.success || !quoteSummaryResult.quoteSummary) {
      console.error(
        `[ERROR] 获取${symbol}分析师见解失败，API返回:`,
        JSON.stringify(quoteSummaryResult)
      );
      throw new Error('无法获取分析师见解数据');
    }

    // 提取相关数据
    const { recommendationTrend, upgradeDowngradeHistory, financialData, earningsTrend } =
      quoteSummaryResult.quoteSummary;

    // 记录返回的数据结构以进行调试
    console.log(`[DEBUG] ${symbol}分析师见解数据结构:
      recommendationTrend: ${recommendationTrend ? 'present' : 'missing'}
      upgradeDowngradeHistory: ${upgradeDowngradeHistory ? 'present' : 'missing'}
      financialData: ${financialData ? 'present' : 'missing'}
      earningsTrend: ${earningsTrend ? 'present' : 'missing'}
    `);

    // 提取分析师建议
    let analystsRecommendation = null;
    if (recommendationTrend?.trend && recommendationTrend.trend.length > 0) {
      const latestTrend = recommendationTrend.trend[0];
      analystsRecommendation = {
        strongBuy: latestTrend.strongBuy?.raw || 0,
        buy: latestTrend.buy?.raw || 0,
        hold: latestTrend.hold?.raw || 0,
        sell: latestTrend.sell?.raw || 0,
        strongSell: latestTrend.strongSell?.raw || 0,
        period: latestTrend.period || null,
      };
    }

    // 提取目标价
    const targetPrice = financialData?.targetMeanPrice?.raw || null;
    const targetHighPrice = financialData?.targetHighPrice?.raw || null;
    const targetLowPrice = financialData?.targetLowPrice?.raw || null;
    const numberOfAnalysts = financialData?.numberOfAnalystOpinions?.raw || null;

    // 提取升级/降级历史
    const upgrades = [];
    if (upgradeDowngradeHistory?.history && upgradeDowngradeHistory.history.length > 0) {
      for (const item of upgradeDowngradeHistory.history) {
        if (!item) continue;

        upgrades.push({
          firm: item.firm || null,
          toGrade: item.toGrade || null,
          fromGrade: item.fromGrade || null,
          action: item.action || null,
          date: item.epochGradeDate ? new Date(item.epochGradeDate * 1000).toISOString() : null,
        });
      }
    }

    // 构建结果对象
    const insights = {
      symbol,
      analystsRecommendation,
      priceTarget: {
        mean: targetPrice,
        high: targetHighPrice,
        low: targetLowPrice,
        numberOfAnalysts,
      },
      upgradeDowngradeHistory: upgrades,
      // 包含原始数据以便前端可以访问更多细节
      recommendationTrend: recommendationTrend || null,
      upgradeDowngradeHistoryFull: upgradeDowngradeHistory || null,
      financialData: financialData || null,
      earningsTrend: earningsTrend || null,
      metadata: {
        symbol,
        retrievedAt: new Date().toISOString(),
        source: '雅虎财经',
      },
    };

    // 缓存数据
    cache.set(cacheKey, insights, CACHE_TTL);

    return { ...insights, fromCache: false };
  } catch (error: unknown) {
    console.error(`获取${symbol}的分析师见解失败:`, error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`无法获取${symbol}的分析师见解数据: ${errorMessage}`);
  }
};

/**
 * 处理获取股票分析师洞察的 HTTP 请求
 */
export const getStockInsightsHandler = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    if (!symbol) {
      return res.status(400).json({ error: '缺少必要参数', message: '请提供股票代码' });
    }

    const insights = await getCachedOrFreshData(
      `stock_insights_${symbol}`,
      () => getStockInsights(symbol),
      forceRefresh
    );

    return res.json(insights);
  } catch (error: any) {
    console.error('获取股票分析师洞察失败:', error);
    return res.status(500).json({
      error: '服务器错误',
      message: error.message || '获取股票分析师洞察时发生错误',
    });
  }
};
