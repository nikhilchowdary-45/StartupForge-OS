import sqlite3
import os
from pathlib import Path

# Database path in the backend directory
DB_PATH = Path(__file__).resolve().parent.parent / "startupforge.db"

def init_db():
    """Initializes the SQLite database and creates the users table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
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
    """)
    conn.commit()
    conn.close()

def get_db_connection():
    """Returns a SQLite connection dict-factory-enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def register_user_db(name, email, mobile, password, github_token, vercel_token=None, supabase_token=None):
    """Registers a user into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO users (name, email, mobile, password, github_token, vercel_token, supabase_token)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (name, email, mobile, password, github_token, vercel_token, supabase_token)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {"success": True, "user_id": user_id}
    except sqlite3.IntegrityError as e:
        return {"success": False, "error": "Email or Mobile Number already registered."}
    finally:
        conn.close()

def login_user_db(identifier, password):
    """Logs a user in by checking email or mobile matching the password."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM users 
        WHERE (email = ? OR mobile = ?) AND password = ?
        """,
        (identifier, identifier, password)
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "success": True,
            "user": {
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "mobile": row["mobile"],
                "github_token": row["github_token"],
                "vercel_token": row["vercel_token"] or "",
                "supabase_token": row["supabase_token"] or ""
            }
        }
    return {"success": False, "error": "Invalid identifier or password."}

def update_user_credentials_db(user_id, github_token, vercel_token=None, supabase_token=None):
    """Updates user credentials and tokens."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE users 
        SET github_token = ?, vercel_token = ?, supabase_token = ?
        WHERE id = ?
        """,
        (github_token, vercel_token, supabase_token, user_id)
    )
    conn.commit()
    changes = conn.changes()
    conn.close()
    return {"success": True if changes > 0 else False}

# Automatically initialize database when imported
init_db()
