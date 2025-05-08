from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from news_scrapper import fetch_news_for_keywords
from summarizer import summarize_news
from backtest import backtest_portfolio, update_portfolio_history
import yfinance as yf
import pandas as pd
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

@app.route('/api/test', methods=['GET'])
def test():
    sample = [{
        "title": "Trump is going down",
        "url": "https://example.com",
        "summary": "First 500 characters of the article text"
    }]
    return summarize_news(sample)

@app.route('/api/getnews', methods=['GET','POST'])
def getnews():
    if not request.is_json:
        return jsonify({"error": "Invalid content type. Expected 'application/json'"}), 415

    data = request.get_json()
    keywords = data.get('keywords', ['tech', 'finance'])
    
    news_articles = fetch_news_for_keywords(keywords)
    print(news_articles,"\n")
    summary = summarize_news(news_articles)
    return jsonify({'summary': summary})

@app.route('/api/backtestportfolio', methods=['GET','POST'])
def backtestportfolio():
    data = request.get_json()
    portfolio = data["portfolio"]
    portfolio_performance, final_shares = backtest_portfolio(portfolio)
    return jsonify({
        "portfolio_performance": portfolio_performance,
        "final_shares": final_shares
    })

@app.route('/api/retrieveportfoliohistory', methods=["GET", "POST"])
def retrieveportfoliohistory():
    data = request.get_json()
    portfolio = data["portfolio"]
    # print(portfolio)
    portfolio_performance, updated_portfolio_data = update_portfolio_history(portfolio)
    return jsonify({
        "portfolio_performance": portfolio_performance,
        "updated_portfolio_data": updated_portfolio_data
    })



@app.route('/api/get_price')
def get_price():
    ticker = request.args.get('ticker', '').upper()
    if not ticker:
        return jsonify({'price': None}), 400

    url = (
        f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}"
        "?range=1d&interval=1d"
    )
    headers = {
        # pretend to be a real browser
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    max_retries = 3
    backoff = 1  # seconds

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            resp.raise_for_status()
            break  # success!
        except requests.exceptions.HTTPError as e:
            status = getattr(e.response, "status_code", None)
            if status == 429 and attempt < max_retries:
                # rate-limited: wait and retry
                time.sleep(backoff)
                backoff *= 2
                continue
            # other HTTP errors or out of retries
            return jsonify({'price': None}), status or 502
        except requests.exceptions.RequestException:
            # network error / timeout
            return jsonify({'price': None}), 502
    else:
        # ran out of retries
        return jsonify({'price': None, 'error': 'rate_limit_exceeded'}), 429

    # parse the JSON safely
    data = resp.json()
    try:
        closes = (
            data["chart"]["result"][0]
                ["indicators"]["quote"][0]
                ["close"]
        )
        latest = closes[-1]
        if latest is None:
            raise ValueError()
    except Exception:
        return jsonify({'price': None})

    return jsonify({'price': round(float(latest), 2)})
    
if __name__ == '__main__':
    app.run(debug=True, port=3002)
