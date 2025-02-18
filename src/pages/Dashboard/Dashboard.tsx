import React, { useState } from "react";
import './dashboard.css';
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
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig"; // Adjust path if necessary
import Modal from "./Modal";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Title);

const Dashboard: React.FC = () => {
  const [formData, setFormData] = useState({
    riskTolerance: "",
    investmentHorizon: "",
    financialGoals: "",
    startingCapital: "",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<any | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAIRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userInput = `Using principles of Modern Portfolio Theory (MPT), create a realistic and well-diversified investment portfolio tailored to my preferences. The portfolio should focus on maximizing returns for a given level of risk tolerance while considering asset classes such as equities, bonds, real estate, and alternative investments. 
      Please ensure the portfolio is in this exact format:
      - A portfolio name.
      - 5 key portfolio points including allocation percentages in this exact format numbered 1-5 (eg. Equities - 50%) from this list of invesmtnets ("Equities - US Large Cap, Equities - US Small Cap, Equities - International, Equities - Emerging Markets, Bonds - Aggregate, Bonds - Treasuries, Real Estate, Commodities - Gold, Commodities - Oil, Cryptocurrency - Bitcoin, Cash"), each with 2 subpoints exactly only (e.g., allocation percentages, real-world examples, or rebalancing strategies).
      - Summary point which starts with the word "Summary".
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
  
      // Fetch historical performance for the portfolio
      console.log("PORTFOLIO DATA HEREE  ",parsedData.portfolioData)
      const performance = await retryBacktestPortfolio(parsedData.portfolioData);
      console.log("performance:",performance);

      const chartData = performance.length
        ? {
            labels: performance.map((item) => item.date), // X-axis labels (dates)
            datasets: [
              {
                label: "Portfolio Performance (Starting with $10000)",
                data: performance.map((item) => item.value), // Y-axis data (portfolio value)
                borderColor: "rgba(75,192,192,1)",
                backgroundColor: "rgba(75,192,192,0.2)",
              },
            ],
          }
        : null;
      
      setGeneratedPortfolio({
        portfolioName: parsedData.portfolioName,
        portfolioData: parsedData.portfolioData,
        portfolioPoints: parsedData.portfolioPoints,
        chartData: chartData,
      });

      setShowModal(true);
      // savePortfolioToFirestore(parsedData.portfolioName, parsedData.portfolioData, parsedData.portfolioPoints, chartData);
    } catch (error) {
      console.error("Error fetching OpenAI response:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePortfolioToFirestore = async (
    portfolioName: string,
    portfolioData: { ticker: string; weight: number }[],
    portfolioPoints: { title: string; subpoints: string[] }[],
    chartData: any
  ) => {
    const user = auth.currentUser; // Get the currently logged-in user
  
    if (!user) {
      console.error("No authenticated user found.");
      return;
    }
  
    try {
      // Reference to the user's document in Firestore
      const userRef = doc(db, "users", user.uid);
  
      // Save portfolio data under the user's Firestore document
      await setDoc(
        userRef,
        {
          portfolio: {
            name: portfolioName,
            data: portfolioData,
            points: portfolioPoints,
            chart: chartData,
            timestamp: new Date(), // Save timestamp for tracking
          },
        },
        { merge: true } // Prevents overwriting existing user data
      );
  
      console.log("Portfolio successfully saved to Firestore.");
    } catch (error) {
      console.error("Error saving portfolio to Firestore:", error);
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

  const retryBacktestPortfolio = async (portfolio, maxRetries = 5) => {
    let attempts = 0;
    let performanceData = null;

    while (attempts < maxRetries) {
        try {
            performanceData = await backtestPortfolio(portfolio);
            if (performanceData && performanceData.length > 0) {
                return performanceData; // Successful fetch
            }
        } catch (error) {
            console.error(`Backtest failed (attempt ${attempts + 1}):`, error);
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    }

    throw new Error("Backtest failed after maximum retries.");
  };


  const parseOpenAIResponse = (message: string) => {
    const lines = message.split("\n").filter((line) => line.trim() !== ""); // Split lines and remove empty ones
    let portfolioName = "";
    const portfolioPoints: { title: string; subpoints: string[] }[] = [];
    const portfolioData: { ticker: string; weight: number }[] = [];
  
    lines.forEach((line, index) => {
      line = line.replace(/[*#]/g, "").trim();

      if (index === 0) {
        portfolioName = line.trim();
      } else if (/^\d\./.test(line) || line.includes("Summary")) {
        const match = line.match(/^(\d\.\s*)([a-zA-Z\s\-]+)\s*-\s*(\d+)%$/);
        if (match) {
          const assetClass = match[2].trim(); // Extract asset class
          const weight = parseFloat(match[3]) / 100; // Convert percentage to decimal
  
          const ticker = assetClassToTicker[assetClass];
          if (ticker) {
            portfolioData.push({ ticker, weight });
          } else {
            console.warn(`No ticker found for asset class: ${assetClass}`);
          }
        }
        portfolioPoints.push({ title: line.trim(), subpoints: [] });
      } else {
        portfolioPoints[portfolioPoints.length - 1].subpoints.push(line.trim());
      }
    });
  
    console.log("Portfolio Name:", portfolioName);
    console.log("Portfolio Data:", portfolioData);
    console.log("Portfolio Points:", portfolioPoints);
  
    return { portfolioName, portfolioData, portfolioPoints };
  };

  const rejectPortfolio = () => {
    setShowModal(false);
    setGeneratedPortfolio(null);
    setFormData({
      riskTolerance: "",
      investmentHorizon: "",
      financialGoals: "",
      startingCapital: "",
    });
  };

  const acceptPortfolio = () => {
    setShowModal(false);
    savePortfolioToFirestore(generatedPortfolio.portfolioName, generatedPortfolio.portfolioData, generatedPortfolio.portfolioPoints, generatedPortfolio.chartData);
  }

  return (
    <>
      <div>
        {loading && (
          <div className="modal">
            <div className="modal-content">
              <div className="loader"></div>
              <div className="modal-text">Generating Portfolio and Backtesting...</div>
            </div>
          </div>
        )}
        

        <Modal
          isOpen={showModal}
          onClose={rejectPortfolio}
          onConfirm={acceptPortfolio}
          portfolio={generatedPortfolio}
        />    
      

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
      </div>
    </>
  );
};

export default Dashboard;
