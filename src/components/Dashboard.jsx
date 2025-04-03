// src/components/Dashboard.jsx
import React from 'react';

const Dashboard = ({ stocks }) => {
  // Calculate portfolio metrics
  const totalValue = stocks.reduce((sum, stock) => sum + (stock.price * stock.shares), 0);
  const totalCost = stocks.reduce((sum, stock) => sum + stock.totalCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercentage = totalCost ? ((totalGain / totalCost) * 100).toFixed(2) : 0;
  
  // Find best and worst performing stocks
  let bestStock = { gainPercentage: -Infinity };
  let worstStock = { gainPercentage: Infinity };
  
  stocks.forEach(stock => {
    const currentValue = stock.price * stock.shares;
    const gain = currentValue - stock.totalCost;
    const gainPercentage = stock.totalCost ? ((gain / stock.totalCost) * 100) : 0;
    
    if (gainPercentage > bestStock.gainPercentage) {
      bestStock = { ...stock, gainPercentage };
    }
    
    if (gainPercentage < worstStock.gainPercentage) {
      worstStock = { ...stock, gainPercentage };
    }
  });
  
  // Get top 5 holdings by value
  const topHoldings = [...stocks]
    .sort((a, b) => (b.price * b.shares) - (a.price * a.shares))
    .slice(0, 5);
  
  if (stocks.length === 0) {
    return (
      <div className="dashboard-empty">
        <h2 className="section-title">Welcome to Your Stock Portfolio Tracker</h2>
        <p>You don't have any stocks in your portfolio yet.</p>
        <p>Go to the "Manage Stocks" tab to add your first stock!</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2 className="section-title">Portfolio Dashboard</h2>
      
      {/* Portfolio summary cards */}
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h3>Total Value</h3>
          <div className="dashboard-value">${totalValue.toFixed(2)}</div>
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
            <div className="dashboard-card">
              <h3>Best Performer</h3>
              <div className="dashboard-value">{bestStock.symbol}</div>
              <div className="positive">+{bestStock.gainPercentage.toFixed(2)}%</div>
              <p>{bestStock.name}</p>
            </div>
            
            <div className="dashboard-card">
              <h3>Worst Performer</h3>
              <div className="dashboard-value">{worstStock.symbol}</div>
              <div className="negative">{worstStock.gainPercentage.toFixed(2)}%</div>
              <p>{worstStock.name}</p>
            </div>
          </>
        )}
      </div>
      
      {/* Top holdings */}
      <h2 className="section-title">Top Holdings</h2>
      <table className="stock-list">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Market Value ($)</th>
            <th>Price ($)</th>
            <th>Shares</th>
            <th>Gain/Loss (%)</th>
          </tr>
        </thead>
        <tbody>
          {topHoldings.map((stock) => {
            const marketValue = stock.price * stock.shares;
            const gain = marketValue - stock.totalCost;
            const gainPercentage = ((gain / stock.totalCost) * 100).toFixed(2);
            
            return (
              <tr key={stock.id}>
                <td>{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>${marketValue.toFixed(2)}</td>
                <td>${stock.price.toFixed(2)}</td>
                <td>{stock.shares}</td>
                <td className={gain >= 0 ? 'positive' : 'negative'}>
                  {gainPercentage}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;