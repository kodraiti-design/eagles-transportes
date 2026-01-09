import sqlite3
import os

# Ensure we use the exact same path relative to where this script is run
# Assuming running from root or backend, we'll try to find the DB.
DB_FILES = ["backend/eagles_v3.db", "eagles_v3.db"]
TARGET_DB = None

for db in DB_FILES:
    if os.path.exists(db):
        TARGET_DB = db
        break

if not TARGET_DB:
    # If not found, maybe create it in backend?
    TARGET_DB = "backend/eagles_v3.db"
    print("Database not found, creating new one at backend/eagles_v3.db")

print(f"Migrating {TARGET_DB}...")

conn = sqlite3.connect(TARGET_DB)
cursor = conn.cursor()

# 1. Freights Table Columns
columns_to_add = [
    ("rejection_reason", "VARCHAR"),
    ("delivery_photos", "VARCHAR"),
    ("accepted_at", "DATETIME"),
    ("delivered_at", "DATETIME")
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE freights ADD COLUMN {col_name} {col_type}")
        print(f"Added column {col_name}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {col_name} already exists")
        else:
            print(f"Error adding {col_name}: {e}")

# 2. Users Table
# We will use SQLAlchemy to create the table properly if it's missing, 
# or use raw SQL here for simplicity.
create_users_sql = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR UNIQUE,
    hashed_password VARCHAR,
    role VARCHAR DEFAULT 'OPERATOR',
    permissions VARCHAR DEFAULT '',
    is_active BOOLEAN DEFAULT 1,
    is_online BOOLEAN DEFAULT 0,
    last_seen DATETIME,
    created_at DATETIME
);
"""
cursor.execute(create_users_sql)
print("Ensured users table exists")

# 3. Create indices for Users
try:
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_username ON users (username)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_id ON users (id)")
    print("Created user indices")
except Exception as e:
    print(f"Index creation warning: {e}")

conn.commit()
conn.close()
print("Force migration complete.")
