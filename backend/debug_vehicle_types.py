from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create tables if not exist (sanity check)
models.Base.metadata.create_all(bind=engine)

def check_types():
    db = SessionLocal()
    try:
        types = db.query(models.VehicleType).all()
        print(f"Total Vehicle Types found: {len(types)}")
        for t in types:
            print(f"- {t.id}: {t.name}")
    except Exception as e:
        print(f"Database Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_types()
