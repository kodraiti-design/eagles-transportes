from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database

router = APIRouter(
    prefix="/templates",
    tags=["templates"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.MessageTemplate])
def read_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    templates = db.query(models.MessageTemplate).offset(skip).limit(limit).all()
    return templates

@router.post("/", response_model=schemas.MessageTemplate)
def create_template(template: schemas.MessageTemplateCreate, db: Session = Depends(get_db)):
    db_template = db.query(models.MessageTemplate).filter(models.MessageTemplate.slug == template.slug).first()
    if db_template:
        raise HTTPException(status_code=400, detail="Template with this slug already exists")
    new_template = models.MessageTemplate(**template.dict())
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template

@router.put("/{template_id}", response_model=schemas.MessageTemplate)
def update_template(template_id: int, template_update: schemas.MessageTemplateUpdate, db: Session = Depends(get_db)):
    db_template = db.query(models.MessageTemplate).filter(models.MessageTemplate.id == template_id).first()
    if not db_template:
         raise HTTPException(status_code=404, detail="Template not found")
    
    if template_update.content is not None:
        db_template.content = template_update.content
    if template_update.is_active is not None:
        db_template.is_active = template_update.is_active
        
    db.commit()
    db.refresh(db_template)
    return db_template

@router.post("/seed", response_model=List[schemas.MessageTemplate])
def seed_templates(db: Session = Depends(get_db)):
    # Initial Default Templates
    defaults = [
        {
            "name": "Oferta para Motorista",
            "slug": "driver_offer",
            "description": "Mensagem inicial oferecendo carga para o motorista",
            "content": """Olá {motorista}, tudo bem?
Aqui é da Eagles Transportes.

Tenho uma carga de *{origem}* para *{destino}*.
Produto: {produto}
Peso: {peso}
Valor: R$ {valor}
Pagamento: {pagamento}

Tem interesse?"""
        },
        {
            "name": "Dados para Cliente",
            "slug": "driver_data_to_client",
            "description": "Enviar dados do motorista/veículo contratado para o cliente",
            "content": """Seguem dados do motorista para a carga de {origem} x {destino}:

Motorista: {motorista}
CPF: {cpf}
ANTT: {antt}
Placa Cavalo: {placa_cavalo}
Carreta: {placa_carreta}
Telefone: {telefone}

Previsão de chegada: {previsao}"""
        },
        {
             "name": "Confirmação de Coleta",
             "slug": "pickup_confirmation",
             "description": "Confirmar ao cliente que o veículo chegou/coletou",
             "content": """Bom dia!
             
Veículo placa *{placa}* já se encontra no local de coleta em {origem}.
Iniciando carregamento.

Qualquer dúvida estou à disposição."""
        }
    ]
    
    results = []
    for t in defaults:
        exists = db.query(models.MessageTemplate).filter(models.MessageTemplate.slug == t["slug"]).first()
        if not exists:
            new_t = models.MessageTemplate(**t)
            db.add(new_t)
            db.commit()
            db.refresh(new_t)
            results.append(new_t)
        else:
            results.append(exists)
            
    return results
