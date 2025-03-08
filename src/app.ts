// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import yahooStockRoutes from './routes/yahooStockRoutes';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(express.json()); // JSON解析

// 速率限制 - 防止API滥用
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口期
  max: 100, // 每个IP在窗口期内最多100个请求
  standardHeaders: true, // 返回标准的RateLimit头
  legacyHeaders: false, // 禁用旧版头
  message: '请求过于频繁，请稍后再试',
});
app.use(limiter);

// 添加路由前缀
app.use('/api', yahooStockRoutes);

// 主页路由
app.get('/', (req, res) => {
  res.json({
    message: '股票价格API服务已启动',
    documentation: '/api/docs',
    endpoints: {
      singleStock: '/api/stock/:symbol',
      multipleStocks: '/api/stocks?symbols=AAPL,MSFT,GOOGL',
      historicalData: '/api/stock/:symbol/history?period=1mo&interval=1d',
    },
  });
});

// API文档路由
app.get('/api/docs', (req, res) => {
  res.json({
    description: '股票价格API文档',
    endpoints: [
      {
        path: '/api/stock/:symbol',
        method: 'GET',
        description: '获取单个股票的实时价格数据',
        params: {
          symbol: '股票代码，例如: AAPL, MSFT, GOOGL, 0700.HK, 600000.SS',
        },
        example: '/api/stock/AAPL',
      },
      {
        path: '/api/stocks',
        method: 'GET',
        description: '获取多个股票的实时价格数据',
        query: {
          symbols: '逗号分隔的股票代码列表，例如: AAPL,MSFT,GOOGL',
        },
        example: '/api/stocks?symbols=AAPL,MSFT,GOOGL',
      },
      {
        path: '/api/stock/:symbol/history',
        method: 'GET',
        description: '获取单个股票的历史价格数据',
        params: {
          symbol: '股票代码，例如: AAPL, MSFT, GOOGL',
        },
        query: {
          period: '时间跨度 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd)',
          interval: '数据点间隔 (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)',
        },
        example: '/api/stock/AAPL/history?period=1mo&interval=1d',
      },
    ],
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '未找到请求的资源',
    suggestion: '请检查URL是否正确，或访问 /api/docs 查看可用的API端点',
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
app.listen(PORT, () => {
  console.log(`🚀 服务器已启动: http://localhost:${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}/api/docs`);
  console.log(`🔄 环境: ${process.env.NODE_ENV || 'development'}`);
});

// 处理未捕获的异常
process.on('uncaughtException', error => {
  console.error('未捕获的异常:', error);
  // 在生产环境中，这里可以添加通知机制，例如发送邮件或消息到Slack
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

export default app;
