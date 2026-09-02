import time
import requests
import urllib.parse

API_URL = "http://127.0.0.1:8000"

# Reddit requires a descriptive User-Agent header to prevent 429 Too Many Requests errors
HEADERS = {"User-Agent": "SocialLeadFinder/1.0 (by /u/YourUsername)"}

def fetch_active_keywords():
    try:
        response = requests.get(f"{API_URL}/keywords/")
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Connection error fetching keywords: {e}")
    return []

def search_reddit_for_keyword(keyword_term):
    search_url = f"https://www.reddit.com/search.json?q={urllib.parse.quote(keyword_term)}&sort=new&limit=5"
    try:
        response = requests.get(search_url, headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            posts = data.get("data", {}).get("children", [])
            
            leads = []
            for post in posts:
                p_data = post.get("data", {})
                title = p_data.get("title", "")
                selftext = p_data.get("selftext", "")
                permalink = p_data.get("permalink", "")
                
                # Skip if data is missing
                if not title or not permalink:
                    continue
                
                content = f"{title} - {selftext[:120]}..." if selftext else title
                source_url = f"https://reddit.com{permalink}"
                
                leads.append({
                    "content": content,
                    "source_url": source_url
                })
            return leads
    except Exception as e:
        print(f"Error querying Reddit API: {e}")
    return []

def run_worker():
    import urllib.parse
    print("Live Reddit lead discovery worker initialized...")
    while True:
        keywords = fetch_active_keywords()
        if keywords:
            for kw in keywords:
                print(f"Scanning platforms for keyword: '{kw['term']}'")
                live_posts = search_reddit_for_keyword(kw["term"])
                
                for post in live_posts:
                    payload = {
                        "keyword_id": kw["id"],
                        "content": post["content"],
                        "source_url": post["source_url"]
                    }
                    
                    try:
                        # Post to FastAPI backend; this automatically fires the WebSocket broadcast
                        res = requests.post(f"{API_URL}/leads/", json=payload)
                        if res.status_code == 200:
                            print(f"[Live Ingestion] Captured real lead for: '{kw['term']}'")
                    except Exception as e:
                        print(f"Error pushing lead to backend: {e}")
                
                # Sleep briefly between keyword queries to respect rate limits
                time.sleep(5)
        else:
            print("No active keywords found in database.")
        
        # Long polling delay before the next full scan loop (e.g., 60 seconds)
        time.sleep(60)

if __name__ == "__main__":
    run_worker()