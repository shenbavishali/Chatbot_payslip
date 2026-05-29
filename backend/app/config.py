from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PayrollApiSettings(BaseModel):
    timeout_seconds: int = 20
    endpoints: dict[str, str] = Field(default_factory=dict)


class DatabaseSettings(BaseModel):
    dsn: str


class AppSettings(BaseModel):
    name: str = "chatbot-payslip-api"
    cors_origins: list[str] = Field(default_factory=list)


class RuntimeSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_nested_delimiter="__")

    config_file: str = "config/app.yml"
    mysql_dsn: str | None = None


class Settings(BaseModel):
    app: AppSettings
    database: DatabaseSettings
    payroll_api: PayrollApiSettings


def _read_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with path.open("r", encoding="utf-8") as stream:
        return yaml.safe_load(stream) or {}


@lru_cache
def get_settings() -> Settings:
    runtime = RuntimeSettings()
    config_path = Path(runtime.config_file)
    if not config_path.is_absolute():
        config_path = Path(__file__).resolve().parents[1] / config_path

    raw = _read_yaml(config_path)
    settings = Settings.model_validate(raw)

    if runtime.mysql_dsn:
        settings.database.dsn = runtime.mysql_dsn

    return settings
