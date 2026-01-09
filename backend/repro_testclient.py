from fastapi.testclient import TestClient
from main import app
import sys

client = TestClient(app)

data = {
  "name": "Test Client",
  "cnpj": "60.863.708/0001-06",
  "phone": "(41) 9 9999-9999",
  "email": "test@test.com",
  "cep": "83065568",
  "street": "Rua Test",
  "number": "123",
  "neighborhood": "Bairro",
  "city": "Cidade",
  "state": "PR"
}

print("Sending POST via TestClient...")
try:
    response = client.post("/clients/", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"CRITICAL TEST CLIENT ERROR: {e}")
    import traceback
    traceback.print_exc()
