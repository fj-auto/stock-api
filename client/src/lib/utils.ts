import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 处理API错误
export const handleApiError = (error: any): string => {
  if (error.response) {
    // 服务器响应了，但状态码不是2xx
    return error.response.data.error || error.response.data.message || '请求失败';
  } else if (error.request) {
    // 请求已发送但没收到响应
    return '无法连接到服务器，请检查网络连接';
  } else {
    // 请求设置时出现问题
    return error.message || '请求出错';
  }
};

// 格式化大数字
export function formatLargeNumber(value?: number): string {
  if (value === undefined || value === null) return 'N/A';

  if (value >= 1000000000000) {
    return `$${(value / 1000000000000).toFixed(2)}T`;
  } else if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

// 格式化百分比
export function formatPercent(value?: number): string {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(2)}%`;
}
