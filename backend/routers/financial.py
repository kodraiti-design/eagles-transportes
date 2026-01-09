from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
import models, schemas
from database import get_db
from routers.auth import get_current_active_user

router = APIRouter(
    prefix="/financial",
    tags=["financial"],
    responses={404: {"description": "Not found"}},
)

# --- Categories Endpoints ---

@router.get("/categories", response_model=List[schemas.FinancialCategory])
def read_categories(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return db.query(models.FinancialCategory).all()

@router.post("/categories", response_model=schemas.FinancialCategory)
def create_category(category: schemas.FinancialCategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Check if exists
    exists = db.query(models.FinancialCategory).filter(models.FinancialCategory.name == category.name).first()
    if exists:
        return exists
    
    db_cat = models.FinancialCategory(**category.dict(), is_system=False)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/categories/{id}")
def delete_category(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    cat = db.query(models.FinancialCategory).filter(models.FinancialCategory.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system category")
    
    db.delete(cat)
    db.commit()
    return {"ok": True}

# --- History Endpoint ---

@router.get("/history")
def get_financial_history(
    months: int = 12,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Calculate start date
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30*months)
    
    # Query transactions in range
    transactions = db.query(models.FinancialTransaction).filter(
        models.FinancialTransaction.date >= start_date
    ).all()
    
    # Aggregate by Month
    history = {} # "YYYY-MM": {income: 0, expense: 0}
    
    # Initialize last 12 months with 0 to ensure continuity in charts
    for i in range(months):
        d = end_date - timedelta(days=30*i)
        key = d.strftime("%Y-%m")
        history[key] = {"date": key, "income": 0, "expense": 0}

    for t in transactions:
        key = t.date.strftime("%Y-%m")
        if key not in history:
             history[key] = {"date": key, "income": 0, "expense": 0}
             
        if t.type == 'INCOME':
            history[key]["income"] += t.amount
        elif t.type == 'EXPENSE':
            history[key]["expense"] += t.amount
            
    # Convert to list and sort
    result = list(history.values())
    result.sort(key=lambda x: x['date'])
    
    return result

@router.get("/summary")
def get_financial_summary(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.FinancialTransaction)
    
    if month and year:
        query = query.filter(
            func.extract('month', models.FinancialTransaction.date) == month,
            func.extract('year', models.FinancialTransaction.date) == year
        )
    elif year:
        query = query.filter(func.extract('year', models.FinancialTransaction.date) == year)
        
    transactions = query.all()
    
    total_income = sum(t.amount for t in transactions if t.type == 'INCOME')
    total_expense = sum(t.amount for t in transactions if t.type == 'EXPENSE')
    total_payable = sum(t.amount for t in transactions if t.type == 'EXPENSE' and t.status == 'PENDING')
    total_receivable = sum(t.amount for t in transactions if t.type == 'INCOME' and t.status == 'PENDING')
    
    # Category breakdown for charts
    categories = {}
    for t in transactions:
        if t.type == 'EXPENSE':
            cat = t.category or "Uncategorized"
            categories[cat] = categories.get(cat, 0) + t.amount

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "total_payable": total_payable,
        "total_receivable": total_receivable,
        "categories": [{"name": k, "value": v} for k, v in categories.items()]
    }

@router.get("/transactions", response_model=List[schemas.FinancialTransaction])
def read_transactions(
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.FinancialTransaction)
    if type:
        query = query.filter(models.FinancialTransaction.type == type)
    if status:
        query = query.filter(models.FinancialTransaction.status == status)
        
    return query.order_by(models.FinancialTransaction.date.desc()).offset(skip).limit(limit).all()

@router.post("/transactions", response_model=schemas.FinancialTransaction)
def create_transaction(
    transaction: schemas.FinancialTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_transaction = models.FinancialTransaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.patch("/transactions/{transaction_id}", response_model=schemas.FinancialTransaction)
def update_transaction(
    transaction_id: int,
    transaction_update: schemas.FinancialTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_transaction = db.query(models.FinancialTransaction).filter(models.FinancialTransaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    update_data = transaction_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
        
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_transaction = db.query(models.FinancialTransaction).filter(models.FinancialTransaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.delete(db_transaction)
    db.commit()
    return {"ok": True}
