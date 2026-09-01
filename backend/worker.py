# backend/worker.py
import time
import requests
import random

API_URL = "http://127.0.0.1:8000"

MOCK_POSTS = [
    "Does anyone know a good alternative to {term}?",
    "Struggling with our current tool, looking to switch from {term} ASAP.",
    "Can someone recommend a platform similar to {term}?",
    "Looking for recommendations to replace {term} for my store."
]

def poll_and_simulate():
    print("Starting background social lead polling worker...")
    while True:
        try:
            response = requests.get(f"{API_URL}/keywords/")
            if response.status_code == 200:
                keywords = response.json()
                for kw in keywords:
                    if random.random() < 0.4:  # 40% chance per cycle to find a lead
                        term = kw["term"]
                        content = random.choice(MOCK_POSTS).format(term=term)
                        source_url = f"https://reddit.com/r/ecommerce/comments/{random.randint(100000, 999999)}"
                        
                        payload = {
                            "keyword_id": kw["id"],
                            "content": content,
                            "source_url": source_url
                        }
                        
                        res = requests.post(f"{API_URL}/leads/", json=payload)
                        if res.status_code == 200:
                            print(f"[Worker] Automated Lead Captured for '{term}': {content}")
        except Exception as e:
            print(f"[Worker Error] {e}")
        
        time.sleep(10)

if __name__ == "__main__":
    poll_and_simulate()