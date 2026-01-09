import requests
import random
import string

def random_digits(n):
    return ''.join(random.choices(string.digits, k=n))

cnpj = f"{random_digits(2)}.{random_digits(3)}.{random_digits(3)}/0001-{random_digits(2)}"

url = "http://localhost:8000/clients/"
data = {
  "name": f"Test Client {random_digits(5)}",
  "cnpj": cnpj,
  "phone": "(41) 9 9999-9999",
  "email": "test@test.com",
  "cep": "83065568",
  "street": "Rua Test",
  "number": "123",
  "neighborhood": "Bairro",
  "city": "Cidade",
  "state": "PR"
}

print(f"Sending POST with CNPJ {cnpj}")
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
