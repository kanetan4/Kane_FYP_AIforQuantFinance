import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd

def compute_portfolio_performance(portfolio, historical_data):
    """
    Computes the portfolio's value over time based on historical prices.
    Supports mixed intervals (15m and 60m).
    """
    # Step 1: Collect All Available Timestamps
    all_timestamps = set()
    for data in historical_data.values():
        all_timestamps.update(entry["timestamp"] for entry in data)

    sorted_timestamps = sorted(list(all_timestamps))  # Sort in ascending order

    if not sorted_timestamps:
        print("⚠️ No common historical data found.")
        return []

    print(f"✅ Aligning data from {sorted_timestamps[0]} to {sorted_timestamps[-1]}")

    # Step 2: Compute Portfolio Value Over Time Using Stored Quantities
    portfolio_performance = []

    for timestamp in sorted_timestamps:
        total_value = 0  # Initialize total portfolio value

        for asset in portfolio["data"]:
            ticker = asset["ticker"]
            quantity = asset["quantity"]  # Quantity remains unchanged

            # Find stock price for this timestamp
            asset_data = next((entry for entry in historical_data[ticker] if entry["timestamp"] == timestamp), None)
            if asset_data:
                price = asset_data["price"]
                total_value += quantity * price  # Compute portfolio value at this timestamp

        portfolio_performance.append({
            "timestamp": timestamp,  # Use actual timestamp from historical data
            "value": round(total_value, 2)  # Round to 2 decimal places
        })

    return portfolio_performance


# def fetch_historical_data(type, ticker, interval, start="2025-01-01"):
#     df = pdr.DataReader(ticker, "stooq", start=start)
#     df = df.sort_index()    # Stooq returns descending by date
#     rows = []
#     for dt, row in df.iterrows():
#         rows.append({
#             "date": dt.strftime("%Y-%m-%d"),
#             "price": row["Close"]
#         })
#     return rows


import requests
from datetime import datetime, timezone

def fetch_historical_data(type, ticker, interval, start="2010-01-01"):
    """
    Fetch daily (or intraday) history from Yahoo Finance’s public API.
    Returns a list of dicts with keys: date, timestamp, price.
    """
    # 1) build the URL (you can adjust range= and interval= as needed)
    url = (
        f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}"
        f"?range=max&interval={interval}"
    )
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    # 2) fetch & parse JSON
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    data = resp.json()["chart"]["result"][0]

    timestamps = data["timestamp"]                              # list of epoch seconds
    closes     = data["indicators"]["quote"][0]["close"]       # list of close prices

    # 3) filter & build rows
    start_dt = datetime.fromisoformat(start).date()
    rows = []

    for ts, close in zip(timestamps, closes):
        # skip any null prices
        if close is None:
            continue

        # convert epoch→UTC datetime
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        if dt.date() < start_dt:
            continue

        iso_ts   = dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z"
        date_str = dt.strftime("%Y-%m-%d")

        rows.append({
            "date":      date_str,
            "timestamp": iso_ts,
            "price":     float(close)
        })

    return rows



# YFINANCE API - test once in awhile

# def fetch_historical_data(type, ticker, interval, start="2025-01-01"):
#     """
#     Fetch historical monthly stock prices from Yahoo Finance.
#     """
#     stock = yf.Ticker(ticker)
#     hist = stock.history(period="max", interval=interval, start=start)

#     if hist.empty:
#         print(f"⚠️ No data found for {ticker}")
#         return []

#     # Convert DataFrame to a list of dictionaries
#     if type == "backtest":
#         return [{"date": date.strftime("%Y-%m-%d"), "price": row["Close"]} for date, row in hist.iterrows()]
#     else:
#         return [{"timestamp": date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"), "price": row["Close"]} for date, row in hist.iterrows()]




def fetch_full_historical_data(ticker, start):
    """
    Fetch historical data in chunks based on API limitations.
    - Uses 60-minute (`60m`) data for periods > 60 days ago.
    - Uses 15-minute (`15m`) data for the last 60 days.
    """
    historical_data = []
    end_date = datetime.today()  # Current date
    current_start = datetime.strptime(start, "%Y-%m-%d")

    while current_start < end_date:
        # If the start date is more than 60 days ago, use `60m`
        days_ago = (end_date - current_start).days
        interval = "1d" 
        # if days_ago > 60 else "15m"

        # Set max range based on interval (60 days for 60m, 60 days for 15m)
        next_end = min(current_start + timedelta(days=59), end_date)  # Ensure max 60-day window

        print(f"Fetching {interval} data for {ticker} from {current_start.date()} to {next_end.date()}...")

        # Fetch data for this range
        chunk_data = fetch_historical_data("", ticker, interval, start=current_start.strftime("%Y-%m-%d"))
        historical_data.extend(chunk_data)

        # Move start to next batch
        current_start = next_end

    return historical_data


def update_portfolio_history(portfolio):
    """
    Updates portfolio performance over time by:
    1. Pulling historical data from the last recorded timestamp.
    2. Calculating the portfolio value over time based on stored quantity.
    3. Returning updated history data and latest portfolio values.
    """

    # Extract historical start date from last recorded entry
    if "history" in portfolio and portfolio["history"]:
        last_entry = portfolio["history"][-1]
        start_date = last_entry["timestamp"][:10]  # Extract YYYY-MM-DD
        last_timestamp = last_entry["timestamp"]
    else:
        print("⚠️ No history found, using default start date.")
        start_date = "2025-03-01"
        last_timestamp = None

    print(f"Fetching historical data from {start_date}...")

    historical_data = {}

    # Fetch new historical data for each asset
    for asset in portfolio["data"]:
        ticker = asset["ticker"]
        print(f"Fetching data for {ticker}...")
        historical_data[ticker] = fetch_full_historical_data(ticker, start=start_date)
        print(f"✅ Data for {ticker}: {len(historical_data[ticker])} entries.")
        
    if len(historical_data[ticker]) == 0:
        return [], portfolio['data']

    if last_timestamp:
        for ticker in historical_data:
            historical_data[ticker] = [
                entry for entry in historical_data[ticker]
                if entry["timestamp"] > last_timestamp
            ]

    portfolio_performance = compute_portfolio_performance(portfolio, historical_data)
    
    # Update Portfolio Data with Latest Prices
    updated_portfolio_data = []

    for asset in portfolio["data"]:
        ticker = asset["ticker"]
        quantity = asset["quantity"]
        if historical_data[ticker]:
            latest_price = historical_data[ticker][-1]['price']  # Get latest price
        else:
            latest_price = asset["value"]
        print(asset)
        updated_ticker_data = {
            "ticker": ticker,
            "quantity": quantity,
            "value": latest_price,
            "startvalue": asset["startvalue"]
        }
        updated_portfolio_data.append(updated_ticker_data)

    print("✅ Portfolio history updated successfully!")
    return portfolio_performance, updated_portfolio_data

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
        historical_data[ticker] = fetch_historical_data("backtest",ticker, "15m")  # Function to get historical prices
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
        start_value = asset["value"]
        current_price = historical_data[ticker][-1]['price']  # Get the latest price
        quantity = float(start_value / current_price)  # Calculate number of shares

        # Append the structured dictionary to the list
        final_shares.append({
            "ticker": ticker,
            "startvalue": start_value,
            "value": current_price,
            "quantity": quantity,
        })

    # Print or return final_shares to verify
    print(final_shares)
    print("✅ Portfolio backtest complete!")
    return portfolio_performance, final_shares