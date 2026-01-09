from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(prefix="/drivers", tags=["drivers"])

@router.post("/", response_model=schemas.Driver)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    db_driver = models.Driver(**driver.dict())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.get("/", response_model=List[schemas.Driver])
def read_drivers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    drivers = db.query(models.Driver).offset(skip).limit(limit).all()
    return drivers

    return driver

@router.put("/{driver_id}", response_model=schemas.Driver)
def update_driver(driver_id: int, driver_update: schemas.DriverCreate, db: Session = Depends(get_db)):
    db_driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    for key, value in driver_update.dict().items():
        setattr(db_driver, key, value)
    
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.delete("/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    db_driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    db.delete(db_driver)
    db.commit()
    return {"message": "Driver deleted"}

@router.patch("/{driver_id}/status")
def update_driver_status(driver_id: int, status: str, db: Session = Depends(get_db)):
    db_driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    db_driver.status = status
    db.commit()
    return {"message": "Status updated", "status": status}
