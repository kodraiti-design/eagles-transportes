import sqlite3
import os

DB_PATH = "eagles_v3.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(freights)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if "observation" not in columns:
        print("Adding 'observation' column...")
        try:
            cursor.execute("ALTER TABLE freights ADD COLUMN observation TEXT")
            print("Success.")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("'observation' column already exists.")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
