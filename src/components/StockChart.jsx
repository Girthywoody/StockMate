// src/components/StockChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHistoricalData } from '../services/yahooFinanceService';

const StockChart = ({ symbol }) => {
  const [chartData, setChartData] = useState([]);
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
        
        // Format data for chart
        const formattedData = formatChartData(data);
        setChartData(formattedData);
      } catch (err) {
        console.error('Failed to load chart data:', err);
        setError('Failed to load chart data. Please try again later.');
        
        // For demo/development, generate mock data
        setChartData(generateMockChartData(timeRange, interval));
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [symbol, timeRange, interval]);

  const handleRangeChange = (range, intrv) => {
    setTimeRange(range);
    setInterval(intrv);
  };

  // Helper function to format chart data from API response
  const formatChartData = (data) => {
    if (!data || !data.timestamp || !data.indicators || !data.indicators.quote) {
      return [];
    }
    
    const timestamps = data.timestamp;
    const quotes = data.indicators.quote[0];
    
    return timestamps.map((time, index) => ({
      date: new Date(time * 1000).toLocaleDateString(),
      price: quotes.close[index],
      volume: quotes.volume[index]
    })).filter(item => item.price !== null);
  };
  
  // Generate mock data for development/demo
  const generateMockChartData = (range, interval) => {
    const data = [];
    let days = 30;
    
    switch (range) {
      case '1d': days = 1; break;
      case '5d': days = 5; break;
      case '1mo': days = 30; break;
      case '6mo': days = 180; break;
      case '1y': days = 365; break;
      case '5y': days = 365 * 5; break;
      default: days = 30;
    }
    
    // Adjust points based on interval
    let points = days;
    if (interval === '1m' || interval === '5m' || interval === '15m') {
      points = days * 24 * 4; // 15-minute intervals
    } else if (interval === '1h') {
      points = days * 24;
    } else if (interval === '1wk') {
      points = Math.ceil(days / 7);
    } else if (interval === '1mo') {
      points = Math.ceil(days / 30);
    }
    
    // Limit points to a reasonable number
    points = Math.min(points, 100);
    
    // Generate mock price data with some randomness but following a trend
    const startPrice = 100 + Math.random() * 100;
    let currentPrice = startPrice;
    const trendDirection = Math.random() > 0.5 ? 1 : -1; // up or down trend
    
    const now = new Date();
    const msPerPoint = (days * 24 * 60 * 60 * 1000) / points;
    
    for (let i = 0; i < points; i++) {
      // Random price movement, slightly biased in trend direction
      const change = (Math.random() * 2 - 0.9) * trendDirection;
      currentPrice = Math.max(currentPrice + change, 1); // ensure price is positive
      
      const date = new Date(now.getTime() - (points - i) * msPerPoint);
      
      data.push({
        date: date.toLocaleDateString(),
        price: parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 500000
      });
    }
    
    return data;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">Loading chart data...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-700">{symbol} Price Chart</h3>
        <div className="flex space-x-2">
          <button 
            className={`px-2 py-1 text-sm rounded ${timeRange === '1d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleRangeChange('1d', '5m')}
          >
            1D
          </button>
          <button 
            className={`px-2 py-1 text-sm rounded ${timeRange === '5d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleRangeChange('5d', '15m')}
          >
            5D
          </button>
          <button 
            className={`px-2 py-1 text-sm rounded ${timeRange === '1mo' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleRangeChange('1mo', '1d')}
          >
            1M
          </button>
          <button 
            className={`px-2 py-1 text-sm rounded ${timeRange === '6mo' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleRangeChange('6mo', '1d')}
          >
            6M
          </button>
          <button 
            className={`px-2 py-1 text-sm rounded ${timeRange === '1y' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleRangeChange('1y', '1wk')}
          >
            1Y
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="date" 
              padding={{ left: 10, right: 10 }} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // Format based on timeRange
                if (timeRange === '1d') {
                  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                if (timeRange === '5d') {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }
                return value;
              }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value) => [`$${value}`, 'Price']}
              labelFormatter={(value) => `Date: ${value}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3498db" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
        <div>
          <div className="font-semibold">Open</div>
          <div>${chartData[0]?.price.toFixed(2) || 'N/A'}</div>
        </div>
        <div>
          <div className="font-semibold">Close</div>
          <div>${chartData[chartData.length - 1]?.price.toFixed(2) || 'N/A'}</div>
        </div>
        <div>
          <div className="font-semibold">Change</div>
          {chartData.length > 1 && (
            <div className={
              chartData[chartData.length - 1].price > chartData[0].price 
                ? 'text-green-600' 
                : 'text-red-600'
            }>
              {((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price * 100).toFixed(2)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChart;