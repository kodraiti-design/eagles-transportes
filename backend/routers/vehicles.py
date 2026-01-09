from fastapi import APIRouter, HTTPException
from services.denatran import DenatranClient

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

# TODO: Load this from a secure config or environment variable
# For now, we will ask the user to provide it or update it here.
DEFAULT_CPF_USER = "06768500902" 

@router.get("/{placa}")
def consult_vehicle(placa: str):
    """
    Consults vehicle info by license plate using DENATRAN API.
    """
    try:
        # Instantiate client with the system user's CPF
        client = DenatranClient(DEFAULT_CPF_USER)
        data = client.consultar_veiculo_por_placa(placa)
        return data
    except Exception as e:
        # Check if it's our known 401 error
        error_msg = str(e)
        if "401" in error_msg:
             raise HTTPException(status_code=500, detail="Erro de Autenticação com Denatran (CPF inválido ou não autorizado). Verifique a configuração.")
        elif "404" in error_msg:
             raise HTTPException(status_code=404, detail="Veículo não encontrado.")
        
        raise HTTPException(status_code=500, detail=f"Erro na consulta: {error_msg}")
