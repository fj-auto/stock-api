export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

export const ENDPOINTS = {
  // Yahoo Finance API端点
  YAHOO: {
    STOCK: (symbol: string) => `${API_BASE_URL}/yahoo/all-info/${symbol}`,
    STOCKS: `${API_BASE_URL}/yahoo/all-info`,
    HISTORY: (symbol: string) => `${API_BASE_URL}/yahoo/historical/${symbol}`,
    SEARCH: (query: string) => `${API_BASE_URL}/yahoo/search/${query}`,
    EARNINGS_DATES: (symbol: string, years?: number) =>
      `${API_BASE_URL}/yahoo/earnings-dates/${symbol}${years ? `?years=${years}` : ''}`,
    ALL_INFO: (symbol: string, refresh?: boolean) =>
      `${API_BASE_URL}/yahoo/all-info/${symbol}${refresh ? `?refresh=true` : ''}`,
    EARNINGS_FULL: (symbol: string) => `${API_BASE_URL}/yahoo/earnings-full/${symbol}`,
  },
};
