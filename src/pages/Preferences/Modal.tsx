import React from "react";
import "./modal.css"
import { Line } from "react-chartjs-2";

const Modal = ({ isOpen, onClose, onConfirm, portfolio }) => {
  if (!isOpen || !portfolio) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Generated Investment Portfolio</h3>
        <h4>{portfolio.portfolioName}</h4>

        {portfolio.chartData && (
            <div className="chart-container">
              <Line
                  className="line-chart"
                  key={JSON.stringify(portfolio.chartData)} // Use unique key to force re-render
                  data={{
                    ...portfolio.chartData,
                    datasets: portfolio.chartData.datasets.map((dataset) => ({
                      ...dataset,
                      borderColor: "rgba(54, 162, 235, 1)", // Blue line color
                      backgroundColor: "rgba(54, 162, 235, 0.2)", // Light fill color
                      borderWidth: 1, // Thicker line
                      pointRadius: 3, // Larger points
                      pointBackgroundColor: "rgba(255, 99, 132, 1)", // Red point color
                      pointHoverRadius: 7, // Bigger hover effect
                      tension: 0.4, // Smooth curves
                    })),
                  }}
                  style={{width:'500px', height:'250px'}}
                  options={{
                    responsive: false,
                    maintainAspectRatio: false,
                    // aspectRatio: 1,
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

        <ul>
          {portfolio.portfolioPoints.map((point, index) => (
            <li key={index}>
              <strong>{point.title}</strong>
              <ul>
                {point.subpoints.map((sub, subIndex) => (
                  <li key={subIndex}>{sub}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="modal-buttons">
          <button onClick={onConfirm} className="confirm-button">Accept</button>
          <button onClick={onClose} className="reject-button">Reject</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
