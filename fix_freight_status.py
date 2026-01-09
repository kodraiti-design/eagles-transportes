import sqlite3
import os

db_path = 'backend/eagles_v3.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("UPDATE freights SET status='RECRUITING' WHERE id=2")
conn.commit()
print("Freight 2 reset to RECRUITING successfully.")
conn.close()
