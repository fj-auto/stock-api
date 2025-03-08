import React, { useState, useEffect } from 'react';
import { StockPriceCard } from './StockPriceCard';
import { useStockContext } from '../context/StockContext';

interface StockWatchlistProps {
  onSelectStock: (symbol: string) => void;
  refreshInterval?: number;
}

export const StockWatchlist: React.FC<StockWatchlistProps> = ({
  onSelectStock,
  refreshInterval = 30000, // 默认 30 秒刷新一次
}) => {
  const { watchlist, removeFromWatchlist } = useStockContext();
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<any[]>([]);

  useEffect(() => {
    const fetchWatchlistData = async () => {
      if (watchlist.length === 0) {
        setStocks([]);
        return;
      }

      setLoading(true);
      try {
        // 模拟从 API 获取数据
        // 实际应用中应该使用真实的 API 调用
        const mockData = watchlist.map(symbol => ({
          symbol,
          price: Math.random() * 1000,
          change: Math.random() * 20 - 10,
          changePercent: Math.random() * 10 - 5,
          volume: Math.floor(Math.random() * 10000000),
          marketCap: Math.floor(Math.random() * 1000000000000),
        }));

        setStocks(mockData);
      } catch (error) {
        console.error('获取监视列表数据时出错:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistData();

    // 设置定时刷新
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchWatchlistData, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [watchlist, refreshInterval]);

  if (watchlist.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">您的监视列表是空的</p>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          在股票页面上点击星标图标将股票添加到您的监视列表
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && watchlist.length > 0 && stocks.length === 0 ? (
        <div className="p-6 text-center">
          <p>正在加载您的监视列表...</p>
        </div>
      ) : (
        <>
          {stocks.map(stock => (
            <StockPriceCard
              key={stock.symbol}
              symbol={stock.symbol}
              stock={stock}
              onClick={() => onSelectStock(stock.symbol)}
              onRemoveFromWatchlist={() => removeFromWatchlist(stock.symbol)}
            />
          ))}
        </>
      )}
    </div>
  );
};
