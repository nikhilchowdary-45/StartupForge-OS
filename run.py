import uvicorn
import sys
import os

if __name__ == "__main__":
    # Adjust paths so uvicorn can find app.main correctly
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(current_dir, "backend")
    sys.path.insert(0, backend_dir)
    
    print("Starting StartupForge OS (Unified Frontend & Backend)...")
    print("Open http://localhost:8000 in your browser.")
    
    # Start Unified Uvicorn Server
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
