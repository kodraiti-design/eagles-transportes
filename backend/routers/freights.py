from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from dependencies import check_permission

router = APIRouter(prefix="/freights", tags=["freights"])

@router.post("/", response_model=schemas.Freight)
def create_freight(
    freight: schemas.FreightCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_permission('create_freight'))
):
    # Verify Client exists
    client = db.query(models.Client).filter(models.Client.id == freight.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    db_freight = models.Freight(**freight.dict())
    db.add(db_freight)
    db.commit()
    db.refresh(db_freight)
    return db_freight

@router.get("/", response_model=List[schemas.Freight])
def read_freights(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    freights = db.query(models.Freight).offset(skip).limit(limit).all()
    return freights

@router.get("/{freight_id}", response_model=schemas.Freight)
def read_freight(freight_id: int, db: Session = Depends(get_db)):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    if freight is None:
        raise HTTPException(status_code=404, detail="Freight not found")
    return freight

@router.patch("/{freight_id}/status", response_model=schemas.Freight)
def update_freight_status(freight_id: int, status: str, db: Session = Depends(get_db)):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    if freight is None:
        raise HTTPException(status_code=404, detail="Freight not found")
    
    freight.status = status
    db.commit()
    db.refresh(freight)
    return freight

@router.patch("/{freight_id}/assign/{driver_id}", response_model=schemas.Freight)
def assign_driver(freight_id: int, driver_id: int, db: Session = Depends(get_db)):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    
    if not freight or not driver:
        raise HTTPException(status_code=404, detail="Freight or Driver not found")
        
    freight.driver_id = driver_id
    # do not auto-set to ASSIGNED, let the driver accept it
    db.commit()
    db.refresh(freight)
    return freight

@router.post("/{freight_id}/accept")
def accept_freight(freight_id: int, db: Session = Depends(get_db)):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    if not freight:
        raise HTTPException(status_code=404, detail="Freight not found")
    
    freight.status = "ASSIGNED"
    freight.accepted_at = datetime.now()
    db.commit()
    return {"message": "Freight accepted"}

@router.post("/{freight_id}/reject")
def reject_freight(freight_id: int, reason: str = Body(..., embed=True), db: Session = Depends(get_db)):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    if not freight:
        raise HTTPException(status_code=404, detail="Freight not found")
    
    freight.status = "REJECTED"
    freight.rejection_reason = reason
    db.commit()
    return {"message": "Freight rejected"}

from fastapi import UploadFile, File, Form
import shutil
import os
import json

@router.post("/{freight_id}/deliver")
def deliver_freight(
    freight_id: int, 
    files: List[UploadFile] = File(...), 
    db: Session = Depends(get_db)
):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    if not freight:
        raise HTTPException(status_code=404, detail="Freight not found")
        
    if len(files) < 3:
        raise HTTPException(status_code=400, detail="Minimum of 3 photos required")

    upload_dir = f"uploads/delivery_proofs/{freight_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    saved_paths = []
    
    for file in files:
        file_path = f"{upload_dir}/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_paths.append(file_path)
    
    freight.status = "DELIVERED"
    freight.delivered_at = datetime.now()
    freight.delivery_photos = json.dumps(saved_paths)
    
    db.commit()
    return {"message": "Delivery confirmed", "photos": saved_paths}

from dependencies import check_permission

# ... (imports)

@router.delete("/{freight_id}")
def delete_freight(
    freight_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_permission('delete_freight'))
):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    if not freight:
        raise HTTPException(status_code=404, detail="Freight not found")
    
    db.delete(freight)
    db.commit()
    return {"message": "Freight deleted"}

@router.put("/{freight_id}", response_model=schemas.Freight)
def update_freight(
    freight_id: int, 
    freight_data: schemas.FreightCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_permission('edit_freight'))
):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    if not freight:
        raise HTTPException(status_code=404, detail="Freight not found")

    # Update simple fields
    freight.client_id = freight_data.client_id
    freight.origin = freight_data.origin
    freight.destination = freight_data.destination
    freight.pickup_date = freight_data.pickup_date
    freight.delivery_date = freight_data.delivery_date
    freight.valor_motorista = freight_data.valor_motorista
    freight.valor_cliente = freight_data.valor_cliente
    freight.observation = freight_data.observation
    
    # Allow manual status override if provided in payload (FreightCreate usually has 'status' as optional default)
    # However, FreightCreate might have default='RECRUITING'. We should be careful not to reset status unless intended.
    # Given the requirements, user wants to "change status". So we will respect the passed status.
    freight.status = freight_data.status

    db.commit()
    db.refresh(freight)
    return freight
