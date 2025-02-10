import React, { useState } from "react";
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb";
import "./alerts.css";
import { db } from "./firebaseConfig"; // Adjust the import path based on your setup
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
//   const [error, setError] = useState<string | null>(null);

  const fetchFinancialNews = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:3002/api/getnews", {
        method: "POST", // Use POST instead of GET
        headers: {
          "Content-Type": "application/json", // Ensure JSON content type
        },
        body: JSON.stringify({ keywords: ["tech", "finance"] }), // Send keywords in the request body
      });

      if (!response.ok) {
        throw new Error("Failed to fetch financial news.");
      }

      const data = await response.json();
      setAlerts(data.summary); 
    } catch (error) {
      console.error("Error fetching financial news:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNews = (alerts) => {
    if (!alerts || typeof alerts !== "string") {
      return { header: "No news available", articles: [] };
    }
  
    // Extract header (first occurrence of [YYYY-MM-DD])
    const headerMatch = alerts.match(/\[\d{4}-\d{2}-\d{2}\].*/);
    const header = headerMatch ? headerMatch[0] : "No header found";
  
    // Remove header from the text safely
    const bodyText = headerMatch ? alerts.replace(header, "").trim() : alerts.trim();
  
    // Split the text into articles using numbered points (1., 2., etc.)
    const articles = bodyText.split(/\s*\d+\.\s+/).filter(Boolean);
  
    // Format the articles into structured objects
    const formattedArticles = articles.map((article) => {
      // Extract the topic (first sentence before the first newline)
      const [topic, ...rest] = article.split("\n");
      return {
        topic: topic.trim(),
        article: rest.length > 0 ? rest.join(" ").trim() : topic.trim(),
      };
    });
  
    return { header, articles: formattedArticles };
  };
  
  
  // // Example usage
  const formattedAlerts = formatNews(alerts);
  

  const handleFetchRecommendations = () => {
    setLoading(true);
    setTimeout(() => {
      setRecommendations([
        "Invest in blue-chip stocks like Apple and Microsoft for stable returns.",
        "Consider adding more to your bond portfolio to balance risk.",
      ]);
      setLoading(false);
    }, 2000);
  };

  return (
    <>
      <Breadcrumb pageName="Alerts" />

      <div className="alerts-container">
        <h1 className="alerts-title">Financial Alerts</h1>

        <section className="alerts-section">
          <button className="fetch-button" onClick={fetchFinancialNews} disabled={loading}>
            {loading ? "Fetching Alerts..." : "Fetch Financial Alerts"}
          </button>

          {loading ? "Fetching News..." : "Fetch News"}
          
        </section>

        <div className="news-container">
          <div className="news-header">{formattedAlerts.header}</div>
          {formattedAlerts.articles.map((item, index) => (
            <div key={index} className="news-item">
              <div className="news-topic">
                {index + 1}. {item.topic}
              </div>
              <div className="news-article">{item.article}</div>
            </div>
          ))}
        </div>

        <section className="recommendations-section">
          <h2 className="section-title">Personalised Recommendations</h2>
          <button className="fetch-button" onClick={handleFetchRecommendations} disabled={loading}>
            {loading ? "Fetching Recommendations..." : "Get Recommendations"}
          </button>
          {recommendations && (
            <ul className="recommendations-list">
              {recommendations.map((rec, index) => (
                <li key={index} className="recommendation-item">
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default Alerts;
