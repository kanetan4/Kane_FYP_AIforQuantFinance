import React, { useState, useEffect } from "react";
import "./dashboard.css"
import { useAuth } from "../../context/AuthContext"
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { Line } from "react-chartjs-2";
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
  const { user, userData, loading, logout } = useAuth();

  useEffect(() => {
    if (!user) return; // Ensure user is logged in

    const fetchPortfolio = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log(userData.portfolio);
          setPortfolioName(userData.portfolio.name || "My Portfolio");
          setPortfolioPoints(userData.portfolio.points || []);
          setChartData(userData.portfolio.chart || null);
        } else {
          console.error("No portfolio data found for this user.");
        }
      } catch (error) {
        console.error("Error fetching portfolio data:", error);
      } finally {
        console.log("final");
      }
    };

    fetchPortfolio();
  }, [user]);

  return (
    <div>
        {portfolioPoints && (
            <div className="response-output">
            {portfolioName && ( <div> <h3>{portfolioName}</h3> </div> )}
            {chartData && (
                <div className="chart-container">
                <Line
                    key={JSON.stringify(chartData)} // Use unique key to force re-render
                    data={chartData}
                    options={{
                    responsive: false,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                        display: true,
                        position: "top",
                        },
                    },
                    }}
                />
                </div>
            )}
            <ul className="portfolio-list">
                {portfolioPoints.map((point:{title:string; subpoints:string[]}, index) => (
                <li key={index} className="portfolio-item">
                    <h4 className="portfolio-title">{point.title}</h4>
                    <ul className="portfolio-subpoints">
                    {point.subpoints.map((subpoint, subIndex) => (
                        <div key={subIndex} className="portfolio-subpoint">
                        {subpoint}
                        </div>
                    ))}
                    </ul>
                </li>
                ))}
            </ul>
            </div>
        )}
    </div>
  )
}

export default Dashboard