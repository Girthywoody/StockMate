// src/components/StockList.jsx
import React, { useState, useEffect } from 'react';
import { getStockQuotes, createRealtimeConnection } from '../services/yahooFinanceServices';

const StockList = ({ stocks, removeStock, updateStockPrice }) => {
  const [realTimeData, setRealTimeData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Set up real-time connection for stock updates
  useEffect(() => {
    if (stocks.length === 0) return;
    
    const symbols = stocks.map(stock => stock.symbol);
    
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        setIsUpdating(true);
        const data = await getStockQuotes(symbols);
        
        // Convert array to object keyed by symbol for easier lookup
        const dataObj = data.reduce((acc, quote) => {
          acc[quote.symbol] = quote;
          return acc;
        }, {});
        
        setRealTimeData(dataObj);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch initial stock data', error);
      } finally {
        setIsUpdating(false);
      }
    };
    
    fetchInitialData();
    
    // Set up real-time connection (polling)
    const realtimeConnection = createRealtimeConnection(symbols, (data) => {
      setIsUpdating(true);
      
      // Convert array to object keyed by symbol
      const dataObj = data.reduce((acc, quote) => {
        acc[quote.symbol] = quote;
        return acc;
      }, {});
      
      setRealTimeData(dataObj);
      setLastUpdated(new Date());
      setIsUpdating(false);
      
      // Also update the parent component's state with new prices
      data.forEach(quote => {
        updateStockPrice(quote.symbol, quote.regularMarketPrice);
      });
    });
    
    realtimeConnection.start();
    
    return () => {
      realtimeConnection.stop();
    };
  }, [stocks, updateStockPrice]);
  
  // Calculate total portfolio value
  const totalValue = stocks.reduce((sum, stock) => sum + (stock.price * stock.shares), 0);
  const totalCost = stocks.reduce((sum, stock) => sum + stock.totalCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercentage = totalCost ? ((totalGain / totalCost) * 100).toFixed(2) : 0;
  
  if (stocks.length === 0) {
    return <p>No stocks in your portfolio. Add some stocks to get started!</p>;
  }
  
  return (
    <div>
      <h2 className="section-title">Your Stock Holdings</h2>
      
      <div className="portfolio-summary">
        <p><strong>Total Portfolio Value:</strong> ${totalValue.toFixed(2)}</p>
        <p><strong>Total Cost Basis:</strong> ${totalCost.toFixed(2)}</p>
        <p>
          <strong>Total Gain/Loss:</strong> 
          <span className={totalGain >= 0 ? 'positive' : 'negative'}>
            ${totalGain.toFixed(2)} ({totalGainPercentage}%)
          </span>
        </p>
        <p className="last-updated">
          <strong>Last Updated:</strong> {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          {isUpdating && <span className="updating-indicator"> (updating...)</span>}
        </p>
      </div>
      
      <table className="stock-list">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Shares</th>
            <th>Current Price ($)</th>
            <th>Change Today</th>
            <th>Market Value ($)</th>
            <th>Cost Basis ($)</th>
            <th>Gain/Loss ($)</th>
            <th>Gain/Loss (%)</th>
            <th>Volume</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const realtimeStock = realTimeData[stock.symbol];
            const currentPrice = realtimeStock?.regularMarketPrice || stock.price;
            const priceChange = realtimeStock?.regularMarketChange || 0;
            const priceChangePercent = realtimeStock?.regularMarketChangePercent || 0;
            const volume = realtimeStock?.regularMarketVolume || 'N/A';
            
            const currentValue = currentPrice * stock.shares;
            const gain = currentValue - stock.totalCost;
            const gainPercentage = ((gain / stock.totalCost) * 100).toFixed(2);
            
            return (
              <tr key={stock.id} className={isUpdating ? 'updating-row' : ''}>
                <td className="symbol-cell">{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>{stock.shares}</td>
                <td className={priceChange >= 0 ? 'positive' : 'negative'}>
                  ${currentPrice.toFixed(2)}
                </td>
                <td className={priceChange >= 0 ? 'positive' : 'negative'}>
                  {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </td>
                <td>${currentValue.toFixed(2)}</td>
                <td>${stock.totalCost.toFixed(2)}</td>
                <td className={gain >= 0 ? 'positive' : 'negative'}>
                  ${gain.toFixed(2)}
                </td>
                <td className={gain >= 0 ? 'positive' : 'negative'}>
                  {gainPercentage}%
                </td>
                <td>{volume.toLocaleString()}</td>
                <td className="actions">
                  <button 
                    className="btn btn-danger"
                    onClick={() => removeStock(stock.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="auto-refresh-controls">
        <p>Real-time updates are enabled. Data refreshes automatically every 5 seconds.</p>
      </div>
    </div>
  );
};

export default StockList;