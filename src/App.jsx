// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
// Note: Changed the import path to match the correct filename
import './realTimeComponents.css';
import StockList from './components/StockList';
import AddStockForm from './components/AddStockForm';
import Portfolio from './components/Portfolio';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MarketOverview from './components/MarketOverview';
import StockDetail from './components/StockDetail';
import StockChart from './components/StockChart';
import { getStockQuotes } from './services/yahooFinanceService';

function App() {
  // Load stocks from localStorage on initial render
  const [stocks, setStocks] = useState(() => {
    const savedStocks = localStorage.getItem('stockPortfolio');
    return savedStocks ? JSON.parse(savedStocks) : [];
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Save stocks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('stockPortfolio', JSON.stringify(stocks));
  }, [stocks]);

  // Periodically refresh all stock prices
  useEffect(() => {
    if (stocks.length === 0) return;

    const refreshAllPrices = async () => {
      try {
        setIsLoading(true);
        const symbols = stocks.map(stock => stock.symbol);
        const quotes = await getStockQuotes(symbols);
        
        // Update prices for all stocks
        setStocks(prevStocks => 
          prevStocks.map(stock => {
            const quote = quotes.find(q => q.symbol === stock.symbol);
            if (quote) {
              const newPrice = quote.regularMarketPrice;
              const priceChange = ((newPrice - stock.price) / stock.price * 100).toFixed(2);
              return {
                ...stock,
                price: newPrice,
                priceChange,
                lastUpdated: new Date().toLocaleString()
              };
            }
            return stock;
          })
        );
        
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to refresh stock prices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial refresh
    refreshAllPrices();
    
    // Set interval for periodic refresh - every 5 minutes
    const intervalId = setInterval(refreshAllPrices, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [stocks.length]);

  const addStock = async (stock) => {
    // Check if stock already exists in portfolio
    const existingStock = stocks.find(s => s.symbol === stock.symbol);
    
    if (existingStock) {
      // Update existing stock
      setStocks(stocks.map(s => 
        s.symbol === stock.symbol ? 
        { 
          ...s, 
          shares: s.shares + stock.shares,
          totalCost: s.totalCost + (stock.price * stock.shares),
          lastUpdated: new Date().toLocaleString()
        } : s
      ));
    } else {
      // Add new stock
      setStocks([...stocks, {
        ...stock,
        totalCost: stock.price * stock.shares,
        id: Date.now(),
        lastUpdated: new Date().toLocaleString()
      }]);
    }
  };

  const updateStockPrice = (symbol, newPrice) => {
    setStocks(stocks.map(stock => 
      stock.symbol === symbol ? 
      { 
        ...stock, 
        price: newPrice,
        priceChange: ((newPrice - (stock.totalCost / stock.shares)) / (stock.totalCost / stock.shares) * 100).toFixed(2),
        lastUpdated: new Date().toLocaleString()
      } : stock
    ));
  };

  const removeStock = (id) => {
    setStocks(stocks.filter(stock => stock.id !== id));
  };

  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
  };
  
  const closeStockDetail = () => {
    setSelectedStock(null);
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {isLoading && (
        <div className="loading-indicator">
          Refreshing stock data...
        </div>
      )}
      
      {lastUpdated && (
        <div className="last-updated-info">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}
      
      <div className="content-container">
        {activeTab === 'dashboard' && (
          <>
            <MarketOverview />
            <Dashboard 
              stocks={stocks} 
              onSelectStock={handleStockSelect}
            />
          </>
        )}
        
        {activeTab === 'portfolio' && (
          <Portfolio 
            stocks={stocks} 
            onSelectStock={handleStockSelect}
          />
        )}
        
        {activeTab === 'stocks' && (
          <>
            <AddStockForm addStock={addStock} />
            <StockList 
              stocks={stocks} 
              removeStock={removeStock} 
              updateStockPrice={updateStockPrice}
              onSelectStock={handleStockSelect} 
            />
          </>
        )}
        
        {selectedStock && (
          <div className="stock-detail-overlay">
            <StockDetail 
              symbol={selectedStock} 
              onClose={closeStockDetail} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;