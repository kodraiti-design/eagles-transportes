from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback
import os

from routers import drivers, clients, freights, vehicles, vehicle_types, templates, auth, dashboard, financial, billing, backup, system
import models, database

app = FastAPI(title="Eagles Transportes API", version="1.0.0")

# CORS Configuration
# Allow any origin (http/https) to support local network access (IP addresses)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",  # Allows http://Anything and https://Anything
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from static_config import mount_static
mount_static(app)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        log_path = r"c:\Users\Marcelo Kodrai\Documents\projetos_python\Eagles Transportes\backend\traceback_global.log"
        with open(log_path, "w") as f:
            f.write(f"GLOBAL ERROR: {e}\n")
            traceback.print_exc(file=f)
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# Create Tables
models.Base.metadata.create_all(bind=database.engine)

# Include Routers
app.include_router(drivers.router)
app.include_router(clients.router)
app.include_router(freights.router)
app.include_router(vehicles.router)
app.include_router(vehicle_types.router)
app.include_router(templates.router)
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(financial.router)
app.include_router(billing.router)
app.include_router(backup.router)
app.include_router(system.router)

@app.on_event("startup")
def seed_data():
    db = database.SessionLocal()
    
    # Seed Vehicle Types
    defaults = [
        "BITREM", "BITRUCK", "CARRETA", "CARRETA LST", "COMPLEMENTO", 
        "FIORINO", "GRANELEIRA", "GUINCHO", "HR", "MUNK", 
        "PLATAFORMA", "PORTA CONTAINERS", "PRANCHA", "RH", 
        "SPRINTER", "TOCO", "TOCO/HR", "TRUCK", "VAN", "VUC"
    ]
    
    count = 0
    for name in defaults:
        exists = db.query(models.VehicleType).filter(models.VehicleType.name == name).first()
        if not exists:
            db.add(models.VehicleType(name=name))
            count += 1
    
    # Seed Message Templates
    template_defaults = [
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

    t_count = 0
    for t in template_defaults:
        exists = db.query(models.MessageTemplate).filter(models.MessageTemplate.slug == t["slug"]).first()
        if not exists:
            db.add(models.MessageTemplate(**t))
            t_count += 1
            
    # Seed Admin User
    from routers.auth import get_password_hash
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    hashed_pwd = get_password_hash("admin")
    
    if not admin_user:
        db.add(models.User(
            username="admin", 
            hashed_password=hashed_pwd, 
            role="ADMIN", 
            is_active=True,
            is_online=False
        ))
        print("DEBUG: Seeded admin user")
        count += 1
    else:
        # Update admin password just in case
        admin_user.hashed_password = hashed_pwd
    
    if count > 0 or t_count > 0:
        db.commit()
    
    db.close()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Serve index.html for any unmatched route (SPA)
    index_path = r"../frontend/dist/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not built. Run 'npm run build' in frontend directory."}

if __name__ == "__main__":
    import uvicorn
    print("DEBUG: STARTING MAIN DIRECTLY", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8000)