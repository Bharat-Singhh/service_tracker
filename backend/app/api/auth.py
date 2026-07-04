from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.models import User, ActivityLog
from app.schemas.schemas import LoginRequest, TokenResponse

router = APIRouter(tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token({"sub": user.username})

    # Log activity
    log = ActivityLog(action="LOGIN", description=f"User '{user.username}' logged in")
    db.add(log)
    db.commit()

    return TokenResponse(access_token=token, username=user.username)
