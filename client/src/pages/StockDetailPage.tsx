// src/pages/StockDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { StockPriceCard } from '../components/StockPriceCard';
import { StockChart } from '../components/StockChart';
import { useQuoteSummary, useStockInsights, useChartData } from '../hooks/useYahooFinance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, LineChart, PieChart, TrendingUp, Info, DollarSign } from 'lucide-react';
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

  // 处理图表数据为适合组件使用的格式
  const processedChartData = React.useMemo(() => {
    if (
      !chartData ||
      !chartData.chart ||
      !chartData.chart.result ||
      chartData.chart.result.length === 0
    ) {
      return [];
    }

    const result = chartData.chart.result[0];
    const { timestamp, indicators } = result;

    if (!timestamp || !indicators || !indicators.quote || indicators.quote.length === 0) {
      return [];
    }

    const quote = indicators.quote[0];

    return timestamp.map((time: number, index: number) => ({
      date: time,
      close: quote.close?.[index] || 0,
      open: quote.open?.[index] || 0,
      high: quote.high?.[index] || 0,
      low: quote.low?.[index] || 0,
      volume: quote.volume?.[index] || 0,
    }));
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
                  <h3 className="font-medium">{summaryData?.assetProfile?.name || symbol}</h3>
                  <div className="text-sm text-muted-foreground">
                    {summaryData?.assetProfile?.industry && (
                      <span className="mr-2">行业: {summaryData.assetProfile.industry}</span>
                    )}
                    {summaryData?.assetProfile?.sector && (
                      <span className="mr-2">板块: {summaryData.assetProfile.sector}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm line-clamp-3">
                    {summaryData?.assetProfile?.longBusinessSummary || '暂无公司简介'}
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
            <StockChart data={processedChartData} period={period as any} showVolume={true} />
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
                      ${summaryData?.summaryDetail?.fiftyTwoWeekLow?.toFixed(2) || 'N/A'} - $
                      {summaryData?.summaryDetail?.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">市值</div>
                    <div className="font-medium">
                      {formatLargeNumber(summaryData?.summaryDetail?.marketCap)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">市盈率</div>
                    <div className="font-medium">
                      {summaryData?.summaryDetail?.trailingPE?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">每股收益</div>
                    <div className="font-medium">
                      ${summaryData?.defaultKeyStatistics?.trailingEps?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">股息收益率</div>
                    <div className="font-medium">
                      {summaryData?.summaryDetail?.dividendYield
                        ? (summaryData.summaryDetail.dividendYield * 100).toFixed(2) + '%'
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">平均成交量</div>
                    <div className="font-medium">
                      {formatLargeNumber(summaryData?.summaryDetail?.averageVolume)}
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
                      {formatLargeNumber(summaryData?.financialData?.totalRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">毛利率</div>
                    <div className="font-medium">
                      {summaryData?.financialData?.grossMargins
                        ? (summaryData.financialData.grossMargins * 100).toFixed(2) + '%'
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">营业利润率</div>
                    <div className="font-medium">
                      {summaryData?.financialData?.operatingMargins
                        ? (summaryData.financialData.operatingMargins * 100).toFixed(2) + '%'
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">总现金</div>
                    <div className="font-medium">
                      {formatLargeNumber(summaryData?.financialData?.totalCash)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">总债务</div>
                    <div className="font-medium">
                      {formatLargeNumber(summaryData?.financialData?.totalDebt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">经营现金流</div>
                    <div className="font-medium">
                      {formatLargeNumber(summaryData?.financialData?.operatingCashflow)}
                    </div>
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
                          ${summaryData?.financialData?.targetMeanPrice?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">最高目标价</div>
                        <div className="font-medium">
                          ${summaryData?.financialData?.targetHighPrice?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">最低目标价</div>
                        <div className="font-medium">
                          ${summaryData?.financialData?.targetLowPrice?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">分析师评级</h3>
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="font-bold text-xl">
                        {summaryData?.financialData?.recommendationMean?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {getRecommendationText(summaryData?.financialData?.recommendationKey)}(
                        {summaryData?.financialData?.numberOfAnalystOpinions || 0} 位分析师)
                      </div>
                    </div>

                    {/* 这里可以添加分析师评级的分布图表 */}
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

function getRecommendationText(key?: string): string {
  const recommendations: Record<string, string> = {
    strong_buy: '强力买入',
    buy: '买入',
    hold: '持有',
    sell: '卖出',
    strong_sell: '强力卖出',
    none: '无评级',
  };

  return recommendations[key || 'none'] || '无评级';
}

export default StockDetailPage;
