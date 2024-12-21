import React, { useState } from "react";
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb";
import "./alerts.css";

const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
//   const [error, setError] = useState<string | null>(null);

  const fetchFinancialNews = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/news");
      if (!response.ok) {
        throw new Error("Failed to fetch financial news.");
      }
      const data = await response.json();
      setAlerts(data); // Update alerts state with the fetched news
    } catch (error) {
      console.error("Error fetching financial news:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRecommendations = () => {
    // Simulated recommendations for now
    setLoading(true);
    setTimeout(() => {
      setRecommendations([
        "Invest in blue-chip stocks like Apple and Microsoft for stable returns.",
        "Consider adding more to your bond portfolio to balance risk.",
      ]);
      setLoading(false);
    }, 2000);
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/news");
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Alerts" />

      <div className="alerts-container">
        <h1 className="alerts-title">Financial Alerts</h1>

        {/* Fetch News Button */}
        <section className="alerts-section">
          <h2 className="section-title">Real-Time Alerts</h2>
          <button className="fetch-button" onClick={fetchFinancialNews} disabled={loading}>
            {loading ? "Fetching Alerts..." : "Fetch Financial Alerts"}
          </button>

          {/* Display Loading or Error */}
          {loading ? "Fetching News..." : "Fetch News"}

          {/* Display Alerts */}
          {!loading && alerts.length > 0 && (
            <ul className="alerts-list">
              {alerts.map((alert, index) => (
                <li key={index} className={`alert-item alert-${alert.sentiment.toLowerCase()}`}>
                  <h3 className="alert-title">{alert.title}</h3>
                  <a
                    href={alert.link}
                    className="alert-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read More
                  </a>
                  <span className={`alert-sentiment sentiment-${alert.sentiment.toLowerCase()}`}>
                    {alert.sentiment}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recommendations Section */}
        <section className="recommendations-section">
          <h2 className="section-title">AI-Driven Recommendations</h2>
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
