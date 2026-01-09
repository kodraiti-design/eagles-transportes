try:
    print("DEBUG: Importing dependencies...")
    import sys
    import os
    
    # Add project root to path
    sys.path.append(os.getcwd())
    
    # MONKEY PATCH correct DB path before importing session
    # The actual DB is in backend/eagles_v3.db
    import backend.database
    print("DEBUG: Patching DB URL...")
    # Use absolute path to be sure
    db_path = os.path.join(os.getcwd(), 'backend', 'eagles_v3.db')
    backend.database.SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
    
    # Re-create engine with new URL
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    backend.database.engine = create_engine(
        backend.database.SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    backend.database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=backend.database.engine)
    
    from backend import models
    
    print(f"DEBUG: Connecting to DB at {backend.database.SQLALCHEMY_DATABASE_URL}")
    session = backend.database.SessionLocal()
    
    print("--- Inspecting Freight Roots (Dashboard Logic) ---")
    
    # Replicate dashboard filter
    from datetime import datetime, timedelta
    now = datetime.now()
    three_months_ago = now - timedelta(days=90)
    
    freights = session.query(models.Freight).filter(
        models.Freight.pickup_date >= three_months_ago,
        models.Freight.status.notin_(['QUOTED', 'REJECTED'])
    ).all()
    
    print(f"Found {len(freights)} freights matching dashboard criteria.")
    
    with open("debug_output.txt", "w", encoding="utf-8") as out:
        out.write(f"Found {len(freights)} freights matching dashboard criteria.\n")
        for f in freights:
             driver_name = f.driver.name if f.driver else "NO DRIVER"
             v_type = f.driver.vehicle_type if f.driver else "NO DRIVER"
             origin_val = f.origin if f.origin else "NULL"
             dest_val = f.destination if f.destination else "NULL"
             out.write(f"ID: {f.id} | Status: {f.status} | Origin: '{origin_val}' | Dest: '{dest_val}' | VType: '{v_type}'\n")
    
    session.close()
    print("DEBUG: Done. Check debug_output.txt")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
