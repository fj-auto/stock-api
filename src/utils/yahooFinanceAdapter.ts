/**
 * Yahoo Finance API 适配器
 *
 * 该文件用于解决yahoo-finance2库版本更新导致的API不兼容问题
 * 提供兼容层处理类型和属性访问差异
 */

import yahooFinance from 'yahoo-finance2';

// 有效的模块名称列表
const VALID_MODULES = [
  'assetProfile',
  'summaryProfile',
  'summaryDetail',
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
] as const;

// 有效模块类型
type ValidModule = (typeof VALID_MODULES)[number];

// 全局配置
const globalOptions = {
  validation: false, // 禁用结果验证以避免错误
  // 增强的请求头，模拟真实浏览器
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Cache-Control': 'max-age=0',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
    'Upgrade-Insecure-Requests': '1',
  },
  maxRetries: 3, // 请求失败时重试次数
  timeout: 10000, // 请求超时时间（毫秒）
};

// 设置yahooFinance默认选项，应用我们的配置
try {
  // Yahoo Finance API需要cookie来获取"crumb"令牌
  // 创建一个模拟的cookie字符串
  const mockCookies = [
    `A3=d=AQABBMV2ZGUCEMZfCJbUdq1PkF7B1j0B8QEFEgABCAHDZWV4ZQJ-bmUB_eMBAAcIxXZkZQJ-meE&S=AQAAAuHLCxCrQHKWh5PhJadTSi8`,
    `A1=d=AQABBMV2ZGUCEMZfCJbUdq1PkF7B1j0B8QEFEgABCAHDZWV4ZQJ-bmUB_eMBAAcIxXZkZQJ-meE&S=AQAAAuHLCxCrQHKWh5PhJadTSi8`,
    `GUC=AQABCAFkZcNlRkIrmQTL&s=AQAAAPlH_MHr&g=ZJuMaw`,
    `cmp=t=1688825432&j=0&u=1---`,
    `APID=UP3b05c502-e68f-11ee-a6c4-024471a4b3ef`,
    `B=dnidpfkf6q953&b=3&s=7e`,
  ].join('; ');

  // 应用我们的配置到yahooFinance库
  (yahooFinance as any).defaultOptions = {
    ...(yahooFinance as any).defaultOptions,
    ...globalOptions,
    headers: {
      ...globalOptions.headers,
      Cookie: mockCookies, // 添加cookie头
      Referer: 'https://finance.yahoo.com/',
      Origin: 'https://finance.yahoo.com',
    },
  };

  // 禁用Yahoo Finance的错误通知
  yahooFinance.setGlobalConfig({
    validation: {
      logErrors: false,
      logOptionsErrors: false,
    },
  });

  // 抑制Yahoo Finance的问卷调查通知
  if (typeof yahooFinance.suppressNotices === 'function') {
    yahooFinance.suppressNotices(['yahooSurvey']);
  }

  console.log('✅ Yahoo Finance配置已更新，增强了身份验证处理');
} catch (error) {
  console.error('设置Yahoo Finance配置时出错:', error);
}

/**
 * 尝试刷新Yahoo Finance API的crumb和cookie
 * 这个函数在遇到Invalid Crumb错误时调用
 */
const refreshCrumbAndCookie = async (): Promise<boolean> => {
  try {
    console.log('[DEBUG] 尝试刷新Yahoo Finance API的crumb和cookie...');

    // 不再尝试使用内部方法_setCrumb，直接使用search方法触发crumb刷新
    console.log('[DEBUG] 尝试通过简单请求触发crumb刷新...');
    const dummyResult = await yahooFinance.search('AAPL');
    console.log('[DEBUG] 触发crumb刷新的请求已完成');
    return true;
  } catch (error) {
    console.error('[ERROR] 刷新Yahoo Finance API的crumb失败:', error);
    return false;
  }
};

/**
 * 包装quoteSummary方法，处理兼容性问题
 */
const adaptedQuoteSummary = async (symbol: string, modules: ValidModule[] | string[]) => {
  try {
    // 确保模块名称有效
    const validatedModules = modules.filter(module =>
      VALID_MODULES.includes(module as ValidModule)
    ) as ValidModule[];

    if (validatedModules.length === 0) {
      return {
        success: false,
        error: '无有效模块名称',
        quoteSummary: null,
      };
    }

    const result = await yahooFinance.quoteSummary(symbol, {
      modules: validatedModules as any,
    });

    return {
      success: true,
      quoteSummary: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询报价摘要时出错',
      quoteSummary: null,
    };
  }
};

/**
 * 包装搜索建议API
 */
const adaptedAutoc = async (query: string) => {
  try {
    const result = await yahooFinance.search(query);
    return {
      success: true,
      results: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '自动完成搜索时出错',
      results: [],
    };
  }
};

