import React from "react";

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

// 📊 Risk Metric Component
const RiskMetric: React.FC<RiskMetricProps> = ({ history, startValue }) => {
  const { metric: volatility, insight: volatilityInsight } = calculateVolatility(history);
  const { metric: var95, insight: var95Insight } = calculateVaR(history, startValue);
  const { metric: maxDrawdown, insight: maxDrawdownInsight } = calculateMaxDrawdown(history);

  // Color coding based on metric values
  const getColor = (metric: number, isPositiveGood: boolean) => {
    if (isPositiveGood) {
      return metric < 10 ? "text-green-600" : "text-red-600";
    } else {
      return metric > -2 ? "text-green-600" : "text-red-600";
    }
  };

  return (
    <div className="mt-4" style={{marginBottom:'3rem'}}>
      <h3 className="text-xl font-semibold">Risk Analysis</h3>
      <ul className="mb-4">
        <li className="flex items-center">
          <span>Volatility: </span>
          <span className={`ml-2 ${getColor(volatility, false)}`}>{volatility}%</span>
          <span className="ml-4 text-sm text-gray-500">{volatilityInsight}</span>
        </li>
        <li className="flex items-center">
          <span>Max Drawdown: </span>
          <span className={`ml-2 ${getColor(maxDrawdown, false)}`}>{maxDrawdown}%</span>
          <span className="ml-4 text-sm text-gray-500">{maxDrawdownInsight}</span>
        </li>
        <li className="flex items-center">
          <span>VaR (95% Confidence): </span>
          <span className={`ml-2 ${getColor(var95, true)}`}>{var95}%</span>
          <span className="ml-4 text-sm text-gray-500">{var95Insight}</span>
        </li>
      </ul>
    </div>
  );
};

export default RiskMetric;
