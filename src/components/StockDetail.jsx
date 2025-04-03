// src/components/StockDetail.jsx
import React, { useState, useEffect } from 'react';
import { getStockQuotes, getMockStockQuotes } from '../services/yahooFinanceService';
import StockChart from './StockChart';

const StockDetail = ({ symbol, onClose }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch real data from API
        const data = await getStockQuotes([symbol]);
        
        if (data && data.length > 0) {
          setStockData(data[0]);
        } else {
          // If no data returned, use mock data
          const mockData = getMockStockQuotes([symbol]);
          setStockData(mockData[0]);
        }
      } catch (err) {
        console.error('Failed to load stock data:', err);
        
        // Fall back to mock data on error
        try {
          const mockData = getMockStockQuotes([symbol]);
          setStockData(mockData[0]);
        } catch (mockErr) {
          setError('Failed to load stock data');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchStockData();
    
    // Refresh data every 15 seconds
    const intervalId = setInterval(fetchStockData, 15000);
    
    return () => clearInterval(intervalId);
  }, [symbol]);

  if (!symbol) return null;
  
  if (loading && !stockData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Loading stock data...</h2>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Error: {error}</h2>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!stockData) return null;
  
  const {
    shortName,
    regularMarketPrice = 0,
    regularMarketChange = 0,
    regularMarketChangePercent = 0,
    regularMarketOpen = 0,
    regularMarketDayHigh = 0,
    regularMarketDayLow = 0,
    regularMarketVolume = 0,
    marketCap = 0,
    fiftyTwoWeekHigh = 0,
    fiftyTwoWeekLow = 0,
    averageVolume = 0,
    trailingPE = 0,
    dividendYield = 0
  } = stockData;
  
  // Helper function to format large numbers with K, M, B suffixes
  const formatLargeNumber = (number) => {
    if (!number) return 'N/A';
    
    if (number >= 1e12) {
      return (number / 1e12).toFixed(2) + 'T';
    } else if (number >= 1e9) {
      return (number / 1e9).toFixed(2) + 'B';
    } else if (number >= 1e6) {
      return (number / 1e6).toFixed(2) + 'M';
    } else if (number >= 1e3) {
      return (number / 1e3).toFixed(2) + 'K';
    }
    
    return number.toString();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">{shortName || `${symbol} Stock`}</h2>
              <span className="text-gray-600">{symbol}</span>
            </div>
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          
          <div className="bg-gray-100 p-4 rounded mb-6">
            <div className="text-3xl font-bold">${regularMarketPrice.toFixed(2)}</div>
            <div className={`text-lg font-bold ${regularMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {regularMarketChange.toFixed(2)} ({regularMarketChangePercent.toFixed(2)}%)
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last updated: {new Date().toLocaleTimeString()}
              {loading && <span className="italic ml-2">(refreshing...)</span>}
            </div>
          </div>
          
          <div className="mb-6">
            <StockChart symbol={symbol} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Market Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Open</div>
                  <div className="font-bold">${regularMarketOpen.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Day High</div>
                  <div className="font-bold">${regularMarketDayHigh.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Day Low</div>
                  <div className="font-bold">${regularMarketDayLow.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Volume</div>
                  <div className="font-bold">{regularMarketVolume.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg. Volume</div>
                  <div className="font-bold">{averageVolume.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Market Cap</div>
                  <div className="font-bold">${formatLargeNumber(marketCap)}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Stock Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">52-Week High</div>
                  <div className="font-bold">${fiftyTwoWeekHigh.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">52-Week Low</div>
                  <div className="font-bold">${fiftyTwoWeekLow.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">P/E Ratio</div>
                  <div className="font-bold">{trailingPE ? trailingPE.toFixed(2) : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Dividend Yield</div>
                  <div className="font-bold">
                    {dividendYield ? (dividendYield * 100).toFixed(2) + '%' : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;