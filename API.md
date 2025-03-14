# 股票服务 API 文档

本文档提供了股票服务 API 的详细说明。所有 API 都基于 RESTful 设计原则，并返回 JSON 格式的数据。

## 基础信息

- **基础 URL**: `http://localhost:3001`
- **认证方式**: 目前不需要认证
- **速率限制**: 每个 IP 在 15 分钟内最多允许 100 个请求

## Yahoo Finance API 接口

以下是在 `/api/yahoo` 路径下的 Yahoo Finance API 接口。

### 1. 获取单个股票价格

获取单个股票的实时价格数据。

- **URL**: `/api/yahoo/price/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL, 0700.HK, 600000.SS
- **查询参数**:
  - `refresh` (可选): 是否刷新缓存数据，布尔值，默认为 `false`

**示例请求**:

```
GET /api/yahoo/price/AAPL
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "price": 209.68,
  "previousClose": 216.98,
  "change": -7.3,
  "changePercent": -3.36,
  "volume": 60306872,
  "marketCap": 3149833961472,
  "lastUpdated": "2025-03-14T09:10:07.018Z",
  "fromCache": false
}
```

### 2. 获取多个股票价格

同时获取多个股票的实时价格数据。

- **URL**: `/api/yahoo/prices`
- **方法**: `GET`
- **查询参数**:
  - `symbols` (必填): 逗号分隔的股票代码列表，例如: AAPL,MSFT,GOOGL
  - `refresh` (可选): 是否刷新缓存数据，布尔值，默认为 `false`

**示例请求**:

```
GET /api/yahoo/prices?symbols=AAPL,MSFT,GOOGL
```

**成功响应**:

```json
[
  {
    "symbol": "AAPL",
    "price": 209.68,
    "previousClose": 216.98,
    "change": -7.3,
    "changePercent": -3.36,
    "volume": 60306872,
    "marketCap": 3149833961472,
    "lastUpdated": "2025-03-14T09:10:07.018Z",
    "fromCache": true
  },
  {
    "symbol": "MSFT",
    "price": 415.1,
    "previousClose": 417.0,
    "change": -1.9,
    "changePercent": -0.46,
    "volume": 23456789,
    "marketCap": 3100432100000,
    "lastUpdated": "2025-03-14T09:10:08.789Z",
    "fromCache": false
  },
  {
    "symbol": "GOOGL",
    "price": 145.67,
    "previousClose": 147.21,
    "change": -1.54,
    "changePercent": -1.05,
    "volume": 12345678,
    "marketCap": 1835432100000,
    "lastUpdated": "2025-03-14T09:10:09.123Z",
    "fromCache": false
  }
]
```

### 3. 获取股票历史数据

获取单个股票的历史价格数据。

- **URL**: `/api/yahoo/history/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `period` (可选): 时间跨度 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd)，默认为 `1mo`
  - `interval` (可选): 数据点间隔 (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)，默认为 `1d`
  - `refresh` (可选): 是否刷新缓存数据，布尔值，默认为 `false`

**示例请求**:

```
GET /api/yahoo/history/AAPL?period=1mo&interval=1d
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "currency": "USD",
  "historicalData": [
    {
      "date": "2025-02-14T14:30:00.000Z",
      "open": 241.25,
      "high": 245.55,
      "low": 241.0,
      "close": 244.6,
      "volume": 40896200,
      "adjClose": 244.6
    }
    // 更多历史数据点
  ],
  "metadata": {
    "symbol": "AAPL",
    "currency": "USD",
    "exchangeName": "NMS",
    "instrumentType": "EQUITY",
    "firstTradeDate": "1980-12-12T14:30:00.000Z",
    "retrievedAt": "2025-03-14T09:10:42.942Z"
  },
  "fromCache": false
}
```

### 4. 获取股票摘要信息

获取股票的详细摘要信息。

- **URL**: `/api/yahoo/summary/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `refresh` (可选): 是否刷新缓存数据，布尔值，默认为 `false`

**示例请求**:

```
GET /api/yahoo/summary/AAPL
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "website": "https://www.apple.com",
  "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide...",
  "country": "United States",
  "fullTimeEmployees": 161000,
  "keyStats": {
    "marketCap": 3149833961472,
    "pe": 24.47,
    "eps": 8.57,
    "dividend": 0.96,
    "dividendYield": 0.46,
    "beta": 1.28
  },
  "price": {
    "regularMarketPrice": 209.68,
    "regularMarketChange": -7.3,
    "regularMarketChangePercent": -3.36,
    "regularMarketDayHigh": 216.84,
    "regularMarketDayLow": 208.42,
    "regularMarketVolume": 60306872
  },
  "metadata": {
    "retrievedAt": "2025-03-14T09:11:20.123Z",
    "source": "Yahoo Finance"
  },
  "fromCache": false
}
```

### 5. 获取全部股票信息

获取股票的所有详细信息。

- **URL**: `/api/yahoo/all-info/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `refresh` (可选): 是否刷新缓存数据，布尔值，默认为 `false`

**示例请求**:

