// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import StockList from './components/StockList';
import AddStockForm from './components/AddStockForm';
import Portfolio from './components/Portfolio';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

function App() {
  // Load stocks from localStorage on initial render
  const [stocks, setStocks] = useState(() => {
    const savedStocks = localStorage.getItem('stockPortfolio');
    return savedStocks ? JSON.parse(savedStocks) : [];
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');

  // Save stocks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('stockPortfolio', JSON.stringify(stocks));
  }, [stocks]);

  const addStock = (stock) => {
    // Check if stock already exists in portfolio
    const existingStock = stocks.find(s => s.symbol === stock.symbol);
    
    if (existingStock) {
      // Update existing stock
      setStocks(stocks.map(s => 
        s.symbol === stock.symbol ? 
        { 
          ...s, 
          shares: s.shares + stock.shares,
          totalCost: s.totalCost + (stock.price * stock.shares)
        } : s
      ));
    } else {
      // Add new stock
      setStocks([...stocks, {
        ...stock,
        totalCost: stock.price * stock.shares,
        id: Date.now()
      }]);
    }
  };

  const updateStockPrice = (symbol, newPrice) => {
    setStocks(stocks.map(stock => 
      stock.symbol === symbol ? 
      { 
        ...stock, 
        price: newPrice,
        priceChange: ((newPrice - stock.price) / stock.price * 100).toFixed(2)
      } : stock
    ));
  };

  const removeStock = (id) => {
    setStocks(stocks.filter(stock => stock.id !== id));
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="content-container">
        {activeTab === 'dashboard' && <Dashboard stocks={stocks} />}
        {activeTab === 'portfolio' && <Portfolio stocks={stocks} />}
        {activeTab === 'stocks' && (
          <>
            <AddStockForm addStock={addStock} />
            <StockList 
              stocks={stocks} 
              removeStock={removeStock} 
              updateStockPrice={updateStockPrice} 
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;