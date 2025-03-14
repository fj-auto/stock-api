// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import yahooFinanceAdapter from './utils/yahooFinanceAdapter';
import yahooRoutes from './routes/yahooStockRoutes';

// 加载环境变量
dotenv.config();

// 配置Yahoo Finance API - 注意：主要配置已移至yahooFinanceAdapter.ts
try {
  console.log('Yahoo Finance API配置已在适配器中设置');
} catch (error) {
  console.error('配置Yahoo Finance API时出错:', error);
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3002; // 修改端口为3002，避免冲突

// 中间件
app.use(cors());
app.use(express.json());
app.use(helmet());

// 速率限制器
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
});

// 应用速率限制器到所有请求
app.use(limiter);

// 路由定义
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用股票数据服务',
    version: '1.0.0',
    endpoints: {
      '/api/yahoo/search/:query': '搜索股票',
      '/api/yahoo/price/:symbol': '获取股票价格',
      '/api/yahoo/history/:symbol': '获取股票历史数据',
      '/api/yahoo/info/:symbol': '获取股票基本信息',
      '/api/yahoo/all-info/:symbol': '获取所有股票信息',
      '/api/yahoo/earnings-dates/:symbol': '获取财报日期',
    },
  });
});

// 挂载Yahoo Finance路由
app.use('/api/yahoo', yahooRoutes);

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 前端路由 (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '未找到请求的资源' });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误', details: err.message });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
