# 股票服务 API 文档

本文档提供了股票服务 API 的详细说明。所有 API 都基于 RESTful 设计原则，并返回 JSON 格式的数据。

## 基础信息

- **基础 URL**: `http://localhost:3001`
- **认证方式**: 目前不需要认证
- **速率限制**: 每个 IP 在 15 分钟内最多允许 100 个请求

## 基础 API 接口

### 1. 获取单个股票价格

获取单个股票的实时价格数据。

- **URL**: `/api/stock/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL, 0700.HK, 600000.SS

**示例请求**:

```
GET /api/stock/AAPL
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "price": 175.23,
  "previousClose": 173.45,
  "change": 1.78,
  "changePercent": 1.03,
  "volume": 56789123,
  "marketCap": 2876543210000,
  "lastUpdated": "2023-03-07T12:34:56.789Z"
}
```

### 2. 获取多个股票价格

同时获取多个股票的实时价格数据。

- **URL**: `/api/stocks`
- **方法**: `GET`
- **查询参数**:
  - `symbols` (必填): 逗号分隔的股票代码列表，例如: AAPL,MSFT,GOOGL

**示例请求**:

```
GET /api/stocks?symbols=AAPL,MSFT,GOOGL
```

**成功响应**:

```json
[
  {
    "symbol": "AAPL",
    "price": 175.23,
    "previousClose": 173.45,
    "change": 1.78,
    "changePercent": 1.03,
    "volume": 56789123,
    "marketCap": 2876543210000,
    "lastUpdated": "2023-03-07T12:34:56.789Z"
  },
  {
    "symbol": "MSFT",
    "price": 290.45,
    "previousClose": 289.98,
    "change": 0.47,
    "changePercent": 0.16,
    "volume": 23456789,
    "marketCap": 2165432100000,
    "lastUpdated": "2023-03-07T12:34:56.789Z"
  },
  {
    "symbol": "GOOGL",
    "price": 134.67,
    "previousClose": 133.21,
    "change": 1.46,
    "changePercent": 1.09,
    "volume": 12345678,
    "marketCap": 1765432100000,
    "lastUpdated": "2023-03-07T12:34:56.789Z"
  }
]
```

### 3. 获取股票历史数据

获取单个股票的历史价格数据。

- **URL**: `/api/stock/:symbol/history`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `period` (可选): 时间跨度 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd)，默认为 `1mo`
  - `interval` (可选): 数据点间隔 (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)，默认为 `1d`

**示例请求**:

```
GET /api/stock/AAPL/history?period=1mo&interval=1d
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "historicalData": [
    {
      "date": "2023-02-07T00:00:00.000Z",
      "open": 173.45,
      "high": 175.32,
      "low": 172.89,
      "close": 174.76,
      "volume": 54321987,
      "adjClose": 174.76
    }
    // 更多历史数据点
  ]
}
```

## 高级 API 接口

以下是在 `/api/yahoo` 路径下的高级 Yahoo Finance API 接口。

### 1. 自动完成搜索

获取基于查询字符串的股票搜索建议。

- **URL**: `/api/yahoo/autoc`
- **方法**: `GET`
- **查询参数**:
  - `query` (必填): 搜索查询字符串

**示例请求**:

```
GET /api/yahoo/autoc?query=app
```

**成功响应**:

```json
{
  "suggestions": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exch": "NMS",
      "type": "S",
      "exchDisp": "NASDAQ",
      "typeDisp": "Equity"
    }
    // 更多搜索建议
  ]
}
```

### 2. 图表数据

获取股票的图表数据。

- **URL**: `/api/yahoo/chart/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `interval` (可选): 数据点间隔 (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)，默认为 `1d`
  - `range` (可选): 数据范围 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)，默认为 `1mo`
  - `includePrePost` (可选): 是否包含盘前盘后数据，默认为 `false`

**示例请求**:

```
GET /api/yahoo/chart/AAPL?interval=1d&range=1mo&includePrePost=false
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "timestamp": [...],
  "close": [...],
  "open": [...],
  "high": [...],
  "low": [...],
  "volume": [...]
}
```

### 3. 报价摘要及其子模块

获取股票的详细摘要信息。

- **URL**: `/api/yahoo/summary/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `modules` (可选): 逗号分隔的模块列表，可用模块包括: assetProfile, balanceSheetHistory, cashflowStatementHistory, defaultKeyStatistics, earnings, earningsHistory, earningsTrend, financialData, incomeStatementHistory, majorHoldersBreakdown, price, recommendationTrend, summaryDetail

**示例请求**:

```
GET /api/yahoo/summary/AAPL?modules=price,recommendationTrend,financialData
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "price": {
    "regularMarketPrice": 175.23,
    "regularMarketChange": 1.78,
    "regularMarketChangePercent": 1.03
    // 更多价格数据
  },
  "recommendationTrend": {
    // 推荐趋势数据
  },
  "financialData": {
    // 财务数据
  }
}
```

### 4. 搜索功能

搜索股票并可能包含相关新闻。

- **URL**: `/api/yahoo/search`
- **方法**: `GET`
- **查询参数**:
  - `query` (必填): 搜索查询字符串
  - `quotesCount` (可选): 返回的报价数量，默认为 `6`
  - `newsCount` (可选): 返回的新闻数量，默认为 `4`

**示例请求**:

```
GET /api/yahoo/search?query=apple&quotesCount=5&newsCount=3
```

**成功响应**:

```json
{
  "quotes": [
    // 股票报价数据
  ],
  "news": [
    // 相关新闻
  ]
}
```

### 5. 股票推荐

获取与特定股票相关的推荐股票。

- **URL**: `/api/yahoo/recommendations/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL

