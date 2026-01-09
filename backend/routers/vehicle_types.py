from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database

router = APIRouter(prefix="/vehicle_types", tags=["vehicle_types"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.VehicleType])
def read_vehicle_types(db: Session = Depends(get_db)):
    return db.query(models.VehicleType).all()

@router.post("/", response_model=schemas.VehicleType)
def create_vehicle_type(vehicle_type: schemas.VehicleTypeCreate, db: Session = Depends(get_db)):
    db_vt = models.VehicleType(name=vehicle_type.name)
    db.add(db_vt)
    db.commit()
    db.refresh(db_vt)
    return db_vt

@router.put("/{type_id}", response_model=schemas.VehicleType)
def update_vehicle_type(type_id: int, vehicle_type: schemas.VehicleTypeCreate, db: Session = Depends(get_db)):
    db_vt = db.query(models.VehicleType).filter(models.VehicleType.id == type_id).first()
    if not db_vt:
        raise HTTPException(status_code=404, detail="Vehicle Type not found")
    
    db_vt.name = vehicle_type.name
    db.commit()
    db.refresh(db_vt)
    return db_vt

@router.delete("/{type_id}")
def delete_vehicle_type(type_id: int, db: Session = Depends(get_db)):
    db_vt = db.query(models.VehicleType).filter(models.VehicleType.id == type_id).first()
    if not db_vt:
        raise HTTPException(status_code=404, detail="Vehicle Type not found")
    
    db.delete(db_vt)
    db.commit()
    return {"message": "Vehicle Type deleted"}
