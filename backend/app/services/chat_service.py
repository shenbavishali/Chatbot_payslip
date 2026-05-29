from dataclasses import dataclass
import re
from typing import Any

import logging

from sqlalchemy.orm import Session

from app.models import ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.intent import ChatIntent, detect_intent
from app.services.payroll_client import PayrollClient

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PayrollPeriod:
    month: int
    year: int

    @property
    def api_month(self) -> str:
        return f"{MONTH_ABBREVIATIONS[self.month]}-{self.year}"

    @property
    def api_month_code(self) -> str:
        return MONTH_ABBREVIATIONS[self.month]

    @property
    def display(self) -> str:
        return f"{MONTH_NAMES[self.month]} {self.year}"


MONTH_NAMES = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
}
MONTH_ABBREVIATIONS = {
    1: "JAN",
    2: "FEB",
    3: "MAR",
    4: "APR",
    5: "MAY",
    6: "JUN",
    7: "JUL",
    8: "AUG",
    9: "SEP",
    10: "OCT",
    11: "NOV",
    12: "DEC",
}
MONTH_ALIASES = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


class ChatService:
    def __init__(self, payroll_client: PayrollClient | None = None) -> None:
        self._payroll_client = payroll_client or PayrollClient()

    async def reply(self, request: ChatRequest, db: Session) -> ChatResponse:
        intent = detect_intent(request.message)
        pending_intent = request.context.session_params.get("pending_intent")

        if intent == ChatIntent.UNKNOWN and pending_intent == ChatIntent.PAYSLIP.value:
            intent = ChatIntent.PAYSLIP
        if intent == ChatIntent.UNKNOWN and pending_intent == ChatIntent.PAY_SUMMARY.value:
            intent = ChatIntent.PAY_SUMMARY

        if intent == ChatIntent.UNKNOWN:
            response = ChatResponse(
                intent=intent.value,
                answer="I can currently help with payslip and pay summary queries.",
            )
            self._log(request, response, db)
            return response

        period: PayrollPeriod | None = None
        year: int | None = None

        if intent == ChatIntent.PAYSLIP:
            period = self._parse_period(request.message)
            if period is None:
                response = ChatResponse(
                    intent=intent.value,
                    answer="Which month and year do you need the payslip for? For example, April 2026.",
                    pending_intent=intent.value,
                    required_inputs=["month", "year"],
                )
                self._log(request, response, db)
                return response

        if intent == ChatIntent.PAY_SUMMARY:
            year = self._parse_year(request.message)
            if year is None:
                response = ChatResponse(
                    intent=intent.value,
                    answer="Which year do you need the pay summary for? For example, 2025.",
                    pending_intent=intent.value,
                    required_inputs=["year"],
                )
                self._log(request, response, db)
                return response

        data = await self._payroll_client.fetch(intent, request.context, period, year)
        answer = self._format_answer(intent, data, period, year)
        response = ChatResponse(intent=intent.value, answer=answer, data=data)
        self._log(request, response, db)
        return response

    def _format_answer(
        self,
        intent: ChatIntent,
        data: dict[str, Any] | list[Any],
        period: PayrollPeriod | None,
        year: int | None,
    ) -> str:
        if intent == ChatIntent.PAYSLIP:
            if self._is_empty_result(data) and period is not None:
                return f"No payslip was found for {period.display}."
            if period is not None:
                return f"Here is your payslip for {period.display}."
            return "Here is your payslip."
        if intent == ChatIntent.PAY_SUMMARY:
            if self._is_empty_result(data) and year is not None:
                return f"No pay summary was found for {year}."
            if year is not None:
                return f"Here is your pay summary for {year}."
            return "Here is your pay summary."
        return "I found the requested payroll information."

    def _is_empty_result(self, data: dict[str, Any] | list[Any]) -> bool:
        if isinstance(data, list):
            return len(data) == 0
        if isinstance(data, dict) and isinstance(data.get("result"), list):
            return len(data["result"]) == 0
        return False

    def _parse_period(self, message: str) -> PayrollPeriod | None:
        normalized = " ".join(message.lower().replace(",", " ").split())
        year = self._parse_year(normalized)
        if year is None:
            return None

        for token in re.findall(r"[a-z]+", normalized):
            month = MONTH_ALIASES.get(token)
            if month is not None:
                return PayrollPeriod(month=month, year=year)

        numeric_patterns = (
            r"\b(0?[1-9]|1[0-2])\s*[-/]\s*(20\d{2}|19\d{2})\b",
            r"\b(20\d{2}|19\d{2})\s*[-/]\s*(0?[1-9]|1[0-2])\b",
        )
        for pattern in numeric_patterns:
            match = re.search(pattern, normalized)
            if match is None:
                continue

            first, second = match.groups()
            month = int(second if len(first) == 4 else first)
            parsed_year = int(first if len(first) == 4 else second)
            return PayrollPeriod(month=month, year=parsed_year)

        return None

    def _parse_year(self, message: str) -> int | None:
        match = re.search(r"\b(20\d{2}|19\d{2})\b", message)
        if match is None:
            return None

        year = int(match.group(1))
        if 1900 <= year <= 9999:
            return year

        return None

    def _log(self, request: ChatRequest, response: ChatResponse, db: Session) -> None:
        message = ChatMessage(
            employee_id=request.context.employee_id,
            user_id=request.context.user_id,
            company_id=request.context.company_id,
            question=request.message,
            intent=response.intent,
            answer=response.answer,
        )
        db.add(message)
        try:
            db.commit()
        except Exception:
            try:
                db.rollback()
            except Exception:
                logger.exception("Failed to roll back chat audit log transaction")
            logger.exception("Failed to write chat audit log")
