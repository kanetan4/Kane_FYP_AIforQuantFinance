import axios from "axios";

export const backtestPortfolio = async (portfolio: { ticker: string; weight: number }[]) => {
  console.log("backtesting", portfolio);
  const historicalData: Record<string, any[]> = {};

  const apiKey = import.meta.env.VITE_ALPHAVANTAGE_API_KEY;
  console.log(apiKey);

  for (const asset of portfolio) {
    const response = await axios.get(
      `https://www.alphavantage.co/query`, 
      {
        params: {
          function: "TIME_SERIES_MONTHLY",
          symbol: asset.ticker,
          apikey: apiKey
        }
      }
    );
    console.log("response", response);
    const timeSeries = response.data["Monthly Time Series"];
    historicalData[asset.ticker] = Object.entries(timeSeries).map(([date, data]) => ({
      date,
      price: parseFloat(data["4. close"]),
    }));
  }
  console.log("historical shit",historicalData);

  // Combine performance data based on weights
  const aggregatedPerformance = aggregatePerformance(historicalData, portfolio);

  return aggregatedPerformance;
};

// Utility function to aggregate performance based on weights
const aggregatePerformance = (
  data: Record<string, any[]>, 
  portfolio: { ticker: string; weight: number }[]
) => {
  const combined: Record<string, number> = {};
  const sortedDates = new Set<string>();

  // Collect all unique dates
  Object.keys(data).forEach((ticker) => {
    data[ticker].forEach((entry) => sortedDates.add(entry.date));
  });

  // Sort dates in ascending order
  const sortedDateArray = Array.from(sortedDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  let initialInvestment = 10000; // Start with $10,000
  let previousValue = 0;

  sortedDateArray.forEach((date, index) => {
    let portfolioValue = 0;

    // Calculate portfolio value based on asset weights
    Object.keys(data).forEach((ticker) => {
      const assetData = data[ticker].find((entry) => entry.date === date);
      if (assetData) {
        const weight = portfolio.find((p) => p.ticker === ticker)?.weight || 0;
        portfolioValue += assetData.price * weight;
      }
    });

    if (index === 0) {
      // Normalize first value to initial investment
      previousValue = portfolioValue;
      combined[date] = initialInvestment;
    } else {
      // Calculate investment growth based on portfolio percentage change
      const growthFactor = portfolioValue / previousValue;
      initialInvestment *= growthFactor; // Apply growth
      combined[date] = initialInvestment;
      previousValue = portfolioValue;
    }
  });

  return Object.entries(combined)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
