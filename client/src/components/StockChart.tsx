import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Rectangle,
  Scatter,
  ReferenceArea,
} from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';

interface StockChartProps {
  data?: any[];
  period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';
  showVolume?: boolean;
  symbol?: string;
  initialPeriod?: string;
  initialInterval?: string;
}

// 定义均线类型
type EMAType = 3 | 9 | 21 | 50 | 144 | 200;

// 均线配置
interface EMAConfig {
  days: EMAType;
  color: string;
  enabled: boolean;
}

// 定义K线图的数据处理工具函数
const prepareDataForCandlestick = (data: any[]) => {
  return data.map(item => ({
    ...item,
    // 添加计算属性，用于K线图显示
    priceDiff: item.close - item.open,
    // 正负价格差，用于确定颜色
    isPositive: item.close >= item.open,
  }));
};

// 计算EMA (指数移动平均线)
const calculateEMA = (data: any[], period: number): (number | null)[] => {
  if (!data || data.length === 0) return [];

  const ema: (number | null)[] = [];
  const k = 2 / (period + 1);

  // 初始EMA值使用前period个收盘价的简单平均数
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i].close;
  }

  // 初始EMA
  ema[period - 1] = sum / period;

  // 计算剩余数据的EMA
  for (let i = period; i < data.length; i++) {
    const prevEma = ema[i - 1];
    // 确保前一个EMA值不为null
    if (prevEma !== null) {
      ema[i] = data[i].close * k + prevEma * (1 - k);
    } else {
      // 如果前一个值为null，使用当前收盘价作为EMA
      ema[i] = data[i].close;
    }
  }

  // 填充前period-1个未计算的值
  for (let i = 0; i < period - 1; i++) {
    ema[i] = null;
  }

  return ema;
};

// 为数据添加EMA
const addEMAToData = (data: any[], emaPeriods: EMAType[]): any[] => {
  if (!data || data.length === 0 || !emaPeriods || emaPeriods.length === 0) {
    return data;
  }

  const enrichedData = [...data];

  // 为每个EMA周期计算并添加EMA值
  emaPeriods.forEach(period => {
    const emaValues = calculateEMA(data, period);

    // 将EMA值添加到数据中
    enrichedData.forEach((item, index) => {
      item[`ema${period}`] = emaValues[index];
    });
  });

  return enrichedData;
};

// 定义K线图形状组件
// 这是自定义的K线绘制组件，用于Scatter的shape属性
const CandlestickShape = (props: any) => {
  // Recharts 会传入以下属性
  const {
    cx,
    cy, // 中心点坐标
    payload,
    index,
    xAxis,
    yAxis,
  } = props;

  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
    return <g></g>;
  }

  // 判断是上涨还是下跌
  const isRising = payload.close >= payload.open;
  const color = isRising ? '#10B981' : '#EF4444'; // 绿色表示上涨，红色表示下跌

  // K线宽度，适当调窄以便看清
  const candleWidth = 8;
  const halfCandleWidth = candleWidth / 2;

  // 使用yAxis.scale来将价格转换为像素坐标
  // 这确保K线的位置和比例准确反映数据
  if (!yAxis || !yAxis.scale) {
    return <g></g>;
  }

  // 计算所有关键位置的y坐标
  const openY = yAxis.scale(payload.open);
  const closeY = yAxis.scale(payload.close);
  const highY = yAxis.scale(payload.high);
  const lowY = yAxis.scale(payload.low);

  // 确定蜡烛实体的顶部和底部
  const candleTop = Math.min(openY, closeY);
  const candleBottom = Math.max(openY, closeY);
  const candleHeight = Math.abs(candleBottom - candleTop);

  return (
    <g>
      {/* 上下影线 - 从最高价到最低价 */}
      <line x1={cx} y1={highY} x2={cx} y2={lowY} stroke={color} strokeWidth={1} />

      {/* 蜡烛实体 - 从开盘价到收盘价 */}
      <rect
        x={cx - halfCandleWidth}
        y={candleTop}
        width={candleWidth}
        height={Math.max(candleHeight, 1)} // 确保至少有1像素的高度
        fill={color}
        stroke={color}
      />
    </g>
  );
};

