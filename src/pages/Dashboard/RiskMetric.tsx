import React from "react";

interface RiskMetricProps {
  history: { timestamp: string; value: number }[];
  startValue: number;
}

export interface RiskMetricResult {
  metric: number;
  insight: string;
  color: string;
}

// 📊 Volatility Metric and Insight
const calculateVolatility = (history: RiskMetricProps["history"]): RiskMetricResult => {
  const returns = history.slice(1).map((entry, i) => (entry.value - history[i].value) / history[i].value);
  const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = parseFloat((Math.sqrt(variance) * 100).toFixed(2));

  let insight = "";
  let color = "";
  if (volatility > 20) {
    insight = "High volatility indicates high risk.";
    color = "text-red-600"
  } else if (volatility < 5) {
    insight = "Low volatility indicates low risk.";
    color = "text-green-600"
  } else {
    insight = "Moderate volatility suggests balanced risk.";
    color = "text-yellow-600"
  }

  return { metric: volatility, insight, color };
};

// 📊 VaR Metric and Insight
const calculateVaR = (history: RiskMetricProps["history"], startValue: number): RiskMetricResult => {
  const volatility = calculateVolatility(history).metric / 100;
  const zScore = 1.65; // 95% confidence
  const meanReturn = (history[history.length - 1]?.value - startValue) / startValue;
  const var95 = parseFloat((meanReturn - zScore * volatility).toFixed(2));

  let insight = "";
  let color = "";
  if (var95 < -5) {
    insight = "High potential loss at 95% confidence level.";
    color = "text-red-600"
  } else if (var95 > -2) {
    insight = "Low potential loss at 95% confidence level.";
    color = "text-green-600"
  } else {
    insight = "Moderate potential loss at 95% confidence level.";
    color = "text-yellow-600"
  }

  return { metric: var95, insight, color };
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
  let color = "";
  if (maxDrawdownPercentage > 15) {
    insight = "Max drawdown suggests potential for large losses.";
    color = "text-red-600"
  } else if (maxDrawdownPercentage < 5) {
    insight = "Low drawdown indicates limited historical losses.";
    color = "text-green-600"
  } else {
    insight = "Moderate drawdown indicates manageable losses.";
    color = "text-yellow-600"
  }

  return { metric: maxDrawdownPercentage, insight, color };
};

// 📊 Risk Metric Component
const RiskMetric: React.FC<RiskMetricProps> = ({ history, startValue }) => {
  const { metric: volatility, insight: volatilityInsight, color: vcolor } = calculateVolatility(history);
  const { metric: var95, insight: var95Insight, color: varcolor } = calculateVaR(history, startValue);
  const { metric: maxDrawdown, insight: maxDrawdownInsight, color: mddcolor } = calculateMaxDrawdown(history);

  return (
    <div className="mt-4" style={{marginBottom:'3rem'}}>
      <h3 className="text-xl font-semibold">Risk Analysis</h3>
      <ul className="mb-4">
        <li className="flex items-center">
          <span>Volatility: </span>
          <span className={`ml-2 ${vcolor}`}>{volatility}%</span>
          <span className="ml-4 text-sm text-gray-500">{volatilityInsight}</span>
        </li>
        <li className="flex items-center">
          <span>Max Drawdown: </span>
          <span className={`ml-2 ${mddcolor}`}>{maxDrawdown}%</span>
          <span className="ml-4 text-sm text-gray-500">{maxDrawdownInsight}</span>
        </li>
        <li className="flex items-center">
          <span>VaR (95% Confidence): </span>
          <span className={`ml-2 ${varcolor}`}>{var95}%</span>
          <span className="ml-4 text-sm text-gray-500">{var95Insight}</span>
        </li>
      </ul>
    </div>
  );
};

export default RiskMetric;
