// src/routes/yahooStockRoutes.ts
import express from 'express';
import {
  // 已有处理函数
  getStockPriceHandler,
  getMultipleStockPricesHandler,
  getHistoricalDataHandler,

  // 新增处理函数
  getSearchSuggestionsHandler,
  getChartDataHandler,
  getQuoteSummaryHandler,
  searchStocksHandler,
  getRecommendationsHandler,
  getTrendingStocksHandler,
  getOptionsDataHandler,
  getInsightsHandler,
  getDailyGainersHandler,
  getQuoteCombineHandler,

  // 新增财报日期处理函数
  getEarningsDatesHandler,

  // 新增全部信息处理函数
  getAllStockInfoHandler,

  // 新增详细财报数据处理函数
  getEarningsFullDataHandler,
} from '../services/yahooFinanceService';

const router = express.Router();

// 调试中间件，记录所有请求
router.use((req, res, next) => {
  console.log(`Yahoo Finance API 请求: ${req.method} ${req.originalUrl}`);
  next();
});

// 基本报价路由 - 已有
router.get('/stock/:symbol', getStockPriceHandler);
router.get('/stocks', getMultipleStockPricesHandler);
router.get('/stock/:symbol/history', getHistoricalDataHandler);

// 新增路由
// 1. 自动完成搜索
router.get('/autoc', getSearchSuggestionsHandler);

// 2. 图表数据
router.get('/chart/:symbol', getChartDataHandler);

// 3. 报价摘要及其子模块
router.get('/summary/:symbol', getQuoteSummaryHandler);

// 4. 搜索功能
router.get('/search', searchStocksHandler);

// 5. 股票推荐
router.get('/recommendations/:symbol', getRecommendationsHandler);

// 6. 热门股票
router.get('/trending', getTrendingStocksHandler);

// 7. 期权数据
router.get('/options/:symbol', getOptionsDataHandler);

// 8. 洞察信息
router.get('/insights/:symbol', getInsightsHandler);

// 9. 日内涨幅最大的股票
router.get('/gainers', getDailyGainersHandler);

// 10. 组合报价
router.get('/combine', getQuoteCombineHandler);

// 11. 获取股票历史财报日期
router.get('/earnings-dates/:symbol', getEarningsDatesHandler);

// 12. 获取股票全部信息（所有可用模块）
router.get('/all-info/:symbol', getAllStockInfoHandler);

// 13. 获取股票详细财报数据
router.get('/earnings-full/:symbol', getEarningsFullDataHandler);

export default router;
