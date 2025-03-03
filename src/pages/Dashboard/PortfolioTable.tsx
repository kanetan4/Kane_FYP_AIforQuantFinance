import React, { useState } from "react";

const PortfolioTable = ({ portfolioHoldings }) => {
  // State for sorting
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

  // Function to sort data
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

  // Handle sort on header click
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="mt-5">
      {portfolioHoldings.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th
                className="py-2 px-4 cursor-pointer"
                onClick={() => handleSort("ticker")}
              >
                Ticker {sortConfig.key === "ticker" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                className="py-2 px-4 cursor-pointer"
                onClick={() => handleSort("quantity")}
              >
                Quantity {sortConfig.key === "quantity" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                className="py-2 px-4 cursor-pointer"
                onClick={() => handleSort("startvalue")}
              >
                Starting Value {sortConfig.key === "startvalue" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                className="py-2 px-4 cursor-pointer"
                onClick={() => handleSort("value")}
              >
                Current Value {sortConfig.key === "value" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                className="py-2 px-4 cursor-pointer"
                onClick={() => handleSort("pnl")}
              >
                PnL {sortConfig.key === "pnl" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((holding, index) => {
              const startValue = holding.startvalue;
              const currentValue = holding.value;
              const pnl = currentValue - startValue;
              const pnlPercentage = ((pnl / startValue) * 100).toFixed(2);
              const isProfit = pnl >= 0;

              return (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{holding.ticker}</td>
                  <td className="py-2 px-4">{holding.quantity.toFixed(2)}</td>
                  <td className="py-2 px-4">${startValue.toFixed(2)}</td>
                  <td className="py-2 px-4">${currentValue.toFixed(2)}</td>
                  <td
                    className={`py-2 px-4 font-semibold flex items-center ${
                      isProfit ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isProfit ? (
                      <>
                        ▲ +${pnl.toFixed(2)} (+{pnlPercentage}%)
                      </>
                    ) : (
                      <>
                        ▼ -${Math.abs(pnl).toFixed(2)} ({pnlPercentage}%)
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>Loading portfolio holdings...</p>
      )}
    </div>
  );
};

export default PortfolioTable;
