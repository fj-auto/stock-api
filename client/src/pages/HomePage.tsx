// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { StockSearch } from '../components/StockSearch';
import { StockPriceCard } from '../components/StockPriceCard';
import { StockWatchlist } from '../components/StockWatchlist';
import { useTrendingStocks, useDailyGainers } from '../hooks/useYahooFinance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, LineChart } from 'lucide-react';

const HomePage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('trending');
  const {
    data: trendingData,
    loading: trendingLoading,
    error: trendingError,
  } = useTrendingStocks('US', 0);
  const {
    data: gainersData,
    loading: gainersLoading,
    error: gainersError,
  } = useDailyGainers(5, 'US', 0);

  // 调试日志
  useEffect(() => {
    if (trendingData) {
      console.log('热门股票数据:', trendingData);
    }
    if (trendingError) {
      console.error('热门股票获取错误:', trendingError);
    }

    if (gainersData) {
      console.log('涨幅最大股票数据:', gainersData);
    }
    if (gainersError) {
      console.error('涨幅最大股票获取错误:', gainersError);
    }
  }, [trendingData, trendingError, gainersData, gainersError]);

  // 从趋势数据中提取股票符号 - 修正数据结构路径
  const trendingSymbols = trendingData?.quotes?.map((item: any) => item.symbol) || [];

  // 从涨幅数据中提取股票符号 - 修正数据结构路径
  const gainersSymbols = gainersData?.quotes?.map((item: any) => item.symbol) || [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">股票市场概览</h1>

      {/* 显示可能的API错误 */}
      {(trendingError || gainersError) && (
        <div className="p-4 mb-4 text-sm rounded-lg bg-red-100 text-red-800">
          {trendingError && <p>热门股票获取失败: {trendingError.message}</p>}
          {gainersError && <p>涨幅最大股票获取失败: {gainersError.message}</p>}
        </div>
      )}

      <div className="w-full max-w-md">
        <StockSearch
          onSelectStock={symbol => {
            window.location.href = `/stock/${symbol}`;
          }}
          placeholder="搜索股票代码或公司名称..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StockPriceCard
          symbol="AAPL"
          autoRefresh={true}
          onSelect={symbol => {
            window.location.href = `/stock/${symbol}`;
          }}
        />
        <StockPriceCard
          symbol="MSFT"
          autoRefresh={true}
          onSelect={symbol => {
            window.location.href = `/stock/${symbol}`;
          }}
        />
        <StockPriceCard
          symbol="GOOG"
          autoRefresh={true}
          onSelect={symbol => {
            window.location.href = `/stock/${symbol}`;
          }}
        />
      </div>

      <Tabs defaultValue="trending" className="w-full">
        <TabsList>
          <TabsTrigger value="trending" onClick={() => setSelectedTab('trending')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            热门股票
          </TabsTrigger>
          <TabsTrigger value="gainers" onClick={() => setSelectedTab('gainers')}>
            <DollarSign className="h-4 w-4 mr-2" />
            涨幅最大
          </TabsTrigger>
          <TabsTrigger value="watchlist" onClick={() => setSelectedTab('watchlist')}>
            <LineChart className="h-4 w-4 mr-2" />
            自选股
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle>市场热门股票</CardTitle>
              <CardDescription>当前市场最受关注的股票</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingLoading
                  ? Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="animate-pulse h-36 bg-gray-200 rounded-md"></div>
                      ))
                  : trendingSymbols.slice(0, 6).map((symbol: string) => (
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
        </TabsContent>

        <TabsContent value="gainers">
          <Card>
            <CardHeader>
              <CardTitle>涨幅最大的股票</CardTitle>
              <CardDescription>当日表现最佳的股票</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gainersLoading
                  ? Array(5)
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
        </TabsContent>

        <TabsContent value="watchlist">
          <StockWatchlist
            onSelectStock={symbol => {
              window.location.href = `/stock/${symbol}`;
            }}
            refreshInterval={60000}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomePage;
