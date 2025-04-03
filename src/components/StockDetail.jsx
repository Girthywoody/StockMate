// src/components/StockDetail.jsx
import React, { useState, useEffect } from 'react';
import { getStockQuotes } from '../services/yahooFinanceService';
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
        const data = await getStockQuotes([symbol]);
        if (data && data.length > 0) {
          setStockData(data[0]);
        } else {
          setError('No data available for this stock');
        }
      } catch (err) {
        setError('Failed to load stock data');
        console.error(err);
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
      <div className="stock-detail-container">
        <div className="stock-detail-header">
          <h2>Loading stock data...</h2>
          <button className="btn btn-primary close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="stock-detail-container">
        <div className="stock-detail-header">
          <h2>Error: {error}</h2>
          <button className="btn btn-primary close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  
  if (!stockData) return null;
  
  const {
    shortName,
    longName,
    regularMarketPrice,
    regularMarketChange,
    regularMarketChangePercent,
    regularMarketOpen,
    regularMarketDayHigh,
    regularMarketDayLow,
    regularMarketVolume,
    marketCap,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    averageVolume,
    trailingPE,
    dividendYield
  } = stockData;
  
  return (
    <div className="stock-detail-container">
      <div className="stock-detail-header">
        <div className="stock-title">
          <h2>{shortName || longName}</h2>
          <span className="stock-symbol">{symbol}</span>
        </div>
        <button className="btn btn-primary close-btn" onClick={onClose}>Close</button>
      </div>
      
      <div className="stock-price-container">
        <div className="current-price">${regularMarketPrice?.toFixed(2) || 'N/A'}</div>
        <div className={`price-change ${regularMarketChange >= 0 ? 'positive' : 'negative'}`}>
          {regularMarketChange?.toFixed(2) || '0.00'} ({regularMarketChangePercent?.toFixed(2) || '0.00'}%)
        </div>
        <div className="price-timestamp">
          Last updated: {new Date().toLocaleTimeString()}
          {loading && <span className="loading-indicator"> (refreshing...)</span>}
        </div>
      </div>
      
      <div className="stock-chart-wrapper">
        <StockChart symbol={symbol} />
      </div>
      
      <div className="stock-details">
        <div className="detail-section">
          <h3>Market Data</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Open</span>
              <span className="detail-value">${regularMarketOpen?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Day High</span>
              <span className="detail-value">${regularMarketDayHigh?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Day Low</span>
              <span className="detail-value">${regularMarketDayLow?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Volume</span>
              <span className="detail-value">{regularMarketVolume?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Avg. Volume</span>
              <span className="detail-value">{averageVolume?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Market Cap</span>
              <span className="detail-value">${formatLargeNumber(marketCap)}</span>
            </div>
          </div>
        </div>
        
        <div className="detail-section">
          <h3>Stock Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">52-Week High</span>
              <span className="detail-value">${fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">52-Week Low</span>
              <span className="detail-value">${fiftyTwoWeekLow?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">P/E Ratio</span>
              <span className="detail-value">{trailingPE?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Dividend Yield</span>
              <span className="detail-value">
                {dividendYield ? (dividendYield * 100).toFixed(2) + '%' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format large numbers with K, M, B suffixes
function formatLargeNumber(number) {
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
}

export default StockDetail;