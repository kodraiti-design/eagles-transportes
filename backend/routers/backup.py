from fastapi import APIRouter, HTTPException
import shutil
import os
from datetime import datetime
import glob

router = APIRouter(
    prefix="/backup",
    tags=["backup"]
)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "eagles.db") # Verify exact name
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
BACKUP_ROOT = os.path.join(os.path.dirname(BASE_DIR), "_BACKUPS_DATA")

@router.post("/create")
def create_backup():
    try:
        timestamp = datetime.now().strftime("%Y_%m_%d_%H%M%S")
        backup_dir = os.path.join(BACKUP_ROOT, f"backup_{timestamp}")
        
        os.makedirs(backup_dir, exist_ok=True)
        
        # 1. Backup DB
        # Find the actual DB file. It might be eagles.db or eagles_v2.db
        # I'll check what exists.
        db_files = glob.glob(os.path.join(BASE_DIR, "*.db"))
        for db_file in db_files:
            shutil.copy2(db_file, backup_dir)
            
        # 2. Backup Uploads
        if os.path.exists(UPLOADS_DIR):
            shutil.copytree(UPLOADS_DIR, os.path.join(backup_dir, "uploads"))
            
        return {"message": "Backup criado com sucesso!", "id": f"backup_{timestamp}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
def list_backups():
    if not os.path.exists(BACKUP_ROOT):
        return []
        
    backups = []
    # List directories
    for name in os.listdir(BACKUP_ROOT):
        path = os.path.join(BACKUP_ROOT, name)
        if os.path.isdir(path):
            # Parse timestamp if possible
            try:
                date_str = name.replace("backup_", "")
                date_obj = datetime.strptime(date_str, "%Y_%m_%d_%H%M%S")
                formatted_date = date_obj.strftime("%d/%m/%Y %H:%M")
            except:
                formatted_date = name
                
            # Calculate size? (Optional, maybe too slow)
            backups.append({
                "id": name,
                "date": formatted_date,
                "path": path
            })
            
    # Sort by name desc (newest first)
    return sorted(backups, key=lambda x: x["id"], reverse=True)

@router.post("/restore/{backup_id}")
def restore_backup(backup_id: str):
    source_dir = os.path.join(BACKUP_ROOT, backup_id)
    if not os.path.exists(source_dir):
        raise HTTPException(status_code=404, detail="Backup não encontrado")
        
    try:
        # 1. Restore DB
        # This is the tricky part on Windows. 
        # We try to copy over. If it fails, we assume it's locked.
        
        db_files = glob.glob(os.path.join(source_dir, "*.db"))
        for src_db in db_files:
            filename = os.path.basename(src_db)
            dst_db = os.path.join(BASE_DIR, filename)
            
            # Try atomic replace if possible, or simple copy
            try:
                shutil.copy2(src_db, dst_db)
            except PermissionError:
                 raise HTTPException(status_code=400, detail="O banco de dados está em uso e não pode ser substituído agora. Pare o servidor para restaurar.")
        
        # 2. Restore Uploads
        src_uploads = os.path.join(source_dir, "uploads")
        if os.path.exists(src_uploads):
            # Clear existing uploads? Or merge?
            # Safer to clear to match backup state exactly
            if os.path.exists(UPLOADS_DIR):
                shutil.rmtree(UPLOADS_DIR)
            shutil.copytree(src_uploads, UPLOADS_DIR)
            
        return {"message": "Restauração concluída! Por favor, REINICIE o servidor para garantir que os dados sejam carregados corretamente."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na restauração: {str(e)}")
