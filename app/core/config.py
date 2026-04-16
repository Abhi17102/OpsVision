from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = REPO_ROOT / ".env"


class Settings(BaseSettings):
    # Use an absolute `.env` path so it works regardless of the current working directory.
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding="utf-8")

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/opsvision"
    cors_origins: str = "*"

    metrics_alert_cpu: float = 85.0
    metrics_alert_mem: float = 85.0
    metrics_alert_disk: float = 90.0


settings = Settings()

