from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    SECRET_KEY: str = "your-super-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "changeme123"

    DATABASE_URL: str = "sqlite:///./domain_tracker.db"

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None
    RECIPIENTS: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
