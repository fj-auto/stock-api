export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

export const ENDPOINTS = {
  // Yahoo Finance API端点
  YAHOO: {
    STOCK: (symbol: string) => `${API_BASE_URL}/yahoo/stock/${symbol}`,
    STOCKS: `${API_BASE_URL}/yahoo/stocks`,
    HISTORY: (symbol: string) => `${API_BASE_URL}/yahoo/stock/${symbol}/history`,
    AUTOC: `${API_BASE_URL}/yahoo/autoc`,
    CHART: (symbol: string) => `${API_BASE_URL}/yahoo/chart/${symbol}`,
    SUMMARY: (symbol: string) => `${API_BASE_URL}/yahoo/summary/${symbol}`,
    SEARCH: `${API_BASE_URL}/yahoo/search`,
    RECOMMENDATIONS: (symbol: string) => `${API_BASE_URL}/yahoo/recommendations/${symbol}`,
    TRENDING: `${API_BASE_URL}/yahoo/trending`,
    OPTIONS: (symbol: string) => `${API_BASE_URL}/yahoo/options/${symbol}`,
    INSIGHTS: (symbol: string) => `${API_BASE_URL}/yahoo/insights/${symbol}`,
    GAINERS: `${API_BASE_URL}/yahoo/gainers`,
    COMBINE: `${API_BASE_URL}/yahoo/combine`,
  },
};
