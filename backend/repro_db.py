try:
    from database import SessionLocal, engine
    print(f"Database URL: {engine.url}")
    db = SessionLocal()
    print("Session created successfully")
    db.close()
    print("Session closed")
except Exception as e:
    print(f"CRITICAL DB ERROR: {e}")
    import traceback
    traceback.print_exc()
