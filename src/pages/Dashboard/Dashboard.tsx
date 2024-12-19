import React, { useState } from "react";
import './dashboard.css';
import { callOpenAI } from "../../api/openai";

const Dashboard: React.FC = () => {
  const [formData, setFormData] = useState({
    riskTolerance: "",
    investmentHorizon: "",
    financialGoals: "",
    startingCapital: "",
  });

  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAIRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const userInput = `Please provide a concrete investment plan in 5 point form with 2 subpointers each and less than 250 words along with a concrete plan, do not use headers so there wont be stars in the text. I am a user looking to invest. My risk tolerance is ${formData.riskTolerance}, my investment horizon is ${formData.investmentHorizon} years, my financial goals are "${formData.financialGoals}", and I have a starting capital of $${formData.startingCapital}.`;

    const messages = [
      { role: "system", content: "You are a financial investment assistant." },
      { role: "user", content: userInput },
    ];

    try {
      const response = await callOpenAI(messages);
      const aiResponse = response.choices[0].message.content;
      console.log("OpenAI response:", aiResponse);
      setResponseMessage(aiResponse); // Set the response message to display below the form
    } catch (error) {
      console.error("Error fetching OpenAI response:", error);
      setResponseMessage("There was an error fetching the response. Please try again.");
    }
  };

  const parseResponseMessage = (message: string): string[] => {
    return message
      .split("\n") // Split the response into lines
      .filter((line) => line.trim() !== "") // Remove empty lines
      .map((line) => {
        // Remove the ** from headers
        if (line.startsWith("**") && line.endsWith("**")) {
          return line.slice(2, -2).trim(); // Remove the ** and trim
        }
        return line.trim(); // Just trim other lines
      });
  };

  return (
    <>
      <div>
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

        {responseMessage && (
          <div className="response-output">
            <h3>Personalized investment plan</h3>
            <ul className="response-list">
              {parseResponseMessage(responseMessage).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
