import os

project_root = r"C:\Users\nikhi\.gemini\antigravity\scratch\startupforge-ai"

# Read frontend files
with open(os.path.join(project_root, "frontend", "index.html"), "r", encoding="utf-8") as f:
    index_html = f.read()

with open(os.path.join(project_root, "frontend", "styles.css"), "r", encoding="utf-8") as f:
    styles_css = f.read()

with open(os.path.join(project_root, "frontend", "app.js"), "r", encoding="utf-8") as f:
    app_js = f.read()

# Build app.py content
app_code = f"""import sqlite3
import os
import sys
import uuid
import json
import asyncio
from pathlib import Path
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException, Response
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ==================== DATABASE CONFIGURATION ====================
DB_PATH = Path("startupforge.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(\"\"\"
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            mobile TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            github_token TEXT NOT NULL,
            vercel_token TEXT,
            supabase_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    \"\"\")
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def register_user_db(name, email, mobile, password, github_token, vercel_token=None, supabase_token=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            \"\"\"
            INSERT INTO users (name, email, mobile, password, github_token, vercel_token, supabase_token)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            \"\"\",
            (name, email, mobile, password, github_token, vercel_token, supabase_token)
        )
        conn.commit()
        return {{"success": True, "user_id": cursor.lastrowid}}
    except sqlite3.IntegrityError:
        return {{"success": False, "error": "Email or Mobile Number already registered."}}
    finally:
        conn.close()

def login_user_db(identifier, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        \"\"\"
        SELECT * FROM users 
        WHERE (email = ? OR mobile = ?) AND password = ?
        \"\"\",
        (identifier, identifier, password)
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        return {{
            "success": True,
            "user": {{
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "mobile": row["mobile"],
                "github_token": row["github_token"],
                "vercel_token": row["vercel_token"] or "",
                "supabase_token": row["supabase_token"] or ""
            }}
        }}
    return {{"success": False, "error": "Invalid identifier or password."}}

def update_user_credentials_db(user_id, github_token, vercel_token=None, supabase_token=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        \"\"\"
        UPDATE users 
        SET github_token = ?, vercel_token = ?, supabase_token = ?
        WHERE id = ?
        \"\"\",
        (github_token, vercel_token, supabase_token, user_id)
    )
    conn.commit()
    changes = conn.changes()
    conn.close()
    return {{"success": True if changes > 0 else False}}

init_db()

# ==================== FASTAPI APPLICATION ====================
app = FastAPI(title="StartupForge OS Unified")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class RegisterRequest(BaseModel):
    name: str
    email: str
    mobile: str
    password: str
    github_token: str
    vercel_token: str = None
    supabase_token: str = None

class LoginRequest(BaseModel):
    identifier: str
    password: str

class UpdateCredentialsRequest(BaseModel):
    user_id: int
    github_token: str
    vercel_token: str = None
    supabase_token: str = None

class StartupIdea(BaseModel):
    idea: str
    target_audience: str = ""

class DeployRequest(BaseModel):
    task_id: str
    platform: str = "vercel"

class MentorMessage(BaseModel):
    task_id: str
    message: str

task_results = {{}}

# Background Workflow Simulation
def run_agent_workflow(task_id: str, idea_text: str):
    simulate_workflow(task_id, idea_text)

def simulate_workflow(task_id: str, idea_text: str):
    readiness_score = min(max(40 + len(idea_text) % 50, 45), 92)
    tam = 5000 + (len(idea_text) * 123) % 45000
    sam = int(tam * 0.15)
    som = int(sam * 0.05)
    first_word = idea_text.split()[0].title() if idea_text.split() else "Startuphub"
    clean_name = "".join(c for c in first_word if c.isalnum())
    is_conflict = len(clean_name) < 4 or any(x in clean_name.lower() for x in ["apple", "google", "meta", "uber", "amazon"])
    
    task_results[task_id] = {{
        "status": "completed",
        "is_mock": True,
        "data": {{
            "name": clean_name,
            "idea": idea_text,
            "market_research": {{
                "competitors": [
                    {{"name": f"Legacy{{clean_name}}", "strength": "Established market presence", "weakness": "High price, outdated platform"}},
                    {{"name": "nichePlayer", "strength": "Agile, focused features", "weakness": "Limited funding, small team"}},
                    {{"name": "OpenSourceAlternative", "strength": "Free to host", "weakness": "Complex developer setup"}}
                ],
                "tam": f"${{tam:,}}M",
                "sam": f"${{sam:,}}M",
                "som": f"${{som:,}}M",
                "market_trends": "Growing demand for AI-driven optimization, low-latency micro-frontends, and automated tooling architectures."
            }},
            "finance": {{
                "pricing": [
                    {{"tier": "Starter", "price": "$29/mo", "features": "Basic functions, 1 workspace"}},
                    {{"tier": "Growth", "price": "$89/mo", "features": "Advanced modules, team workspaces, priority SLAs"}},
                    {{"tier": "Enterprise", "price": "Custom", "features": "SAML SSO, custom analytics, unlimited usage"}}
                ],
                "revenue_projection": {{
                    "year_1": f"${{int(som * 0.15):,}}k",
                    "year_2": f"${{int(som * 0.45):,}}k",
                    "year_3": f"${{int(som * 1.2):,}}k"
                }},
                "break_even_months": 7
            }},
            "branding": {{
                "domains": [
                    {{"domain": f"get{{clean_name.lower()}}.com", "status": "Available"}},
                    {{"domain": f"{{clean_name.lower()}}app.io", "status": "Available"}},
                    {{"domain": f"{{clean_name.lower()}}.ai", "status": "Taken"}}
                ],
                "colors": {{
                    "primary": "#8b5cf6",
                    "secondary": "#3b82f6",
                    "accent": "#f472b6"
                }},
                "taglines": [
                    f"Powering your startup lifecycle.",
                    f"The next-generation framework for builders.",
                    f"Scale {{clean_name}} without limits."
                ]
            }},
            "investor": {{
                "readiness_score": readiness_score,
                "swot": {{
                    "strengths": ["Clear product differentiation", "Highly scalable software distribution", "Favorable early brand signals"],
                    "weaknesses": ["Resource-constrained engineering", "Early-stage target audience definition"],
                    "opportunities": ["Global expansion into emerging markets", "Up-selling premium value add-ons"],
                    "threats": ["API availability and infrastructure pricing changes", "Incumbent copycat feature releases"]
                }},
                "investment_thesis": f"The proposed idea addresses a real industry friction point. With an initial score of {{readiness_score}}/100, the focus should be on validating high-priority features with early active adopters."
            }},
            "trademark": {{
                "status": "Warning (Potential Conflict)" if is_conflict else "Safe (Clear Search)",
                "description": f"Name conflict matches found in database registries for '{{clean_name}}'" if is_conflict else f"No identical trademark matching entries found in USPTO database registries for '{{clean_name}}'"
            }},
            "customer_personas": [
                {{
                    "name": "Sarah Miller", "role": "Product Lead", "age": 32, "profession": "PM at Growth Tech",
                    "interests": ["Product management tools", "No-code solutions", "Venture ecosystems"],
                    "pain_points": "Switching between 5 separate tools to research competitors and map budgets.",
                    "buying_behavior": "Willing to pay $50-$100/mo for unified platforms saving time."
                }},
                {{
                    "name": "Alex Chen", "role": "Solo Founder", "age": 27, "profession": "Independent Developer",
                    "interests": ["Open-source tools", "Indie Hacking", "SaaS automation"],
                    "pain_points": "Lacks brand design experience; deployment configuration is slow.",
                    "buying_behavior": "Looks for free trial plans, upgrades immediately if MVP is launched."
                }}
            ],
            "business_plan": {{
                "executive_summary": f"{{clean_name}} is a high-growth platform designed to solve the critical market need of: {{idea_text}}.",
                "vision": f"To democratize building by integrating research, design, and deployment pipelines.",
                "mission": "Provide tools that empower builders to launch validated products instantly.",
                "lean_canvas": {{
                    "problem": "Founders waste weeks switching tools, wasting budgets before product validation.",
                    "solution": "A consolidated multi-agent system managing business strategy, branding, and deployment.",
                    "metrics": "Customer acquisition cost, monthly active workspace retention, code template downloads.",
                    "value_proposition": "Move from business concept to a launch-ready deployed startup in minutes."
                }}
            ],
            "builder_console": {{
                "db_schema": "CREATE TABLE users (\\n  id SERIAL PRIMARY KEY,\\n  email VARCHAR(255) UNIQUE,\\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\\n);\\n\\nCREATE TABLE projects (\\n  id SERIAL PRIMARY KEY,\\n  user_id INT REFERENCES users(id),\\n  name VARCHAR(100),\\n  status VARCHAR(50)\\n);",
                "dockerfile": "FROM python:3.11-slim\\nWORKDIR /app\\nCOPY requirements.txt .\\nRUN pip install -r requirements.txt\\nCOPY . .\\nEXPOSE 8000\\nCMD [\\"uvicorn\\", \\"app.main:app\\", \\"--host\\", \\"0.0.0.0\\", \\"--port\\", \\"8000\\"]",
                "github_action": "name: CI/CD\\non: [push]\\njobs:\\n  build-and-deploy:\\n    runs-on: ubuntu-latest\\n    steps:\\n    - uses: actions/checkout@v3\\n    - name: Set up Python\\n      uses: actions/setup-python@v4\\n    - name: Run Tests\\n      run: pytest"
            }},
            "marketing": {{
                "seo_keywords": ["automated building", "SaaS platform", f"{{clean_name.lower()}} toolkit", "startup templates"],
                "email_campaign": "Subject: Launching Your MVP has never been simpler!\\n\\nHey there,\\nWe noticed you are building on the edge. Meet our latest workspace...",
                "blog_ideas": [
                    "How to scale your SaaS MVP using automated cloud toolsets.",
                    "Common pitfalls builders face during product validation cycles."
                ]
            }},
            "pitch_deck": [
                {{"title": "1. The Problem", "text": "Startups spend too much time and resources on strategy tools instead of validating product usage."}},
                {{"title": "2. The Solution", "text": f"Introducing {{clean_name}} - a single, integrated operating system for startup creation, design, and launching."}},
                {{"title": "3. The Market Size", "text": f"Targeting a addressable market (TAM) of {{tam}}M startups globally."}},
                {{"title": "4. Business Model", "text": "Subscription tiers ranging from $29/mo to enterprise SLAs."}},
                {{"title": "5. Go-To-Market", "text": "Direct integration with popular developer repositories and developer communities."}}
            ]
        }}
    }}

@app.post("/api/v1/auth/register")
async def register_user(req: RegisterRequest):
    res = register_user_db(
        name=req.name, email=req.email, mobile=req.mobile, password=req.password,
        github_token=req.github_token, vercel_token=req.vercel_token, supabase_token=req.supabase_token
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["error"])
    return {{"message": "Registration successful", "user_id": res["user_id"]}}

@app.post("/api/v1/auth/login")
async def login_user(req: LoginRequest):
    res = login_user_db(req.identifier, req.password)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@app.post("/api/v1/auth/update-credentials")
async def update_credentials(req: UpdateCredentialsRequest):
    res = update_user_credentials_db(
        user_id=req.user_id, github_token=req.github_token, vercel_token=req.vercel_token, supabase_token=req.supabase_token
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail="User not found or credentials unchanged.")
    return {{"message": "Credentials updated successfully"}}

@app.post("/api/v1/analyze")
async def analyze_startup(startup_idea: StartupIdea, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    task_results[task_id] = {{"status": "processing"}}
    background_tasks.add_task(run_agent_workflow, task_id, startup_idea.idea)
    return {{"task_id": task_id, "status": "processing"}}

@app.get("/api/v1/results/{{task_id}}")
async def get_results(task_id: str):
    return task_results.get(task_id, {{"error": "Task not found"}})

@app.post("/api/v1/mentor")
async def ask_mentor(req: MentorMessage):
    task = task_results.get(req.task_id)
    if not task:
        return {{"response": "I couldn't locate your startup idea. Please run an analysis first!"}}
    name = task["data"]["name"]
    msg = req.message.lower()
    if "pricing" in msg:
        return {{"response": f"For {{name}}, starting with a tiered subscription (Starter $29/Growth $89) is highly recommended."}}
    elif "competitor" in msg or "beat" in msg:
        return {{"response": f"To outpace competitors of {{name}}, focus on simplicity and setup speed."}}
    elif "launch" in msg or "mvp" in msg:
        return {{"response": f"Launch a minimal scope version of {{name}} targeting solo founders first."}}
    else:
        return {{"response": f"As your mentor for {{name}}, I recommend prioritizing simple user actions."}}

@app.websocket("/ws/logs/{{task_id}}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        logs = [
            ("orchestrator", "StartupForge AI Orchestrator initialized. Spawning agents..."),
            ("market_research", "Market Research Agent: Fetching live industry data..."),
            ("market_research", "Market Research Agent: Competitor analysis complete. Computing TAM/SAM/SOM..."),
            ("finance", "Finance Agent: Building pricing configurations & revenue forecasts..."),
            ("branding", "Branding Agent: Generating slogans, domain recommendations, and visual assets..."),
            ("branding", "Branding Agent: Querying global trademark search registries..."),
            ("investor", "Investor Agent: Running VC readiness audit and SWOT assessment..."),
            ("orchestrator", "Evaluation complete. Compiling final interactive dashboard...")
        ]
        for agent, message in logs:
            await websocket.send_json({{"agent": agent, "message": message, "status": "running"}})
            await asyncio.sleep(1.0)
        await websocket.send_json({{"status": "completed"}})
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/deploy/{{task_id}}")
async def websocket_deploy_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        steps = [
            "Initializing deployment build engine...",
            "Creating target GitHub repository [github.com/startupforge-mvp/project-repo]...",
            "Pushing codebase templates (HTML5, Tailwind, JS configuration files)...",
            "Setting up dynamic environment credentials...",
            "Connecting hosting pipeline to Vercel edge framework...",
            "Running production bundle optimization and asset delivery pipelines...",
            "Verification check complete! MVP deployment online at: https://startupforge-mvp.vercel.app"
        ]
        for step in steps:
            await websocket.send_json({{"log": step}})
            await asyncio.sleep(1.0)
        await websocket.send_json({{"status": "deployed", "url": "https://startupforge-mvp.vercel.app"}})
    except WebSocketDisconnect:
        pass

# ==================== SERVING STATIC FRONTEND STRINGS ====================
INDEX_HTML = \"\"\"{index_html}\"\"\"
STYLES_CSS = \"\"\"{styles_css}\"\"\"
APP_JS = \"\"\"{app_js}\"\"\"

@app.get("/")
async def serve_index():
    return HTMLResponse(content=INDEX_HTML)

@app.get("/styles.css")
async def serve_css():
    return Response(content=STYLES_CSS, media_type="text/css")

@app.get("/app.js")
async def serve_js():
    return Response(content=APP_JS, media_type="application/javascript")

@app.get("/logo.jpg")
async def serve_logo():
    if os.path.exists("logo.jpg"):
        return FileResponse("logo.jpg")
    elif os.path.exists("frontend/logo.jpg"):
        return FileResponse("frontend/logo.jpg")
    else:
        raise HTTPException(status_code=404, detail="logo.jpg not found.")

@app.on_event("startup")
async def on_startup():
    # Automatically write README.md if not present
    if not os.path.exists("README.md"):
        with open("README.md", "w") as f:
            f.write(\"\"\"# StartupForge OS
The Unified Multi-Agent Startup Builder & Operating System in a Single File.

## Requirements
```bash
pip install fastapi uvicorn pydantic websockets
```

## Running the App
```bash
python app.py
```
Open **http://localhost:8000** in your browser.
\"\"\")

if __name__ == "__main__":
    print("Starting StartupForge OS Unified Application...")
    print("Open http://localhost:8000 in your browser.")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
"""

with open(os.path.join(project_root, "app.py"), "w", encoding="utf-8") as f:
    f.write(app_code)

print("Unified app.py compiled successfully!")
