import "./modal.css"
import { Line } from "react-chartjs-2";
import { ChartDataset } from "chart.js";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  portfolio: any | null; // Ideally, replace `any` with a proper type
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, portfolio }) => {
  if (!isOpen || !portfolio) return null;
  console.log("chart data hereeee",portfolio.chartData);

  return (
    <div className="modal">
      <div className="modal-content">
        {/* <h3>Generated Investment Portfolio</h3> */}
        <h4>{portfolio.portfolioName}</h4>

        {portfolio.chartData && (
            <div className="chart-container">
              <Line
                  className="line-chart"
                  key={JSON.stringify(portfolio.chartData)} // Use unique key to force re-render
                  data={{
                    ...portfolio.chartData,
                    datasets: portfolio.chartData.datasets.map((dataset: ChartDataset<"line">) => ({
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
                  style={{width:'600px', height:'220px'}}
                  options={{
                    responsive: false,
                    maintainAspectRatio: false,
                    // aspectRatio: 1,
                    plugins: {
                        legend: {
                        display: false,
                        position: "top",
                        },
                    },
                    scales: {
                      x: {
                        ticks: {
                          font: {
                            size: 6, // Adjust the font size for x-axis labels
                          },
                        },
                      },
                      y: {
                        ticks: {
                          font: {
                            size: 6, // Adjust the font size for x-axis labels
                          },
                        },
                      },
                    },
                  }}
              />
            </div>
        )}

        <ul>
          {portfolio.portfolioPoints.map((point:{title:string; subpoints:string[]}, index) => (
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
          <button onClick={onClose} className="reject-button">Reject</button>
          <button onClick={onConfirm} className="confirm-button">Accept</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
