// src/services/yahooFinanceServices.js
import axios from 'axios';

// Replace with your Polygon API key
const POLYGON_API_KEY = 'A3BDeeI6N1m3nqsD6ff84U4ybq0i5bsd';
const BASE_URL = 'https://api.polygon.io';

// Helper function to add delay between requests to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch real-time stock quote data for a list of symbols
 * @param {string[]} symbols - Array of stock symbols
 * @returns {Promise} - Promise resolving to quote data
 */
export const getStockQuotes = async (symbols) => {
  try {
    // For multiple symbols, we need to make individual requests
    const results = [];
    
    for (const symbol of symbols) {
      try {
        // Use the Last Trade endpoint for the most recent price data
        const response = await axios.get(`${BASE_URL}/v2/last/trade/${symbol}?apiKey=${POLYGON_API_KEY}`);
        
        if (response.data && response.data.status === 'success' && response.data.results) {
          const lastTrade = response.data.results;
          
          // Get the day's data for additional info
          const dayDataResponse = await axios.get(
            `${BASE_URL}/v2/aggs/ticker/${symbol}/prev?apiKey=${POLYGON_API_KEY}`
          );
          
          let prevClose = 0;
          let open = 0;
          let high = 0;
          let low = 0;
          let changePercent = 0;
          
          if (dayDataResponse.data && dayDataResponse.data.results) {
            const dayData = dayDataResponse.data.results[0];
            prevClose = dayData.c;
            open = dayData.o;
            high = dayData.h;
            low = dayData.l;
            
            // Calculate change percentage
            const change = lastTrade.p - prevClose;
            changePercent = prevClose ? (change / prevClose) * 100 : 0;
          }
          
          // Get company name
          let companyName = symbol;
          try {
            const companyResponse = await axios.get(
              `${BASE_URL}/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`
            );
            
            if (companyResponse.data && companyResponse.data.results) {
              companyName = companyResponse.data.results.name || symbol;
            }
          } catch (error) {
            console.log(`Error fetching company data for ${symbol}:`, error);
          }
          
          results.push({
            symbol: symbol,
            shortName: companyName,
            longName: companyName,
            regularMarketPrice: lastTrade.p,
            regularMarketChange: lastTrade.p - prevClose,
            regularMarketChangePercent: changePercent,
            regularMarketVolume: lastTrade.s || 0,
            regularMarketDayHigh: high,
            regularMarketDayLow: low,
            regularMarketOpen: open,
            lastUpdated: new Date(lastTrade.t).toLocaleString()
          });
        } else {
          results.push(getMockStockQuotes([symbol])[0]);
        }
        
        // Add delay to avoid hitting rate limits
        await delay(200);
      } catch (error) {
        console.log(`Error processing data for ${symbol}:`, error);
        results.push(getMockStockQuotes([symbol])[0]);
        await delay(200);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching stock quotes:', error);
    return getMockStockQuotes(symbols);
  }
};

/**
 * Fetch historical chart data for a symbol
 * @param {string} symbol - Stock symbol
 * @param {string} range - Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max)
 * @param {string} interval - Data interval (1m, 5m, 15m, 1d, 1wk, 1mo)
 * @returns {Promise} - Promise resolving to historical chart data
 */
export const getHistoricalData = async (symbol, range = '1mo', interval = '1d') => {
  try {
    // Convert range to Polygon time parameters
    const { from, to, timespan } = convertRangeToPolygonParams(range, interval);
    
    const response = await axios.get(
      `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/${timespan}/${from}/${to}?adjusted=true&apiKey=${POLYGON_API_KEY}`
    );
    
    if (!response.data || !response.data.results || response.data.results.length === 0) {
      throw new Error('No historical data available');
    }
    
    // Convert Polygon data format to the format expected by your application
    return {
      timestamp: response.data.results.map(bar => Math.floor(bar.t / 1000)),
      indicators: {
        quote: [{
          close: response.data.results.map(bar => bar.c),
          high: response.data.results.map(bar => bar.h),
          low: response.data.results.map(bar => bar.l),
          open: response.data.results.map(bar => bar.o),
          volume: response.data.results.map(bar => bar.v)
        }]
      }
    };
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return generateMockChartData(range, interval);
  }
};

/**
 * Fetch market summaries for major indices
 * @returns {Promise} - Promise resolving to market summary data
 */
export const getMarketSummary = async () => {
  try {
    // Major index tickers in Polygon format
    const indices = ['SPY', 'DIA', 'QQQ', 'IWM', 'VIX'];
    const data = await getStockQuotes(indices);
    
    return data.map(item => {
      const indexInfo = getIndexInfo(item.symbol);
      return {
        ...item,
        shortName: indexInfo.name,
        symbol: indexInfo.yahooSymbol
      };
    });
  } catch (error) {
    console.error('Error fetching market summary:', error);
    return getMockMarketSummary();
  }
};

/**
 * Search for stocks by query
 * @param {string} query - Search query
 * @returns {Promise} - Promise resolving to search results
 */
export const searchStocks = async (query) => {
  if (!query || query.length < 2) {
    return [];
  }
  
  try {
    const response = await axios.get(
      `${BASE_URL}/v3/reference/tickers?search=${query}&active=true&sort=ticker&order=asc&limit=10&apiKey=${POLYGON_API_KEY}`
    );
    
    if (!response.data || !response.data.results) {
      throw new Error('Invalid response from Polygon search API');
    }
    
    return response.data.results.map(item => ({
      symbol: item.ticker,
      name: item.name || item.ticker
    }));
  } catch (error) {
    console.error('Search failed:', error);
    return getMockSearchResults(query);
  }
};

/**
 * Create a real-time connection for stock updates
 * Note: Using polling approach due to Polygon websocket requiring higher tier subscription
 * @param {string[]} symbols - Array of stock symbols to watch
 * @param {Function} onUpdate - Callback function for updates
 * @returns {Object} - Controller for the connection
 */
export const createRealtimeConnection = (symbols, onUpdate) => {
  let intervalId = null;
  
  const start = () => {
    // Poll for updates every 5 seconds
    intervalId = setInterval(async () => {
      try {
        const data = await getStockQuotes(symbols);
        onUpdate(data);
      } catch (error) {
        console.error('Error in real-time updates:', error);
      }
    }, 5000);
  };
  
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  const addSymbol = (symbol) => {
    if (!symbols.includes(symbol)) {
      symbols.push(symbol);
    }
  };
  
  const removeSymbol = (symbol) => {
    const index = symbols.indexOf(symbol);
    if (index !== -1) {
      symbols.splice(index, 1);
    }
  };
  
  return {
    start,
    stop,
    addSymbol,
    removeSymbol
  };
};

// Helper function to convert Yahoo Finance range to Polygon parameters
function convertRangeToPolygonParams(range, interval) {
  const now = new Date();
  let from = new Date();
  let timespan = 'day';
  
  switch (range) {
    case '1d':
      from.setDate(now.getDate() - 1);
      timespan = 'minute';
      break;
    case '5d':
      from.setDate(now.getDate() - 5);
      timespan = 'hour';
      break;
    case '1mo':
      from.setMonth(now.getMonth() - 1);
      timespan = 'day';
      break;
    case '3mo':
      from.setMonth(now.getMonth() - 3);
      timespan = 'day';
      break;
    case '6mo':
      from.setMonth(now.getMonth() - 6);
      timespan = 'day';
      break;
    case '1y':
      from.setFullYear(now.getFullYear() - 1);
      timespan = 'day';
      break;
    case '5y':
      from.setFullYear(now.getFullYear() - 5);
      timespan = 'week';
      break;
    default:
      from.setMonth(now.getMonth() - 1);
      timespan = 'day';
  }
  
  // Format dates as YYYY-MM-DD
  const fromStr = from.toISOString().split('T')[0];
  const toStr = now.toISOString().split('T')[0];
  
  return { from: fromStr, to: toStr, timespan };
}

// Helper function to map between ETF symbols and index names
function getIndexInfo(symbol) {
  const indexMap = {
    'SPY': { name: 'S&P 500', yahooSymbol: '^GSPC' },
    'DIA': { name: 'Dow 30', yahooSymbol: '^DJI' },
    'QQQ': { name: 'Nasdaq', yahooSymbol: '^IXIC' },
    'IWM': { name: 'Russell 2000', yahooSymbol: '^RUT' },
    'VIX': { name: 'VIX', yahooSymbol: '^VIX' }
  };
  
  return indexMap[symbol] || { name: symbol, yahooSymbol: symbol };
}

// Helper function for mock search results
function getMockSearchResults(query) {
  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'META', name: 'Meta Platforms, Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'V', name: 'Visa Inc.' }
  ];
  
  return mockStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
    stock.name.toLowerCase().includes(query.toLowerCase())
  );
}

