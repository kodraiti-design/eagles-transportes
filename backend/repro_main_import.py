print("Starting import test...")
try:
    import main
    print("Import successful.")
    print(f"App routes count: {len(main.app.routes)}")
    for route in main.app.routes:
        print(f"Route: {route.path}")
except Exception as e:
    print(f"Import failed: {e}")
