import requests
import json
import os

# Caminho para salvar no frontend
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'public', 'cities.json')

def fetch_and_save_cities():
    print("Baixando cidades do IBGE/BrasilAPI...")
    try:
        # Tenta BrasilAPI primeiro (mais rápido/estável par CORS, mas aqui é script python)
        # IBGE direto é melhor para script server-side
        url = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
        response = requests.get(url)
        response.raise_for_status()
        
        cities_data = response.json()
        
        # Formatar
        formatted_cities = []
        for city in cities_data:
            name = city['nome'].upper()
            uf = city['microrregiao']['mesorregiao']['UF']['sigla']
            formatted_cities.append(f"{name} - {uf}")
            
        formatted_cities.sort()
        
        # Salvar
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(formatted_cities, f, ensure_ascii=False)
            
        print(f"Sucesso! {len(formatted_cities)} cidades salvas em {OUTPUT_PATH}")
        
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    fetch_and_save_cities()
