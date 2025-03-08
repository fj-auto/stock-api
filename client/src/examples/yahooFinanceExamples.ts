// src/examples/yahooFinanceExamples.ts
import { yahooFinanceClient } from '../client/yahooFinanceClient';

/**
 * 示例1: 获取股票基本信息和价格历史
 * 获取单个股票的基本价格信息和最近一个月的历史数据
 */
export async function getStockBasicInfo(symbol: string) {
  try {
    // 并行请求以提高性能
    const [priceData, historicalData] = await Promise.all([
      yahooFinanceClient.getStockPrice(symbol),
      yahooFinanceClient.getHistoricalData(symbol, '1mo', '1d'),
    ]);

    console.log(`${symbol} 当前价格: $${priceData.price.toFixed(2)}`);
    console.log(`涨跌: ${priceData.change?.toFixed(2)} (${priceData.changePercent?.toFixed(2)}%)`);
    console.log(`交易量: ${priceData.volume?.toLocaleString()}`);
    console.log(`市值: $${(priceData.marketCap || 0) / 1000000000}B`);

    // 计算价格区间
    const highPrice = Math.max(...historicalData.map(item => item.high));
    const lowPrice = Math.min(...historicalData.map(item => item.low));
    console.log(`30天价格区间: $${lowPrice.toFixed(2)} - $${highPrice.toFixed(2)}`);

    return {
      priceData,
      historicalData,
      priceRange: { low: lowPrice, high: highPrice },
    };
  } catch (error) {
    console.error('获取股票基本信息失败:', error);
    throw error;
  }
}

/**
 * 示例2: 行业对比分析
 * 比较同一行业内多个股票的表现
 */
export async function compareIndustryStocks(symbols: string[], industryName: string) {
  try {
    // 获取多个股票价格
    const stocksData = await yahooFinanceClient.getMultipleStockPrices(symbols);

    // 计算平均值
    const avgPrice = stocksData.reduce((sum, stock) => sum + stock.price, 0) / stocksData.length;
    const avgChangePercent =
      stocksData.reduce((sum, stock) => sum + (stock.changePercent || 0), 0) / stocksData.length;

    console.log(`${industryName} 行业分析:`);
    console.log(`分析的股票: ${symbols.join(', ')}`);
    console.log(`行业平均价格: $${avgPrice.toFixed(2)}`);
    console.log(`行业平均涨跌幅: ${avgChangePercent.toFixed(2)}%`);

    // 排序并找出表现最好和最差的股票
    const sortedByPerformance = [...stocksData].sort(
      (a, b) => (b.changePercent || 0) - (a.changePercent || 0),
    );

    console.log(
      `表现最好: ${sortedByPerformance[0].symbol} (${sortedByPerformance[0].changePercent?.toFixed(
        2,
      )}%)`,
    );
    console.log(
      `表现最差: ${
        sortedByPerformance[sortedByPerformance.length - 1].symbol
      } (${sortedByPerformance[sortedByPerformance.length - 1].changePercent?.toFixed(2)}%)`,
    );

    return {
      stocks: stocksData,
      industryAvg: { price: avgPrice, changePercent: avgChangePercent },
      bestPerforming: sortedByPerformance[0],
      worstPerforming: sortedByPerformance[sortedByPerformance.length - 1],
    };
  } catch (error) {
    console.error('行业对比分析失败:', error);
    throw error;
  }
}

/**
 * 示例3: 获取公司财务概览
 * 获取公司的关键财务数据和统计信息
 */
