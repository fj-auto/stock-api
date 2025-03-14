// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import yahooFinance from 'yahoo-finance2';
import {
  getStockPriceHandler,
  getMultipleStockPricesHandler,
  getHistoricalDataHandler,
  getStockPrice,
  getTrendingStocks,
  getDailyGainers,
  DATA_REFRESH_INTERVAL,
} from './services/yahooFinanceService';
import yahooRoutes from './routes/yahooStockRoutes';

// 加载环境变量
dotenv.config();

// 配置yahoo-finance2，添加用户代理以解决401错误
try {
  // 更新 Yahoo Finance 配置，增强身份验证处理
  yahooFinance.defaultOptions = {
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
    validateResult: false, // 禁用结果验证以避免错误
    // 添加更多 Yahoo Finance 请求选项
    maxRetries: 3, // 请求失败时重试次数
    timeout: 10000, // 请求超时时间（毫秒）
    devel: true, // 开发模式，启用更多日志
  };

  // 禁用 Yahoo Finance 的错误通知
  yahooFinance.setGlobalConfig({
    validation: {
      logErrors: false,
      logOptionsErrors: false,
    },
  });

  // 抑制 Yahoo Finance 的问卷调查通知
  yahooFinance.suppressNotices(['yahooSurvey']);

  console.log('✅ Yahoo Finance 配置已更新，增强了身份验证处理');
} catch (error) {
  console.error('设置Yahoo Finance配置时出错:', error);
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001; // 确保使用了正确的端口 3001

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true }));

// 速率限制 - 防止API滥用
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口期
  max: 100, // 每个IP在窗口期内最多100个请求
  standardHeaders: true, // 返回标准的RateLimit头
  legacyHeaders: false, // 禁用旧版头
  message: '请求过于频繁，请稍后再试',
});
app.use(limiter);

// 挂载Yahoo Finance路由
app.use('/api/yahoo', yahooRoutes);

// 路由定义
app.get('/api/stock/:symbol', getStockPriceHandler);
app.get('/api/stocks', getMultipleStockPricesHandler);
app.get('/api/stock/:symbol/history', getHistoricalDataHandler);

// 主页路由
app.get('/', (req, res) => {
  res.json({
    message: '股票价格API服务已启动',
    endpoints: {
      singleStock: '/api/stock/:symbol',
      multipleStocks: '/api/stocks?symbols=AAPL,MSFT,GOOGL',
      historicalData: '/api/stock/:symbol/history?period=1mo&interval=1d',
    },
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '未找到请求的资源',
    suggestion: '请检查URL是否正确',
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('应用错误:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 服务器已启动: http://localhost:${PORT}`);
  console.log(`🔄 环境: ${process.env.NODE_ENV || 'development'}`);

  // 设置定期刷新热门数据的任务
  setupDataRefreshTasks();
});

/**
 * 设置定期刷新数据的任务
 */
function setupDataRefreshTasks() {
  const refreshInterval = DATA_REFRESH_INTERVAL;
  console.log(`🔄 配置数据刷新任务，频率: ${refreshInterval / 1000} 秒`);

  // 定期获取热门股票数据（美国市场）
  setInterval(async () => {
    try {
      console.log('执行定期任务: 刷新美国热门股票数据');
      await getTrendingStocks('US');
      console.log('美国热门股票数据已刷新');
    } catch (error) {
      console.error('刷新美国热门股票数据失败:', error);
    }
  }, refreshInterval);

  // 定期获取大涨股数据
  setInterval(async () => {
    try {
      console.log('执行定期任务: 刷新大涨股数据');
      await getDailyGainers(10, 'US');
      console.log('大涨股数据已刷新');
    } catch (error) {
      console.error('刷新大涨股数据失败:', error);
    }
  }, refreshInterval);

  // 定期获取主要股票数据
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'];
  setInterval(async () => {
    try {
      console.log('执行定期任务: 刷新主要股票数据');
      for (const symbol of popularStocks) {
        await getStockPrice(symbol);
      }
      console.log('主要股票数据已刷新');
    } catch (error) {
      console.error('刷新主要股票数据失败:', error);
    }
  }, refreshInterval);
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM信号收到，关闭HTTP服务器');
  server.close(() => {
    console.log('HTTP服务器已关闭');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', error => {
  console.error('未捕获的异常:', error);
  // 在严重错误的情况下，最好重启服务
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

export default app;
