import React, { useState, useEffect } from "react";
import { db, auth } from "../../../firebaseConfig";
import { collection, doc, setDoc, query, orderBy, limit, getDocs, getDoc } from "firebase/firestore";
import "./recommendations.css";
import { callOpenAI } from "../../api/openai";

interface RiskMetricProps {
  history: { timestamp: string; value: number }[];
  startValue: number;
}

export interface RiskMetricResult {
  metric: number;
  insight: string;
}

// 📊 Volatility Metric and Insight
const calculateVolatility = (history: RiskMetricProps["history"]): RiskMetricResult => {
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
const calculateVaR = (history: RiskMetricProps["history"], startValue: number): RiskMetricResult => {
  const volatility = calculateVolatility(history).metric / 100;
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
const calculateMaxDrawdown = (history: RiskMetricProps["history"]): RiskMetricResult => {
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

interface NewsArticle {
  topic: string;
  article: string;
}

interface NewsData {
  date: string;
  header: string;
  articles: NewsArticle[];
}

interface PortfolioHolding {
    ticker: string;
    quantity: number;
    value: number;
    startvalue: number;
    target: string;
}

interface RiskMetricProps {
    history: { timestamp: string; value: number }[];
    startValue: number;
  }

const Recommendations: React.FC = () => {
  const [news, setNews] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [riskMetric, setRiskMetric] = useState<RiskMetricProps | undefined>();

  // 📊 Fetch Portfolio Data from Firestore
  useEffect(() => {
    const fetchPortfolioFromFirestore = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const portfolioData = userData?.portfolio?.data || [];
        const riskMetricData: RiskMetricProps = {
            history: userData?.portfolio?.history || [],
            startValue: userData?.portfolio?.currentValue || 0,
        };
        setPortfolio(portfolioData);
        setRiskMetric(riskMetricData);
      } else {
        console.log("No portfolio data found.");
      }
    };

    fetchPortfolioFromFirestore();
  }, []);
  
  useEffect(() => {
    const fetchNewsFromFirestore = async () => {
      setLoading(true);
      try {
        const newsRef = collection(db, "news");
        const q = query(newsRef, orderBy("date", "desc"), limit(1)); // Get the latest news
        const querySnapshot = await getDocs(q);

        const today = new Date().toISOString().split("T")[0];

        if (!querySnapshot.empty) {
          const latestNews = querySnapshot.docs[0].data() as NewsData;

          // Check if today's news is available
          if (latestNews.date === today) {
            setNews(latestNews);
            console.log("News from Firestore:", latestNews);
          } else {
            console.log("No news for today in Firestore. Fetching from API...");
            fetchFinancialNews();
          }
        } else {
          console.log("No news found in Firestore. Fetching from API...");
          fetchFinancialNews();
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      }
      setLoading(false);
    };

    fetchNewsFromFirestore();
  }, []);

  // 📊 Fetch Financial News from API
  const fetchFinancialNews = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:3002/api/getnews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: ["tech", "finance"] }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch financial news.");
      }

      const data = await response.json();
      const formattedNews = formatNews(data.summary);
      setNews(formattedNews);
      saveNewsToFirestore(formattedNews);
    } catch (error) {
      console.error("Error fetching financial news:", error);
    } finally {
      setLoading(false);
    }
  };

  // 📊 Format News
  const formatNews = (alerts: string) => {
    if (!alerts || typeof alerts !== "string") {
      return { date: "", header: "No news available", articles: [] };
    }

    const headerMatch = alerts.match(/\[\d{4}-\d{2}-\d{2}\].*/);
    const header = headerMatch ? headerMatch[0] : "No header found";
    const bodyText = headerMatch ? alerts.replace(header, "").trim() : alerts.trim();
    const articles = bodyText.split(/\s*\d+\.\s+/).filter(Boolean);

    const formattedArticles = articles.map((article) => {
      const [topic, ...rest] = article.split("\n");
      return {
        topic: topic.trim(),
        article: rest.length > 0 ? rest.join(" ").trim() : topic.trim(),
      };
    });

    const today = new Date().toISOString().split("T")[0];
    return { date: today, header, articles: formattedArticles };
  };

  // 📊 Save News to Firestore
  const saveNewsToFirestore = async (newsData: NewsData) => {
    const today = new Date().toISOString().split("T")[0];
    try {
      await setDoc(doc(db, "news", today), newsData);
      console.log("News successfully saved to Firestore!");
    } catch (error) {
      console.error("Error saving news to Firestore:", error);
    }
  };

   // 📊 Generate Actionable Insights with OpenAI
   const generateActionableInsights = async () => {
    if (!news || !portfolio ) return;

    // Define the riskProps object properly
    const riskProps = riskMetric
        ? {
            history: riskMetric.history,
            startValue: riskMetric.startValue,
        }
        : {
            history: [],         // Default empty array if riskMetric is undefined
            startValue: 0,       // Default start value if riskMetric is undefined
    };

    // Calculate risk metrics with type assertion
    const volatility = (calculateVolatility(riskProps.history) as RiskMetricResult)?.metric ?? 0;
    const var95 = (calculateVaR(riskProps.history, riskProps.startValue) as RiskMetricResult)?.metric ?? 0;
    const maxDrawdown = (calculateMaxDrawdown(riskProps.history) as RiskMetricResult)?.metric ?? 0;



    // const userInput = `Based on the following data, provide 3 actionable investment recommendations:
    // - Risk Analysis:
    //   - Volatility: ${volatility}%
    //   - Value at Risk (95% confidence): ${var95}%
    //   - Max Drawdown: ${maxDrawdown}%
    // - Portfolio Holdings:
    //   ${portfolio.map((holding) => 
    //     `- ${holding.ticker}: ${holding.quantity} shares, 
    //     Current Value: $${holding.value.toFixed(2)}, 
    //     Targeted Allocation: ${holding.target}`).join("\n")}
    // - News of the Day: 
    //   ${news.articles.map((article) => `- ${article.topic}: ${article.article}`).join("\n")}
    // Recommendations should focus on observing the market and news, risk management, potential gains, and asset allocation strategies. 
    // Each recommendation should be a short and actionable sentence.`;
    
    const userInput = `Based on the following data, provide 3 actionable rebalancing recommendations using the Constant Mix Rebalancing strategy in just 3 points with no other content. 
                       This strategy aims to rebalance the portfolio to its target asset allocations by adjusting the weights back to their 
                       predefined levels, ensuring the portfolio stays aligned with the target composition while respecting tolerance ranges 
                       for each asset class.
    - Risk Analysis:
        - Volatility: ${volatility}%
        - Value at Risk (95% confidence): ${var95}%
        - Max Drawdown: ${maxDrawdown}%

    - Portfolio Holdings:
        ${portfolio.map((holding) => 
          `- ${holding.ticker}: ${holding.quantity} shares, 
           Current Value: $${holding.value.toFixed(2)}, 
           Targeted Allocation: ${holding.target}`).join("\n")}
      
    - News of the Day:
        ${news.articles.map((article) => `- ${article.topic}: ${article.article}`).join("\n")}

     Instructions for Rebalancing Strategy:

    1. Focus on rebalancing the portfolio back to the target weights for each asset class, staying within the specified tolerance ranges.
    2. For each asset class, adjust the quantities or allocation percentages to re-align with the target, ensuring that the changes respect 
       the tolerance range of 10%.
    3. Factor in current market conditions (such as news articles) and how they might impact specific asset classes.
    4. Provide short, actionable sentences for each recommendation, ensuring that the strategy is aligned with the portfolio's overall risk 
       tolerance, financial goals, and the latest news insights.`;

    const messages = [
      { role: "system", content: "You are a financial investment assistant." },
      { role: "user", content: userInput },
    ];

    setLoading(true);
    try {
      const response = await callOpenAI(messages);
      const aiResponse = response.choices[0].message.content.trim().split("\n").filter(Boolean);
      setRecommendations(aiResponse);
    } catch (error) {
      console.error("Error fetching recommendations from OpenAI:", error);
    } finally {
      setLoading(false);
    }
  };

  // 📊 Call Generate Recommendations when Data is Ready
  useEffect(() => {
    if (news && portfolio) generateActionableInsights();
  }, [news, portfolio]);

  const removeAsterisks = (text: string) => text.replace(/\*/g, "");


  return (
    <div className="recommendations-container">
      {/* <h2 className="text-lg font-bold mb-2">Latest News</h2> */}
      {loading ? (
        <div>Loading latest news...</div>
      ) : news ? (
        <div className="news-container">
          <div className="news-header">{news.header}</div>
          {news.articles.map((item, index) => (
            <div key={index} className="news-item">
              <div className="news-topic">
                {index + 1}. {item.topic}
              </div>
              <div className="news-article">{item.article}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>No news available.</div>
      )}

    <section className="recommendations-section">
        <h3 className="news-header">
            Personalised Recommendations
        </h3>
        {recommendations ? (
            <ul className="recommendations-list">
            {recommendations.map((rec, index) => (
              <li
                key={index}
                className="recommendation-item"
              >
                {removeAsterisks(rec)} {/* Cleaned text without asterisks */}
              </li>
            ))}
            </ul>
        ) : (
            <div className="text-sm text-gray-600 dark:text-gray-300">
            No recommendations available yet.
            </div>
        )}
    </section>


    </div>
  );
};

export default Recommendations;
