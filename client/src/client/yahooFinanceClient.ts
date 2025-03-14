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

  constructor(baseURL: string = `${API_BASE_URL}/yahoo`) {
    this.baseURL = baseURL;
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
    try {
      const response = await axios.get<StockData>(`${this.baseURL}/stock/${symbol}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 2. 获取多个股票价格
  async getMultipleStockPrices(symbols: string[]): Promise<StockData[]> {
    try {
      const response = await axios.get<StockData[]>(`${this.baseURL}/stocks`, {
        params: { symbols: symbols.join(',') },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 3. 获取历史数据
  async getHistoricalData(
    symbol: string,
    period: string = '1mo',
    interval: string = '1d'
  ): Promise<HistoricalDataPoint[]> {
    try {
      const response = await axios.get<HistoricalDataPoint[]>(
        `${this.baseURL}/stock/${symbol}/history`,
        { params: { period, interval } }
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 4. 搜索建议
  async getSearchSuggestions(query: string) {
    try {
      const response = await axios.get(`${this.baseURL}/autoc`, {
        params: { query },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 5. 获取图表数据
  async getChartData(
    symbol: string,
    interval: string = '1d',
    range: string = '1mo',
    includePrePost: boolean = false
  ) {
    try {
      const response = await axios.get(`${this.baseURL}/chart/${symbol}`, {
        params: { interval, range, includePrePost },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 6. 获取报价摘要
  async getQuoteSummary(symbol: string, modules: string[]) {
    try {
      const response = await axios.get(`${this.baseURL}/summary/${symbol}`, {
        params: { modules: modules.join(',') },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 7. 搜索股票
  async searchStocks(query: string, quotesCount: number = 6, newsCount: number = 4) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: { query, quotesCount, newsCount },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 8. 获取推荐股票
  async getRecommendations(symbol: string) {
    try {
      const response = await axios.get(`${this.baseURL}/recommendations/${symbol}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 9. 获取热门股票
  async getTrendingStocks(region: string = 'US') {
    try {
      const response = await axios.get(`${this.baseURL}/trending`, {
        params: { region },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 10. 获取期权数据
  async getOptionsData(symbol: string, date?: string, strikeMin?: number, strikeMax?: number) {
    try {
      const params: Record<string, any> = {};
      if (date) params.date = date;
      if (strikeMin !== undefined) params.strikeMin = strikeMin;
      if (strikeMax !== undefined) params.strikeMax = strikeMax;

      const response = await axios.get(`${this.baseURL}/options/${symbol}`, { params });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 11. 获取洞察信息
  async getInsights(symbol: string) {
    try {
      const response = await axios.get(`${this.baseURL}/insights/${symbol}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 12. 获取涨幅最大的股票
  async getDailyGainers(count: number = 5, region: string = 'US') {
    try {
      const response = await axios.get(`${this.baseURL}/gainers`, {
        params: { count, region },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 13. 获取组合报价
  async getQuoteCombine(symbols: string[], modules: string[]) {
    try {
      const response = await axios.get(`${this.baseURL}/combine`, {
        params: {
          symbols: symbols.join(','),
          modules: modules.join(','),
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 14. 获取股票历史财报日期
  async getEarningsDates(symbol: string, years: number = 5) {
    try {
      const response = await axios.get(`${this.baseURL}/earnings-dates/${symbol}`, {
        params: { years },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// 导出一个默认实例
export const yahooFinanceClient = new YahooFinanceClient();

// 也可以导出类，允许用户创建自定义实例
export default YahooFinanceClient;
