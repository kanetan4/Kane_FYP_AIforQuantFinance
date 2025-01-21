import React, { useState } from "react";
import './dashboard.css';
import { Line } from "react-chartjs-2";
import { callOpenAI } from "../../api/openai";
import { backtestPortfolio } from "../../api/backtest";
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
  const [formData, setFormData] = useState({
    riskTolerance: "",
    investmentHorizon: "",
    financialGoals: "",
    startingCapital: "",
  });
  const [portfolioName, setPortfolioName] = useState<string | null>(null);
  const [portfolioPoints, setPortfolioPoints] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]); // For graph data

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAIRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const userInput = `Using principles of Modern Portfolio Theory (MPT), create a realistic and well-diversified investment portfolio tailored to my preferences. The portfolio should focus on maximizing returns for a given level of risk tolerance while considering asset classes such as equities, bonds, real estate, and alternative investments. 
      Please ensure the portfolio is in this exact format:
      1. A portfolio name.
      2. 5 key portfolio points including allocation percentages in this exact format (eg. Equities - 50%) from this list of invesmtnets ("Equities - US Large Cap, Equities - US Small Cap, Equities - International, Equities - Emerging Markets, Bonds - Aggregate, Bonds - Treasuries, Real Estate, Commodities - Gold, Commodities - Oil, Cryptocurrency - Bitcoin, Cash"), each with 2 subpoints exactly only (e.g., allocation percentages, real-world examples, or rebalancing strategies).
      3. Summary point which starts with the word "Summary".
      Details about me:
      - Risk tolerance: ${formData.riskTolerance}.
      - Investment horizon: ${formData.investmentHorizon} years.
      - Financial goals: "${formData.financialGoals}".
      - Starting capital: $${formData.startingCapital}.`;

    const messages = [
      { role: "system", content: "You are a financial investment assistant." },
      { role: "user", content: userInput },
    ];

    try {
      const response = await callOpenAI(messages);
      const aiResponse = response.choices[0].message.content;
      console.log("OpenAI response:", aiResponse);
      const parsedData = parseOpenAIResponse(aiResponse);
      setPortfolioName(parsedData.portfolioName);
      setPortfolioPoints(parsedData.portfolioPoints);
      setPortfolioData(parsedData.portfolioData);
      console.log(portfolioData);
  
      // Fetch historical performance for the portfolio
      const performance = await backtestPortfolio(portfolioData);
      console.log("walao");
      console.log("performance:",performance);
      setPerformanceData(performance);
  
    } catch (error) {
      console.error("Error fetching OpenAI response:", error);
    }
  };

  const assetClassToTicker = {
    "Equities - US Large Cap": "SPY",
    "Equities - US Small Cap": "IWM",
    "Equities - International": "VXUS",
    "Equities - Emerging Markets": "EEM",
    "Bonds - Aggregate": "AGG",
    "Bonds - Treasuries": "SHY",
    "Real Estate": "VNQ",
    "Commodities - Gold": "GLD",
    "Commodities - Oil": "USO",
    "Cryptocurrency - Bitcoin": "BITO",
    "Cash": "BIL",
  };

  const parseOpenAIResponse = (message: string) => {
    const lines = message.split("\n").filter((line) => line.trim() !== ""); // Split lines and remove empty ones
    let portfolioName = "";
    const portfolioPoints: { title: string; subpoints: string[] }[] = [];
    const portfolioData: { ticker: string; weight: number }[] = [];
  
    lines.forEach((line, index) => {
      // Extract portfolio name (assume it's the first line)
      line = line.replace(/\*/g, "").trim();

      if (index === 0) {
        portfolioName = line.trim();
      } else if (/^\d\./.test(line) || line.includes("Summary")) {
        // Match format "1. **Equities - US Large Cap - 40%**"
        const match = line.match(/^(\d\.\s*)([a-zA-Z\s\-]+)\s*-\s*(\d+)%$/);
        if (match) {
          const assetClass = match[2].trim(); // Extract asset class
          const weight = parseFloat(match[3]) / 100; // Convert percentage to decimal
  
          // Map asset class to ticker
          const ticker = assetClassToTicker[assetClass];
          if (ticker) {
            portfolioData.push({ ticker, weight });
          } else {
            console.warn(`No ticker found for asset class: ${assetClass}`);
          }
  
          // Add the point to portfolioPoints
        }
        portfolioPoints.push({ title: line.trim(), subpoints: [] });
      } else {
        // Extract subpoints (e.g., "- Allocate 60% to SPY")
        portfolioPoints[portfolioPoints.length - 1].subpoints.push(line.trim());
      }
    });
  
    console.log("Portfolio Name:", portfolioName);
    console.log("Portfolio Data:", portfolioData);
    console.log("Portfolio Points:", portfolioPoints);
  
    return { portfolioName, portfolioData, portfolioPoints };
  };

  const chartData = performanceData.length
    ? {
        labels: performanceData.map((item) => item.date), // X-axis labels (dates)
        datasets: [
          {
            label: "Portfolio Performance",
            data: performanceData.map((item) => item.value), // Y-axis data (portfolio value)
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.2)",
          },
        ],
      }
    : null;
  

  return (
    <>
      <div>
        <form onSubmit={handleOpenAIRequest} className="investment-form">
          <h2 className="form-title">Investment Preferences</h2>
          
          <div className="form-group">
            <label htmlFor="riskTolerance" className="form-label">Risk Tolerance</label>
            <select
              name="riskTolerance"
              id="riskTolerance"
              value={formData.riskTolerance}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select Risk Tolerance</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="investmentHorizon" className="form-label">Investment Horizon (Years)</label>
            <input
              type="number"
              name="investmentHorizon"
              id="investmentHorizon"
              value={formData.investmentHorizon}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="financialGoals" className="form-label">Financial Goals</label>
            <textarea
              name="financialGoals"
              id="financialGoals"
              value={formData.financialGoals}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Enter your financial goals"
              rows={4}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="startingCapital" className="form-label">Starting Capital (USD)</label>
            <input
              type="number"
              name="startingCapital"
              id="startingCapital"
              value={formData.startingCapital}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 10000"
              required
            />
          </div>

          <button type="submit" className="form-submit-button">
            Submit
          </button>
        </form>
        
        { portfolioData && (
          <div className="portfolio-output">
            <ul>
              {portfolioData.map((asset, index) => (
                <li key={index}>
                {asset.ticker} - {asset.weight * 100}%
              </li>
              ))}
            </ul>
          </div>
        )}

        {portfolioPoints && (
          <div className="response-output">
            {portfolioName && (
              <div>
                <h3>{portfolioName}</h3>
              </div>
            )}
            {chartData && (
              <div className="chart-container">
                <h3>Portfolio Performance</h3>
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
              {portfolioPoints.map((point, index) => (
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
    </>
  );
};

export default Dashboard;
