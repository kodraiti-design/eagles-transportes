import requests
from validate_docbr import CNPJ
import random

cnpj = CNPJ().generate(True) # Generate formatted valid CNPJ

url = "http://localhost:8000/clients/"
data = {
  "name": f"Valid Client {random.randint(1000,9999)}",
  "cnpj": cnpj,
  "phone": "(41) 9 9999-9999",
  "email": "valid@test.com",
  "cep": "83065568",
  "street": "Rua Valid",
  "number": "123",
  "neighborhood": "Bairro",
  "city": "Cidade",
  "state": "PR"
}

print(f"Sending POST with VAILD CNPJ {cnpj}")
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
