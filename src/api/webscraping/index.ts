import axios from "axios";
import cheerio from "cheerio";

export const fetchFinancialNews = async (): Promise<any[]> => {
//   const targetUrl = "https://www.cnn.com/business"; // Example: CNN Business
  const targetUrl = "https://www.google.com"; // Example: CNN Business

  try {
    // Fetch the website content using Axios
    const response = await axios.get(targetUrl);
    const html = response.data;

    // Load HTML into Cheerio for parsing
    const $ = cheerio.load(html);
    const news: any[] = [];

    // Scrape headlines and links from the page
    $(".container__headline").each((index, element) => {
      const title = $(element).text().trim();
      const link = $(element).find("a").attr("href");

      if (title && link) {
        news.push({
          title,
          link: link.startsWith("http") ? link : `https://www.cnn.com${link}`,
          sentiment: "Neutral", // Placeholder for sentiment analysis
        });
      }
    });

    return news;
  } catch (error) {
    console.error("Error scraping financial news:", error);
    throw new Error("Failed to scrape financial news.");
  }
};
