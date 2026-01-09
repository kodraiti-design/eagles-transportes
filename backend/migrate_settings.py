import sqlite3
import os

DB_PATH = "eagles_v3.db"

def migrate():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("Creating system_settings table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE,
                value TEXT,
                updated_at TIMESTAMP
            )
        """)
        
        # Insert or Ignore default placeholder if needed (optional)
        # but better to rely on code logic fallback
        
        conn.commit()
        conn.close()
        print("Table system_settings created successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
