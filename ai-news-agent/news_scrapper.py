import requests
from bs4 import BeautifulSoup
from newspaper import Article
from urllib.parse import urljoin


def scrape_news(query):
    url = f"https://news.google.com/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    articles = []
    for item in soup.select('article'):
        articles.append(item)
        headline = item.select_one('h3').get_text(strip=True)
        link = item.find('a')['href']
        articles.append({
            'headline': headline,
            'link': f'https://news.google.com{link}',
        })

    return articles



# def fetch_news_for_keywords(keywords):
    
#     NEWS_SOURCES = [
#         "https://www.cnbc.com/world/?region=world",
#         "https://www.channelnewsasia.com/finance",
#         "https://sg.finance.yahoo.com/topic/latestnews/",
#     ]
#     articles = []
    
#     for source in NEWS_SOURCES:
#         response = requests.get(source)
#         if response.status_code != 200:
#             continue
        
#         soup = BeautifulSoup(response.text, 'html.parser')
#         # links = [a['href'] for a in soup.find_all('a', href=True) if any(kw.lower() in a.text.lower() for kw in keywords)]
#         links = [a['href'] for a in soup.find_all('a', href=True)]

#         for link in links:
#             full_url = link if link.startswith("http") else source + link
        
#             try:
#                 article = Article(full_url)
#                 article.download()
#                 article.parse()
                
#                 title = article.title.lower()
#                 text = article.text.lower()
#                 if article.text != "" and any(kw.lower() in title or kw.lower() in text for kw in keywords):
#                     articles.append({
#                         "title": article.title,
#                         "url": full_url,
#                         "summary": article.text,
#                     })
#             except:
#                 continue
    
#     return articles

def fetch_news_for_keywords(keywords):
    NEWS_SOURCES = [
        "https://www.cnbc.com/world/?region=world",
        "https://sg.finance.yahoo.com/topic/latestnews/",
        # "https://sg.finance.yahoo.com/markets/crypto/all/",
    ]
    
    articles = []
    
    for source in NEWS_SOURCES:
        response = requests.get(source, headers={"User-Agent": "Mozilla/5.0"})
        if response.status_code != 200:
            print(f"Failed to fetch {source}: {response.status_code}")
            continue
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # **Find and filter only article links**
        if "cnbc.com" in source:
            # CNBC - Extract article links from divs with class "Card-title"
            article_links = [a['href'] for a in soup.find_all('a', class_="Card-title", href=True)]
        elif "crypto" in source:
            # Yahoo Finance Crypto - Extract from news list
            # article_links = [a['href'] for a in soup.find_all('a', class_="content yf-82qtw3", href=True)]
            article_links = [a['href'] for a in soup.find_all('a', href=True) if "html" in a['href']]
        elif "yahoo.com" in source:
            # Yahoo Finance - Extract from news list
            article_links = [a['href'] for a in soup.find_all('a', href=True) if "/news/" in a['href']]
        else:
            # Generic case (fallback)
            article_links = [a['href'] for a in soup.find_all('a', href=True)]
        
        # **Process and clean links**
        unique_links = set()  # To avoid duplicate links
        for link in article_links:
            full_url = urljoin(source, link)  # Convert relative URLs to absolute
            if full_url not in unique_links:
                unique_links.add(full_url)
        
        # **Download and process articles**
        for full_url in unique_links:
            try:
                article = Article(full_url)
                article.download()
                article.parse()

                title = article.title.lower()
                text = article.text.lower()
                if article.text and any(kw.lower() in title or kw.lower() in text for kw in keywords):
                    articles.append({
                        "title": article.title,
                        "url": full_url,
                        "summary": article.text[:500],  # Limit summary length
                    })
            except Exception as e:
                print(f"Failed to process {full_url}: {e}")
                continue

    return articles