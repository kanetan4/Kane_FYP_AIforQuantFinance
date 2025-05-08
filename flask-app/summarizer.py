import os
from openai import OpenAI
from dotenv import load_dotenv
from datetime import date

load_dotenv()

client = OpenAI(
    api_key = os.getenv("OPENAI_API_KEY")
)

def summarize_news(articles):
    # Combine headlines for summarization
    combined_text = "\n".join([article['title'] + article['url'] + article['summary'] for article in articles])
    print(combined_text,"\n")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", 
                     "text": f'''Summarize the following news headlines into the top 5 most relevant news articles:\n\n{combined_text}. Format it exactly in this format:
                               [{date.today()}] Here are the top news articles for the day:
                               1. Headline 1 (URL 1)
                               Article 1
                               
                               2. Headline 2 (URL 2)
                               Article 2
                               
                               3. Headline 3 (URL 3)
                               Article 3
                               
                               4. Headline 4 (URL 4)
                               Article 4
                               
                               5. Headline 5 (URL 5)
                               Article 5'''
                    },
                ],
            }
        ],
    )
    print(response.choices[0].message.content,"\n")
    return response.choices[0].message.content
