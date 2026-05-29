from typing import Any

from pydantic import BaseModel, Field, field_validator


class UserContext(BaseModel):
    employee_id: str = Field(..., min_length=1)
    employee_name: str | None = None
    user_id: str | None = None
    company_id: str | None = None
    session_params: dict[str, Any] = Field(default_factory=dict)

    @field_validator("employee_id")
    @classmethod
    def validate_employee_id(cls, value: str) -> str:
        normalized = value.strip()
        if normalized.lower() in {"null", "undefined"}:
            raise ValueError("Employee context was not provided by iCore")
        return normalized


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    context: UserContext


class ChatResponse(BaseModel):
    intent: str
    answer: str
    data: dict[str, Any] | list[Any] | None = None
    pending_intent: str | None = None
    required_inputs: list[str] = Field(default_factory=list)
