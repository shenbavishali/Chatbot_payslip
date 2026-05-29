from typing import Any

import httpx
import logging

from app.config import get_settings
from app.schemas.chat import UserContext
from app.services.intent import ChatIntent

logger = logging.getLogger(__name__)


class PayrollApiError(RuntimeError):
    pass


class PayrollClient:

    def __init__(self) -> None:
        settings = get_settings().payroll_api
        self._endpoints = settings.endpoints
        self._timeout = settings.timeout_seconds

    async def fetch(
        self,
        intent: ChatIntent,
        context: UserContext,
        period: Any | None = None,
        year: int | None = None,
    ) -> dict[str, Any] | list[Any]:

        endpoint = self._endpoint_for(intent)

        payload = self._payload_for(intent, context, period, year)

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                verify=False
            ) as client:

                response = await client.post(
                    endpoint,
                    json=payload
                )

        except httpx.RequestError as exc:
            logger.exception("Unable to reach Java MCP API at %s", endpoint)
            raise PayrollApiError(
                f"Unable to reach payroll API at {endpoint}"
            ) from exc

        if response.status_code >= 400:
            body = response.text[:500]
            logger.error(
                "Java MCP API returned %s for %s. Response: %s",
                response.status_code,
                endpoint,
                body,
            )
            raise PayrollApiError(
                f"Payroll API returned {response.status_code} for {endpoint}: {body}"
            )

        raw_body = response.text.strip()
        if not raw_body:
            logger.info(
                "Java MCP API returned an empty response for %s using %s",
                endpoint,
                payload["tool"],
            )
            return {"result": []}

        try:
            data = response.json()
        except ValueError as exc:
            body = raw_body[:500]
            logger.error(
                "Java MCP API returned non-JSON response from %s. Response: %s",
                endpoint,
                body,
            )
            raise PayrollApiError(
                f"Payroll API returned an invalid JSON response: {body}"
            ) from exc

        if isinstance(data, dict) and data.get("error"):
            raise PayrollApiError(str(data["error"]))

        logger.info("Java MCP API call succeeded for %s using %s", endpoint, payload["tool"])
        return data

    def _payload_for(
        self,
        intent: ChatIntent,
        context: UserContext,
        period: Any | None = None,
        year: int | None = None,
    ) -> dict[str, Any]:
        if intent == ChatIntent.PAY_SUMMARY:
            args: dict[str, Any] = {
                "company": context.company_id,
                "employee": context.employee_id,
                "year": str(year) if year is not None else None,
            }
            return {
                "tool": "getPaySummary",
                "args": {key: value for key, value in args.items() if value is not None},
            }

        session_args = {
            key: value
            for key, value in context.session_params.items()
            if key not in {"pending_intent", "month", "year", "employee", "company", "userId"}
        }

        args: dict[str, Any] = {
            **session_args,
            "employee": context.employee_id,
            "userId": context.user_id,
            "company": context.company_id,
            "month": period.api_month_code if period is not None else None,
            "year": str(period.year) if period is not None else None,
        }

        if intent == ChatIntent.PAYSLIP:
            return {
                "tool": "getPayslip",
                "args": {key: value for key, value in args.items() if value is not None},
            }

        raise PayrollApiError(f"No Java MCP tool configured for {intent.value}")

    def _endpoint_for(self, intent: ChatIntent) -> str:
        endpoint = self._endpoints.get(intent.value)

        if not endpoint:
            raise PayrollApiError(
                f"No payroll endpoint configured for {intent.value}"
            )

        return endpoint
