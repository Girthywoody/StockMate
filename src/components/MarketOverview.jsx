// src/components/MarketOverview.jsx
import React, { useState, useEffect } from 'react';
import { getMarketSummary } from '../services/yahooFinanceService';

const MarketOverview = () => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        const data = await getMarketSummary();
        // Filter to keep only major indices
        const majorIndices = data.filter(item => 
          ['S&P 500', 'Dow 30', 'Nasdaq', 'Russell 2000', 'VIX'].includes(item.shortName)
        );
        setMarketData(majorIndices);
      } catch (error) {
        console.error('Failed to load market data', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarketData();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchMarketData, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  if (loading && marketData.length === 0) {
    return <div className="market-loading">Loading market data...</div>;
  }
  
  return (
    <div className="market-overview">
      <h2 className="section-title">Market Overview</h2>
      <div className="market-indices">
        {marketData.map(index => (
          <div key={index.symbol} className="market-index-card">
            <div className="index-name">{index.shortName}</div>
            <div className="index-price">{index.regularMarketPrice?.toFixed(2) || 'N/A'}</div>
            <div className={`index-change ${index.regularMarketChange >= 0 ? 'positive' : 'negative'}`}>
              {index.regularMarketChange?.toFixed(2) || '0.00'} ({index.regularMarketChangePercent?.toFixed(2) || '0.00'}%)
            </div>
            <div className="market-range">
              <div className="range-label">Day Range:</div>
              <div className="range-values">
                {index.regularMarketDayLow?.toFixed(2) || 'N/A'} - {index.regularMarketDayHigh?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="market-status">
        <div className="market-timestamp">
          Last updated: {new Date().toLocaleTimeString()}
          {loading && <span className="loading-indicator"> (updating...)</span>}
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;