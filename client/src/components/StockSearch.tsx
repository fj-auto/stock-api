import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { yahooFinanceClient } from '../client/yahooFinanceClient';

// 定义 Yahoo Finance 搜索结果项的接口
interface YahooSearchResultItem {
  symbol: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchange?: string;
  [key: string]: any; // 允许其他属性
}

// 定义处理后的搜索结果项接口
interface ProcessedSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
  placeholder?: string;
}

export const StockSearch: React.FC<StockSearchProps> = ({
  onSelectStock,
  placeholder = '搜索股票...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProcessedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchStocks = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        // 使用 yahooFinanceClient 来搜索股票
        const result = await yahooFinanceClient.searchStocks(query);
        // 从响应中提取股票列表
        const stockResults = result.results || [];
        // 过滤和转换结果
        const validResults = stockResults
          .filter(
            (item: YahooSearchResultItem) => item.symbol && (item.name || item.type === 'EQUITY')
          )
          .map(
            (item: YahooSearchResultItem): ProcessedSearchResult => ({
              symbol: item.symbol,
              name: item.name || item.symbol,
              exchange: item.exchange || '',
            })
          );
        setResults(validResults);
      } catch (error) {
        console.error('搜索股票时出错:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      searchStocks();
    }, 500);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelectStock = (symbol: string) => {
    onSelectStock(symbol);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
          {results.map(result => (
            <div
              key={result.symbol}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
              onClick={() => handleSelectStock(result.symbol)}
            >
              <div className="font-medium">{result.symbol}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {result.name}
                {result.exchange && (
                  <span className="ml-2 text-xs opacity-70">{result.exchange}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute top-full left-0 right-0 z-10 p-4 mt-1 text-center bg-white border rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white">
          正在搜索...
        </div>
      )}
    </div>
  );
};
