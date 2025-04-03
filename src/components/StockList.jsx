// src/components/StockList.jsx
import React, { useState } from 'react';

const StockList = ({ stocks, removeStock, updateStockPrice }) => {
  const [priceInputs, setPriceInputs] = useState({});

  const handlePriceChange = (e, symbol) => {
    const { value } = e.target;
    setPriceInputs({ ...priceInputs, [symbol]: value });
  };

  const handleUpdatePrice = (symbol) => {
    const newPrice = parseFloat(priceInputs[symbol]);
    if (!isNaN(newPrice) && newPrice > 0) {
      updateStockPrice(symbol, newPrice);
      setPriceInputs({ ...priceInputs, [symbol]: '' });
    } else {
      alert('Please enter a valid price');
    }
  };

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
      </div>
      
      <table className="stock-list">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Shares</th>
            <th>Price ($)</th>
            <th>Market Value ($)</th>
            <th>Cost Basis ($)</th>
            <th>Gain/Loss ($)</th>
            <th>Gain/Loss (%)</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
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
                <td>${stock.totalCost.toFixed(2)}</td>
                <td className={gain >= 0 ? 'positive' : 'negative'}>
                  ${gain.toFixed(2)}
                </td>
                <td className={gain >= 0 ? 'positive' : 'negative'}>
                  {gainPercentage}%
                </td>
                <td>{stock.lastUpdated || 'N/A'}</td>
                <td className="actions">
                  <div className="price-update">
                    <input
                      type="number"
                      placeholder="New price"
                      className="price-input"
                      value={priceInputs[stock.symbol] || ''}
                      onChange={(e) => handlePriceChange(e, stock.symbol)}
                      step="0.01"
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleUpdatePrice(stock.symbol)}
                    >
                      Update
                    </button>
                  </div>
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
    </div>
  );
};

export default StockList;