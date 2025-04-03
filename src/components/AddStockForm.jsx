// src/components/AddStockForm.jsx
import React, { useState } from 'react';

const AddStockForm = ({ addStock }) => {
  const [stock, setStock] = useState({
    symbol: '',
    name: '',
    shares: '',
    price: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStock({ ...stock, [name]: name === 'shares' || name === 'price' ? parseFloat(value) || '' : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!stock.symbol || !stock.name || !stock.shares || !stock.price) {
      alert('Please fill in all fields');
      return;
    }
    
    // Add new stock to portfolio
    addStock({
      ...stock,
      priceChange: 0,
      lastUpdated: new Date().toLocaleString()
    });
    
    // Reset form
    setStock({
      symbol: '',
      name: '',
      shares: '',
      price: ''
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Add Stock to Portfolio</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="symbol"
            placeholder="Stock Symbol (e.g., AAPL)"
            className="form-control"
            value={stock.symbol}
            onChange={handleChange}
          />
          <input
            type="text"
            name="name"
            placeholder="Company Name"
            className="form-control"
            value={stock.name}
            onChange={handleChange}
          />
          <input
            type="number"
            name="shares"
            step="0.01"
            placeholder="Number of Shares"
            className="form-control"
            value={stock.shares}
            onChange={handleChange}
          />
          <input
            type="number"
            name="price"
            step="0.01"
            placeholder="Purchase Price ($)"
            className="form-control"
            value={stock.price}
            onChange={handleChange}
          />
          <button type="submit" className="btn btn-primary">Add Stock</button>
        </div>
      </form>
    </div>
  );
};

export default AddStockForm;