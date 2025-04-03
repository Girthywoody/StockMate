// src/components/AddStockForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { searchStocks, getStockQuotes } from '../services/yahooFinanceService';

const AddStockForm = ({ addStock }) => {
  const [stock, setStock] = useState({
    symbol: '',
    name: '',
    shares: '',
    price: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle search input changes with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };
  
  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      const results = await searchStocks(query);
      setSearchResults(results.slice(0, 5)); // Limit to top 5 results
      setShowDropdown(results.length > 0);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectStock = async (selectedStock) => {
    try {
      // Get current price and details
      const quoteData = await getStockQuotes([selectedStock.symbol]);
      if (quoteData && quoteData.length > 0) {
        const quote = quoteData[0];
        setStock({
          ...stock,
          symbol: quote.symbol,
          name: quote.shortName || quote.longName || selectedStock.name,
          price: quote.regularMarketPrice || 0
        });
      } else {
        setStock({
          ...stock,
          symbol: selectedStock.symbol,
          name: selectedStock.name
        });
      }
    } catch (error) {
      console.error('Failed to get stock details:', error);
      setStock({
        ...stock,
        symbol: selectedStock.symbol,
        name: selectedStock.name
      });
    }
    
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };
  
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
        <div className="search-container" ref={dropdownRef}>
          <input
            type="text"
            placeholder="Search for a stock..."
            className="form-control"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          
          {showDropdown && (
            <div className="search-results-dropdown">
              {isSearching ? (
                <div className="search-loading">Searching...</div>
              ) : (
                searchResults.map((result) => (
                  <div 
                    key={result.symbol} 
                    className="search-result-item"
                    onClick={() => selectStock(result)}
                  >
                    <span className="search-result-symbol">{result.symbol}</span>
                    <span className="search-result-name">{result.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <input
            type="text"
            name="symbol"
            placeholder="Stock Symbol (e.g., AAPL)"
            className="form-control"
            value={stock.symbol}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Company Name"
            className="form-control"
            value={stock.name}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="shares"
            step="0.01"
            placeholder="Number of Shares"
            className="form-control"
            value={stock.shares}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="price"
            step="0.01"
            placeholder="Current Price ($)"
            className="form-control"
            value={stock.price}
            onChange={handleChange}
            required
          />
          <button type="submit" className="btn btn-primary">Add Stock</button>
        </div>
      </form>
    </div>
  );
};

export default AddStockForm;