export async function getCompanyFinancialOverview(symbol: string) {
  try {
    // 获取多个模块的财务数据
    const financialModules = [
      'assetProfile', // 公司基本信息
      'financialData', // 财务数据
      'defaultKeyStatistics', // 关键统计数据
      'recommendationTrend', // 分析师建议趋势
      'earnings', // 盈利数据
    ];

    const summaryData = await yahooFinanceClient.getQuoteSummary(symbol, financialModules);

    // 提取并组织公司概述
    const companyOverview = {
      name: summaryData.assetProfile?.companyName || symbol,
      industry: summaryData.assetProfile?.industry,
      sector: summaryData.assetProfile?.sector,
      employees: summaryData.assetProfile?.fullTimeEmployees,
      website: summaryData.assetProfile?.website,
      summary: summaryData.assetProfile?.longBusinessSummary,
    };

    // 提取关键财务指标
    const financialMetrics = {
      revenueGrowth: summaryData.financialData?.revenueGrowth,
      grossMargin: summaryData.financialData?.grossMargins,
      profitMargin: summaryData.financialData?.profitMargins,
      operatingMargin: summaryData.financialData?.operatingMargins,
      returnOnAssets: summaryData.financialData?.returnOnAssets,
      returnOnEquity: summaryData.financialData?.returnOnEquity,
      totalCash: summaryData.financialData?.totalCash,
      totalDebt: summaryData.financialData?.totalDebt,
      debtToEquity: summaryData.financialData?.debtToEquity,
      currentRatio: summaryData.financialData?.currentRatio,
    };

    // 提取估值指标
    const valuationMetrics = {
      marketCap: summaryData.defaultKeyStatistics?.marketCap,
      enterpriseValue: summaryData.defaultKeyStatistics?.enterpriseValue,
      trailingPE: summaryData.defaultKeyStatistics?.trailingPE,
      forwardPE: summaryData.defaultKeyStatistics?.forwardPE,
      priceToSales: summaryData.defaultKeyStatistics?.priceToSales,
      priceToBook: summaryData.defaultKeyStatistics?.priceToBook,
      enterpriseToRevenue: summaryData.defaultKeyStatistics?.enterpriseToRevenue,
      enterpriseToEbitda: summaryData.defaultKeyStatistics?.enterpriseToEbitda,
    };

    // 提取分析师建议数据
    const analystRecommendations = {
      meanRecommendation: summaryData.financialData?.recommendationMean,
      recommendationKey: summaryData.financialData?.recommendationKey,
      targetMeanPrice: summaryData.financialData?.targetMeanPrice,
      targetHighPrice: summaryData.financialData?.targetHighPrice,
      targetLowPrice: summaryData.financialData?.targetLowPrice,
      numberOfAnalystOpinions: summaryData.financialData?.numberOfAnalystOpinions,
      trend: summaryData.recommendationTrend?.trend,
    };

    return {
      companyOverview,
      financialMetrics,
      valuationMetrics,
      analystRecommendations,
    };
  } catch (error) {
    console.error('获取公司财务概览失败:', error);
    throw error;
  }
}

/**
 * 示例4: 构建投资组合分析
 * 分析多个股票组成的投资组合
 */
export async function analyzePortfolio(portfolio: Array<{ symbol: string; shares: number }>) {
  try {
    // 获取所有股票的符号
    const symbols = portfolio.map(item => item.symbol);

    // 获取股票价格数据
    const stocksData = await yahooFinanceClient.getMultipleStockPrices(symbols);

    // 计算投资组合总价值和持仓分布
    let totalValue = 0;
    const holdings = stocksData.map(stock => {
      const portfolioItem = portfolio.find(item => item.symbol === stock.symbol);
      const shares = portfolioItem?.shares || 0;
      const value = shares * stock.price;
      totalValue += value;

      return {
        symbol: stock.symbol,
        shares,
        price: stock.price,
        value,
        dayChange: (stock.change || 0) * shares,
        dayChangePercent: stock.changePercent || 0,
      };
    });

    // 计算每只股票在组合中的占比
    const holdingsWithAllocation = holdings.map(holding => ({
      ...holding,
      allocation: (holding.value / totalValue) * 100,
    }));

    // 计算组合整体的日内变化
    const portfolioDayChange = holdings.reduce((sum, holding) => sum + holding.dayChange, 0);
    const portfolioDayChangePercent = (portfolioDayChange / totalValue) * 100;

    return {
      totalValue,
      holdings: holdingsWithAllocation,
      portfolioDayChange,
      portfolioDayChangePercent,
    };
  } catch (error) {
    console.error('投资组合分析失败:', error);
    throw error;
  }
}

