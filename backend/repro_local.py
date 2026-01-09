import sys
import os
# Add backend to path
sys.path.append(os.getcwd())

import schemas
import models
from routers import clients
from sqlalchemy.orm import Session

# Mock DB
class MockDB:
    def add(self, x): pass
    def commit(self): pass
    def refresh(self, x): pass

# Data
data = {
  "name": "Test",
  "cnpj": "60.863.708/0001-06",
  "phone": "123",
  "email": "test@test.com",
  # No address field
}

# Create Pydantic model
client_in = schemas.ClientCreate(**data)
print("ClientIn dict keys:", client_in.dict().keys())

# Call logic
try:
    clients.create_client(client_in, MockDB())
    print("Success!")
except Exception as e:
    print("Crash:", e)
