import models
from database import SessionLocal, engine
import sys

print("Testing Model Instantiation...")
try:
    # Test 1: Clean data
    c1 = models.Client(name="Test1", cnpj="111", phone="1")
    print("Test 1 (Clean) Passed")
    
    # Test 2: Dirty data (with address)
    c2 = models.Client(name="Test2", cnpj="222", phone="2", address="ShouldBeIgnored")
    print("Test 2 (Dirty) Passed - Patch works!")

except Exception as e:
    print(f"CRITICAL MODEL ERROR: {e}")
    sys.exit(1)

print("Testing DB Persistence...")
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    # Test 3: Save to DB
    db.add(c1)
    db.commit()
    print("Test 3 (Save) Passed")
    
    # Clean up
    db.delete(c1)
    db.commit()
except Exception as e:
    print(f"CRITICAL DB ERROR: {e}")
    sys.exit(1)
finally:
    db.close()

print("FULL STACK VERIFICATION PASSED")
