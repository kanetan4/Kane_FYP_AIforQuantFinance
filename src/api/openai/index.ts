export const callOpenAI = async (messages: Array<{ role: string; content: string }>) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;  
    if (!apiKey) {
      throw new Error("API key is missing. Please set VITE_OPENAI_API_KEY in your .env file.");
    }
  
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
        }),
      });
  
      if (!response.ok) {
        const errorDetails = await response.json();
        console.error("OpenAI API Error:", errorDetails);
        throw new Error(`OpenAI API Error: ${errorDetails.error.message}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error;
    }
  };