/**
 * 示例5: 技术分析指标
 * 计算常用的技术分析指标
 */
export async function calculateTechnicalIndicators(symbol: string, period: string = '6mo') {
  try {
    // 获取历史数据
    const historicalData = await yahooFinanceClient.getHistoricalData(symbol, period, '1d');

    // 确保数据按日期排序（从早到晚）
    const sortedData = [...historicalData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // 计算简单移动平均线 (SMA)
    const calculateSMA = (data: any[], period: number) => {
      const sma = [];
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
        sma.push({
          date: data[i].date,
          value: sum / period,
        });
      }
      return sma;
    };

    // 计算指数移动平均线 (EMA)
    const calculateEMA = (data: any[], period: number) => {
      const ema = [];
      const k = 2 / (period + 1);

      // 首个EMA值使用前period个收盘价的SMA
      let emaValue = data.slice(0, period).reduce((acc, val) => acc + val.close, 0) / period;

      for (let i = period - 1; i < data.length; i++) {
        emaValue = (data[i].close - emaValue) * k + emaValue;
        ema.push({
          date: data[i].date,
          value: emaValue,
        });
      }
      return ema;
    };

    // 计算相对强弱指标 (RSI)
    const calculateRSI = (data: any[], period: number = 14) => {
      const rsi = [];
      let gains = 0;
      let losses = 0;

      // 计算第一个RSI值
      for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change >= 0) {
          gains += change;
        } else {
          losses -= change; // 取绝对值
        }
      }

      let avgGain = gains / period;
      let avgLoss = losses / period;

      for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;

        // 更新平均收益和损失
        if (change >= 0) {
          avgGain = (avgGain * (period - 1) + change) / period;
          avgLoss = (avgLoss * (period - 1)) / period;
        } else {
          avgGain = (avgGain * (period - 1)) / period;
          avgLoss = (avgLoss * (period - 1) - change) / period;
        }

        // 计算RSI
        const rs = avgGain / avgLoss;
        const rsiValue = 100 - 100 / (1 + rs);

        rsi.push({
          date: data[i].date,
          value: rsiValue,
        });
      }

      return rsi;
    };

    // 计算布林带 (Bollinger Bands)
    const calculateBollingerBands = (data: any[], period: number = 20, multiplier: number = 2) => {
      const result = [];

      for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);

        // 计算SMA
        const sma = slice.reduce((acc, val) => acc + val.close, 0) / period;

        // 计算标准差
        const sumSquaredDiff = slice.reduce((acc, val) => {
          const diff = val.close - sma;
          return acc + diff * diff;
        }, 0);

        const stdDev = Math.sqrt(sumSquaredDiff / period);

        result.push({
          date: data[i].date,
          middle: sma,
          upper: sma + multiplier * stdDev,
          lower: sma - multiplier * stdDev,
        });
      }

      return result;
    };

    // 计算并返回各种技术指标
    return {
      sma20: calculateSMA(sortedData, 20),
      sma50: calculateSMA(sortedData, 50),
      sma200: calculateSMA(sortedData, 200),
      ema12: calculateEMA(sortedData, 12),
      ema26: calculateEMA(sortedData, 26),
      rsi14: calculateRSI(sortedData, 14),
      bollingerBands: calculateBollingerBands(sortedData, 20, 2),
    };
  } catch (error) {
    console.error('计算技术指标失败:', error);
    throw error;
  }
}

/**
 * 示例6: 获取价格预测
 * 基于分析师目标价格和当前价格计算潜在回报
 */
