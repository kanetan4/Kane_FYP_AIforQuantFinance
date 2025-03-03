from flask import Flask, jsonify, request
from flask_cors import CORS
from news_scrapper import fetch_news_for_keywords
from summarizer import summarize_news
from backtest import backtest_portfolio, update_portfolio_history

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
    portfolio_performance, updated_portfolio_data = update_portfolio_history(portfolio)
    return jsonify({
        "portfolio_performance": portfolio_performance,
        "updated_portfolio_data": updated_portfolio_data
    })
    
if __name__ == '__main__':
    app.run(debug=True, port=3002)