/**
 * 包装chart API
 */
const adaptedChart = async (
  symbol: string,
  period1: Date | string,
  period2: Date | string,
  interval: string = '1d'
) => {
  try {
    // 确保interval是有效的值
    const validIntervals = [
      '1m',
      '2m',
      '5m',
      '15m',
      '30m',
      '60m',
      '90m',
      '1h',
      '1d',
      '5d',
      '1wk',
      '1mo',
      '3mo',
    ];
    const validInterval = validIntervals.includes(interval) ? interval : '1d';

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: validInterval as any,
    });

    return {
      success: true,
      chart: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取图表数据时出错',
      chart: null,
    };
  }
};

/**
 * 包装quoteCombine API
 */
const adaptedQuoteCombine = async (symbols: string | string[]) => {
  try {
    const result = await yahooFinance.quote(symbols);
    return {
      success: true,
      quotes: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '组合多个报价时出错',
      quotes: [],
    };
  }
};

/**
 * 解决getEarningsFullData未定义的问题
 */
export const getEarningsData = async (symbol: string): Promise<any> => {
  try {
    console.log(`[DEBUG] 使用 yahooFinanceAdapter 获取 ${symbol} 的财报数据`);

    // 尝试直接使用yahoo-finance2的原生方法获取数据
    console.log(`[DEBUG] 尝试使用yahoo-finance2直接获取${symbol}的财报数据...`);
    try {
      // 使用内置的quoteSummary方法直接获取数据，绕过我们的adaptedQuoteSummary
      const directResult = await yahooFinance.quoteSummary(symbol, {
        modules: ['earnings', 'earningsHistory', 'earningsTrend', 'calendarEvents'],
      });

      console.log(`[DEBUG] 直接调用yahoo-finance2成功，返回的模块:`, Object.keys(directResult));

      // 提取结果
      const { earnings, earningsHistory, earningsTrend, calendarEvents } = directResult;

      // 记录每个模块的结构
      if (earnings) {
        console.log(
          `[DEBUG] ${symbol} earnings 直接调用获得数据:`,
          JSON.stringify(earnings, null, 2).substring(0, 300) + '...'
        );
      }

      if (earningsHistory) {
        console.log(
          `[DEBUG] ${symbol} earningsHistory 直接调用获得数据:`,
          JSON.stringify(earningsHistory, null, 2).substring(0, 300) + '...'
        );
      }

      // 使用processEarningsData函数处理数据
      return processEarningsData(symbol, earnings, earningsHistory, earningsTrend, calendarEvents);
    } catch (directError: unknown) {
      console.error(`[ERROR] 直接使用yahoo-finance2获取${symbol}财报数据失败:`, directError);
      const errorMessage = directError instanceof Error ? directError.message : '未知错误';

      // 如果错误是Invalid Crumb，尝试刷新crumb然后重试
      if (errorMessage.includes('Invalid Crumb') || errorMessage.includes('Unauthorized')) {
        console.log(`[DEBUG] 检测到Invalid Crumb错误，尝试刷新crumb并重试...`);
        const refreshed = await refreshCrumbAndCookie();

        if (refreshed) {
          console.log(`[DEBUG] Crumb已刷新，重新尝试获取${symbol}的财报数据...`);
          try {
            // 重新尝试获取数据
            const retryResult = await yahooFinance.quoteSummary(symbol, {
              modules: ['earnings', 'earningsHistory', 'earningsTrend', 'calendarEvents'],
            });

            console.log(`[DEBUG] 刷新crumb后重试成功，返回的模块:`, Object.keys(retryResult));

            // 提取结果
            const { earnings, earningsHistory, earningsTrend, calendarEvents } = retryResult;

            // 处理数据...
            // 这里应该复制上面的数据处理代码，但为了简洁起见，我们可以提取为一个单独的函数
            return processEarningsData(
              symbol,
              earnings,
              earningsHistory,
              earningsTrend,
              calendarEvents
            );
          } catch (retryError: unknown) {
            console.error(`[ERROR] 刷新crumb后重试仍然失败:`, retryError);
            const retryErrorMessage = retryError instanceof Error ? retryError.message : '未知错误';
            throw new Error(`即使刷新crumb后重试仍然失败: ${retryErrorMessage}`);
          }
        }
      }

      throw new Error(`直接调用API获取财报数据失败: ${errorMessage}`);
    }
  } catch (error: unknown) {
    console.error(`[ERROR] 获取财报数据错误:`, error);
    // 不再返回模拟数据，而是抛出错误
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`无法获取 ${symbol} 的财报数据: ${errorMessage}`);
  }
};

/**
 * 处理从Yahoo Finance API获取的财报数据
 */