export const StockChart: React.FC<StockChartProps> = ({
  data = [],
  period = '1mo',
  showVolume = true,
  symbol,
  initialPeriod,
  initialInterval,
}) => {
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod || period);

  // 均线配置状态
  const [emaConfig, setEmaConfig] = useState<EMAConfig[]>([
    { days: 3, color: '#FF9800', enabled: false },
    { days: 9, color: '#2196F3', enabled: false },
    { days: 21, color: '#4CAF50', enabled: false },
    { days: 50, color: '#9C27B0', enabled: false },
    { days: 144, color: '#E91E63', enabled: false },
    { days: 200, color: '#607D8B', enabled: false },
  ]);

  // 处理好的K线图数据
  const candlestickData = React.useMemo(() => prepareDataForCandlestick(data), [data]);

  // 添加EMA数据
  const enabledEmaPeriods = emaConfig.filter(config => config.enabled).map(config => config.days);
  const dataWithEMA = React.useMemo(
    () => addEMAToData(candlestickData, enabledEmaPeriods),
    [candlestickData, enabledEmaPeriods]
  );

  React.useEffect(() => {
    if (symbol && data.length === 0) {
      console.log(`应该从API获取${symbol}的${selectedPeriod}数据`);
    }
  }, [symbol, selectedPeriod, data.length]);

  // 处理均线开关切换
  const handleEmaToggle = (index: number) => {
    const newConfig = [...emaConfig];
    newConfig[index].enabled = !newConfig[index].enabled;
    setEmaConfig(newConfig);
  };

  // 格式化日期，根据周期选择不同的显示格式
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    switch (period) {
      case '1d':
        return format(date, 'HH:mm', { locale: zhCN });
      case '5d':
        return format(date, 'M月d日 HH:mm', { locale: zhCN });
      case '1mo':
        return format(date, 'M月d日', { locale: zhCN });
      case '3mo':
      case '6mo':
        return format(date, 'M月d日', { locale: zhCN });
      case '1y':
      case '5y':
        return format(date, 'yyyy年M月', { locale: zhCN });
      default:
        return format(date, 'yyyy-MM-dd', { locale: zhCN });
    }
  };

  // 格式化工具提示中的日期
  const formatTooltipDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return format(date, 'yyyy年M月d日 HH:mm:ss', { locale: zhCN });
  };

  // 自定义工具提示内容 - 折线图
  const LineChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border rounded-md shadow-md dark:bg-gray-800 dark:border-gray-700 dark:text-white">
          <p className="font-medium">{formatTooltipDate(label)}</p>
          <p className="text-blue-500">价格: ¥{payload[0].value.toFixed(2)}</p>

          {/* 显示均线值 */}
          {emaConfig
            .filter(config => config.enabled)
            .map((config, index) => {
              const emaPayload = payload.find((p: any) => p.dataKey === `ema${config.days}`);
              if (emaPayload && emaPayload.value !== null) {
                return (
                  <p key={index} style={{ color: config.color }}>
                    EMA{config.days}: ¥{emaPayload.value.toFixed(2)}
                  </p>
                );
              }
              return null;
            })}
        </div>
      );
    }
    return null;
  };

  // 自定义工具提示内容 - K线图
  const CandlestickTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      // 获取K线图数据项
      const dataItem = payload[0].payload;

      return (
        <div className="p-3 bg-white border rounded-md shadow-md dark:bg-gray-800 dark:border-gray-700 dark:text-white">
          <p className="font-medium">{formatTooltipDate(dataItem.date)}</p>
          <p className="text-gray-600 dark:text-gray-300">开盘: ¥{dataItem.open.toFixed(2)}</p>
          <p className="text-gray-600 dark:text-gray-300">收盘: ¥{dataItem.close.toFixed(2)}</p>
          <p className="text-gray-600 dark:text-gray-300">最高: ¥{dataItem.high.toFixed(2)}</p>
          <p className="text-gray-600 dark:text-gray-300">最低: ¥{dataItem.low.toFixed(2)}</p>
          <p className={`font-medium ${dataItem.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            涨跌: ¥{dataItem.priceDiff.toFixed(2)}(
            {((dataItem.priceDiff / dataItem.open) * 100).toFixed(2)}%)
          </p>

          {/* 显示均线值 */}
          {emaConfig
            .filter(config => config.enabled)
            .map((config, index) => {
              const emaKey = `ema${config.days}`;
              if (dataItem[emaKey] !== null && dataItem[emaKey] !== undefined) {
                return (
                  <p key={index} style={{ color: config.color }}>
                    EMA{config.days}: ¥{dataItem[emaKey].toFixed(2)}
                  </p>
                );
              }
              return null;
            })}
        </div>
      );
    }
    return null;
  };

  // 计算价格范围，用于设置Y轴范围
  const getPriceRange = () => {
    if (!data || data.length === 0) return ['auto', 'auto'];

    // 找出价格的最大值和最小值
    let minPrice = Math.min(...data.map(item => item.low));
    let maxPrice = Math.max(...data.map(item => item.high));

    // 添加一点缓冲区，使K线不会紧贴图表边缘
    const buffer = (maxPrice - minPrice) * 0.05;
    return [Math.max(0, minPrice - buffer), maxPrice + buffer];
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">无图表数据可用</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {emaConfig.map((config, index) => (
            <div key={index} className="flex items-center space-x-1">
              <Switch
                id={`ema-${config.days}`}
                checked={config.enabled}
                onCheckedChange={() => handleEmaToggle(index)}
              />
              <Label htmlFor={`ema-${config.days}`} className="text-xs">
                <span style={{ color: config.color }}>EMA{config.days}</span>
              </Label>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-md ${
              chartType === 'line'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setChartType('line')}
          >
            折线图
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${
              chartType === 'candlestick'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setChartType('candlestick')}
          >
            K线图
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'line' ? (
          <LineChart
            key="line-chart"
            data={dataWithEMA}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
            <YAxis domain={getPriceRange()} tick={{ fontSize: 12 }} />
            <Tooltip content={<LineChartTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="close" stroke="#3B82F6" dot={false} name="价格" />

            {/* 渲染均线 */}
            {emaConfig
              .filter(config => config.enabled)
              .map((config, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`ema${config.days}`}
                  stroke={config.color}
                  dot={false}
                  name={`EMA${config.days}`}
                  strokeWidth={1.5}
                />
              ))}
          </LineChart>
        ) : (
          <ComposedChart
            key="candlestick-chart"
            data={dataWithEMA}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
            <YAxis domain={getPriceRange()} tick={{ fontSize: 12 }} />
            <Tooltip content={<CandlestickTooltip />} />
            <Legend />

            {/* K线图 */}
            <Scatter name="价格" data={dataWithEMA} fill="#8884d8" shape={<CandlestickShape />} />

            {/* 渲染均线 */}
            {emaConfig
              .filter(config => config.enabled)
              .map((config, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`ema${config.days}`}
                  stroke={config.color}
                  dot={false}
                  name={`EMA${config.days}`}
                  strokeWidth={1.5}
                />
              ))}
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
