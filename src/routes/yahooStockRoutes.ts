// src/routes/yahooStockRoutes.ts
import express, { Request, Response } from 'express';
import {
  // 股票信息处理函数
  getHistoricalDataHandler,
  getEarningsDatesHandler,
  getAllStockInfoHandler,
  getTrendingStocksHandler,
  getDailyGainersHandler,
  // 新增的API处理函数
  getStockPriceHandler,
  getMultipleStockPricesHandler,
  getStockSummaryHandler,
  // 搜索API处理函数
  searchStocksHandler,
  // 新增分析师洞察API处理函数
  getStockInsightsHandler,
} from '../services/yahooFinanceService';

const router = express.Router();

// 调试中间件，记录所有请求
router.use((req, res, next) => {
  console.log(`Yahoo Finance API 请求: ${req.method} ${req.originalUrl}`);
  next();
});

// 添加调试路由
router.get('/debug', (req, res) => {
  res.json({
    status: 'online',
    message: 'Yahoo Finance API 服务正常运行',
    availableEndpoints: [
      '/history/:symbol',
      '/earnings-dates/:symbol',
      '/all-info/:symbol',
      '/earnings-full/:symbol',
      '/trending',
      '/gainers',
      // 新增的API端点
      '/price/:symbol',
      '/prices',
      '/summary/:symbol',
      '/search',
      '/insights/:symbol',
    ],
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route GET /api/yahoo/price/:symbol
 * @description 获取特定股票的当前价格数据
 * @access Public
 */
router.get('/price/:symbol', getStockPriceHandler);

/**
 * @route GET /api/yahoo/prices
 * @description 获取多个股票的当前价格数据
 * @access Public
 */
router.get('/prices', getMultipleStockPricesHandler);

/**
 * @route GET /api/yahoo/summary/:symbol
 * @description 获取股票的基本概要信息
 * @access Public
 */
router.get('/summary/:symbol', getStockSummaryHandler);

/**
 * @route GET /api/yahoo/historical/:symbol
 * @description 获取历史价格数据
 * @access Public
 */
router.get('/historical/:symbol', getHistoricalDataHandler);

/**
 * @route GET /api/yahoo/allinfo/:symbol
 * @description 获取全部股票信息
 * @access Public
 */
router.get('/allinfo/:symbol', getAllStockInfoHandler);

/**
 * @route GET /api/yahoo/trending
 * @description 获取热门股票
 * @access Public
 */
router.get('/trending', getTrendingStocksHandler);

/**
 * @route GET /api/yahoo/gainers
 * @description 获取涨幅最大的股票
 * @access Public
 */
router.get('/gainers', getDailyGainersHandler);

/**
 * @route GET /api/yahoo/earnings-dates/:symbol
 * @description 获取财报日期
 * @access Public
 */
router.get('/earnings-dates/:symbol', getEarningsDatesHandler);

/**
 * @route GET /api/yahoo/search
 * @description 搜索股票
 * @access Public
 */
router.get('/search', searchStocksHandler);

/**
 * @route GET /api/yahoo/insights/:symbol
 * @description 获取股票分析师洞察
 * @access Public
 */
router.get('/insights/:symbol', getStockInsightsHandler);

export default router;
