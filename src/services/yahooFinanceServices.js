// src/services/yahooFinanceService.js
import axios from 'axios';

// API key for Yahoo Finance API (you would need to get your own API key)
const API_KEY = 'dj0yJmk9aGpMMFdSbnRRUnIxJmQ9WVdrOU0yaHFaVE5HWW1NbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PThl';
const BASE_URL = 'https://yfapi.net';

// Headers for API requests
const headers = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json'
};

/**
 * Fetch real-time stock quote data for a list of symbols
 * @param {string[]} symbols - Array of stock symbols
 * @returns {Promise} - Promise resolving to quote data
 */
export const getStockQuotes = async (symbols) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/v6/finance/quote?region=US&lang=en&symbols=${symbols.join(',')}`,
      { headers }
    );
    
    return response.data.quoteResponse.result;
  } catch (error) {
    console.error('Error fetching stock quotes:', error);
    throw error;
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
    const response = await axios.get(
      `${BASE_URL}/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&includePrePost=true`,
      { headers }
    );
    
    return response.data.chart.result[0];
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
    const response = await axios.get(
      `${BASE_URL}/v6/finance/quote/marketSummary?lang=en&region=US`,
      { headers }
    );
    
    return response.data.marketSummaryResponse.result;
  } catch (error) {
    console.error('Error fetching market summary:', error);
    throw error;
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
      `${BASE_URL}/v6/finance/autocomplete?region=US&lang=en&query=${query}`,
      { headers }
    );
    
    return response.data.ResultSet.Result;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
};

/**
 * Create a mock real-time connection for stock updates
 * Note: This is a simulated approach using polling since Yahoo Finance 
 * doesn't directly provide a WebSocket API for most users
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

// For development/testing - mock data for when API is not available
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
    'MSFT': { 
      symbol: 'MSFT', 
      shortName: 'Microsoft Corporation', 
      regularMarketPrice: 417.88, 
      regularMarketChange: -2.35, 
      regularMarketChangePercent: -0.56, 
      regularMarketVolume: 18765432 
    },
    'GOOGL': { 
      symbol: 'GOOGL', 
      shortName: 'Alphabet Inc.', 
      regularMarketPrice: 175.98, 
      regularMarketChange: 3.56, 
      regularMarketChangePercent: 2.07, 
      regularMarketVolume: 15983274 
    },
    'AMZN': { 
      symbol: 'AMZN', 
      shortName: 'Amazon.com Inc.', 
      regularMarketPrice: 183.92, 
      regularMarketChange: 0.87, 
      regularMarketChangePercent: 0.48, 
      regularMarketVolume: 34561298 
    }
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
    }
  ];
};