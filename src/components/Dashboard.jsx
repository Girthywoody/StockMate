// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getStockQuotes } from '../services/yahooFinanceServices';

const Dashboard = ({ stocks, onSelectStock }) => {
  const [realTimeData, setRealTimeData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Fetch real-time data for stocks
  useEffect(() => {
    if (stocks.length === 0) return;
    
    const fetchRealTimeData = async () => {
      try {
        setIsLoading(true);
        const symbols = stocks.map(stock => stock.symbol);
        const data = await getStockQuotes(symbols);
        
        // Convert array to object for easier lookup
        const dataObj = data.reduce((acc, quote) => {
          acc[quote.symbol] = quote;
          return acc;
        }, {});
        
        setRealTimeData(dataObj);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRealTimeData();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchRealTimeData, 30000);
    
    return () => clearInterval(intervalId);
  }, [stocks]);
  
  // Calculate portfolio metrics using real-time data where available
  const calculatePortfolioMetrics = () => {
    let totalValue = 0;
    let totalCost = 0;
    
    stocks.forEach(stock => {
      const currentPrice = realTimeData[stock.symbol]?.regularMarketPrice || stock.price;
      totalValue += currentPrice * stock.shares;
      totalCost += stock.totalCost;
    });
    
    const totalGain = totalValue - totalCost;
    const totalGainPercentage = totalCost ? ((totalGain / totalCost) * 100).toFixed(2) : 0;
    
    return { totalValue, totalCost, totalGain, totalGainPercentage };
  };
  
  // Find best and worst performing stocks based on real-time data
  const findBestAndWorstStocks = () => {
    if (stocks.length === 0) return { bestStock: null, worstStock: null };
    
    let bestStock = { gainPercentage: -Infinity };
    let worstStock = { gainPercentage: Infinity };
    
    stocks.forEach(stock => {
      const currentPrice = realTimeData[stock.symbol]?.regularMarketPrice || stock.price;
      const currentValue = currentPrice * stock.shares;
      const gain = currentValue - stock.totalCost;
      const gainPercentage = stock.totalCost ? ((gain / stock.totalCost) * 100) : 0;
      
      const stockWithPerformance = { 
        ...stock, 
        currentPrice,
        gainPercentage,
        realTimeChange: realTimeData[stock.symbol]?.regularMarketChangePercent
      };
      
      if (gainPercentage > bestStock.gainPercentage) {
        bestStock = stockWithPerformance;
      }
      
      if (gainPercentage < worstStock.gainPercentage) {
        worstStock = stockWithPerformance;
      }
    });
    
    return { bestStock, worstStock };
  };
  
  // Get top holdings by current value
  const getTopHoldings = () => {
    return [...stocks]
      .map(stock => {
        const currentPrice = realTimeData[stock.symbol]?.regularMarketPrice || stock.price;
        const marketValue = currentPrice * stock.shares;
        return { ...stock, currentPrice, marketValue };
      })
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 5);
  };
  
  // Handle click on a stock to show details
  const handleStockClick = (symbol) => {
    if (onSelectStock) {
      onSelectStock(symbol);
    }
  };
  
  if (stocks.length === 0) {
    return (
      <div className="dashboard-empty">
        <h2 className="section-title">Welcome to Your Stock Portfolio Tracker</h2>
        <p>You don't have any stocks in your portfolio yet.</p>
        <p>Go to the "Manage Stocks" tab to add your first stock!</p>
      </div>
    );
  }
  
  const { totalValue, totalCost, totalGain, totalGainPercentage } = calculatePortfolioMetrics();
  const { bestStock, worstStock } = findBestAndWorstStocks();
  const topHoldings = getTopHoldings();

  return (
    <div className="dashboard">
      <h2 className="section-title">Portfolio Dashboard</h2>
      
      {/* Portfolio summary cards */}
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h3>Total Value</h3>
          <div className="dashboard-value">${totalValue.toFixed(2)}</div>
          <div className="dashboard-timestamp">
            {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : ''}
            {isLoading && <span className="loading-indicator"> (updating...)</span>}
          </div>
        </div>
        
        <div className="dashboard-card">
          <h3>Total Gain/Loss</h3>
          <div className={`dashboard-value ${totalGain >= 0 ? 'positive' : 'negative'}`}>
            ${totalGain.toFixed(2)}
          </div>
          <div className={totalGain >= 0 ? 'positive' : 'negative'}>
            {totalGainPercentage}%
          </div>
        </div>
        
        <div className="dashboard-card">
          <h3>Number of Stocks</h3>
          <div className="dashboard-value">{stocks.length}</div>
        </div>
      </div>
      
      {/* Best and worst performers */}
      <h2 className="section-title">Performance Highlights</h2>
      <div className="dashboard-container">
        {stocks.length > 0 && (
          <>
            <div className="dashboard-card clickable" onClick={() => handleStockClick(bestStock.symbol)}>
              <h3>Best Performer</h3>
              <div className="dashboard-value">{bestStock.symbol}</div>
              <div className="positive">+{bestStock.gainPercentage.toFixed(2)}%</div>
              <p>{bestStock.name}</p>
              {bestStock.realTimeChange && (
                <div className="real-time-change">
                  Today: {bestStock.realTimeChange > 0 ? '+' : ''}{bestStock.realTimeChange.toFixed(2)}%
                </div>
              )}
            </div>
            
            <div className="dashboard-card clickable" onClick={() => handleStockClick(worstStock.symbol)}>
              <h3>Worst Performer</h3>
              <div className="dashboard-value">{worstStock.symbol}</div>
              <div className="negative">{worstStock.gainPercentage.toFixed(2)}%</div>
              <p>{worstStock.name}</p>
              {worstStock.realTimeChange && (
                <div className={worstStock.realTimeChange >= 0 ? 'positive' : 'negative'}>
                  Today: {worstStock.realTimeChange > 0 ? '+' : ''}{worstStock.realTimeChange.toFixed(2)}%
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Top holdings */}
      <h2 className="section-title">Top Holdings</h2>
      <div className="dashboard-note">Click on any stock to view detailed information</div>
      <table className="stock-list">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Market Value ($)</th>
            <th>Price ($)</th>
            <th>Today's Change</th>
            <th>Shares</th>
            <th>Gain/Loss (%)</th>
          </tr>
        </thead>
        <tbody>
          {topHoldings.map((stock) => {
            const realtimeStock = realTimeData[stock.symbol];
            const marketValue = stock.marketValue;
            const gain = marketValue - stock.totalCost;
            const gainPercentage = ((gain / stock.totalCost) * 100).toFixed(2);
            
            // Today's change from real-time data
            const todayChange = realtimeStock?.regularMarketChange || 0;
            const todayChangePercent = realtimeStock?.regularMarketChangePercent || 0;
            
            return (
              <tr 
                key={stock.id} 
                className="clickable-row"
                onClick={() => handleStockClick(stock.symbol)}
              >
                <td className="symbol-cell">{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>${marketValue.toFixed(2)}</td>
                <td>${stock.currentPrice.toFixed(2)}</td>
                <td className={todayChange >= 0 ? 'positive' : 'negative'}>
                  {todayChange.toFixed(2)} ({todayChangePercent.toFixed(2)}%)
                </td>
                <td>{stock.shares}</td>
                <td className={gain >= 0 ? 'positive' : 'negative'}>
                  {gainPercentage}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Market trends section */}
      <h2 className="section-title">Your Portfolio at a Glance</h2>
      <div className="dashboard-allocation">
        {/* Portfolio allocation bar */}
        <div className="allocation-bar-container">
          <h3>Portfolio Allocation</h3>
          <div className="allocation-bar">
            {stocks
              .map(stock => {
                const currentPrice = realTimeData[stock.symbol]?.regularMarketPrice || stock.price;
                const marketValue = currentPrice * stock.shares;
                const allocation = (marketValue / totalValue) * 100;
                return { symbol: stock.symbol, allocation, marketValue };
              })
              .sort((a, b) => b.marketValue - a.marketValue)
              .map((item, index) => (
                <div 
                  key={item.symbol}
                  className="allocation-segment"
                  style={{ 
                    width: `${item.allocation}%`,
                    backgroundColor: getStockColor(item.symbol, index)
                  }}
                  title={`${item.symbol}: ${item.allocation.toFixed(2)}%`}
                />
              ))
            }
          </div>
          <div className="allocation-legend">
            {stocks
              .map(stock => {
                const currentPrice = realTimeData[stock.symbol]?.regularMarketPrice || stock.price;
                const marketValue = currentPrice * stock.shares;
                const allocation = ((marketValue / totalValue) * 100).toFixed(2);
                return { symbol: stock.symbol, allocation };
              })
              .sort((a, b) => parseFloat(b.allocation) - parseFloat(a.allocation))
              .map((item, index) => (
                <div key={item.symbol} className="legend-item">
                  <div 
                    className="color-box" 
                    style={{ backgroundColor: getStockColor(item.symbol, index) }}
                  />
                  <span>{item.symbol} ({item.allocation}%)</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to generate consistent colors for stocks
function getStockColor(symbol, index) {
  // Base colors for stocks
  const baseColors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
  ];
  
  // Use the index if available, otherwise hash the symbol
  if (index !== undefined && index < baseColors.length) {
    return baseColors[index];
  }
  
  // Simple hash function for consistent colors
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Select a color from the array using the hash
  return baseColors[Math.abs(hash) % baseColors.length];
}

export default Dashboard;