import requests
import json

url = "http://localhost:8000/clients/"
data = {
  "name": "Kodrai Tech Soluções em TI",
  "cnpj": "60.863.708/0001-06",
  "phone": "(41) 9 8504-1613",
  "email": "kodraitech@gmail.com",
  "cep": "83065568",
  "street": "Rua Monsenhor Domingos Salomão Kahel",
  "number": "632",
  "complement": "B",
  "neighborhood": "Rio Pequeno",
  "city": "São José dos Pinhais",
  "state": "PR"
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except requests.exceptions.ConnectionError:
    print("Connection Error! Server might be down.")
except Exception as e:
    print(f"Error: {e}")
