from flask import Flask, jsonify, request
from flask_cors import CORS
from news_scrapper import scrape_news, fetch_news_for_keywords
from summarizer import summarize_news
import os
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

@app.route('/api/getnews', methods=['GET'])
def getnews():
    data = request.get_json()
    keywords = data.get('keywords', ['tech', 'finance'])
    
    news_articles = fetch_news_for_keywords(keywords)
    print(news_articles,"\n")
    summary = summarize_news(news_articles)
    return jsonify({'summary': summary})

@app.route('/api/test', methods=['GET'])
def test():
    sample = [{
        "title": "Trump is going down",
        "url": "https://example.com",
        "summary": "First 500 characters of the article text"
    }]
    return summarize_news(sample)

if __name__ == '__main__':
    app.run(debug=True, port=3002)
