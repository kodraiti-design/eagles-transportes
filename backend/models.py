from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./eagles_v3.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="OPERATOR") # ADMIN, OPERATOR
    permissions = Column(String, default="") # JSON string or comma-separated
    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    cpf = Column(String, unique=True, index=True)
    antt = Column(String)
    vehicle_plate = Column(String)
    vehicle_type = Column(String) # Truck, Carreta, etc.
    pix_key = Column(String, nullable=True) # For payments
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE, PENDING
    
    # Documents paths
    cnh_path = Column(String, nullable=True)
    address_proof_path = Column(String, nullable=True)
    crlv_path = Column(String, nullable=True)
    
    freights = relationship("Freight", back_populates="driver")

class Client(Base):
    __tablename__ = "clients"

    # Patch to ignore legacy address field
    def __init__(self, **kwargs):
        if 'address' in kwargs:
            del kwargs['address']
        super().__init__(**kwargs)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # Corporate Name
    cnpj = Column(String, unique=True, index=True)
    email = Column(String)
    phone = Column(String)
    
    # Address Fields
    cep = Column(String)
    street = Column(String)
    number = Column(String)
    complement = Column(String)
    neighborhood = Column(String)
    city = Column(String)
    state = Column(String)
    
    freights = relationship("Freight", back_populates="client")

class Freight(Base):
    __tablename__ = "freights"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    origin = Column(String)
    destination = Column(String)
    pickup_date = Column(DateTime)
    delivery_date = Column(DateTime)
    
    valor_motorista = Column(Float)
    valor_cliente = Column(Float)
    
    status = Column(String, default="QUOTED") # QUOTED, RECRUITING, ASSIGNED, LOADING, IN_TRANSIT, DELIVERED, REJECTED
    
    # Details
    observation = Column(String, nullable=True)

    # For integration references
    cte_number = Column(String, nullable=True)
    
    # Driver Acceptance & Delivery Logic
    rejection_reason = Column(String, nullable=True)
    delivery_photos = Column(String, nullable=True) # JSON list of paths
    accepted_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Billing / Boleto Info
    billing_status = Column(String, default="PENDING") # PENDING, ISSUED, PAID, CANCELLED
    boleto_id = Column(String, nullable=True)
    boleto_url = Column(String, nullable=True)
    boleto_expiry_date = Column(DateTime, nullable=True)
    
    client = relationship("Client", back_populates="freights")
    driver = relationship("Driver", back_populates="freights")

class FinancialCategory(Base):
    __tablename__ = "financial_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String) # INCOME, EXPENSE
    is_system = Column(Boolean, default=False) # If true, cannot be deleted (e.g. basic categories)
    created_at = Column(DateTime, default=datetime.now)

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # INCOME, EXPENSE
    category = Column(String) # FIXED, VARIABLE, FREIGHT, MAINTENANCE, SALARY, FUEL
    description = Column(String)
    amount = Column(Float)
    date = Column(DateTime, default=datetime.now)
    status = Column(String, default="PENDING") # PAID, PENDING, OVERDUE
    
    # Optional relation to a freight (e.g. for automatic expense generation)
    related_freight_id = Column(Integer, ForeignKey("freights.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Quotation(BaseModel if False else Base): # Hack to avoid linter confusion if needed, but standard Base is fine
    __tablename__ = "quotations"
    
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String) # Can be a prospect client
    origin = Column(String)
    destination = Column(String)
    vehicle_type = Column(String)
    weight_kg = Column(Float, nullable=True)
    value_goods = Column(Float, nullable=True)
    
    calculated_cost = Column(Float)
    final_price = Column(Float)
    status = Column(String, default="DRAFT")

class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g. "Oferta Motorista"
    slug = Column(String, unique=True, index=True) # e.g. "driver_offer"
    content = Column(String) # Text content with variables
    description = Column(String, nullable=True) # User help text
    is_active = Column(Boolean, default=True)

class VehicleType(Base):
    __tablename__ = "vehicle_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True) # e.g. "ASAAS_API_KEY"
    value = Column(String)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

Base.metadata.create_all(bind=engine)
