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
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<{ ticker: string; weight: number }[] | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]); // For graph data
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAIRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // const userInput = `Please provide a concrete investment plan in 5 point form with 2 subpointers each and less than 250 words along with a concrete plan, do not use headers so there wont be stars in the text. I am a user looking to invest. My risk tolerance is ${formData.riskTolerance}, my investment horizon is ${formData.investmentHorizon} years, my financial goals are "${formData.financialGoals}", and I have a starting capital of $${formData.startingCapital}.`;
    const userInput = `Using principles of Modern Portfolio Theory (MPT), create a realistic and well-diversified investment portfolio tailored to my preferences. The portfolio should focus on maximizing returns for a given level of risk tolerance while considering asset classes such as equities, bonds, real estate, and alternative investments. 
      Please ensure the portfolio is in this exact format:
      1. A portfolio name.
      2. 5 key portfolio points including allocation percentages, each with 2 subpoints exactly only (e.g., allocation percentages, real-world examples, or rebalancing strategies).
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

      setResponseMessage(aiResponse); // Set the response message to display below the form
      const portfolioData = [
        { ticker: "SPY", weight: 0.6 }, // Example: 60% equities
        { ticker: "AGG", weight: 0.3 }, // Example: 30% bonds
        { ticker: "VNQ", weight: 0.1 }, // Example: 10% real estate
      ];
      setPortfolio(portfolioData);
  
      // Fetch historical performance for the portfolio
      const performance = await backtestPortfolio(portfolioData);
      setPerformanceData(performance);
  
      setLoading(false);

    } catch (error) {
      console.error("Error fetching OpenAI response:", error);
      setResponseMessage("There was an error fetching the response. Please try again.");
      setLoading(false);
    }
  };

  const parseOpenAIResponse = (message: string): {
    portfolioName: string;
    portfolioData: { assetClass: string; weight: number }[];
  } => {
    const lines = message.split("\n").filter((line) => line.trim() !== ""); // Remove empty lines
    let portfolioName = "";
    const portfolioData: { assetClass: string; weight: number }[] = [];
  
    lines.forEach((line, index) => {
      // Extract portfolio name (assume it's the first line)
      if (index === 0) {
        portfolioName = line.trim();
      } else if (/^\d\./.test(line)) {
        // Match asset class (e.g., "Equities: 50%")
        const assetMatch = line.match(/^(\d\.\s*)([a-zA-Z\s]+):\s*(\d+)%/);
        if (assetMatch) {
          const assetClass = assetMatch[2].trim();
          const weight = parseFloat(assetMatch[3]) / 100; // Convert percentage to decimal
          portfolioData.push({ assetClass, weight });
        }
      }
    });
  
    return { portfolioName, portfolioData };
  };

  const parseResponseMessage = (message: string): string[] => {
    return message
      .split("\n") // Split the response into lines
      .filter((line) => line.trim() !== "") // Remove empty lines
      .map((line) => {
        // Remove the ** from headers
        if (line.startsWith("**") && line.endsWith("**")) {
          return line.slice(2, -2).trim(); // Remove the ** and trim
        }
        return line.trim(); // Just trim other lines
      });
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

        {portfolioName && (
          <div>
            <h2>{portfolioName} test</h2>
            <ul>
              {portfolioPoints.map((point, index) => (
                <li key={index}>
                  <strong>{point.title}</strong>
                  <ul>
                    {point.subpoints.map((subpoint, idx) => (
                      <li key={idx}>{subpoint}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
        {portfolioData.length > 0 && (
          <div>
            <h3>Portfolio Allocation</h3>
            <Line
              data={{
                labels: portfolioData.map((item) => item.ticker),
                datasets: [
                  {
                    label: "Allocation (%)",
                    data: portfolioData.map((item) => item.weight * 100), // Convert back to percentage
                    backgroundColor: "rgba(75,192,192,0.2)",
                    borderColor: "rgba(75,192,192,1)",
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </div>
        )}

        {portfolio && (
          <div className="portfolio-output">
            <h3>Generated Portfolio</h3>
            <ul>
              {portfolio.map((asset, index) => (
                <li key={index}>
                  {asset.ticker} - {asset.weight * 100}%
                </li>
              ))}
            </ul>
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

        {responseMessage && (
          <div className="response-output">
            <h3>Personalized investment plan</h3>
            <ul className="response-list">
              {parseResponseMessage(responseMessage).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
