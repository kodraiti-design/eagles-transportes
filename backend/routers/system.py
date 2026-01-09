from fastapi import APIRouter, HTTPException
import subprocess
import os

router = APIRouter(
    prefix="/system",
    tags=["system"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@router.post("/update")
def update_system():
    """
    Executes 'git pull' to fetch the latest changes from the remote repository.
    Requires git to be installed and the project to be a git repo.
    """
    try:
        # Check if .git exists
        # Navigate to root (one level up from backend)
        root_dir = os.path.dirname(BASE_DIR)
        
        if not os.path.exists(os.path.join(root_dir, ".git")):
             return {
                 "success": False, 
                 "message": "Este diretório não é um repositório Git. Impossível atualizar automaticamente.",
                 "detail": "Instale o Git e clone o repositório para usar esta função."
             }

        # Run git pull
        result = subprocess.run(
            ["git", "pull"], 
            cwd=root_dir, 
            capture_output=True, 
            text=True, 
            check=False
        )
        
        if result.returncode == 0:
            return {
                "success": True, 
                "message": "Sistema atualizado com sucesso!", 
                "log": result.stdout
            }
        else:
             return {
                 "success": False, 
                 "message": "Erro ao atualizar.", 
                 "log": result.stderr + "\n" + result.stdout
             }

    except FileNotFoundError:
        return {
            "success": False, 
            "message": "Git não encontrado. Verifique se o Git está instalado no servidor."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
