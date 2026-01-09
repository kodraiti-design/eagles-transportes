import sqlite3

DB_PATH = "eagles_v3.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if status column exists
        cursor.execute("PRAGMA table_info(drivers)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "status" not in columns:
            print("Adding 'status' column...")
            cursor.execute("ALTER TABLE drivers ADD COLUMN status TEXT DEFAULT 'ACTIVE'")
            
            if "is_blocked" in columns:
                print("Migrating is_blocked data...")
                cursor.execute("UPDATE drivers SET status = 'INACTIVE' WHERE is_blocked = 1")
                cursor.execute("UPDATE drivers SET status = 'ACTIVE' WHERE is_blocked = 0")
                
            conn.commit()
            print("Migration successful.")
        else:
            print("'status' column already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
