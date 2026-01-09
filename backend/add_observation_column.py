import sqlite3
import os

DB_PATH = "eagles_v3.db"

def add_observation_column():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Checking if 'observation' column exists in 'freights' table...")
        cursor.execute("PRAGMA table_info(freights)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "observation" not in columns:
            print("Adding 'observation' column...")
            cursor.execute("ALTER TABLE freights ADD COLUMN observation TEXT")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'observation' already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_observation_column()
