// src/client/yahooFinanceClient.ts
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// 定义基本的响应类型
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

interface APIError {
  error: string;
  message: string;
}

// Yahoo Finance API 客户端
class YahooFinanceClient {
  private readonly baseURL: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    baseURL: string = `${API_BASE_URL}/yahoo`,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ) {
    this.baseURL = baseURL;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  // 添加重试逻辑的包装函数
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // 如果不是第一次尝试，记录重试信息
        if (attempt > 1) {
          console.log(`重试请求 (${attempt}/${this.maxRetries})...`);
        }

        return await operation();
      } catch (error) {
        lastError = error;
        console.error(`请求失败 (尝试 ${attempt}/${this.maxRetries}):`, error);

        // 如果还有重试次数，等待一段时间后重试
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    // 所有重试都失败
    return this.handleError(lastError);
  }

  // 错误处理工具方法
  private handleError(error: any): never {
    if (error.response) {
      // 服务器返回的错误
      const errorData = error.response.data as APIError;

      // 处理特定的 Yahoo Finance API 错误
      if (errorData.message) {
        // 检查特定的错误类型
        if (errorData.message.includes('访问受限')) {
          // 创建自定义的用户友好错误消息
          console.warn('Yahoo Finance API 访问受限错误:', errorData.message);
          throw new Error('Yahoo Finance 数据暂时不可用，请稍后再试');
        }
      }

      throw new Error(
        `API错误 (${error.response.status}): ${errorData.message || errorData.error || '未知错误'}`
      );
    } else if (error.request) {
      // 请求发出但没有收到响应
      throw new Error('无法连接服务器，请检查您的网络连接');
    } else {
      // 请求设置时出错
      throw new Error(`请求错误: ${error.message}`);
    }
  }

  // 1. 获取单个股票价格
  async getStockPrice(symbol: string): Promise<StockData> {
    return this.withRetry(async () => {
      // 修改为使用专门的price端点，而不是all-info端点
      const response = await axios.get<StockData>(`${this.baseURL}/price/${symbol}`);
      return response.data;
    });
  }

  // 2. 获取多个股票价格
  async getMultipleStockPrices(symbols: string[]): Promise<StockData[]> {
    return this.withRetry(async () => {
      // 使用新的批量获取接口
      const response = await axios.get(`${this.baseURL}/prices`, {
        params: { symbols: symbols.join(',') },
      });
      return response.data;
    });
  }

  // 3. 获取历史数据
  async getHistoricalData(
    symbol: string,
    period: string = '1mo',
    interval: string = '1d'
  ): Promise<HistoricalDataPoint[]> {
    return this.withRetry(async () => {
      const response = await axios.get<HistoricalDataPoint[]>(`${this.baseURL}/history/${symbol}`, {
        params: { period, interval },
      });
      return response.data;
    });
  }

  // 4. 搜索建议
  async getSearchSuggestions(query: string) {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/search/${query}`);
      return response.data;
    });
  }

  // 5. 获取图表数据 - 使用history端点替代，因为后端没有专门的chart端点
  async getChartData(
    symbol: string,
    interval: string = '1d',
    range: string = '1mo',
    includePrePost: boolean = false
  ) {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/historical/${symbol}`, {
        params: { interval, period: range, includePrePost },
      });
      return response.data;
    });
  }

  // 6. 获取报价摘要 - 使用summary端点替代
  async getQuoteSummary(symbol: string, modules: string[]) {
    return this.withRetry(async () => {
      // 如果调用者需要完整数据，仍使用all-info端点
      if (modules && modules.length > 0 && modules.includes('all')) {
        const response = await axios.get(`${this.baseURL}/all-info/${symbol}`);
        return response.data;
      } else {
        // 否则使用summary端点获取更精简的数据
        const response = await axios.get(`${this.baseURL}/summary/${symbol}`);
        return response.data;
      }
    });
  }

  // 7. 搜索股票 - 使用搜索端点
  async searchStocks(query: string, quotesCount: number = 6, newsCount: number = 4) {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: { query, limit: quotesCount },
      });
      return response.data;
    });
  }

  // 8. 获取推荐股票
  async getRecommendations(symbol: string) {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/recommendations/${symbol}`);
      return response.data;
    });
  }

  // 9. 获取热门股票
  async getTrendingSymbols(region: string = 'US') {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/trending`, {
        params: { region },
      });
      return response.data;
    });
  }

  // 获取热门股票 (别名方法)
  async getTrendingStocks(region: string = 'US') {
    return this.getTrendingSymbols(region);
  }

  // 10. 获取期权数据
  async getOptionsData(symbol: string, date?: string, strikeMin?: number, strikeMax?: number) {
    return this.withRetry(async () => {
      const params: Record<string, any> = {};
      if (date) params.date = date;
      if (strikeMin !== undefined) params.strikeMin = strikeMin;
      if (strikeMax !== undefined) params.strikeMax = strikeMax;

      const response = await axios.get(`${this.baseURL}/options/${symbol}`, { params });
      return response.data;
    });
  }

  // 11. 获取洞察信息
  async getInsights(symbol: string) {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/insights/${symbol}`);
      return response.data;
    });
  }

  // 12. 获取涨幅最大的股票
  async getDailyGainers(count: number = 5, region: string = 'US') {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/gainers`, {
        params: { count, region },
      });
      return response.data;
    });
  }

  // 13. 获取组合报价
  async getQuoteCombine(symbols: string[], modules: string[]) {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/combine`, {
        params: {
          symbols: symbols.join(','),
          modules: modules.join(','),
        },
      });
      return response.data;
    });
  }

  // 14. 获取股票历史财报日期
  async getEarningsDates(symbol: string, years: number = 5) {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/earnings-dates/${symbol}`, {
        params: { years },
      });
      return response.data;
    });
  }

  // 获取完整财报数据
  async getEarningsFullData(symbol: string) {
    return this.withRetry(async () => {
      const response = await axios.get(`${this.baseURL}/earnings-full/${symbol}`);
      return response.data;
    });
  }
}

// 导出一个默认实例
export const yahooFinanceClient = new YahooFinanceClient();

// 也可以导出类，允许用户创建自定义实例
export default YahooFinanceClient;
