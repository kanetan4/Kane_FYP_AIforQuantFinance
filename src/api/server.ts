import express from "express";
import cors from "cors";
import { fetchFinancialNews } from "./webscraping";

const app = express();
const PORT = 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  methods: ['GET', 'POST'],        // Specify allowed HTTP methods
}));

// API route for fetching financial news
app.get("/api/news", async (req, res) => {
  try {
    const news = await fetchFinancialNews();
    res.json(news); // Send the news data as a JSON response
  } catch (error) {
    console.error("Error fetching financial news:", error);
    res.status(500).json({ error: "Failed to fetch financial news." });
  }
});

// Start the backend server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