export async function getPricePrediction(symbol: string) {
  try {
    // 并行获取价格数据和分析师推荐数据
    const [priceData, summaryData] = await Promise.all([
      yahooFinanceClient.getStockPrice(symbol),
      yahooFinanceClient.getQuoteSummary(symbol, ['financialData']),
    ]);

    const currentPrice = priceData.price;
    const targetMeanPrice = summaryData.financialData?.targetMeanPrice;
    const targetHighPrice = summaryData.financialData?.targetHighPrice;
    const targetLowPrice = summaryData.financialData?.targetLowPrice;

    // 计算潜在回报率
    const meanReturn = targetMeanPrice ? (targetMeanPrice / currentPrice - 1) * 100 : null;
    const highReturn = targetHighPrice ? (targetHighPrice / currentPrice - 1) * 100 : null;
    const lowReturn = targetLowPrice ? (targetLowPrice / currentPrice - 1) * 100 : null;

    return {
      symbol,
      currentPrice,
      targetPrices: {
        mean: targetMeanPrice,
        high: targetHighPrice,
        low: targetLowPrice,
      },
      potentialReturns: {
        mean: meanReturn,
        high: highReturn,
        low: lowReturn,
      },
      analysts: summaryData.financialData?.numberOfAnalystOpinions || 0,
      recommendationKey: summaryData.financialData?.recommendationKey || 'none',
    };
  } catch (error) {
    console.error('获取价格预测失败:', error);
    throw error;
  }
}

/**
 * 示例7: 获取期权链并计算隐含波动率
 */
export async function getOptionsChainAndIV(symbol: string) {
  try {
    // 获取期权数据
    const optionsData = await yahooFinanceClient.getOptionsData(symbol);

    if (!optionsData.options || optionsData.options.length === 0) {
      throw new Error('没有可用的期权数据');
    }

    // 获取最近的期权到期日数据
    const nearestExpiry = optionsData.options[0];

    // 计算当前价格的平价期权（最接近平价的期权）
    const currentPrice = optionsData.quote.regularMarketPrice;

    // 查找最接近当前价格的看涨和看跌期权
    interface OptionData {
      strike: number;
      lastPrice: number;
      change: number;
      percentChange: number;
      volume: number;
      openInterest: number;
      impliedVolatility: number;
      inTheMoney: boolean;
      contractSymbol: string;
      expiration: number;
    }

    let atMoneyCall = nearestExpiry.calls.reduce((prev: OptionData, curr: OptionData) => {
      return Math.abs(curr.strike - currentPrice) < Math.abs(prev.strike - currentPrice)
        ? curr
        : prev;
    });

    let atMoneyPut = nearestExpiry.puts.reduce((prev: OptionData, curr: OptionData) => {
      return Math.abs(curr.strike - currentPrice) < Math.abs(prev.strike - currentPrice)
        ? curr
        : prev;
    });

    return {
      symbol,
      currentPrice,
      expirationDate: new Date(nearestExpiry.expirationDate * 1000).toISOString().split('T')[0],
      atMoneyCall: {
        strike: atMoneyCall.strike,
        lastPrice: atMoneyCall.lastPrice,
        bid: atMoneyCall.bid,
        ask: atMoneyCall.ask,
        volume: atMoneyCall.volume,
        openInterest: atMoneyCall.openInterest,
        impliedVolatility: atMoneyCall.impliedVolatility * 100,
      },
      atMoneyPut: {
        strike: atMoneyPut.strike,
        lastPrice: atMoneyPut.lastPrice,
        bid: atMoneyPut.bid,
        ask: atMoneyPut.ask,
        volume: atMoneyPut.volume,
        openInterest: atMoneyPut.openInterest,
        impliedVolatility: atMoneyPut.impliedVolatility * 100,
      },
    };
  } catch (error) {
    console.error('获取期权链失败:', error);
    throw error;
  }
}
