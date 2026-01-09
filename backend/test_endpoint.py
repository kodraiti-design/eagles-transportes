import requests

def test_endpoint():
    try:
        r = requests.get("http://localhost:8001/openapi.json")
        if r.status_code == 200:
            data = r.json()
            print("Registered Paths:")
            for path in data.get('paths', {}):
                print(path)
        else:
            print(f"Failed to fetch openapi.json: {r.status_code}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_endpoint()
