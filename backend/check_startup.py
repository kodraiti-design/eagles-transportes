from database import engine
import models
try:
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    print("DB check success")
except Exception as e:
    print(f"DB Check Failed: {e}")
