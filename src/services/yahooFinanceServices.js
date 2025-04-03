// src/services/yahooFinanceService.js
const API_KEY = 'dj0yJmk9aGpMMFdSbnRRUnIxJmQ9WVdrOU0yaHFaVE5HWW1NbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PThl';
const BASE_URL = 'https://yfapi.net';

// Headers for Yahoo Finance API requests
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
    const response = await fetch(`${BASE_URL}/v6/finance/quote?region=US&lang=en&symbols=${symbols.join(',')}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stock quotes');
    }
    
    const data = await response.json();
    return data.quoteResponse.result;
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
    const response = await fetch(
      `${BASE_URL}/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&includePrePost=true`,
      {
        method: 'GET',
        headers: headers
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }
    
    const data = await response.json();
    return data.chart.result[0];
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
    const response = await fetch(`${BASE_URL}/v6/finance/quote/marketSummary?lang=en&region=US`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch market summary');
    }
    
    const data = await response.json();
    return data.marketSummaryResponse.result;
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
    const response = await fetch(`${BASE_URL}/v6/finance/autocomplete?region=US&lang=en&query=${query}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to search stocks');
    }
    
    const data = await response.json();
    return data.ResultSet.Result;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
};

/**
 * Create a WebSocket connection for real-time updates
 * Note: Yahoo Finance doesn't directly provide a WebSocket API
 * This is a simulated approach using polling
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