// Generate mock chart data for development/demo
function generateMockChartData(range, interval) {
  const data = [];
  let days = 30;
  
  switch (range) {
    case '1d': days = 1; break;
    case '5d': days = 5; break;
    case '1mo': days = 30; break;
    case '6mo': days = 180; break;
    case '1y': days = 365; break;
    case '5y': days = 365 * 5; break;
    default: days = 30;
  }
  
  // Adjust points based on interval
  let points = days;
  if (interval === '1m' || interval === '5m' || interval === '15m') {
    points = days * 24 * (60 / parseInt(interval));
  } else if (interval === '1h') {
    points = days * 24;
  } else if (interval === '1wk') {
    points = Math.ceil(days / 7);
  } else if (interval === '1mo') {
    points = Math.ceil(days / 30);
  }
  
  // Limit points to a reasonable number
  points = Math.min(points, 1000);
  
  // Generate timestamps and mock data
  const now = Date.now();
  const timestamps = [];
  const closes = [];
  const opens = [];
  const highs = [];
  const lows = [];
  const volumes = [];
  
  let basePrice = 100 + Math.random() * 100;
  
  for (let i = 0; i < points; i++) {
    // Calculate timestamp going backwards from now
    const timestamp = Math.floor((now - (i * (days * 86400000 / points))) / 1000);
    
    // Generate price with some randomness but following a trend
    const changePercent = (Math.random() - 0.5) * 2; // -1% to +1%
    basePrice = Math.max(basePrice * (1 + changePercent/100), 1);
    
    const open = basePrice;
    const close = basePrice * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    timestamps.push(timestamp);
    opens.push(open);
    closes.push(close);
    highs.push(high);
    lows.push(low);
    volumes.push(volume);
  }
  
  // Return in the format expected by the app
  return {
    timestamp: timestamps.reverse(),
    indicators: {
      quote: [{
        open: opens.reverse(),
        close: closes.reverse(),
        high: highs.reverse(),
        low: lows.reverse(),
        volume: volumes.reverse()
      }]
    }
  };
}

