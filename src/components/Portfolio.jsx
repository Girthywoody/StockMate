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
    return (
      <div className="dashboard-empty">
        <h2 className="section-title">Portfolio Overview</h2>
        <p>No stocks in your portfolio. Add some stocks to get started!</p>
        <p>Go to the "Manage Stocks" tab to add your first stock.</p>
      </div>
    );
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
      
      {/* Improved visual representation of allocation */}
      <div className="portfolio-chart">
        <h3 className="section-title">Allocation Chart</h3>
        
        {/* Horizontal bar chart for allocations */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '20px',
          marginBottom: '30px'
        }}>
          {sortedStocks.map((stock) => {
            const barColor = getRandomColor(stock.symbol);
            return (
              <div key={stock.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{ width: '80px', textAlign: 'right' }}>
                  <strong>{stock.symbol}</strong>
                </div>
                <div style={{
                  height: '25px',
                  width: `${Math.max(stock.allocation * 3, 10)}px`,
                  backgroundColor: barColor,
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  color: 'white',
                  paddingRight: '8px'
                }}>
                  {parseFloat(stock.allocation) > 5 ? `${stock.allocation}%` : ''}
                </div>
                <div>
                  {parseFloat(stock.allocation) <= 5 ? `${stock.allocation}%` : ''} ${stock.marketValue.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Colorful allocation bar */}
        <div style={{ marginTop: '30px' }}>
          <div className="allocation-bar" style={{
            display: 'flex',
            height: '40px',
            width: '100%',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            {sortedStocks.map((stock) => (
              <div 
                key={stock.id}
                style={{ 
                  width: `${stock.allocation}%`,
                  backgroundColor: getRandomColor(stock.symbol),
                  height: '100%',
                  transition: 'width 0.3s ease'
                }}
                title={`${stock.symbol}: ${stock.allocation}%`}
              />
            ))}
          </div>
          
          {/* Allocation legend */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            marginTop: '15px'
          }}>
            {sortedStocks.map((stock) => (
              <div key={stock.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div 
                  style={{ 
                    backgroundColor: getRandomColor(stock.symbol),
                    width: '15px',
                    height: '15px',
                    borderRadius: '3px'
                  }}
                />
                <span>{stock.symbol} ({stock.allocation}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate consistent colors based on stock symbol
function getRandomColor(symbol) {
  // Simple hash function for consistent colors
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate vibrant colors
  const r = 50 + (hash & 0xFF) % 150;
  const g = 50 + ((hash >> 8) & 0xFF) % 150;
  const b = 50 + ((hash >> 16) & 0xFF) % 150;
  
  return `rgb(${r}, ${g}, ${b})`;
}

export default Portfolio;