const processEarningsData = (
  symbol: string,
  earnings: any,
  earningsHistory: any,
  earningsTrend: any,
  calendarEvents: any
): any => {
  console.log(`[DEBUG] 开始处理${symbol}的财报数据...`);

  // 格式化日期的辅助函数，只保留日期部分YYYY-MM-DD
  const formatDate = (dateString: string | null): string | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // 如果是无效日期，返回原始字符串
      return date.toISOString().split('T')[0]; // 只保留YYYY-MM-DD部分
    } catch (error) {
      console.error(`[ERROR] 格式化日期'${dateString}'出错:`, error);
      return dateString;
    }
  };

  // 从earnings模块获取下一个财报日期和预估EPS
  // --------------------------------------------
  let upcomingEarningsDate = null;
  let upcomingEpsEstimate = null;

  // 优先从earnings.earningsChart获取下一次财报日期
  if (earnings?.earningsChart?.earningsDate) {
    const earningsDates = earnings.earningsChart.earningsDate;
    if (Array.isArray(earningsDates) && earningsDates.length > 0) {
      // 日期可能是字符串格式
      if (typeof earningsDates[0] === 'string') {
        upcomingEarningsDate = formatDate(earningsDates[0]);
        console.log(
          `[DEBUG] 从earnings.earningsChart获取到${symbol}的下一次财报日期(字符串格式):`,
          upcomingEarningsDate
        );
      } else {
        // 或者是时间戳格式
        const timestamp = earningsDates[0];
        upcomingEarningsDate = timestamp
          ? formatDate(new Date(Number(timestamp) * 1000).toISOString())
          : null;
        console.log(
          `[DEBUG] 从earnings.earningsChart获取到${symbol}的下一次财报日期(时间戳格式):`,
          upcomingEarningsDate
        );
      }
    }
  }
  // 备选：从calendarEvents获取财报日期
  else if (calendarEvents?.earnings?.earningsDate) {
    const earningsDates = calendarEvents.earnings.earningsDate;
    if (Array.isArray(earningsDates) && earningsDates.length > 0) {
      if (typeof earningsDates[0] === 'string') {
        upcomingEarningsDate = formatDate(earningsDates[0]);
      } else if (typeof earningsDates[0] === 'object' && earningsDates[0] !== null) {
        const timestamp = 'raw' in earningsDates[0] ? earningsDates[0].raw : null;
        upcomingEarningsDate = timestamp
          ? formatDate(new Date(Number(timestamp) * 1000).toISOString())
          : null;
      }
      console.log(`[DEBUG] 从calendarEvents获取到${symbol}的下一次财报日期:`, upcomingEarningsDate);
    }
  }

  // 从earnings获取EPS预估
  if (earnings?.earningsChart?.currentQuarterEstimate) {
    upcomingEpsEstimate = earnings.earningsChart.currentQuarterEstimate;
    console.log(`[DEBUG] 从earnings.earningsChart获取到${symbol}的预估EPS:`, upcomingEpsEstimate);
  }

  // 构建即将到来的财报数据
  const upcomingEarnings = {
    date: upcomingEarningsDate,
    epsEstimate: upcomingEpsEstimate,
    // 添加当前季度信息 (简化)
    quarter: earnings?.earningsChart?.currentQuarterEstimateDate
      ? `${earnings.earningsChart.currentQuarterEstimateDate}${earnings.earningsChart.currentQuarterEstimateYear}`
      : null,
  };

  // 从earningsHistory模块获取历史财报数据
  // --------------------------------------------
  let pastEarnings = [];

  // 优先从earningsHistory.history获取历史财报数据
  if (earningsHistory?.history && Array.isArray(earningsHistory.history)) {
    console.log(
      `[DEBUG] 从earningsHistory.history获取${symbol}的历史财报数据，条目数:`,
      earningsHistory.history.length
    );

    pastEarnings = earningsHistory.history
      .map((item: any) => {
        if (!item) return null;

        // 直接保留原始的quarter日期字段，但格式化为YYYY-MM-DD
        const quarterDate = item.quarter ? formatDate(item.quarter) : null;

        // 构建含有简化日期信息的条目
        return {
          // 简化日期格式，只保留YYYY-MM-DD部分
          quarter: quarterDate,
          // 保留日期字段，并简化格式
          date: item.date ? formatDate(item.date) : quarterDate,
          // 使用原始值，不做过度处理
          actualEPS: item.epsActual,
          estimateEPS: item.epsEstimate,
          epsDifference: item.epsDifference,
          surprisePercent: item.surprisePercent,
          // 保留其他可能有用的原始字段
          period: item.period || null,
          raw: item, // 添加完整的原始数据供前端使用
        };
      })
      .filter(Boolean); // 过滤掉null值

    console.log(`[DEBUG] 成功从earningsHistory模块提取了${pastEarnings.length}条历史财报记录`);
  }
  // 备选：如果earningsHistory没有数据，尝试从earnings.earningsChart.quarterly获取
  else if (earnings?.earningsChart?.quarterly && Array.isArray(earnings.earningsChart.quarterly)) {
    console.log(
      `[DEBUG] 备选方案：使用earnings.earningsChart.quarterly获取${symbol}的历史财报数据，条目数:`,
      earnings.earningsChart.quarterly.length
    );

    pastEarnings = earnings.earningsChart.quarterly
      .map((item: any) => {
        if (!item) return null;

        // 直接保留原始数据结构，但简化日期格式
        return {
          date: item.date ? formatDate(item.date) : null,
          actualEPS: item.actual,
          estimateEPS: item.estimate,
          epsDifference: item.actual && item.estimate ? item.actual - item.estimate : null,
          surprisePercent:
            item.actual && item.estimate
              ? ((item.actual - item.estimate) / Math.abs(item.estimate)) * 100
              : null,
          quarter: item.date ? formatDate(item.date) : null,
          raw: item, // 添加完整的原始数据供前端使用
        };
      })
      .filter(Boolean);

    console.log(
      `[DEBUG] 从备选earnings.earningsChart.quarterly模块提取了${pastEarnings.length}条历史财报记录`
    );
  }

  console.log(`[DEBUG] ${symbol}财报数据处理完成`);

  // 返回处理后的完整数据，保留原始数据结构
  return {
    success: true,
    symbol,
    upcomingEarnings,
    earningsDates: [
      // 只有当未来财报有日期时才添加到列表
      ...(upcomingEarningsDate ? [upcomingEarnings] : []),
      ...pastEarnings,
    ],
    pastEarnings, // 保留该字段以向后兼容
    earningsHistory: {
      history: pastEarnings, // 直接提供earningsHistory结构
    },
    // 添加原始数据，方便前端参考
    rawData: {
      earnings,
      earningsHistory,
      earningsTrend,
      calendarEvents,
    },
    metadata: {
      symbol,
      retrievedAt: new Date().toISOString(),
      source: '雅虎财经',
    },
  };
};

