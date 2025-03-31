import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FinancialData = ({ symbol, apiKey }) => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch financial statements using axios
        const incomeStatement = await axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?apikey=${apiKey}`);
        const balanceSheet = await axios.get(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?apikey=${apiKey}`);
        const cashFlow = await axios.get(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?apikey=${apiKey}`);
        const dividends = await axios.get(`https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${apiKey}`);

        // Extract relevant data
        const latestIncomeStatement = incomeStatement.data[0];
        const latestBalanceSheet = balanceSheet.data[0];
        const latestCashFlow = cashFlow.data[0];
        const latestDividends = dividends.data[0];

        const data = {
          revenue: latestIncomeStatement.revenue,
          grossProfit: latestIncomeStatement.grossProfit,
          netIncome: latestIncomeStatement.netIncome,
          totalAssets: latestBalanceSheet.totalAssets,
          totalLiabilities: latestBalanceSheet.totalLiabilities,
          cash: latestBalanceSheet.cashAndCashEquivalents,
          debt: latestBalanceSheet.totalDebt,
          operatingCashFlow: latestCashFlow.operatingCashFlow,
          freeCashFlow: latestCashFlow.freeCashFlow,
          dividend: latestDividends ? latestDividends.dividends[0].amount : 'N/A',
        };

        setFinancialData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, apiKey]);

  if (loading) return <p>Loading financial data...</p>;
  if (error) return <p>Error fetching data: {error}</p>;

  return (
    <div>
      <h2>Financial Data for {symbol}</h2>
      <ul>
        <li>Revenue: ${financialData.revenue.toLocaleString()}</li>
        <li>Gross Profit: ${financialData.grossProfit.toLocaleString()}</li>
        <li>Net Income: ${financialData.netIncome.toLocaleString()}</li>
        <li>Total Assets: ${financialData.totalAssets.toLocaleString()}</li>
        <li>Total Liabilities: ${financialData.totalLiabilities.toLocaleString()}</li>
        <li>Cash: ${financialData.cash.toLocaleString()}</li>
        <li>Debt: ${financialData.debt.toLocaleString()}</li>
        <li>Operating Cash Flow: ${financialData.operatingCashFlow.toLocaleString()}</li>
        <li>Free Cash Flow: ${financialData.freeCashFlow.toLocaleString()}</li>
        <li>Latest Dividend: ${financialData.dividend}</li>
      </ul>
    </div>
  );
};

const App = () => {
  const [stockData, setStockData] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState('AAPL'); // Default symbol
  const [searchQuery, setSearchQuery] = useState('');

  const apiKey = 'q9j7zoVhisoovNS7dvEBmupVTJDAMVu7'; // Your API key

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        // Fetch historical stock prices for the past 12 months using axios
        const stockResponse = await axios.get(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=365&apikey=${apiKey}`);
        const stockPrices = stockResponse.data.historical;
        setStockData(stockPrices);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchFinancialData = async () => {
      try {
        // Fetch financial statements using axios
        const incomeStatement = await axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?apikey=${apiKey}`);
        const balanceSheet = await axios.get(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?apikey=${apiKey}`);
        const cashFlow = await axios.get(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?apikey=${apiKey}`);
        const dividends = await axios.get(`https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${apiKey}`);

        // Extract relevant data
        const latestIncomeStatement = incomeStatement.data[0];
        const latestBalanceSheet = balanceSheet.data[0];
        const latestCashFlow = cashFlow.data[0];
        const latestDividends = dividends.data[0];

        const data = {
          revenue: latestIncomeStatement.revenue,
          grossProfit: latestIncomeStatement.grossProfit,
          netIncome: latestIncomeStatement.netIncome,
          totalAssets: latestBalanceSheet.totalAssets,
          totalLiabilities: latestBalanceSheet.totalLiabilities,
          cash: latestBalanceSheet.cashAndCashEquivalents,
          debt: latestBalanceSheet.totalDebt,
          operatingCashFlow: latestCashFlow.operatingCashFlow,
          freeCashFlow: latestCashFlow.freeCashFlow,
          dividend: latestDividends ? latestDividends.dividends[0].amount : 'N/A',
        };

        setFinancialData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
    fetchFinancialData();
  }, [symbol, apiKey]);

  // Prepare data for the horizontal bar chart
  const chartData = {
    labels: stockData.map(entry => entry.date),
    datasets: [
      {
        label: 'Stock Price (USD)',
        data: stockData.map(entry => entry.close),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Chart options to switch to horizontal bar chart
  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        ticks: {
          maxTicksLimit: 5, // Limit the number of ticks to avoid clutter
        },
      },
    },
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSubmitSearch = (event) => {
    event.preventDefault();
    setSymbol(searchQuery.toUpperCase()); // Update symbol to search for the new stock
  };

  if (loading) return <p>Loading stock and financial data...</p>;
  if (error) return <p>Error fetching data: {error}</p>;

  return (
    <div>
      <h1>Stock Data and Financial Data</h1>

      {/* Search Bar */}
      <form onSubmit={handleSubmitSearch}>
        <input 
          type="text"
          placeholder="Enter stock symbol"
          value={searchQuery}
          onChange={handleSearch}
        />
        <button type="submit">Search</button>
      </form>

      {/* Render the FinancialData Component */}
      <FinancialData symbol={symbol} apiKey={apiKey} />

      <div>
        <h2>Stock Price Over the Last 12 Months</h2>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default App;
