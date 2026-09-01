# Social Lead Finder

A full-stack, API-first micro-SaaS application designed to automate the discovery and management of high-intent buying signals and target keywords across platforms.

## Tech Stack

* **Backend:** Python, FastAPI, SQLite, SQLAlchemy
* **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Single-Page Application layout)
* **Automation:** Python background polling worker for automated lead simulation and ingestion

## Project Structure

```text
social-lead-finder/
│
├── backend/
│   ├── main.py            # FastAPI application and CRUD endpoints
│   ├── models.py          # SQLAlchemy database models & Pydantic schemas
│   ├── database.py        # SQLite database session configuration
│   ├── requirements.txt   # Python dependencies
│   └── worker.py          # Background polling script for lead generation
│
├── htmlfiles/
│   ├── index.html         # Landing page view
│   └── dashboard.html     # Main Single-Page Application shell
│
└── javascriptfiles/
    ├── script.js          # Global scripts and navigation logic
    └── dashboard.js       # Dynamic data fetching, UI controllers, and view rendering
```
## Core Features

Live Monitoring Dashboard: Real-time metrics overview tracking incoming buying signals and active keyword searches.

Keyword Management: Add, track, and audit active search terms targeting specific software or product alternatives.

Lead Archive & Simulation: Instantly capture incoming signals or use the built-in background worker to simulate incoming traffic dynamically.

Persistent Client Settings: Configure and store custom API endpoints and polling frequencies locally using browser localStorage.

Getting Started Locally
1. Clone the repository:

```text
git clone [https://github.com/Luther-123/social-lead-finder.git](https://github.com/Luther-123/social-lead-finder.git)
cd social-lead-finder

```

2. Set up a Python virtual environment and install dependencies:

```text
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

3. Run the FastAPI backend server:

```text
cd backend
uvicorn main:app --reload
```

4. Launch the Background Worker (optional for simulation):
Open a separate terminal window, activate your virtual environment, and run:

```text
python backend/worker.py
```

5. Open the Frontend:
Open htmlfiles/dashboard.html in your browser or serve it via a local static server to interact with the full-stack interface.
