import yfinance as yf
import pandas as pd

def fetch_historical_data(ticker, start="2010-01-01"):
    """
    Fetch historical monthly stock prices from Yahoo Finance.
    """
    stock = yf.Ticker(ticker)
    hist = stock.history(period="max", interval="1d", start=start)

    if hist.empty:
        print(f"⚠️ No data found for {ticker}")
        return []

    # Convert DataFrame to a list of dictionaries
    return [{"date": date.strftime("%Y-%m-%d"), "price": row["Close"]} for date, row in hist.iterrows()]

def backtest_portfolio(portfolio):
    """
    Simulates a portfolio's performance over time using historical prices.

    - Converts initial investment values into number of shares using the first available price.
    - Computes portfolio value over time by multiplying shares with stock prices at each date.
    """
    historical_data = {}

    # Fetch historical data for each asset
    for asset in portfolio:
        ticker = asset["ticker"]
        print(f"Fetching data for {ticker}...")
        historical_data[ticker] = fetch_historical_data(ticker)  # Function to get historical prices
        print(historical_data[ticker][:10])

    print("✅ Raw historical data fetched")
    
    common_dates = set.intersection(*[set([entry["date"] for entry in data]) for data in historical_data.values()])
    sorted_dates = sorted(list(common_dates))

    if not sorted_dates:
        print("⚠️ No common historical data found.")
        return []

    print(f"✅ Aligning data from {sorted_dates[0]} to {sorted_dates[-1]}")

    # Step 1: Initialize portfolio with number of shares
    shares = {}  # { ticker: number_of_shares }
    for asset in portfolio:
        ticker = asset["ticker"]
        initial_value = asset["value"]

        # Get the first available stock price
        first_price = next(entry["price"] for entry in historical_data[ticker] if entry["date"] == sorted_dates[0])
        
        # Compute number of shares
        shares[ticker] = float(initial_value / first_price)

    print("Initial Shares Allocation:", shares)

    # Step 2: Compute portfolio value for each date
    portfolio_performance = []
    
    for date in sorted_dates:
        total_value = 0
        for ticker in shares:
            # Get the stock price for this date
            asset_data = next((entry for entry in historical_data[ticker] if entry["date"] == date), None)
            if asset_data:
                price = asset_data["price"]
                total_value += shares[ticker] * price  # Compute current value

        portfolio_performance.append({"date": date, "value": float(total_value)})
    # print(portfolio_performance)
    final_shares = []

    for asset in portfolio:
        ticker = asset["ticker"]
        current_value = asset["value"]
        current_price = historical_data[ticker][-1]['price']  # Get the latest price
        quantity = float(current_value / current_price)  # Calculate number of shares

        # Append the structured dictionary to the list
        final_shares.append({
            "ticker": ticker,
            "value": current_value,
            "quantity": quantity
        })

    # Print or return final_shares to verify
    print(final_shares)
    print("✅ Portfolio backtest complete!")
    return portfolio_performance, final_shares