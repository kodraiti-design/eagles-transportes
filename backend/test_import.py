try:
    from validate_docbr import CPF, CNPJ
    print("Import validate_docbr Success")
    cpf = CPF()
    print("CPF class works")
except Exception as e:
    print("Import validate_docbr Failed:", e)

try:
    from pydantic import BaseModel, validator
    print("Import pydantic Success")
except Exception as e:
    print("Import pydantic Failed:", e)
