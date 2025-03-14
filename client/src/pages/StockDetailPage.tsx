// src/pages/StockDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { StockPriceCard } from '../components/StockPriceCard';
import { StockChart } from '../components/StockChart';
import {
  useQuoteSummary,
  useStockInsights,
  useChartData,
  useEarningsDates,
} from '../hooks/useYahooFinance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart2,
  LineChart,
  PieChart,
  TrendingUp,
  Info,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// 格式化大数字的辅助函数
const formatLargeNumber = (num?: number) => {
  if (num === undefined || num === null) return 'N/A';

  if (num >= 1000000000000) {
    return `$${(num / 1000000000000).toFixed(2)}T`;
  } else if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else {
    return `$${num.toFixed(2)}`;
  }
};

// 计算市盈率的辅助函数
const calculatePE = (price?: number, eps?: number) => {
  if (!price || !eps || eps === 0) return null;
  return (price / eps).toFixed(2);
};

// 从分析师建议数据计算平均建议评分
const calculateRecommendationMean = (recommendations?: any) => {
  if (!recommendations) return null;

  const { strongBuy = 0, buy = 0, hold = 0, sell = 0, strongSell = 0 } = recommendations;
  const total = strongBuy + buy + hold + sell + strongSell;

  if (total === 0) return null;

  // 计算加权平均值：强烈推荐=1, 推荐=2, 持有=3, 卖出=4, 强烈卖出=5
  const weightedSum = 1 * strongBuy + 2 * buy + 3 * hold + 4 * sell + 5 * strongSell;

  return (weightedSum / total).toFixed(1);
};

// 获取分析师总数
const getTotalAnalysts = (recommendations?: any) => {
  if (!recommendations) return 0;

  const { strongBuy = 0, buy = 0, hold = 0, sell = 0, strongSell = 0 } = recommendations;
  return strongBuy + buy + hold + sell + strongSell;
};

// 从分析师建议数据获取推荐类型
const getRecommendationKeyFromAnalysts = (recommendations?: any) => {
  if (!recommendations) return null;

  const mean = Number(calculateRecommendationMean(recommendations));

  if (mean <= 1.5) return 'strongBuy';
  if (mean <= 2.5) return 'buy';
  if (mean <= 3.5) return 'hold';
  if (mean <= 4.5) return 'sell';
  return 'strongSell';
};

// 根据推荐类型获取文本描述
const getRecommendationText = (key?: string) => {
  switch (key) {
    case 'strongBuy':
      return '强烈推荐';
    case 'buy':
      return '买入';
    case 'hold':
      return '持有';
    case 'sell':
      return '卖出';
    case 'strongSell':
      return '强烈卖出';
    case 'underperform':
      return '表现不佳';
    case 'overperform':
      return '表现优异';
    default:
      return '未知';
  }
};

const StockDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [period, setPeriod] = useState('1mo');
  const [interval, setInterval] = useState('1d');

  // 获取公司基本信息和财务数据
  const { data: summaryData, loading: summaryLoading } = useQuoteSummary(symbol || '', [
    'assetProfile',
    'financialData',
    'summaryDetail',
    'defaultKeyStatistics',
    'recommendationTrend',
  ]);

  // 获取分析师洞察
  const { data: insightsData, loading: insightsLoading } = useStockInsights(symbol || '');

  // 获取图表数据
  const {
    data: chartData,
    loading: chartLoading,
    error: chartError,
    refetch: refetchChart,
  } = useChartData(symbol || '', interval, period);

  // 获取历史财报日期
  const {
    data: earningsData,
    loading: earningsLoading,
    error: earningsError,
    refetch: refetchEarnings,
  } = useEarningsDates(symbol || '');

  // 处理图表数据为适合组件使用的格式
  const processedChartData = React.useMemo(() => {
    // 处理新的API响应格式
    if (chartData && chartData.historicalData && chartData.historicalData.length > 0) {
      return chartData.historicalData.map((item: any) => ({
        date: new Date(item.date).getTime() / 1000, // 转换为Unix时间戳(秒)
        close: item.close || 0,
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        volume: item.volume || 0,
      }));
    }

    // 兼容旧格式
    if (
      chartData &&
      chartData.chart &&
      chartData.chart.result &&
      chartData.chart.result.length > 0
    ) {
      const result = chartData.chart.result[0];
      const { timestamp, indicators } = result;

      if (timestamp && indicators && indicators.quote && indicators.quote.length > 0) {
        const quote = indicators.quote[0];

        return timestamp.map((time: number, index: number) => ({
          date: time,
          close: quote.close?.[index] || 0,
          open: quote.open?.[index] || 0,
          high: quote.high?.[index] || 0,
          low: quote.low?.[index] || 0,
          volume: quote.volume?.[index] || 0,
        }));
      }
    }

    return [];
  }, [chartData]);

  // 处理周期切换
  const handlePeriodChange = (newPeriod: string, newInterval: string) => {
    setPeriod(newPeriod);
    setInterval(newInterval);
  };

  if (!symbol) {
    return <div className="p-8 text-center">股票代码无效</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">{symbol} - 股票详情</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <StockPriceCard symbol={symbol} autoRefresh={true} refreshInterval={30000} />
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>公司简介</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                </div>
              ) : (
                <>
                  <h3 className="font-medium">
                    {summaryData?.profile?.name || summaryData?.assetProfile?.name || symbol}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {(summaryData?.profile?.industry || summaryData?.assetProfile?.industry) && (
                      <span className="mr-2">
                        行业:{' '}
                        {summaryData?.profile?.industry || summaryData?.assetProfile?.industry}
                      </span>
                    )}
                    {(summaryData?.profile?.sector || summaryData?.assetProfile?.sector) && (
                      <span className="mr-2">
                        板块: {summaryData?.profile?.sector || summaryData?.assetProfile?.sector}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm line-clamp-3">
                    {summaryData?.profile?.description ||
                      summaryData?.assetProfile?.longBusinessSummary ||
                      '暂无公司简介'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>股价走势</CardTitle>
          <div className="flex mt-2 space-x-2 overflow-x-auto pb-2">
            <Button
              variant={period === '1d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('1d', '5m')}
            >
              1天
            </Button>
            <Button
              variant={period === '5d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('5d', '15m')}
            >
              5天
            </Button>
            <Button
              variant={period === '1mo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('1mo', '1d')}
            >
              1个月
            </Button>
            <Button
              variant={period === '3mo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('3mo', '1d')}
            >
              3个月
            </Button>
            <Button
              variant={period === '6mo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('6mo', '1d')}
            >
              6个月
            </Button>
            <Button
              variant={period === '1y' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('1y', '1d')}
            >
              1年
            </Button>
            <Button
              variant={period === '5y' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('5y', '1wk')}
            >
              5年
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">加载图表数据中...</p>
            </div>
          ) : chartError ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">加载图表数据失败</p>
                <Button size="sm" onClick={refetchChart}>
                  重试
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-96">
              <StockChart data={processedChartData} period={period as any} showVolume={true} />
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">
            <Info className="h-4 w-4 mr-2" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="financial">
            <BarChart2 className="h-4 w-4 mr-2" />
            财务指标
          </TabsTrigger>
          <TabsTrigger value="earnings">
            <Calendar className="h-4 w-4 mr-2" />
            财报日期
          </TabsTrigger>
          <TabsTrigger value="insight">
            <TrendingUp className="h-4 w-4 mr-2" />
            分析师观点
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>股票概览</CardTitle>
              <CardDescription>基本统计数据和市场表现</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                        <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground">52周范围</div>
                    <div className="font-medium">
                      $
                      {summaryData?.quoteSummary?.summaryDetail?.fiftyTwoWeekLow?.raw?.toFixed(2) ||
                        'N/A'}{' '}
                      - $
                      {summaryData?.quoteSummary?.summaryDetail?.fiftyTwoWeekHigh?.raw?.toFixed(
                        2
                      ) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">市值</div>
                    <div className="font-medium">
                      {formatLargeNumber(
                        summaryData?.quoteSummary?.summaryDetail?.marketCap?.raw ||
                          summaryData?.quoteSummary?.price?.marketCap?.raw
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">市盈率</div>
                    <div className="font-medium">
                      {summaryData?.quoteSummary?.summaryDetail?.trailingPE?.raw?.toFixed(2) ||
                        calculatePE(
                          summaryData?.quoteSummary?.price?.regularMarketPrice?.raw,
                          summaryData?.quoteSummary?.defaultKeyStatistics?.trailingEps?.raw
                        ) ||
                        'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">每股收益</div>
                    <div className="font-medium">
                      $
                      {summaryData?.quoteSummary?.defaultKeyStatistics?.trailingEps?.raw?.toFixed(
                        2
                      ) ||
                        (earningsData?.earningsDates &&
                          earningsData.earningsDates.length > 0 &&
                          earningsData.earningsDates[0].actualEPS) ||
                        'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">股息收益率</div>
                    <div className="font-medium">
                      {summaryData?.quoteSummary?.summaryDetail?.dividendYield?.raw
                        ? (summaryData.quoteSummary.summaryDetail.dividendYield.raw * 100).toFixed(
                            2
                          ) + '%'
                        : '0.00%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">平均成交量</div>
                    <div className="font-medium">
                      {formatLargeNumber(
                        summaryData?.keyStats?.averageVolume ||
                          summaryData?.summaryDetail?.averageVolume ||
                          summaryData?.price?.volume
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>财务指标</CardTitle>
              <CardDescription>主要财务数据和评估指标</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                        <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground">总收入</div>
                    <div className="font-medium">
                      {formatLargeNumber(
                        summaryData?.quoteSummary?.financialData?.totalRevenue?.raw
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">毛利率</div>
                    <div className="font-medium">
                      {summaryData?.quoteSummary?.financialData?.grossMargins?.raw
                        ? (summaryData.quoteSummary.financialData.grossMargins.raw * 100).toFixed(
                            2
                          ) + '%'
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">营业利润率</div>
                    <div className="font-medium">
                      {summaryData?.quoteSummary?.financialData?.operatingMargins?.raw
                        ? (
                            summaryData.quoteSummary.financialData.operatingMargins.raw * 100
                          ).toFixed(2) + '%'
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">总现金</div>
                    <div className="font-medium">
                      {formatLargeNumber(summaryData?.quoteSummary?.financialData?.totalCash?.raw)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">总债务</div>
                    <div className="font-medium">
                      {formatLargeNumber(summaryData?.quoteSummary?.financialData?.totalDebt?.raw)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">经营现金流</div>
                    <div className="font-medium">
                      {formatLargeNumber(
                        summaryData?.quoteSummary?.financialData?.operatingCashflow?.raw
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>历史财报日期</CardTitle>
              <CardDescription>过去几年的财报发布日期及每股收益信息</CardDescription>
            </CardHeader>
            <CardContent>
              {earningsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="grid grid-cols-4 gap-4">
                        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                      </div>
                    ))}
                </div>
              ) : earningsError ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">加载财报数据失败</p>
                  <Button size="sm" onClick={refetchEarnings}>
                    重试
                  </Button>
                </div>
              ) : !earningsData ||
                !earningsData.earningsDates ||
                earningsData.earningsDates.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  暂无财报数据
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-4 gap-4 font-medium text-sm mb-2 border-b pb-2">
                    <div>财报发布日期</div>
                    <div>实际EPS</div>
                    <div>预估EPS</div>
                    <div>意外百分比</div>
                  </div>
                  <div className="space-y-2">
                    {earningsData.earningsDates
                      .slice() // 创建副本以避免修改原数组
                      .sort((a: { date?: string }, b: { date?: string }) => {
                        // 按日期倒序排列（从新到旧）
                        const dateA = a.date ? new Date(a.date).getTime() : 0;
                        const dateB = b.date ? new Date(b.date).getTime() : 0;
                        return dateB - dateA; // 倒序排列
                      })
                      .map((item: any, index: number) => (
                        <div
                          key={index}
                          className={`grid grid-cols-4 gap-4 text-sm py-2 ${
                            index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                          }`}
                        >
                          <div>
                            {item.date && item.date.startsWith('+') ? '待公布' : item.date || 'N/A'}
                          </div>
                          <div className="font-medium">${item.actualEPS || 'N/A'}</div>
                          <div>${item.estimateEPS || item.epsEstimate || 'N/A'}</div>
                          <div
                            className={
                              item.surprisePercent > 0
                                ? 'text-green-600'
                                : item.surprisePercent < 0
                                ? 'text-red-600'
                                : ''
                            }
                          >
                            {item.surprisePercent
                              ? `${(item.surprisePercent * 100).toFixed(2)}%`
                              : 'N/A'}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insight">
          <Card>
            <CardHeader>
              <CardTitle>分析师观点</CardTitle>
              <CardDescription>市场预期和专业评估</CardDescription>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-24 bg-gray-200 rounded-md"></div>
                  <div className="grid grid-cols-3 gap-4">
                    {Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                          <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">目标价格</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">平均目标价</div>
                        <div className="font-medium">
                          $
                          {insightsData?.priceTarget?.mean ||
                            summaryData?.quoteSummary?.financialData?.targetMeanPrice?.raw?.toFixed(
                              2
                            ) ||
                            'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">最高目标价</div>
                        <div className="font-medium">
                          $
                          {insightsData?.priceTarget?.high ||
                            summaryData?.quoteSummary?.financialData?.targetHighPrice?.raw?.toFixed(
                              2
                            ) ||
                            'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">最低目标价</div>
                        <div className="font-medium">
                          $
                          {insightsData?.priceTarget?.low ||
                            summaryData?.quoteSummary?.financialData?.targetLowPrice?.raw?.toFixed(
                              2
                            ) ||
                            'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">分析师评级</h3>
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="font-bold text-xl">
                        {calculateRecommendationMean(insightsData?.analystsRecommendation) ||
                          summaryData?.quoteSummary?.financialData?.recommendationMean?.raw?.toFixed(
                            1
                          ) ||
                          'N/A'}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {getRecommendationText(
                          getRecommendationKeyFromAnalysts(insightsData?.analystsRecommendation) ||
                            summaryData?.quoteSummary?.financialData?.recommendationKey
                        )}
                        (
                        {insightsData?.priceTarget?.numberOfAnalysts ||
                          summaryData?.quoteSummary?.financialData?.numberOfAnalystOpinions?.raw ||
                          getTotalAnalysts(insightsData?.analystsRecommendation) ||
                          0}{' '}
                        位分析师)
                      </div>
                    </div>

                    {/* 如果有推荐趋势数据，显示推荐趋势 */}
                    {insightsData?.recommendationTrend?.trend &&
                      insightsData.recommendationTrend.trend.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">推荐趋势</h4>
                          <div className="flex justify-between text-sm">
                            <div>
                              强力买入: {insightsData.recommendationTrend.trend[0].strongBuy || 0}
                            </div>
                            <div>买入: {insightsData.recommendationTrend.trend[0].buy || 0}</div>
                            <div>持有: {insightsData.recommendationTrend.trend[0].hold || 0}</div>
                            <div>卖出: {insightsData.recommendationTrend.trend[0].sell || 0}</div>
                            <div>
                              强力卖出: {insightsData.recommendationTrend.trend[0].strongSell || 0}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDetailPage;
