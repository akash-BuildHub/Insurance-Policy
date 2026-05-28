"""Authentication routes: signup, login, current user."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, security
from ..config import get_settings
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/signup", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(body: schemas.SignupRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    existing = db.query(models.User).filter(models.User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # First user matching INITIAL_ADMIN_EMAIL is auto-promoted to admin
    is_initial_admin = (
        settings.initial_admin_email
        and body.email.lower() == settings.initial_admin_email.lower()
    )

    user = models.User(
        email=body.email.lower(),
        full_name=body.full_name,
        password_hash=security.hash_password(body.password),
        role=models.Role.admin if is_initial_admin else models.Role.user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = security.create_access_token(str(user.id), user.role.value)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    user = db.query(models.User).filter(models.User.email == body.email.lower()).first()
    if not user or not security.verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = security.create_access_token(str(user.id), user.role.value)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)) -> schemas.UserOut:
    return schemas.UserOut.model_validate(user)
