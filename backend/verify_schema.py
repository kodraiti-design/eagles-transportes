from schemas import ClientCreate

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
    c = ClientCreate(**data)
    print("Dict keys:", c.dict().keys())
    if 'address' in c.dict():
        print("ALERT: address IS in dict!")
    else:
        print("address is NOT in dict.")
except Exception as e:
    print("Error instantiating:", e)
