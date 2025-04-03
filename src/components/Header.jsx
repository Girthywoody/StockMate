// src/components/Header.jsx
import React from 'react';

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <div className="header">
      <h1>Stock Portfolio Tracker</h1>
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        <button 
          className={`tab ${activeTab === 'stocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('stocks')}
        >
          Manage Stocks
        </button>
      </div>
    </div>
  );
};

export default Header;