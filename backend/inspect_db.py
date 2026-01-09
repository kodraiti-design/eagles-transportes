import sqlite3
import os

def inspect():
    db = "eagles.db"
    if not os.path.exists(db):
        print("DB not found")
        return
        
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables:", tables)
    
    for t in tables:
        table_name = t[0]
        print(f"\nSchema for {table_name}:")
        cursor.execute(f"PRAGMA table_info({table_name})")
        cols = cursor.fetchall()
        for c in cols:
            print(c)
            
    conn.close()

if __name__ == "__main__":
    inspect()