/**
 * 包装trendingSymbols API
 * 获取热门股票
 */
const adaptedTrendingSymbols = async (region: string = 'US') => {
  try {
    // 使用增强的选项获取数据
    const result = await yahooFinance.trendingSymbols(region, {
      count: 10,
      lang: 'en-US',
      ...globalOptions, // 应用全局配置到这个请求
    });

    console.log('成功获取热门股票数据:', JSON.stringify(result, null, 2).substring(0, 200) + '...');

    return {
      success: true,
      trending: result,
      metadata: {
        retrievedAt: new Date().toISOString(),
        source: '雅虎财经',
      },
    };
  } catch (error) {
    console.error('获取热门股票错误:', error);
    // 创建模拟数据而不是抛出错误
    const mockData = {
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

    console.log('返回模拟热门股票数据');

    return {
      success: true,
      trending: mockData,
      metadata: {
        retrievedAt: new Date().toISOString(),
        source: '模拟数据 (API错误)',
      },
      warning: 'Yahoo Finance API访问出错，显示模拟数据',
    };
  }
};

/**
 * 包装dailyGainers API
 * 获取日涨幅最大的股票
 */
const adaptedDailyGainers = async () => {
  try {
    // 使用增强的选项获取数据
    const result = await yahooFinance.dailyGainers({
      count: 5,
      region: 'US',
      lang: 'en-US',
      ...globalOptions, // 应用全局配置到这个请求
    });

    console.log(
      '成功获取涨幅最大股票数据:',
      JSON.stringify(result, null, 2).substring(0, 200) + '...'
    );

    return {
      success: true,
      gainers: result,
      metadata: {
        retrievedAt: new Date().toISOString(),
        source: '雅虎财经',
      },
    };
  } catch (error) {
    console.error('获取日涨幅最大股票错误:', error);
    // 创建模拟数据而不是抛出错误
    const mockData = {
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

    console.log('返回模拟涨幅最大股票数据');

    return {
      success: true,
      gainers: mockData,
      metadata: {
        retrievedAt: new Date().toISOString(),
        source: '模拟数据 (API错误)',
      },
      warning: 'Yahoo Finance API访问出错，显示模拟数据',
    };
  }
};

// 导出适配器接口
const adapter: any = {
  quoteSummary: adaptedQuoteSummary,
  search: adaptedAutoc,
  chart: adaptedChart,
  quote: adaptedQuoteCombine,
  getEarningsData,
  trendingSymbols: adaptedTrendingSymbols,
  dailyGainers: adaptedDailyGainers,
  // 全局配置
  defaultOptions: globalOptions,
};

export default adapter;
