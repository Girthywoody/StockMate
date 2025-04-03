// src/components/StockChart.jsx
import React, { useState, useEffect } from 'react';
import { getHistoricalData } from '../services/yahooFinanceService';

const StockChart = ({ symbol }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1mo');
  const [interval, setInterval] = useState('1d');

  useEffect(() => {
    const fetchChartData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getHistoricalData(symbol, timeRange, interval);
        setChartData(data);
      } catch (err) {
        setError('Failed to load chart data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
    
    // Refresh every minute for the active chart
    const refreshInterval = setInterval(fetchChartData, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [symbol, timeRange, interval]);

  const handleRangeChange = (range, intrv) => {
    setTimeRange(range);
    setInterval(intrv);
  };

  if (loading) return <div className="chart-loading">Loading chart...</div>;
  if (error) return <div className="chart-error">{error}</div>;
  if (!chartData) return <div>Select a stock to view chart</div>;

  // Format chart data for rendering
  const timestamps = chartData.timestamp || [];
  const quotes = chartData.indicators.quote[0] || {};
  const close = quotes.close || [];
  const formattedData = timestamps.map((time, index) => ({
    date: new Date(time * 1000).toLocaleDateString(),
    price: close[index]?.toFixed(2) || 0
  }));

  // Simple SVG chart rendering
  const chartHeight = 300;
  const chartWidth = 600;
  const padding = { top: 20, right: 30, bottom: 30, left: 50 };
  
  // Find min and max values for scaling
  const prices = close.filter(price => price !== null);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  
  // Scale functions
  const xScale = (index) => 
    padding.left + (index / (timestamps.length - 1)) * (chartWidth - padding.left - padding.right);
  
  const yScale = (price) => 
    chartHeight - padding.bottom - ((price - minPrice) / (maxPrice - minPrice)) * 
    (chartHeight - padding.top - padding.bottom);

  // Generate path data
  const pathData = formattedData
    .map((point, index) => {
      if (index === 0) {
        return `M ${xScale(index)} ${yScale(point.price)}`;
      }
      return `L ${xScale(index)} ${yScale(point.price)}`;
    })
    .join(' ');

  // Chart color based on trend
  const isPositive = close[close.length - 1] >= close[0];
  const strokeColor = isPositive ? '#2ecc71' : '#e74c3c';

  return (
    <div className="stock-chart-container">
      <div className="chart-header">
        <h3>{symbol} Price Chart</h3>
        <div className="timeframe-selector">
          <button 
            className={timeRange === '1d' ? 'active' : ''} 
            onClick={() => handleRangeChange('1d', '5m')}
          >
            1D
          </button>
          <button 
            className={timeRange === '5d' ? 'active' : ''} 
            onClick={() => handleRangeChange('5d', '15m')}
          >
            5D
          </button>
          <button 
            className={timeRange === '1mo' ? 'active' : ''} 
            onClick={() => handleRangeChange('1mo', '1d')}
          >
            1M
          </button>
          <button 
            className={timeRange === '6mo' ? 'active' : ''} 
            onClick={() => handleRangeChange('6mo', '1d')}
          >
            6M
          </button>
          <button 
            className={timeRange === '1y' ? 'active' : ''} 
            onClick={() => handleRangeChange('1y', '1wk')}
          >
            1Y
          </button>
          <button 
            className={timeRange === '5y' ? 'active' : ''} 
            onClick={() => handleRangeChange('5y', '1mo')}
          >
            5Y
          </button>
        </div>
      </div>
      
      <svg width={chartWidth} height={chartHeight} className="stock-chart">
        {/* Chart line */}
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
        />
        
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke="#ccc"
          strokeWidth="1"
        />
        
        {/* X-axis */}
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#ccc"
          strokeWidth="1"
        />
        
        {/* Chart labels */}
        <text x={chartWidth / 2} y={chartHeight - 5} textAnchor="middle" fontSize="12">
          {timeRange} ({interval})
        </text>
        
        {/* Price labels - min, max, and current */}
        <text x={padding.left - 5} y={padding.top} textAnchor="end" fontSize="12">
          ${maxPrice.toFixed(2)}
        </text>
        <text x={padding.left - 5} y={chartHeight - padding.bottom} textAnchor="end" fontSize="12">
          ${minPrice.toFixed(2)}
        </text>
        <text x={chartWidth - padding.right + 5} y={padding.top + 15} textAnchor="start" fontSize="12" fontWeight="bold">
          ${close[close.length - 1]?.toFixed(2) || 'N/A'}
        </text>
      </svg>
      
      <div className="chart-stats">
        <div className="stat">
          <span className="label">Open:</span>
          <span>${quotes.open?.[0]?.toFixed(2) || 'N/A'}</span>
        </div>
        <div className="stat">
          <span className="label">High:</span>
          <span>${Math.max(...(quotes.high || [0]))?.toFixed(2) || 'N/A'}</span>
        </div>
        <div className="stat">
          <span className="label">Low:</span>
          <span>${Math.min(...(quotes.low || [Infinity]))?.toFixed(2) || 'N/A'}</span>
        </div>
        <div className="stat">
          <span className="label">Close:</span>
          <span>${close[close.length - 1]?.toFixed(2) || 'N/A'}</span>
        </div>
        <div className="stat">
          <span className="label">Volume:</span>
          <span>{quotes.volume?.[quotes.volume.length - 1]?.toLocaleString() || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default StockChart;