// For development/testing - mock data for when API is not available
export const getMockStockQuotes = (symbols) => {
  const mockData = {
    'AAPL': { 
      symbol: 'AAPL', 
      shortName: 'Apple Inc.', 
      regularMarketPrice: 178.72, 
      regularMarketChange: 1.23, 
      regularMarketChangePercent: 0.69, 
      regularMarketVolume: 52416813,
      regularMarketDayHigh: 179.85,
      regularMarketDayLow: 177.55,
      regularMarketOpen: 178.10
    },
    'MSFT': { 
      symbol: 'MSFT', 
      shortName: 'Microsoft Corporation', 
      regularMarketPrice: 417.88, 
      regularMarketChange: -2.35, 
      regularMarketChangePercent: -0.56, 
      regularMarketVolume: 18765432,
      regularMarketDayHigh: 420.11,
      regularMarketDayLow: 416.24,
      regularMarketOpen: 419.50
    },
    'GOOGL': { 
      symbol: 'GOOGL', 
      shortName: 'Alphabet Inc.', 
      regularMarketPrice: 175.98, 
      regularMarketChange: 3.56, 
      regularMarketChangePercent: 2.07, 
      regularMarketVolume: 15983274,
      regularMarketDayHigh: 176.12,
      regularMarketDayLow: 172.45,
      regularMarketOpen: 173.21
    },
    'AMZN': { 
      symbol: 'AMZN', 
      shortName: 'Amazon.com Inc.', 
      regularMarketPrice: 183.92, 
      regularMarketChange: 0.87, 
      regularMarketChangePercent: 0.48, 
      regularMarketVolume: 34561298,
      regularMarketDayHigh: 184.95,
      regularMarketDayLow: 182.11,
      regularMarketOpen: 183.05
    }
  };
  
  return symbols.map(symbol => {
    if (mockData[symbol]) {
      return {
        ...mockData[symbol],
        lastUpdated: new Date().toLocaleString()
      };
    }
    
    // Generate random data for unknown symbols
    const price = 100 + Math.random() * 100;
    const change = (Math.random() - 0.5) * 5;
    const changePercent = (change / price) * 100;
    
    return {
      symbol,
      shortName: `${symbol} Inc.`,
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketVolume: Math.floor(Math.random() * 10000000),
      regularMarketDayHigh: price * (1 + Math.random() * 0.05),
      regularMarketDayLow: price * (1 - Math.random() * 0.05),
      regularMarketOpen: price * (1 - change/2),
      lastUpdated: new Date().toLocaleString()
    };
  });
};

export const getMockMarketSummary = () => {
  return [
    { 
      symbol: '^GSPC', 
      shortName: 'S&P 500', 
      regularMarketPrice: 5276.34, 
      regularMarketChange: 15.28, 
      regularMarketChangePercent: 0.29, 
      regularMarketDayLow: 5255.11, 
      regularMarketDayHigh: 5282.56 
    },
    { 
      symbol: '^DJI', 
      shortName: 'Dow 30', 
      regularMarketPrice: 39168.15, 
      regularMarketChange: 75.66, 
      regularMarketChangePercent: 0.19, 
      regularMarketDayLow: 39068.25, 
      regularMarketDayHigh: 39224.13 
    },
    { 
      symbol: '^IXIC', 
      shortName: 'Nasdaq', 
      regularMarketPrice: 16718.84, 
      regularMarketChange: 106.07, 
      regularMarketChangePercent: 0.64, 
      regularMarketDayLow: 16605.41, 
      regularMarketDayHigh: 16749.32 
    },
    {
      symbol: '^RUT',
      shortName: 'Russell 2000',
      regularMarketPrice: 2125.89,
      regularMarketChange: -12.79,
      regularMarketChangePercent: -0.60,
      regularMarketDayLow: 2120.15,
      regularMarketDayHigh: 2138.96
    },
    {
      symbol: '^VIX',
      shortName: 'VIX',
      regularMarketPrice: 15.23,
      regularMarketChange: 0.76,
      regularMarketChangePercent: 5.25,
      regularMarketDayLow: 14.62,
      regularMarketDayHigh: 15.45
    }
  ];
};