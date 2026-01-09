import sys
import os
from datetime import datetime
from sqlalchemy import func

sys.path.append(os.getcwd())
import backend.models as models
import backend.database as database

# Manually setup DB connection to avoid relative path issues from imports
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_path = os.path.join(os.getcwd(), 'backend', 'eagles_v3.db')
db_url = f"sqlite:///{db_path}"
print(f"Connecting to: {db_url}")

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()

now = datetime.now()
start_of_month = datetime(now.year, now.month, 1)

print(f"--- Inspecting Revenue (Start of Month: {start_of_month}) ---")

query = session.query(models.Freight).filter(
    models.Freight.pickup_date >= start_of_month,
    models.Freight.status.notin_(['REJECTED', 'QUOTED'])
)

freights = query.all()
total_cliente = 0
total_motorista = 0

print(f"{'ID':<5} | {'Date':<10} | {'Status':<12} | {'Val. Cliente':<12} | {'Val. Motorista':<12} | {'Origin'}")
print("-" * 80)

for f in freights:
    v_cli = f.valor_cliente if f.valor_cliente else 0
    v_mot = f.valor_motorista if f.valor_motorista else 0
    
    total_cliente += v_cli
    total_motorista += v_mot
    
    d_str = f.pickup_date.strftime("%d/%m") if f.pickup_date else "N/A"
    
    print(f"{f.id:<5} | {d_str:<10} | {f.status:<12} | R$ {v_cli:,.2f}    | R$ {v_mot:,.2f}      | {f.origin}")

print("-" * 80)
print(f"TOTAL CLIENTE (Dashboard): R$ {total_cliente:,.2f}")
print(f"TOTAL MOTORISTA          : R$ {total_motorista:,.2f}")
