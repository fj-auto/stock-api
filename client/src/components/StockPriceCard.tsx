// src/components/StockPriceCard.tsx (修改版)
import React from 'react';
import { useStockPrice } from '../hooks/useYahooFinance';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Star, StarOff } from 'lucide-react';
import { useStockContext } from '../context/StockContext';
import { formatLargeNumber } from '../lib/utils';

interface StockPriceCardProps {
  symbol: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onSelect?: (symbol: string) => void;
  showWatchlistButton?: boolean;
  stock?: any;
  onClick?: () => void;
  onRemoveFromWatchlist?: () => void;
}

export const StockPriceCard: React.FC<StockPriceCardProps> = ({
  symbol,
  autoRefresh = false,
  refreshInterval = 60000, // 默认1分钟刷新一次
  onSelect,
  showWatchlistButton = false,
  stock,
  onClick,
  onRemoveFromWatchlist,
}) => {
  // 如果直接传入了 stock 对象，则使用它，否则通过 API 获取数据
  const shouldFetchData = !stock;
  const symbolToUse = stock?.symbol || symbol;

  const {
    data: fetchedData,
    loading,
    error,
    lastUpdated,
    refetch,
  } = useStockPrice(shouldFetchData ? symbolToUse : null, autoRefresh ? refreshInterval : 0);

  // 使用传入的 stock 数据或从 API 获取的数据
  const data = stock || fetchedData;

  const {
    addToWatchlist,
    removeFromWatchlist: removeFromWatchlistContext,
    isInWatchlist,
  } = useStockContext();
  const isWatchlisted = isInWatchlist(symbolToUse);

  // 处理添加/删除股票到监视列表
  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWatchlisted) {
      if (onRemoveFromWatchlist) {
        onRemoveFromWatchlist();
      } else {
        removeFromWatchlistContext(symbolToUse);
      }
    } else {
      addToWatchlist(symbolToUse);
    }
  };

  // 处理点击
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onSelect) {
      onSelect(symbolToUse);
    }
  };

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle>{symbolToUse}</CardTitle>
          <CardDescription>加载错误</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.message}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card className="opacity-75">
        <CardHeader>
          <CardTitle>{symbolToUse}</CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex flex-col gap-2">
            <div className="h-6 bg-gray-200 rounded-md w-24"></div>
            <div className="h-4 bg-gray-200 rounded-md w-16"></div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="h-3 bg-gray-200 rounded-md w-12 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded-md w-16"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-200 rounded-md w-12 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded-md w-16"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect ? handleClick : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbolToUse}
              {showWatchlistButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={handleWatchlistToggle}
                >
                  {isWatchlisted ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
              )}
            </CardTitle>
            <CardDescription>Last Price</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${data?.price.toFixed(2)}</div>
            {data?.change !== undefined && (
              <div
                className={`flex items-center ${
                  data.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {data.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span>
                  ${Math.abs(data.change).toFixed(2)} (
                  {Math.abs(data.changePercent || 0).toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Volume</div>
            <div>{data?.volume ? (data.volume / 1000000).toFixed(2) + 'M' : 'N/A'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Market Cap</div>
            <div>{formatLargeNumber(data?.marketCap)}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-1 text-xs text-muted-foreground">
        {lastUpdated ? (
          <div className="flex justify-between w-full">
            <span>更新于 {lastUpdated.toLocaleTimeString()}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={e => {
                e.stopPropagation();
                refetch();
              }}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span>加载中...</span>
        )}
      </CardFooter>
    </Card>
  );
};