```
GET /api/yahoo/all-info/AAPL
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "price": {
    // 价格详情
  },
  "summaryDetail": {
    // 摘要详情
  },
  "assetProfile": {
    // 资产配置
  },
  "financialData": {
    // 财务数据
  },
  "balanceSheetHistory": {
    // 资产负债表历史
  },
  "incomeStatementHistory": {
    // 损益表历史
  },
  "cashflowStatementHistory": {
    // 现金流量表历史
  },
  "defaultKeyStatistics": {
    // 关键统计
  },
  "recommendationTrend": {
    // 推荐趋势
  },
  "metadata": {
    "retrievedAt": "2025-03-14T09:10:29.193Z",
    "source": "雅虎财经"
  },
  "fromCache": false
}
```

### 6. 搜索股票

搜索股票并返回结果。

- **URL**: `/api/yahoo/search`
- **方法**: `GET`
- **查询参数**:
  - `query` (必填): 搜索查询字符串
  - `limit` (可选): 返回的结果数量，默认为 `10`

**示例请求**:

```
GET /api/yahoo/search?query=apple&limit=5
```

**成功响应**:

```json
{
  "query": "apple",
  "count": 5,
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NMS",
      "type": "EQUITY",
      "typeDisp": "Equity",
      "exchangeDisp": "NASDAQ"
    }
    // 更多搜索结果
  ]
}
```

### 7. 获取股票推荐

获取与特定股票相关的推荐股票。

- **URL**: `/api/yahoo/recommendations/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `refresh` (可选): 是否刷新缓存数据，布尔值，默认为 `false`

**示例请求**:

```
GET /api/yahoo/recommendations/AAPL
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "recommendedSymbols": [
    {
      "symbol": "MSFT",
      "name": "Microsoft Corporation",
      "score": 0.95
    },
    {
      "symbol": "GOOGL",
      "name": "Alphabet Inc.",
      "score": 0.92
    }
    // 更多推荐股票
  ]
}
```

### 8. 热门股票

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
  "count": 10,
  "quotes": [
    {
      "symbol": "DOCU"
    },
    {
      "symbol": "GC=F"
    },
    {
      "symbol": "ULTA"
    }
    // 更多热门股票
  ],
  "startInterval": 202503140800,
  "jobTimestamp": 1741943261311
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
GET /api/yahoo/gainers?count=5&region=US
```

**成功响应**:

```json
{
  "canonicalName": "DAY_GAINERS",
  "count": 5,
  "quotes": [
    {
      "symbol": "INTC",
      "shortName": "Intel Corporation",
      "regularMarketPrice": 23.7,
      "regularMarketChange": 3.02,
      "regularMarketChangePercent": 14.6,
      "regularMarketVolume": 241655664
      // 更多股票详情
    }
    // 更多涨幅最大的股票
  ],
  "title": "Day Gainers",
  "total": 25
}
```

### 10. 获取股票历史财报日期

获取特定股票过去的财报发布日期信息。

- **URL**: `/api/yahoo/earnings-dates/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `years` (可选): 要查询的年数，默认为 `5`，表示尝试获取过去 5 年的财报日期
  - `refresh` (可选): 是否刷新缓存数据，布尔值，默认为 `false`

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
      "date": "2026-03-14T09:11:09.440Z",
      "epsEstimate": "3.08"
    },
    {
      "actualEPS": "1.71",
      "date": null,
      "epsDifference": "0.07",
      "estimateEPS": "1.43",
      "surprisePercent": "10.86"
    }
    // 更多历史财报日期
  ],
  "upcomingEarnings": {
    "date": "2026-03-14T09:11:09.440Z",
    "epsEstimate": "3.08"
  },
  "metadata": {
    "requestedYears": 5,
    "retrievedAt": "2025-03-14T09:11:09.440Z",
    "source": "雅虎财经",
    "symbol": "AAPL"
  },
  "fromCache": false
}
```

### 11. 获取完整财报数据

获取特定股票的完整财报数据。

- **URL**: `/api/yahoo/earnings-full/:symbol`
- **方法**: `GET`
- **URL 参数**:
  - `symbol` (必填): 股票代码，例如: AAPL, MSFT, GOOGL
- **查询参数**:
  - `refresh` (可选): 是否刷新缓存数据，布尔值，默认为 `false`

**示例请求**:

```
GET /api/yahoo/earnings-full/AAPL
```

**成功响应**:

```json
{
  "symbol": "AAPL",
  "earningsData": {
    "quarterly": [
      {
        "date": "2025-03-01",
        "actual": 1.71,
        "estimate": 1.63
      }
      // 更多季度数据
    ],
    "annual": [
      {
        "date": "2024-09-30",
        "actual": 6.08,
        "estimate": 5.98
      }
      // 更多年度数据
    ]
  },
  "chartData": {
    // 财报图表数据
  },
  "metadata": {
    "retrievedAt": "2025-03-14T09:11:30.440Z",
    "source": "雅虎财经"
  },
  "fromCache": false
}
```

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

## 重试机制

本服务内置了 API 请求的重试机制：

- 服务端: 在与 Yahoo Finance 通信时，服务会自动重试以应对临时性网络问题
- 客户端: 前端客户端也实现了重试逻辑，以改善用户体验

默认重试次数为 3 次，每次重试之间会有一定延迟。
