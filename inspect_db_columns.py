import sys
import os
sys.path.append(os.getcwd())

# Patch DB path again
import backend.database
db_path = os.path.join(os.getcwd(), 'backend', 'eagles_v3.db')
backend.database.SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

from sqlalchemy import create_engine, inspect
engine = create_engine(f"sqlite:///{db_path}")

print(f"Connecting to {db_path}")
inspector = inspect(engine)
columns = inspector.get_columns('freights')

print("--- Columns in 'freights' table ---")
for c in columns:
    print(f"- {c['name']} ({c['type']})")

expected = ['rejection_reason', 'delivery_photos', 'accepted_at', 'delivered_at', 'observation']
print("\n--- Checking Missing Columns ---")
for e in expected:
    found = any(c['name'] == e for c in columns)
    print(f"{e}: {'FOUND' if found else 'MISSING'}")
