// src/components/Portfolio.jsx
import React from 'react';

const Portfolio = ({ stocks }) => {
  // Calculate portfolio metrics
  const totalValue = stocks.reduce((sum, stock) => sum + (stock.price * stock.shares), 0);
  const totalCost = stocks.reduce((sum, stock) => sum + stock.totalCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercentage = totalCost ? ((totalGain / totalCost) * 100).toFixed(2) : 0;
  
  // Calculate allocation percentages
  const stocksWithAllocation = stocks.map(stock => {
    const marketValue = stock.price * stock.shares;
    const allocation = totalValue ? ((marketValue / totalValue) * 100).toFixed(2) : 0;
    return { ...stock, marketValue, allocation };
  });
  
  // Sort stocks by market value (highest to lowest)
  const sortedStocks = [...stocksWithAllocation].sort((a, b) => b.marketValue - a.marketValue);

  if (stocks.length === 0) {
    return <p>No stocks in your portfolio. Add some stocks to get started!</p>;
  }

  return (
    <div>
      <h2 className="section-title">Portfolio Overview</h2>
      
      <div className="portfolio-summary">
        <div className="dashboard-container">
          <div className="dashboard-card">
            <h3>Total Portfolio Value</h3>
            <div className="dashboard-value">${totalValue.toFixed(2)}</div>
          </div>
          
          <div className="dashboard-card">
            <h3>Total Cost Basis</h3>
            <div className="dashboard-value">${totalCost.toFixed(2)}</div>
          </div>
          
          <div className="dashboard-card">
            <h3>Total Gain/Loss</h3>
            <div className={`dashboard-value ${totalGain >= 0 ? 'positive' : 'negative'}`}>
              ${totalGain.toFixed(2)} ({totalGainPercentage}%)
            </div>
          </div>
        </div>
      </div>
      
      <h3 className="section-title">Portfolio Allocation</h3>
      <table className="stock-list">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Shares</th>
            <th>Price ($)</th>
            <th>Market Value ($)</th>
            <th>Allocation (%)</th>
            <th>Gain/Loss ($)</th>
            <th>Gain/Loss (%)</th>
          </tr>
        </thead>
        <tbody>
          {sortedStocks.map((stock) => {
            const currentValue = stock.price * stock.shares;
            const gain = currentValue - stock.totalCost;
            const gainPercentage = ((gain / stock.totalCost) * 100).toFixed(2);
            
            return (
              <tr key={stock.id}>
                <td>{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>{stock.shares}</td>
                <td>${stock.price.toFixed(2)}</td>
                <td>${currentValue.toFixed(2)}</td>
                <td>{stock.allocation}%</td>
                <td className={gain >= 0 ? 'positive' : 'negative'}>
                  ${gain.toFixed(2)}
                </td>
                <td className={gain >= 0 ? 'positive' : 'negative'}>
                  {gainPercentage}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Visual representation of allocation */}
      <div className="portfolio-chart">
        <h3 className="section-title">Allocation Chart</h3>
        <div className="allocation-bar">
          {sortedStocks.map((stock) => (
            <div 
              key={stock.id}
              className="allocation-segment"
              style={{ 
                width: `${stock.allocation}%`,
                backgroundColor: getRandomColor(stock.symbol),
                height: '40px',
                display: 'inline-block'
              }}
              title={`${stock.symbol}: ${stock.allocation}%`}
            />
          ))}
        </div>
        <div className="allocation-legend">
          {sortedStocks.map((stock) => (
            <div key={stock.id} className="legend-item">
              <div 
                className="legend-color" 
                style={{ 
                  backgroundColor: getRandomColor(stock.symbol),
                  width: '20px',
                  height: '20px',
                  display: 'inline-block',
                  marginRight: '5px'
                }}
              />
              <span>{stock.symbol} ({stock.allocation}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Generate consistent colors based on stock symbol
function getRandomColor(symbol) {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to RGB
  const r = (hash & 0xFF) % 200;
  const g = ((hash >> 8) & 0xFF) % 200;
  const b = ((hash >> 16) & 0xFF) % 200;
  
  return `rgb(${r}, ${g}, ${b})`;
}

export default Portfolio;