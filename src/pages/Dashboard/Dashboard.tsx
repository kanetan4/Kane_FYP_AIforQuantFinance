import React, { useState, useEffect } from "react";
import "./dashboard.css"
import { useAuth } from "../../context/AuthContext"
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Line } from "react-chartjs-2";
import { ChartDataset } from "chart.js";
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
  const [portfolioPoints, setPortfolioPoints] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any | null>(null);
  const [history, setHistory] = useState<{ timestamp: string; value: number }[]>([]);
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

        // 2️⃣ Merge New History with Existing History
        const newHistory = [...(currentPortfolio.history || []), ...portfolio_performance];

        // 3️⃣ Update Firestore with New Data
        await updateDoc(userRef, {
          "portfolio.data": updated_portfolio_data,  // Replace with updated stock values
          "portfolio.history": newHistory,  // Append new history
        });

        // 4️⃣ Update State
        setHistory(newHistory);
        setPortfolioName(currentPortfolio.name || "My Portfolio");
        setPortfolioPoints(currentPortfolio.points || []);
        setChartData(currentPortfolio.chart || null);
      } catch (error) {
        console.error("Error updating portfolio:", error);
      }
    };

    fetchAndUpdatePortfolio();
  }, [user]); // Runs when user logs in

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
       <div>
          <h2>Portfolio Performance</h2>
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
    </div>
  )
}

export default Dashboard