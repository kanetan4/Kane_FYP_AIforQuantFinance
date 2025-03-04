import React, { useState, useEffect } from "react";
import "./dashboard.css"
import { useAuth } from "../../context/AuthContext"
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Line } from "react-chartjs-2";
import PortfolioTable from "./PortfolioTable"
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
    Tooltip,
    Legend,
  } from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Title);

const Dashboard: React.FC = () => {
  const [portfolioName, setPortfolioName] = useState<string | null>(null);
  const [history, setHistory] = useState<{ timestamp: string; value: number }[]>([]);
  const [portfolioHoldings, setPortfolioHoldings] = useState<{ ticker: string; quantity: number; value:number, startvalue:number}[]>([]);
  const [startValue, setStartValue] = useState<number | 0>(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Ensure user is logged in

    const fetchAndUpdatePortfolio = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.error("No portfolio data found for this user.");
          return;
        }

        const userData = userSnap.data();
        let currentPortfolio = userData.portfolio || {};

        console.log("Current Portfolio:", currentPortfolio);

        // 1️⃣ Make API Call to Update Portfolio History
        const response = await fetch("http://localhost:3002/api/retrieveportfoliohistory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portfolio: currentPortfolio }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const { portfolio_performance, updated_portfolio_data } = await response.json();
        console.log("Updated Portfolio Data:", updated_portfolio_data);
        console.log("New Portfolio Performance:", portfolio_performance);
        // console.log("HISTORY",history[history.length - 1].value)

        // 2️⃣ Merge New History with Existing History
        const newHistory = [...(currentPortfolio.history || []), ...portfolio_performance];

        // 3️⃣ Update Firestore with New Data
        await updateDoc(userRef, {
          "portfolio.data": updated_portfolio_data,  // Replace with updated stock values
          "portfolio.history": newHistory,  // Append new history
        });

        // 4️⃣ Update State
        setHistory(currentPortfolio.history);
        setStartValue(currentPortfolio.currentValue);
        setPortfolioName(currentPortfolio.name || "My Portfolio");
        setPortfolioHoldings(updated_portfolio_data || currentPortfolio.data);

      } catch (error) {
        console.error("Error updating portfolio:", error);
      }
    };

    fetchAndUpdatePortfolio();
  }, [user]); // Runs when user logs in

  // 📊 Volatility Metric and Insight
  const calculateVolatility = () => {
    const returns = history.slice(1).map((entry, i) => (entry.value - history[i].value) / history[i].value);
    const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = parseFloat((Math.sqrt(variance) * 100).toFixed(2));

    let insight = "";
    if (volatility > 20) {
      insight = "High volatility indicates high risk.";
    } else if (volatility < 10) {
      insight = "Low volatility indicates low risk.";
    } else {
      insight = "Moderate volatility suggests balanced risk.";
    }

    return { metric: volatility, insight };
  };

  // 📊 VaR Metric and Insight
  const calculateVaR = () => {
    const volatility = calculateVolatility().metric / 100;
    const zScore = 1.65; // 95% confidence
    const meanReturn = (history[history.length - 1]?.value - startValue) / startValue;
    const var95 = parseFloat((meanReturn - zScore * volatility).toFixed(2));

    let insight = "";
    if (var95 < -5) {
      insight = "High potential loss at 95% confidence level.";
    } else if (var95 > -2) {
      insight = "Low potential loss at 95% confidence level.";
    } else {
      insight = "Moderate potential loss at 95% confidence level.";
    }

    return { metric: var95, insight };
  };

  // 📊 Max Drawdown Metric and Insight
  const calculateMaxDrawdown = () => {
    let peak = -Infinity;
    let maxDrawdown = 0;
    history.forEach((entry) => {
      if (entry.value > peak) peak = entry.value;
      const drawdown = (peak - entry.value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    const maxDrawdownPercentage = parseFloat((maxDrawdown * 100).toFixed(2));

    let insight = "";
    if (maxDrawdownPercentage > 15) {
      insight = "Max drawdown suggests potential for large losses.";
    } else if (maxDrawdownPercentage < 5) {
      insight = "Low drawdown indicates limited historical losses.";
    } else {
      insight = "Moderate drawdown indicates manageable losses.";
    }

    return { metric: maxDrawdownPercentage, insight };
  };

  const historicalChartData = {
    labels: history.map((entry) => new Date(entry.timestamp).toLocaleDateString()), // X-axis: Dates
    datasets: [
      {
        label: "Portfolio Value",
        data: history.map((entry) => entry.value), // Y-axis: Portfolio Value
        borderColor: "rgba(54, 162, 235, 1)", // Blue line
        backgroundColor: "rgba(54, 162, 235, 0.2)", // Light fill color
        borderWidth: 2, // Thicker line
        pointRadius: 3, // Larger points
        pointBackgroundColor: "rgba(255, 99, 132, 1)", // Red points
        pointHoverRadius: 7, // Bigger hover effect
        tension: 0.4, // Smooth curves
      },
    ],
  };

  return (
    <div>
      <div style={{marginBottom:'3rem'}}>
        <h2 className="text-lg font-bold mb-2">{portfolioName}</h2>
          {history.length > 0 ? (
            <div className="chart-container">
              <Line
                className="line-chart"
                data={historicalChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: "top" },
                  },
                }}
              />
            </div>
          ) : (
            <p>Loading portfolio performance...</p>
          )}
      </div>

      <div className="mt-4" style={{marginBottom:'3rem'}}>
        <h3 className="text-xl font-semibold">Risk Analysis</h3>
        <ul className="mb-4">
          <li>Volatility: {calculateVolatility().metric}% — {calculateVolatility().insight}</li>
          <li>Max Drawdown: {calculateMaxDrawdown().metric}% — {calculateMaxDrawdown().insight}</li>
          <li>VaR (95% Confidence): {calculateVaR().metric}% — {calculateVaR().insight}</li>
        </ul>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        
        <p className="text-xl font-semibold">
          My Portfolio (USD) {history?.[history.length - 1]?.value ? `$${history[history.length - 1].value.toFixed(2)}` : "Loading..."}
        </p>

        {history?.[history.length - 1]?.value && (
          (() => {
            const currentValue = history[history.length - 1].value;
            const pnl = currentValue - startValue;
            const pnlPercentage = ((pnl / startValue) * 100).toFixed(2);
            const isProfit = pnl >= 0;

            return (
              <p className={`text-md font-semibold flex items-center ${isProfit ? "text-green-600" : "text-red-600"}`}>
                {isProfit ? (
                  <>
                    ▲ PnL: +${pnl.toFixed(2)} (+{pnlPercentage}%)
                  </>
                ) : (
                  <>
                    ▼ PnL: -${Math.abs(pnl).toFixed(2)} ({pnlPercentage}%)
                  </>
                )}
              </p>
            );
          })()
        )}
      </div>
      <PortfolioTable portfolioHoldings={portfolioHoldings}></PortfolioTable>
    </div>
  )
}

export default Dashboard