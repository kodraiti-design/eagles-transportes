from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import requests
import os
import json
from datetime import datetime, timedelta

from database import get_db
import models
from routers.auth import get_current_user
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/billing",
    tags=["billing"]
)

# Default to Sandbox if not specified
DEFAULT_ASAAS_API_URL = "https://sandbox.asaas.com/api/v3"

def get_asaas_config(db_session=None):
    if not db_session:
        # Emergency/Fallback if no session provided (should rarely happen in routes)
        return os.getenv("ASAAS_API_KEY", ""), os.getenv("ASAAS_API_URL", DEFAULT_ASAAS_API_URL)
    
    # Try fetch from DB
    try:
        key_listing = db_session.query(models.SystemSetting).filter(models.SystemSetting.key == "ASAAS_API_KEY").first()
        url_listing = db_session.query(models.SystemSetting).filter(models.SystemSetting.key == "ASAAS_API_URL").first()
        
        db_key = key_listing.value if key_listing else None
        db_url = url_listing.value if url_listing else None
        
        # Fallback to env
        final_key = db_key if db_key else os.getenv("ASAAS_API_KEY", "")
        final_url = db_url if db_url else os.getenv("ASAAS_API_URL", DEFAULT_ASAAS_API_URL)
        
        return final_key, final_url
    except:
        return os.getenv("ASAAS_API_KEY", ""), os.getenv("ASAAS_API_URL", DEFAULT_ASAAS_API_URL)

def get_headers(db: Session = None):
    key, url = get_asaas_config(db)
    return {
        "access_token": key,
        "Content-Type": "application/json"
    }

class BoletoRequest(BaseModel):
    value: float
    due_date: str # YYYY-MM-DD
    description: Optional[str] = None

# Helper to find or create customer in Asaas
def get_or_create_customer(client: models.Client, db: Session):
    # Config
    api_key, api_url = get_asaas_config(db)

    if not api_key:
        raise HTTPException(status_code=500, detail="Asaas API Key not configured")

    # 1. Search by CPF/CNPJ
    cpf_cnpj = client.cnpj.replace(".", "").replace("-", "").replace("/", "") if client.cnpj else ""
    if not cpf_cnpj:
         raise HTTPException(status_code=400, detail="Cliente sem CNPJ/CPF cadastrado")

    search_url = f"{api_url}/customers?cpfCnpj={cpf_cnpj}"
    try:
        res = requests.get(search_url, headers=get_headers(db))
        if res.status_code == 200:
            data = res.json()
            if data.get("data"):
                return data["data"][0]["id"]
    except Exception as e:
        print(f"Error searching customer: {e}")

    # 2. Create if not found
    payload = {
        "name": client.name,
        "cpfCnpj": cpf_cnpj,
        "email": client.email or "financeiro@eagles.com.br", # Fallback email
        "mobilePhone": client.phone or None,
        "postalCode": client.cep or None,
        "address": client.street or None,
        "addressNumber": client.number or None,
        "province": client.neighborhood or None,
        "notificationDisabled": False,
    }
    
    
    try:
        res = requests.post(f"{api_url}/customers", headers=get_headers(db), json=payload)
        if res.status_code == 200:
            return res.json()["id"]
        elif res.status_code == 400:
             # Handle possible existing customer error if search failed but create says exists
             err = res.json()
             if "customer_exists" in str(err):
                  # Fallback search again? Or just error.
                  pass
             raise HTTPException(status_code=400, detail=f"Erro Asaas: {res.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar cliente no Asaas: {str(e)}")
        
    raise HTTPException(status_code=500, detail="Falha desconhecida ao obter cliente Asaas")

