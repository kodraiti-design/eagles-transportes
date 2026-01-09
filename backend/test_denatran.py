from services.denatran import DenatranClient
import sys

# REPLACE THIS WITH A REAL CPF LINKED TO THE CERTIFICATE
CPF_TESTE = "06768500902" 

def test_consult():
    if CPF_TESTE == "00000000000":
        print("WARNING: Using dummy CPF. Auth will likely fail, but connection will be tested.")
    
    client = DenatranClient(CPF_TESTE)
    
    # Test Plate (Using the one from the example)
    placa = "ABC1D23" 
    
    print(f"Testing consultation for plate {placa}...")
    try:
        resultado = client.consultar_veiculo_por_placa(placa)
        print("SUCCESS! Result:")
        print(resultado)
    except Exception as e:
        print("FAILED.")
        print(f"Error details: {e}")

if __name__ == "__main__":
    test_consult()
