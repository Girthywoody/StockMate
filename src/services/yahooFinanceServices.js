// src/services/yahooFinanceServices.js
import axios from 'axios';

// Replace with your Polygon API key
const POLYGON_API_KEY = 'A3BDeeI6N1m3nqsD6ff84U4ybq0i5bsd';
const BASE_URL = 'https://api.polygon.io';

/**
 * Fetch real-time stock quote data for a list of symbols
 * @param {string[]} symbols - Array of stock symbols
 * @returns {Promise} - Promise resolving to quote data
 */
export const getStockQuotes = async (symbols) => {
  try {
    // For multiple symbols, we need to make multiple requests
    const requests = symbols.map(symbol => 
      axios.get(`${BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`)
    );
    
    const responses = await Promise.all(requests);
    
    // Format the data to match your app's expected structure
    return responses.map((response, index) => {
      const ticker = response.data.ticker;
      const quote = response.data.ticker?.day;
      const details = response.data.ticker?.min;
      
      if (!quote) return getMockStockQuotes([symbols[index]])[0];
      
      return {
        symbol: ticker.ticker,
        shortName: ticker.name || symbols[index],
        regularMarketPrice: quote.c || details?.c || 0,
        regularMarketChange: quote.c - quote.o || 0,
        regularMarketChangePercent: ((quote.c - quote.o) / quote.o * 100) || 0,
        regularMarketVolume: quote.v || 0,
        regularMarketDayHigh: quote.h || 0,
        regularMarketDayLow: quote.l || 0,
        regularMarketOpen: quote.o || 0
      };
    });
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
    throw error;
  }
};

/**
 * Fetch market summaries for major indices
 * @returns {Promise} - Promise resolving to market summary data
 */
export const getMarketSummary = async () => {
  try {
    const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];
    const data = await getStockQuotes(indices);
    return data.map(item => ({
      ...item,
      shortName: getIndexName(item.symbol)
    }));
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
  try {
    const response = await axios.get(
      `${BASE_URL}/v3/reference/tickers?search=${query}&active=true&sort=ticker&order=asc&limit=10&apiKey=${POLYGON_API_KEY}`
    );
    
    return response.data.results.map(item => ({
      symbol: item.ticker,
      name: item.name || item.ticker
    }));
  } catch (error) {
    console.error('Search failed:', error);
    // Return mock results if the API call fails
    return getMockSearchResults(query);
  }
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

// Helper function to get index names
function getIndexName(symbol) {
  const indexMap = {
    '^GSPC': 'S&P 500',
    '^DJI': 'Dow 30',
    '^IXIC': 'Nasdaq',
    '^RUT': 'Russell 2000',
    '^VIX': 'VIX'
  };
  return indexMap[symbol] || symbol;
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

// Keep your existing mock data functions
export const getMockStockQuotes = (symbols) => {
  const mockData = {
    'AAPL': { 
      symbol: 'AAPL', 
      shortName: 'Apple Inc.', 
      regularMarketPrice: 178.72, 
      regularMarketChange: 1.23, 
      regularMarketChangePercent: 0.69, 
      regularMarketVolume: 52416813 
    },
    // ... your existing mock data
  };
  
  return symbols.map(symbol => mockData[symbol] || {
    symbol,
    shortName: `Unknown Stock (${symbol})`,
    regularMarketPrice: 100.00,
    regularMarketChange: 0,
    regularMarketChangePercent: 0,
    regularMarketVolume: 0
  });
};

export const getMockMarketSummary = () => {
  // Your existing mock data implementation
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
    // ... your existing mock data
  ];
};

// For the real-time connection simulation
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