**示例请求**:

```
GET /api/yahoo/recommendations/AAPL
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "recommendedSymbols": [
    // 推荐股票列表
  ]
}
```

### 6. 热门股票

获取特定地区的热门股票。

- **URL**: `/api/yahoo/trending`
- **方法**: `GET`
- **查询参数**:
  - `region` (可选): 地区代码，例如: US, HK, CN，默认为 `US`

**示例请求**:

```
GET /api/yahoo/trending?region=US
```

**成功响应**:

```json
{
  "region": "US",
  "trending": [
    // 热门股票列表
  ]
}
```

### 7. 期权数据

获取股票的期权数据。

- **URL**: `/api/yahoo/options/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `date` (可选): 到期日期，格式为 YYYY-MM-DD
  - `strikeMin` (可选): 最小行权价
  - `strikeMax` (可选): 最大行权价

**示例请求**:

```
GET /api/yahoo/options/AAPL?date=2023-06-16&strikeMin=150&strikeMax=200
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "expirationDates": [
    // 可用的到期日期
  ],
  "strikes": [
    // 可用的行权价
  ],
  "options": {
    "calls": [
      // 看涨期权
    ],
    "puts": [
      // 看跌期权
    ]
  }
}
```

### 8. 洞察信息

获取股票的市场洞察信息。

- **URL**: `/api/yahoo/insights/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL

**示例请求**:

```
GET /api/yahoo/insights/AAPL
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "insights": {
    // 市场洞察信息
  }
}
```

### 9. 日内涨幅最大的股票

获取当日涨幅最大的股票。

- **URL**: `/api/yahoo/gainers`
- **方法**: `GET`
- **查询参数**:
  - `count` (可选): 返回的股票数量，默认为 `5`
  - `region` (可选): 地区代码，例如: US, HK, CN，默认为 `US`

**示例请求**:

```
GET /api/yahoo/gainers?count=10&region=US
```

**成功响应**:

```json
{
  "region": "US",
  "gainers": [
    // 涨幅最大的股票列表
  ]
}
```

### 10. 组合报价

获取多个股票的详细信息。

- **URL**: `/api/yahoo/combine`
- **方法**: `GET`
- **查询参数**:
  - `symbols` (必填): 逗号分隔的股票代码列表，例如: AAPL,MSFT,GOOGL
  - `modules` (可选): 逗号分隔的模块列表，与 summary 接口相同

**示例请求**:

```
GET /api/yahoo/combine?symbols=AAPL,MSFT,GOOGL&modules=price,financialData
```

**成功响应**:

```json
{
  "AAPL": {
    "price": {
      // 价格数据
    },
    "financialData": {
      // 财务数据
    }
  },
  "MSFT": {
    // 微软的数据
  },
  "GOOGL": {
    // 谷歌的数据
  }
}
```

### 11. 获取股票历史财报日期

获取特定股票过去的财报发布日期信息。

- **URL**: `/api/yahoo/earnings-dates/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `years` (可选): 要查询的年数，默认为 `5`，表示尝试获取过去 5 年的财报日期

**示例请求**:

```
GET /api/yahoo/earnings-dates/AAPL?years=5
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "earningsDates": [
    {
      "date": "2023-04-27T00:00:00.000Z",
      "quarter": "2023-03-31T00:00:00.000Z",
      "epsActual": 1.52,
      "epsEstimate": 1.43,
      "epsDifference": 0.09,
      "surprisePercent": 6.29
    },
    {
      "date": "2023-02-02T00:00:00.000Z",
      "quarter": "2022-12-31T00:00:00.000Z",
      "epsActual": 1.88,
      "epsEstimate": 1.94,
      "epsDifference": -0.06,
      "surprisePercent": -3.09
    }
    // 更多历史财报日期...
  ]
}
```

**响应说明**:

- `date`: 财报实际发布日期
- `quarter`: 财报所属季度的最后一天
- `epsActual`: 实际每股收益
- `epsEstimate`: 预估每股收益
- `epsDifference`: 实际与预估的差异
- `surprisePercent`: 超预期或低于预期的百分比

**注意**:

- Yahoo Finance API 可能无法提供完整的 5 年财报历史，返回的结果将包含 API 能够提供的最大范围。
- 由于 Yahoo Finance API 的限制，此端点可能需要多次调用基础 API 以获取更多历史数据。

## 错误处理

所有 API 在遇到错误时将返回适当的 HTTP 状态码，以及包含错误详情的 JSON 响应。

**错误响应示例**:

```json
{
  "error": "股票代码不存在",
  "message": "无法找到代码为 'INVALID' 的股票数据"
}
```

常见的 HTTP 状态码：

- `400` - 请求参数错误
- `404` - 资源未找到
- `429` - 请求过于频繁（超出速率限制）
- `500` - 服务器内部错误
