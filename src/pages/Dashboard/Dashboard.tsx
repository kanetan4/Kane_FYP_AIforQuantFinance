import React, { useState, useEffect } from "react";
import "./dashboard.css"
import { useAuth } from "../../context/AuthContext"
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Line } from "react-chartjs-2";
import PortfolioTable from "./PortfolioTable"
import RiskMetric from "./RiskMetric"
import Reccomendations from "./Recommendations"
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
  const [timeRange, setTimeRange] = useState<'1d' | '1w' | '1m' | '1y'>('1w');
  const [historicalChartData, setHistoricalChartData] = useState<any>(null);
  const [chartOptions, setChartOptions] = useState<any>(null);
  const { user } = useAuth();

  const calculateMinMax = (data: { timestamp: string; value: number }[]) => {
    const values = data.map(item => item.value);
    return { min: Math.min(...values), max: Math.max(...values) };
  };

  // Effect to update the chart data and handle filtering and zooming
  useEffect(() => {
    const filteredData = filterDataByRange(timeRange);

    const chartData = {
      labels: filteredData.map((entry) => new Date(entry.timestamp).toLocaleDateString()), // X-axis: Dates
      datasets: [
        {
          label: "Portfolio Value",
          data: filteredData.map((entry) => entry.value), // Y-axis: Portfolio Value
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

    // Set chart options with dynamic min/max values
    const { min, max } = calculateMinMax(filteredData);
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "top" },
      },
      scales: {
        y: {
          min, // Dynamic zoom based on the filtered data
          max, // Dynamic zoom based on the filtered data
        },
      },
    };

    setHistoricalChartData(chartData);
    setChartOptions(chartOptions);
  }, [timeRange, history]);

  const filterDataByRange = (range: string) => {
    const currentDate = new Date();
    let filteredData = [...history];

    if (range === '1d') {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.timestamp);
        const diff = (currentDate.getTime() - itemDate.getTime()) / (1000 * 3600 * 24); // Difference in days
        return diff <= 1;
      });
    } else if (range === '1w') {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.timestamp);
        const diff = (currentDate.getTime() - itemDate.getTime()) / (1000 * 3600 * 24); // Difference in days
        return diff <= 7;
      });
    } else if (range === '1m') {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.timestamp);
        const diff = (currentDate.getTime() - itemDate.getTime()) / (1000 * 3600 * 24); // Difference in days
        return diff <= 30;
      });
    } else if (range === '1y') {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.timestamp);
        const diff = (currentDate.getTime() - itemDate.getTime()) / (1000 * 3600 * 24); // Difference in days
        return diff <= 365;
      });
    }

    return filteredData;
  };

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
        setHistory(currentPortfolio.history);
        setPortfolioHoldings(currentPortfolio.data);

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

  const calculateCurrentValue = (holdings: { ticker: string; quantity: number; value: number; startvalue: number }[]) => {
    if (holdings.length === 0) return 0;
    const totalValue = holdings.reduce((total, holding) => total + holding.quantity * holding.value, 0);
    return parseFloat(totalValue.toFixed(2));
  };

  const calculateCost = (holdings: { ticker: string; quantity: number; value: number; startvalue: number }[]) => {
    if (holdings.length === 0) return 0;
    const totalCost = holdings.reduce((total, holding) => total + holding.startvalue, 0);
    return parseFloat(totalCost.toFixed(2));
  };  
  

  return (
    <div>
      <div style={{marginBottom:'3rem'}}>
        <h2 className="text-lg font-bold mb-2">{portfolioName}</h2>
        <div>
          <div>
            Filter by:
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1d' | '1w' | '1m' | '1y')}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="1d">1 Day</option>
              <option value="1w">1 Week</option>
              <option value="1m">1 Month</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
        </div>
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
      
      <RiskMetric history={history} startValue={startValue} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        
      <p className="text-xl font-semibold">
        My Portfolio (USD) ${
          portfolioHoldings.length > 0 
            ? portfolioHoldings
                .reduce((total, holding) => total + holding.quantity * holding.value, 0)
                .toFixed(2)
            : "Loading..."
        }
      </p>


        {history?.[history.length - 1]?.value && (
          (() => {
            const currentValue = calculateCurrentValue(portfolioHoldings);
            const startValue = calculateCost(portfolioHoldings);
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
      <Reccomendations/>
    </div>
  )
}

export default Dashboard