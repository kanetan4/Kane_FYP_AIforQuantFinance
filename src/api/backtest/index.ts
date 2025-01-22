import axios from "axios";

export const backtestPortfolio = async (portfolio: { ticker: string; weight: number }[]) => {
  const historicalData: Record<string, any[]> = {};

  const apiKey = import.meta.env.ALPHAVANTAGE_API_KEY;

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
    const timeSeries = response.data["Monthly Time Series"];
    historicalData[asset.ticker] = Object.entries(timeSeries).map(([date, data]) => ({
      date,
      price: parseFloat(data["4. close"]),
    }));
  }

  // Combine performance data based on weights
  const aggregatedPerformance = aggregatePerformance(historicalData, portfolio);

  return aggregatedPerformance;
};

// Utility function to aggregate performance based on weights
const aggregatePerformance = (data: Record<string, any[]>, portfolio: { ticker: string; weight: number }[]) => {
  const combined = {};

  Object.keys(data).forEach((ticker) => {
    data[ticker].forEach((entry) => {
      if (!combined[entry.date]) combined[entry.date] = 0;
      combined[entry.date] += entry.price * portfolio.find((p) => p.ticker === ticker)?.weight!;
    });
  });

  return Object.entries(combined)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
