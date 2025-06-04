import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { Line, Bar } from 'react-chartjs-2';
import Sidebar from './comp/Sidebar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const formatLargeNumber = (num) => {
  if (typeof num !== 'number') return num;
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'b';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'm';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
};

const App = () => {
  const [stockData, setStockData] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('1y');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const apiKey = 'q9j7zoVhisoovNS7dvEBmupVTJDAMVu7';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const timeseriesMap = { '1y': 365, '6m': 180, '3m': 90, '1m': 30 };
      const timeseries = timeseriesMap[timeRange] || 365;

      const stockResponse = await axios.get(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=${timeseries}&apikey=${apiKey}`
      );
      setStockData(stockResponse.data.historical || []);

      const [incomeStatement, balanceSheet, cashFlow, dividends] = await Promise.all([
        axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?apikey=${apiKey}`),
        axios.get(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?apikey=${apiKey}`),
        axios.get(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?apikey=${apiKey}`),
        axios.get(`https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${apiKey}`)
      ]);

      const latestIncome = incomeStatement.data[0] || {};
      const latestBalance = balanceSheet.data[0] || {};
      const latestCashFlow = cashFlow.data[0] || {};
      const latestDividend = dividends.data[0];
      const dividendAmount =
        latestDividend?.dividends?.[0]?.amount ?? 'N/A';

      setFinancialData({
        revenue: latestIncome.revenue || 0,
        grossProfit: latestIncome.grossProfit || 0,
        netIncome: latestIncome.netIncome || 0,
        totalAssets: latestBalance.totalAssets || 0,
        totalLiabilities: latestBalance.totalLiabilities || 0,
        cash: latestBalance.cashAndCashEquivalents || 0,
        debt: latestBalance.totalDebt || 0,
        operatingCashFlow: latestCashFlow.operatingCashFlow || 0,
        freeCashFlow: latestCashFlow.freeCashFlow || 0,
        dividend: dividendAmount
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, timeRange]);

  const handleSearch = (e) => setSearchQuery(e.target.value);
  const handleSubmitSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) setSymbol(searchQuery.toUpperCase());
    setSearchQuery('');
  };

  const stockChartData = {
    labels: stockData.map(({ date }) => date),
    datasets: [
      {
        label: `${symbol} Price (USD)`,
        data: stockData.map(({ close }) => close),
        borderColor: 'rgb(96, 165, 250)',
        backgroundColor: 'rgba(96, 165, 250, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const financialChartData = {
    labels: ['Revenue', 'Gross Profit', 'Net Income', 'Assets', 'Cash', 'Debt'],
    datasets: [
      {
        label: 'Amount (USD)',
        data: financialData
          ? [
              financialData.revenue,
              financialData.grossProfit,
              financialData.netIncome,
              financialData.totalAssets,
              financialData.cash,
              financialData.debt
            ]
          : [],
        backgroundColor: 'rgba(96, 165, 250, 0.7)',
        borderColor: 'rgb(96, 165, 250)',
        borderWidth: 1
      }
    ]
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="main-content">
        <div className="company-card">
          <form onSubmit={handleSubmitSearch} className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search Symbol..."
            />
          </form>

          <h2>{symbol}</h2>
          <div className="ticker">Latest Price: ${stockData[0]?.close}</div>
          <div className="metrics-grid">
            <div className="metric-card">Revenue: ${formatLargeNumber(financialData.revenue)}</div>
            <div className="metric-card">Net Income: ${formatLargeNumber(financialData.netIncome)}</div>
            <div className="metric-card">Cash: ${formatLargeNumber(financialData.cash)}</div>
            <div className="metric-card">Debt: ${formatLargeNumber(financialData.debt)}</div>
            <div className="metric-card">Assets: ${formatLargeNumber(financialData.totalAssets)}</div>
            <div className="metric-card">Liabilities: ${formatLargeNumber(financialData.totalLiabilities)}</div>
            <div className="metric-card">Free Cash Flow: ${formatLargeNumber(financialData.freeCashFlow)}</div>
            <div className="metric-card">Dividend: {financialData.dividend}</div>
          </div>
        </div>

        <div className="financial-charts">
          <div className="chart-tile">
            <h3>Stock Price</h3>
            <Line data={stockChartData} options={{ responsive: true }} />
          </div>
          <div className="chart-tile">
            <h3>Financial Overview (TTW)</h3>
            <Bar data={financialChartData} options={{ responsive: true }} />
          </div>
        </div>

        <div className="time-range">
          <label>Time Range:</label>
          {['1y', '6m', '3m', '1m'].map((range) => (
            <button
              key={range}
              className={range === timeRange ? 'active' : ''}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
