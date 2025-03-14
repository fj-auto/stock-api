// src/pages/MarketOverviewPage.tsx
import React, { useEffect } from 'react';
import { useDailyGainers } from '../hooks/useYahooFinance';
import { StockPriceCard } from '../components/StockPriceCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketOverviewPage: React.FC = () => {
  const {
    data: gainersData,
    loading: gainersLoading,
    error: gainersError,
  } = useDailyGainers(10, 'US', 0);

  // 调试日志
  useEffect(() => {
    if (gainersData) {
      console.log('市场概览 - 涨幅最大股票数据:', gainersData);
    }
    if (gainersError) {
      console.error('市场概览 - 涨幅最大股票获取错误:', gainersError);
    }
  }, [gainersData, gainersError]);

  // 从涨幅数据中提取股票符号和涨幅 - 修正数据结构路径
  const gainersSymbols = gainersData?.quotes?.map((item: any) => item.symbol) || [];

  const chartData =
    gainersData?.quotes?.map((item: any) => ({
      symbol: item.symbol,
      changePercent: item.regularMarketChangePercent || 0,
    })) || [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">市场概览</h1>

      {/* 显示可能的API错误 */}
      {gainersError && (
        <div className="p-4 mb-4 text-sm rounded-lg bg-red-100 text-red-800">
          <p>涨幅最大股票获取失败: {gainersError.message}</p>
        </div>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>日内涨幅最大的股票</CardTitle>
          <CardDescription>市场表现最佳的前10只股票</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 mb-8">
            {gainersLoading ? (
              <div className="animate-pulse h-full bg-gray-200 rounded-md"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis
                    tickFormatter={value => `${value.toFixed(0)}%`}
                    label={{ value: '涨幅百分比', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: any) => {
                      const numValue = typeof value === 'number' ? value : parseFloat(value);
                      return [`${numValue.toFixed(2)}%`, '涨幅'];
                    }}
                  />
                  <Bar dataKey="changePercent" fill="#10b981" name="涨幅百分比" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {gainersLoading
              ? Array(10)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="animate-pulse h-36 bg-gray-200 rounded-md"></div>
                  ))
              : gainersSymbols.map((symbol: string) => (
                  <StockPriceCard
                    key={symbol}
                    symbol={symbol}
                    onSelect={symbol => {
                      window.location.href = `/stock/${symbol}`;
                    }}
                  />
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketOverviewPage;
