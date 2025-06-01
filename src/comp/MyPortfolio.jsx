// MyPortfolio.jsx
import React, { useState, useEffect } from 'react';
import './MyPortfolio.css';
import Sidebar from './Sidebar';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const apiKey = 'q9j7zoVhisoovNS7dvEBmupVTJDAMVu7';

const MyPortfolio = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [isComparing, setIsComparing] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState({});
  const [editingStock, setEditingStock] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStockDetails, setNewStockDetails] = useState({
    symbol: '',
    date: new Date().toISOString().split('T')[0],
    amountInvested: ''
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedStocks = localStorage.getItem('trackedStocks');
    const savedDetails = localStorage.getItem('purchaseDetails');
    if (savedStocks) setStocks(JSON.parse(savedStocks));
    if (savedDetails) setPurchaseDetails(JSON.parse(savedDetails));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('trackedStocks', JSON.stringify(stocks));
    localStorage.setItem('purchaseDetails', JSON.stringify(purchaseDetails));
  }, [stocks, purchaseDetails]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchStockData = async (symbol) => {
    try {
      // Always fetch maximum data to handle any purchase date
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}`
      );
      return response.data.historical || [];
    } catch (err) {
      console.error(`Error fetching data for ${symbol}:`, err);
      return null;
    }
  };

  const filterDataFromPurchaseDate = (data, purchaseDate) => {
    if (!purchaseDate) return data;
    const purchaseDateObj = new Date(purchaseDate);
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= purchaseDateObj;
    });
  };

  const calculatePerformance = (stockData, amountInvested) => {
    if (!stockData || stockData.length < 1) return null;
    
    const purchasePrice = stockData[stockData.length - 1]?.close;
    const currentPrice = stockData[0]?.close;
    
    if (!purchasePrice || !currentPrice) return null;
    
    // Calculate shares based on invested amount and purchase price
    const shares = amountInvested / purchasePrice;
    const currentValue = shares * currentPrice;
    const gainLoss = currentValue - amountInvested;
    const percentChange = (gainLoss / amountInvested) * 100;
    
    return {
      purchasePrice,
      currentPrice,
      shares,
      currentValue,
      gainLoss,
      percentChange
    };
  };

  const updatePurchaseDetails = (symbol, details) => {
    setPurchaseDetails(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        ...details
      }
    }));
  };

  const calculatePortfolioSummary = () => {
    let totalValue = 0;
    let totalInvested = 0;
    let totalGainLoss = 0;
    const stocksSummary = [];

    stocks.forEach(symbol => {
      const metric = performanceMetrics[symbol] || {};
      const purchase = purchaseDetails[symbol] || {};
      const amountInvested = parseFloat(purchase.amountInvested) || 0;
      
      totalInvested += amountInvested;
      totalValue += metric.currentValue || 0;
      totalGainLoss += metric.gainLoss || 0;

      stocksSummary.push({
        symbol,
        amountInvested,
        purchaseDate: purchase.date,
        purchasePrice: metric.purchasePrice,
        currentPrice: metric.currentPrice,
        currentValue: metric.currentValue,
        gainLoss: metric.gainLoss,
        percentChange: metric.percentChange
      });
    });

    const portfolioPercentChange = totalInvested ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalGainLoss,
      portfolioPercentChange,
      stocksSummary
    };
  };

  const openAddModal = () => {
    setNewStockDetails({
      symbol: '',
      date: new Date().toISOString().split('T')[0],
      amountInvested: ''
    });
    setShowAddModal(true);
  };

  const handleAddStock = async () => {
    const { symbol, date, amountInvested } = newStockDetails;
    const symbolUpper = symbol.toUpperCase();
    const investedAmount = parseFloat(amountInvested);
    
    if (!symbolUpper.trim()) {
      setError('Stock symbol is required');
      return;
    }
    
    if (stocks.includes(symbolUpper)) {
      setError(`${symbolUpper} is already being tracked`);
      return;
    }

    if (!investedAmount || investedAmount <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    setLoading(true);
    setError(null);
    setShowAddModal(false);
    
    try {
      const data = await fetchStockData(symbolUpper);
      if (data && data.length > 0) {
        const newStocks = [...stocks, symbolUpper];
        setStocks(newStocks);
        
        const purchaseData = {
          date,
          amountInvested: investedAmount
        };
        
        updatePurchaseDetails(symbolUpper, purchaseData);
        
        // Update chart with new stock
        updateChartData(newStocks);
      } else {
        setError(`No data found for ${symbolUpper}`);
      }
    } catch (err) {
      setError(`Failed to add ${symbolUpper}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeStock = (symbol) => {
    const updatedStocks = stocks.filter(s => s !== symbol);
    setStocks(updatedStocks);
    
    setPerformanceMetrics(prev => {
      const newMetrics = {...prev};
      delete newMetrics[symbol];
      return newMetrics;
    });

    setPurchaseDetails(prev => {
      const newDetails = {...prev};
      delete newDetails[symbol];
      return newDetails;
    });

    // Update chart after removal
    if (updatedStocks.length > 0) {
      updateChartData(updatedStocks);
    } else {
      setChartData(null);
    }
  };

  const updateChartData = async (symbols) => {
    if (symbols.length === 0) {
      setChartData(null);
      return;
    }

    setLoading(true);
    try {
      const allData = await Promise.all(
        symbols.map(async symbol => {
          const data = await fetchStockData(symbol);
          const purchase = purchaseDetails[symbol] || {};
          const filteredData = filterDataFromPurchaseDate(data, purchase.date);
          
          // Calculate performance
          const amountInvested = parseFloat(purchase.amountInvested) || 0;
          const performance = calculatePerformance(filteredData, amountInvested);
          
          return {
            symbol,
            data: filteredData.map(item => ({
              date: item.date,
              price: item.close
            })),
            rawData: filteredData,
            performance
          };
        })
      );

      // Update performance metrics
      const updatedMetrics = {};
      allData.forEach(({ symbol, performance }) => {
        updatedMetrics[symbol] = performance;
      });
      setPerformanceMetrics(updatedMetrics);

      // Find all unique dates across all stocks (after their purchase dates)
      const allDates = [...new Set(
        allData.flatMap(stock => stock.data.map(item => item.date))
    )].sort();


      // Prepare datasets for the chart
      const datasets = allData.map(({ symbol, data, performance }) => {
        const priceData = allDates.map(date => {
          const found = data.find(item => item.date === date);
          return found ? found.price : null;
        });

        // Calculate normalized performance (starting from 100)
        const normalizedData = priceData.map(price => {
          if (price === null || !performance?.purchasePrice) return null;
          return (price / performance.purchasePrice) * 100;
        });

        const color = generateColor(symbol);

        return {
          label: `${symbol} (${performance?.percentChange ? performance.percentChange.toFixed(2) + '%' : 'N/A'})`,
          data: isComparing ? normalizedData : priceData,
          borderColor: color,
          backgroundColor: color,
          tension: 0.1,
          fill: isComparing,
          borderWidth: 2,
          pointRadius: 0
        };
      });

      setChartData({
        labels: allDates,
        datasets
      });
    } catch (err) {
      setError('Failed to update chart data');
    } finally {
      setLoading(false);
    }
  };

  const generateColor = (symbol) => {
    const hash = symbol.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return `hsl(${hash % 360}, 70%, 50%)`;
  };

  const toggleCompareMode = () => {
    setIsComparing(!isComparing);
    if (stocks.length > 0) {
      updateChartData(stocks);
    }
  };

  const clearAllStocks = () => {
    setStocks([]);
    setChartData(null);
    setPerformanceMetrics({});
    setPurchaseDetails({});
  };

  // When opening edit modal, set temp details
  const openEditModal = (symbol) => {
    setEditingStock(symbol);
    setNewStockDetails({
      symbol,
      date: purchaseDetails[symbol]?.date || new Date().toISOString().split('T')[0],
      amountInvested: purchaseDetails[symbol]?.amountInvested || ''
    });
  };

  // Save details from modal
  const savePurchaseDetails = () => {
    if (!editingStock) return;
    
    const amountInvested = parseFloat(newStockDetails.amountInvested);
    if (!amountInvested || amountInvested <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }
    
    updatePurchaseDetails(editingStock, {
      date: newStockDetails.date,
      amountInvested
    });
    
    setEditingStock(null);
    
    // Update chart with new details
    if (stocks.length > 0) {
      updateChartData(stocks);
    }
  };

  const handleInputChange = (field, value) => {
    setNewStockDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const portfolioSummary = calculatePortfolioSummary();

  return (
    <div className="portfolio-page">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="portfolio-content">
        <h1>Stock Portfolio Tracker</h1>
        <p>Track performance from purchase date with investment amounts</p>
        
        <div className="controls-container">
          <div className="action-buttons">
            <button 
              onClick={openAddModal}
              className="add-button"
            >
              + Add New Stock
            </button>
            <button 
              onClick={toggleCompareMode}
              className={isComparing ? 'active' : ''}
            >
              {isComparing ? 'Normal View' : 'Compare Performance'}
            </button>
            <button 
              onClick={clearAllStocks}
              className="clear-button"
              disabled={stocks.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="stock-list">
          {stocks.map(symbol => (
            <div key={symbol} className="stock-tag">
              <span className="symbol">{symbol}</span>
              {performanceMetrics[symbol] && (
                <span className={`performance ${performanceMetrics[symbol].percentChange >= 0 ? 'positive' : 'negative'}`}>
                  {performanceMetrics[symbol].percentChange.toFixed(2)}%
                </span>
              )}
              <button 
                onClick={() => openEditModal(symbol)}
                className="edit-button"
                title="Edit investment details"
              >
                ✏️
              </button>
              <button 
                onClick={() => removeStock(symbol)}
                className="remove-button"
                title="Remove stock"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {stocks.length > 0 && (
          <div className="portfolio-summary">
            <h3>Portfolio Summary</h3>
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Total Value</h4>
                <p>${portfolioSummary.totalValue.toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h4>Total Invested</h4>
                <p>${portfolioSummary.totalInvested.toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h4>Total Gain/Loss</h4>
                <p className={portfolioSummary.totalGainLoss >= 0 ? 'positive' : 'negative'}>
                  ${portfolioSummary.totalGainLoss.toFixed(2)} ({portfolioSummary.portfolioPercentChange.toFixed(2)}%)
                </p>
              </div>
            </div>

            <div className="detailed-performance">
              <h4>Detailed Performance</h4>
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Invested</th>
                    <th>Purchase Date</th>
                    <th>Purchase Price</th>
                    <th>Current Price</th>
                    <th>Current Value</th>
                    <th>Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioSummary.stocksSummary.map((stock, index) => (
                    <tr key={index}>
                      <td>{stock.symbol}</td>
                      <td>${stock.amountInvested.toFixed(2)}</td>
                      <td>{stock.purchaseDate || 'N/A'}</td>
                      <td>${stock.purchasePrice?.toFixed(2) || 'N/A'}</td>
                      <td>${stock.currentPrice?.toFixed(2) || 'N/A'}</td>
                      <td>${stock.currentValue?.toFixed(2) || 'N/A'}</td>
                      <td className={stock.gainLoss >= 0 ? 'positive' : 'negative'}>
                        ${stock.gainLoss?.toFixed(2) || 'N/A'} ({stock.percentChange?.toFixed(2) || 'N/A'}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="chart-container">
          {chartData ? (
            <Line 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: isComparing 
                      ? 'Normalized Performance Comparison (Starting from 100)' 
                      : 'Stock Performance from Purchase Date',
                    font: { size: 16 }
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                      label: (context) => {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y || 0;
                        return isComparing
                          ? `${label.split(' (')[0]}: ${value.toFixed(2)} (${((value - 100) / 100 * 100).toFixed(2)}%)`
                          : `${label.split(' (')[0]}: $${value.toFixed(2)}`;
                      }
                    }
                  },
                  legend: {
                    position: 'top',
                    labels: {
                      boxWidth: 12,
                      padding: 20,
                      usePointStyle: true
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    }
                  },
                  y: {
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: isComparing ? 'Performance Index (100 = Purchase Price)' : 'Price (USD)'
                    }
                  }
                },
                interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false
                }
              }}
            />
          ) : (
            <div className="empty-state">
              <h3>No stocks in portfolio</h3>
              <p>Add stocks to begin tracking performance</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Stock to Portfolio</h3>
            <div className="form-group">
              <label>Stock Symbol:</label>
              <input
                type="text"
                value={newStockDetails.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
                placeholder="e.g. AAPL"
              />
            </div>
            <div className="form-group">
              <label>Purchase Date:</label>
              <input
                type="date"
                value={newStockDetails.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Amount Invested ($):</label>
              <input
                type="number"
                value={newStockDetails.amountInvested}
                onChange={(e) => handleInputChange('amountInvested', e.target.value)}
                placeholder="Investment amount"
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)}>Cancel</button>
              <button 
                onClick={handleAddStock}
                className="primary"
                disabled={!newStockDetails.symbol.trim() || !newStockDetails.amountInvested}
              >
                {loading ? 'Adding...' : 'Add Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {editingStock && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Investment Details for {editingStock}</h3>
            <div className="form-group">
              <label>Purchase Date:</label>
              <input
                type="date"
                value={newStockDetails.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Amount Invested ($):</label>
              <input
                type="number"
                value={newStockDetails.amountInvested}
                onChange={(e) => handleInputChange('amountInvested', e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setEditingStock(null)}>Cancel</button>
              <button 
                onClick={savePurchaseDetails}
                className="primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPortfolio;