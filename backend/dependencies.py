from fastapi import Depends, HTTPException, status
from typing import List, Optional
from routers.auth import get_current_user
import models

def check_permission(required_permission: str):
    def permission_checker(user: models.User = Depends(get_current_user)):
        # Admin bypass
        if user.role == "ADMIN":
            return user
        
        # Check permission
        user_permissions = user.permissions.split(",") if user.permissions else []
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {required_permission}"
            )
        return user
    return permission_checker
