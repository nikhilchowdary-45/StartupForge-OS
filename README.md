# StartupForge AI

An AI-driven platform for generating, researching, planning, and deploying startups.

## Project Structure

```
startupforge-ai/
├── frontend/              # Next.js + React Dashboard
├── backend/               # FastAPI Server
│   ├── app/
│   │   ├── main.py        # FastAPI Application Entry
│   │   ├── config.py      # App Configurations & Env Variables
│   │   └── agents/        # Agent specifications (CrewAI / Custom)
│   │       ├── base.py
│   │       ├── orchestrator.py
│   │       └── market_research.py
│   ├── requirements.txt   # Backend Dependencies
│   └── .env.example       # Example Environment Template
├── vector_db/             # Local database configurations / storage
├── docker/                # Docker files
└── README.md
```

## Setup Instructions

### 1. Active Workspace Recommendation
For the best experience developing this project with Antigravity, set this folder as your active workspace in your IDE:
```
C:\Users\nikhi\.gemini\antigravity\scratch\startupforge-ai
```

### 2. Configure Environment Variables
Copy the `backend/.env.example` file to `backend/.env` and fill in your API keys:
* `GEMINI_API_KEY`: API key from Google AI Studio.
* `TAVILY_API_KEY`: API key from Tavily Search.

### 3. Running Backend Locally
Change to the backend directory, create a virtual environment, install requirements, and run the server:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The server will start running at `http://127.0.0.1:8000`.

### 4. Running Frontend Dashboard
You can spin up the Next.js frontend using `npm run dev` after initializing it in the `frontend` folder.
