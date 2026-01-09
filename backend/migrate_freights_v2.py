import sqlite3

DB_PATH = "backend/eagles_v3.db"

def migrate():
    print(f"Migrating {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Columns to add
    columns = [
        ("rejection_reason", "TEXT"),
        ("delivery_photos", "TEXT"),
        ("accepted_at", "DATETIME"),
        ("delivered_at", "DATETIME")
    ]
    
    for col_name, col_type in columns:
        try:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE freights ADD COLUMN {col_name} {col_type}")
            print(f"Column {col_name} added.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