@router.get("/pending", response_model=List[dict])
def get_pending_billing(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Freights that are DELIVERED but billing_status is PENDING or None
    freights = db.query(models.Freight).filter(
        models.Freight.status == "DELIVERED",
        (models.Freight.billing_status == "PENDING") | (models.Freight.billing_status == None)
    ).all()
    
    # Return simplified list
    return [{
        "id": f.id,
        "client_name": f.client.name,
        "origin": f.origin,
        "destination": f.destination,
        "valor_cliente": f.valor_cliente,
        "delivery_date": f.delivery_date
    } for f in freights]

@router.get("/issued", response_model=List[dict])
def get_issued_billing(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Freights with generated boletos
    freights = db.query(models.Freight).filter(
        models.Freight.billing_status.in_(["ISSUED", "PAID", "OVERDUE", "RECEIVED", "CONFIRMED"])
    ).all()
    
    return [{
        "id": f.id,
        "client_name": f.client.name,
        "origin": f.origin,
        "destination": f.destination,
        "valor_cliente": f.valor_cliente,
        "delivery_date": f.delivery_date,
        "billing_status": f.billing_status,
        "boleto_url": f.boleto_url,
        "boleto_expiry": f.boleto_expiry_date
    } for f in freights]

@router.post("/emit/{freight_id}")
def emit_boleto(freight_id: int, req: BoletoRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    freight = db.query(models.Freight).filter(models.Freight.id == freight_id).first()
    if not freight:
        raise HTTPException(status_code=404, detail="Frete não encontrado")
    
    if freight.billing_status == "ISSUED" or freight.billing_status == "PAID":
        raise HTTPException(status_code=400, detail="Boleto já emitido para este frete")
        
    if not freight.client:
        raise HTTPException(status_code=400, detail="Frete sem cliente associado")

    # 1. Get Customer ID with DB session
    customer_id = get_or_create_customer(freight.client, db)
    
    # 2. Create Payment (Boleto)
    payload = {
        "customer": customer_id,
        "billingType": "BOLETO",
        "value": req.value,
        "dueDate": req.due_date,
        "description": req.description or f"Frete Eagles Transportes - Origem: {freight.origin} / Destino: {freight.destination}",
        "externalReference": str(freight.id),
        "postalService": False 
    }
    
    try:
        api_key, api_url = get_asaas_config(db)
        res = requests.post(f"{api_url}/payments", headers=get_headers(db), json=payload)
        if res.status_code == 200:
            data = res.json()
            
            # Update Freight
            freight.boleto_id = data["id"]
            freight.boleto_url = data["bankSlipUrl"]
            freight.boleto_expiry_date = datetime.strptime(req.due_date, "%Y-%m-%d")
            freight.billing_status = "ISSUED"
            
            # Also Create a Financial Transaction (Receivable)
            transaction = models.FinancialTransaction(
                type="INCOME",
                category="Frete",
                description=f"Faturamento Frete #{freight.id} - {freight.client.name}",
                amount=req.value,
                date=datetime.now(),
                status="PENDING",
                related_freight_id=freight.id
            )
            db.add(transaction)
            
            db.commit()
            return {"success": True, "boleto_url": data["bankSlipUrl"]}
        else:
            raise HTTPException(status_code=400, detail=f"Erro Asaas: {res.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de conexão: {str(e)}")


# Settings Endpoints

class AsaasSettings(BaseModel):
    api_key: str
    environment: str # 'SANDBOX' or 'PRODUCTION'

@router.get("/config")
def get_asaas_settings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    key, url = get_asaas_config(db)
    env = "PRODUCTION" if "api.asaas.com" in url else "SANDBOX"
    # Obfuscate key for security
    masked_key = f"{key[:10]}...{key[-5:]}" if key and len(key) > 15 else ""
    return {"api_key": masked_key, "environment": env}

class WebhookEvent(BaseModel):
    event: str
    payment: dict

@router.post("/webhook")
def asaas_webhook(event: WebhookEvent, db: Session = Depends(get_db)):
    """Receives and processes Asaas webhooks"""
    payment_id = event.payment.get("id")
    status_map = {
        "PAYMENT_RECEIVED": "PAID",
        "PAYMENT_CONFIRMED": "PAID",
        "PAYMENT_OVERDUE": "OVERDUE",
        "PAYMENT_REFUNDED": "CANCELLED"
    }
    
    new_status = status_map.get(event.event)
    
    if new_status and payment_id:
        freight = db.query(models.Freight).filter(models.Freight.boleto_id == payment_id).first()
        if freight:
            freight.billing_status = new_status
            
            # Update Financial Transaction
            if new_status == "PAID":
                transaction = db.query(models.FinancialTransaction).filter(models.FinancialTransaction.related_freight_id == freight.id).first()
                if transaction:
                    transaction.status = "COMPLETED"
                    transaction.date = datetime.now() # Update to actual payment date?
            
            db.commit()
    
    return {"received": True}

@router.post("/sync")
def sync_billing_status(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Manually updates status from Asaas"""
    api_key, api_url = get_asaas_config(db)
    headers = {"access_token": api_key}
    
    # Get all non-finalized freights that have a boleto
    freights = db.query(models.Freight).filter(
        models.Freight.billing_status.in_(["ISSUED", "OVERDUE", "PENDING"]),
        models.Freight.boleto_id != None
    ).all()
    
    updated_count = 0
    
    for f in freights:
        try:
            res = requests.get(f"{api_url}/payments/{f.boleto_id}", headers=headers)
            if res.status_code == 200:
                data = res.json()
                asaas_status = data.get("status")
                
                # Map Asaas -> Local
                new_status = f.billing_status
                if asaas_status in ["RECEIVED", "CONFIRMED"]:
                    new_status = "PAID"
                elif asaas_status == "OVERDUE":
                    new_status = "OVERDUE"
                elif asaas_status == "PENDING":
                    # Check duplicate logic if needed, otherwise stay ISSUED/PENDING
                    new_status = "ISSUED" 
                
                if new_status != f.billing_status:
                    f.billing_status = new_status
                    
                    # Update transaction if PAID
                    if new_status == "PAID":
                        transaction = db.query(models.FinancialTransaction).filter(models.FinancialTransaction.related_freight_id == f.id).first()
                        if transaction:
                            transaction.status = "COMPLETED"
                            
                    updated_count += 1
        except Exception as e:
            print(f"Error syncing freight {f.id}: {e}")
            continue
            
    db.commit()
    return {"message": f"Sincronização concluída. {updated_count} boletos atualizados."}

@router.post("/config")
def update_asaas_settings(settings: AsaasSettings, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Update/Create Key
    key_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "ASAAS_API_KEY").first()
    if not key_setting:
        key_setting = models.SystemSetting(key="ASAAS_API_KEY", value=settings.api_key)
        db.add(key_setting)
    else:
        key_setting.value = settings.api_key
        
    # 2. Update/Create URL
    url_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "ASAAS_API_URL").first()
    target_url = "https://api.asaas.com/api/v3" if settings.environment == "PRODUCTION" else "https://sandbox.asaas.com/api/v3"
    
    if not url_setting:
        url_setting = models.SystemSetting(key="ASAAS_API_URL", value=target_url)
        db.add(url_setting)
    else:
        url_setting.value = target_url
        
    db.commit()
    return {"message": "Configurações atualizadas com sucesso"}
