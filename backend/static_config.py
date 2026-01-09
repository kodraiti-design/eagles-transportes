from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

def mount_static(app: FastAPI):
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    
    # Mount frontend assets
    frontend_assets = r"../frontend/dist/assets"
    if os.path.exists(frontend_assets):
        app.mount("/assets", StaticFiles(directory=frontend_assets), name="assets")
