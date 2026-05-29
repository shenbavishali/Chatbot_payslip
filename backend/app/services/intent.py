from enum import StrEnum


class ChatIntent(StrEnum):
    PAYSLIP = "payslip"
    PAY_SUMMARY = "pay_summary"
    UNKNOWN = "unknown"


PAYSLIP_TERMS = ("payslip", "pay slip", "salary slip", "slip")
PAY_SUMMARY_TERMS = ("pay summary", "paysummary", "salary summary", "compensation summary", "summary")


def detect_intent(message: str) -> ChatIntent:
    normalized = " ".join(message.lower().split())

    if any(term in normalized for term in PAYSLIP_TERMS):
        return ChatIntent.PAYSLIP

    if any(term in normalized for term in PAY_SUMMARY_TERMS):
        return ChatIntent.PAY_SUMMARY

    return ChatIntent.UNKNOWN
