import requests
import os

# Configuration paths
BASE_CERT_PATH = r"C:\Users\Marcelo Kodrai\Documents\projetos_python\Eagles Transportes\Certificado_Digital"
CERT_PATH = os.path.join(BASE_CERT_PATH, "certificado.pem")
KEY_PATH = os.path.join(BASE_CERT_PATH, "chave.key")

class DenatranClient:
    def __init__(self, cpf_usuario: str):
        # Update endpoint based on SERPRO documentation
        self.base_url = "https://wsdenatran.estaleiro.serpro.gov.br/v1"
        # Remove punctuation from CPF just in case
        self.cpf_usuario = "".join(filter(str.isdigit, cpf_usuario))
        self.cert = (CERT_PATH, KEY_PATH)

    def consultar_veiculo_por_placa(self, placa: str) -> dict:
        """
        Consults vehicle details by license plate using SERPRO API.
        """
        placa = placa.replace("-", "").upper()

        url = f"{self.base_url}/veiculos/placa/{placa}"

        headers = {
            "Accept": "application/json",
            "x-cpf-usuario": self.cpf_usuario
        }

        try:
            print(f"DEBUG: Consulting DENATRAN for plate {placa} with CPF {self.cpf_usuario}...")
            response = requests.get(
                url,
                headers=headers,
                cert=self.cert,
                timeout=20
            )
            
            if response.status_code != 200:
                print(f"DEBUG: Denatran Error {response.status_code}: {response.text}")
                raise Exception(f"Erro {response.status_code} - {response.text}")

            dados = response.json()
            
            # Map response to simpler format
            return {
                "placa": dados.get("placa"),
                "modelo": dados.get("marcaModelo"),
                "ano_modelo": dados.get("anoModelo"),
                "ano_fabricacao": dados.get("anoFabricacao"),
                "cor": dados.get("cor"),
                "chassi": dados.get("chassi"),  # Extra useful info
                "municipio": dados.get("municipio"),
                "uf": dados.get("uf")
            }
            
        except Exception as e:
            print(f"DEBUG: Exception in DenatranClient: {e}")
            raise e
