import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FinancialData = ({ symbol, apiKey }) => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch financial statements
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

export default FinancialData;
