import { useState } from "react";
import "./portfoliotable.css"
import { useAuth } from "../../context/AuthContext"
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

interface PortfolioHolding {
    ticker: string;
    quantity: number;
    startvalue: number;
    value: number;
  }
  
interface PortfolioTableProps {
    portfolioHoldings: PortfolioHolding[];
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ portfolioHoldings }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof PortfolioHolding | "pnl"; direction: "asc" | "desc" }>({
    key: "" as keyof PortfolioHolding | "pnl",
    direction: "asc",
  });
  const [showModal, setShowModal] = useState(false);
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [transactionData, setTransactionData] = useState({ ticker: "", quantity: 0 });
  const { user } = useAuth();

  const handleBuySellClick = (type: "buy" | "sell", ticker: string) => {
    setTransactionType(type);
    setTransactionData({ ticker, quantity: 0 });
    setShowModal(true);
  };

  const handleTransactionSubmit = async() => {
    const { ticker, quantity } = transactionData;
    
    if (quantity <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    const currentHolding = portfolioHoldings.find((h) => h.ticker === ticker);
    if (!currentHolding) {
      alert("Invalid ticker.");
      return;
    }

    if (transactionType === "sell" && quantity > currentHolding.quantity) {
      alert(`Cannot sell more than ${currentHolding.quantity} shares of ${ticker}.`);
      return;
    }

    try {
      // 🔵 Fetch current price from Flask API
      const response = await fetch(`http://localhost:3002/api/get_price?ticker=${ticker}`);
      const { price } = await response.json();
  
      if (!price) {
        alert("Failed to fetch current price.");
        return;
      }
  
      const transactionValue = price * quantity;
      let updatedQuantity = currentHolding.quantity;
      let updatedStartValue = currentHolding.startvalue;
  
      // 🟢 Handle Buy Logic
      if (transactionType === "buy") {
        updatedQuantity += quantity;
        updatedStartValue += transactionValue;
      }
  
      // 🔴 Handle Sell Logic
      if (transactionType === "sell") {
        updatedQuantity -= quantity;
        updatedStartValue -= transactionValue;
      }
      console.log(quantity, transactionValue);
      console.log(updatedQuantity * price);
      
      // 🟠 Update Firestore
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          "portfolio.data": portfolioHoldings.map((h) =>
            h.ticker === ticker
              ? { ...h, quantity: updatedQuantity, startvalue: updatedStartValue }
              : h
          ),
          "portfolio.currentValue": increment(
            transactionType === "buy" ? transactionValue : -transactionValue
          ),
        });
        console.log("Transaction successful!");
        window.location.reload();
      } else {
        console.error("User not authenticated.");
      }
    } catch (error) {
      console.error("Error executing transaction:", error);
      alert("Transaction failed.");
    }
  
    setShowModal(false);
  };

  const sortedHoldings = [...portfolioHoldings].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = sortConfig.key === "pnl" 
        ? a.value - a.startvalue 
        : a[sortConfig.key];
      const bValue = sortConfig.key === "pnl" 
        ? b.value - b.startvalue 
        : b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    }
    return 0;
  });

  const handleSort = (key: keyof PortfolioHolding | "pnl") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="portfolio-table-container">
      {portfolioHoldings.length > 0 ? (
        <table className="portfolio-table">
          <thead>
            <tr className="table-header">
              <th onClick={() => handleSort("ticker")}> Ticker {sortConfig.key === "ticker" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
              <th onClick={() => handleSort("quantity")}> Quantity {sortConfig.key === "quantity" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
              <th onClick={() => handleSort("startvalue")}> Starting Value {sortConfig.key === "startvalue" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
              <th onClick={() => handleSort("value")}> Current Value {sortConfig.key === "value" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""} </th>
              <th onClick={() => handleSort("pnl")}> PnL {sortConfig.key === "pnl" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""} </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((holding, index) => {
              const startValue = holding.startvalue;
              const currentValue = holding.value;
              const pnl = parseFloat((currentValue * holding.quantity - startValue).toFixed(2));
              const pnlPercentage = parseFloat(((pnl / startValue) * 100).toFixed(2));
              const isProfit = pnl >= 0;

              return (
                <tr key={index} className="table-row">
                  <td>{holding.ticker}</td>
                  <td>{holding.quantity.toFixed(2)}</td>
                  <td>${startValue.toFixed(2)}</td>
                  <td>${(currentValue * holding.quantity).toFixed(2)}</td>
                  <td className={`pnl ${isProfit ? "text-green" : "text-red"}`}> {isProfit ? `▲ +${pnl} (+${pnlPercentage}%)` : `▼ -${Math.abs(pnl)} (${pnlPercentage}%)`}</td>
                  <td className="action-buttons" style={{gap:'1rem'}}>
                    <button
                      onClick={() => handleBuySellClick("buy", holding.ticker)}
                      className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600"
                      style={{marginRight:'0.5rem'}}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => handleBuySellClick("sell", holding.ticker)}
                      className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600"
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>Loading portfolio holdings...</p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-md w-96">
            <h3 className="text-lg font-bold mb-2">
              {transactionType === "buy" ? "Buy Stock" : "Sell Stock"} - {transactionData.ticker}
            </h3>
            <label className="block mb-2">
              Quantity:
              <input
                type="number"
                min="0"
                value={transactionData.quantity}
                onChange={(e) => setTransactionData({ ...transactionData, quantity: parseFloat(e.target.value) })}
                className="w-full p-1 border rounded-md mt-1"
              />
            </label>

            {/* 🔴 Real-time Validation Message */}
            {transactionType === "sell" && transactionData.quantity > 0 && (
              (() => {
                const currentHolding = portfolioHoldings.find((h) => h.ticker === transactionData.ticker);
                if (currentHolding && transactionData.quantity > currentHolding.quantity) {
                  return (
                    <p className="text-red-600 text-sm mb-2">
                      Cannot sell more than {currentHolding.quantity.toFixed(2)} shares of {transactionData.ticker}.
                    </p>
                  );
                }
                return null;
              })()
            )}

            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-800 py-1 px-4 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTransactionSubmit}
                className={`py-1 px-4 rounded-md transition ${
                  transactionType === "buy"
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                Confirm {transactionType === "buy" ? "Buy" : "Sell"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioTable;
