import sqlite3
import os

DB_PATH = "eagles_v3.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    columns = [
        ("billing_status", "TEXT DEFAULT 'PENDING'"),
        ("boleto_id", "TEXT"),
        ("boleto_url", "TEXT"),
        ("boleto_expiry_date", "DATETIME")
    ]
    
    print("Checking columns...")
    cursor.execute("PRAGMA table_info(freights)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    
    for col_name, col_type in columns:
        if col_name not in existing_cols:
            print(f"Adding column {col_name}...")
            try:
                cursor.execute(f"ALTER TABLE freights ADD COLUMN {col_name} {col_type}")
                print(f"Added {col_name}.")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")
            
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
