from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Driver Schemas
class DriverBase(BaseModel):
    name: str
    phone: str
    cpf: str
    antt: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_type: Optional[str] = None
    pix_key: Optional[str] = None
    status: str = "ACTIVE"

class DriverCreate(DriverBase):
    pass

class Driver(DriverBase):
    id: int
    status: str
    cnh_path: Optional[str]
    address_proof_path: Optional[str]
    crlv_path: Optional[str]

    class Config:
        orm_mode = True

# Client Schemas
from pydantic import BaseModel, validator
from typing import Optional
from validate_docbr import CPF, CNPJ

class ClientBase(BaseModel):
    name: str
    cnpj: str
    email: str | None = None
    phone: str
    cep: str | None = None
    street: str | None = None
    number: str | None = None
    complement: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    # address field removed

    @validator('cnpj')
    def validate_document(cls, v):
        try:
            # Remove non-digits
            clean_doc = "".join([d for d in v if d.isdigit()])
            
            if len(clean_doc) == 11:
                cpf = CPF()
                if not cpf.validate(clean_doc):
                    raise ValueError('CPF inválido')
                return clean_doc
            elif len(clean_doc) == 14:
                cnpj = CNPJ()
                if not cnpj.validate(clean_doc):
                    raise ValueError('CNPJ inválido')
                return clean_doc
            else:
                 raise ValueError('Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos')
        except ValueError as ve:
             raise ve
        except Exception as e:
            import traceback
            log_path = r"c:\Users\Marcelo Kodrai\Documents\projetos_python\Eagles Transportes\backend\traceback_schema.log"
            with open(log_path, "w") as f:
                f.write(f"SCHEMA ERROR: {e}\n")
                traceback.print_exc(file=f)
            raise e

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    class Config:
        orm_mode = True

# Freight Schemas
class FreightBase(BaseModel):
    client_id: int
    origin: str
    destination: str
    pickup_date: datetime
    delivery_date: datetime
    valor_motorista: float
    valor_cliente: float
    status: Optional[str] = "QUOTED"
    observation: Optional[str] = None
    cte_number: Optional[str] = None

class FreightCreate(FreightBase):
    pass

class Freight(FreightBase):
    id: int
    driver_id: Optional[int] = None
    driver: Optional[Driver] = None
    client: Optional[Client] = None
    
    rejection_reason: Optional[str] = None
    delivery_photos: Optional[str] = None
    accepted_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    # Billing
    billing_status: Optional[str] = "PENDING"
    boleto_id: Optional[str] = None
    boleto_url: Optional[str] = None
    boleto_expiry_date: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Quotation Schemas
class QuotationBase(BaseModel):
    client_name: str
    origin: str
    destination: str
    vehicle_type: str
    weight_kg: Optional[float]
    value_goods: Optional[float]
    calculated_cost: float
    final_price: float

class QuotationCreate(QuotationBase):
    pass

class Quotation(QuotationBase):
    id: int
    status: str
    class Config:
        orm_mode = True

# Vehicle Types Schemas
class VehicleTypeBase(BaseModel):
    name: str

class VehicleTypeCreate(VehicleTypeBase):
    pass

class VehicleType(VehicleTypeBase):
    id: int
    class Config:
        orm_mode = True

# Message Template Schemas
class MessageTemplateBase(BaseModel):
    name: str
    slug: str
    content: str
    description: Optional[str] = None
    is_active: bool

class UserBase(BaseModel):
    username: str
    role: str = "OPERATOR"
    permissions: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    is_online: bool
    last_seen: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginData(BaseModel):
    username: str
    password: str = True

class MessageTemplateCreate(MessageTemplateBase):
    pass

class MessageTemplateUpdate(BaseModel):
    content: Optional[str] = None
    is_active: Optional[bool] = None

class MessageTemplate(MessageTemplateBase):
    id: int
    class Config:
        orm_mode = True

# Financial Schemas
class FinancialCategoryBase(BaseModel):
    name: str
    type: str # INCOME, EXPENSE

class FinancialCategoryCreate(FinancialCategoryBase):
    pass

class FinancialCategory(FinancialCategoryBase):
    id: int
    is_system: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class FinancialTransactionBase(BaseModel):
    type: str # INCOME, EXPENSE
    category: str # FIXED, VARIABLE, FREIGHT, ETC
    description: str
    amount: float
    date: datetime = datetime.now()
    status: str = "PENDING"
    related_freight_id: Optional[int] = None

class FinancialTransactionCreate(FinancialTransactionBase):
    pass

class FinancialTransactionUpdate(BaseModel):
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[datetime] = None
    status: Optional[str] = None
    related_freight_id: Optional[int] = None

class FinancialTransaction(FinancialTransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
