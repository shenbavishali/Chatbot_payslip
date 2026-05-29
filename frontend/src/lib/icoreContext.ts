import { useEffect, useState } from "react";

export type UserContext = {
  employeeId: string;
  employeeName?: string;
  userId?: string;
  companyId?: string;
  sessionParams: Record<string, unknown>;
};

export function readICoreContext(): UserContext | null {
  const context = readContext();

  const employeeId = readString(
    context,
    "externalId",
    "employeeCode",
    "employee_id",
    "empCode",
    "emp_id",
    "personnelExternalId",
    "employeeId",
    "employee",
    "personnelId",
  );

  if (!employeeId) {
    return null;
  }

  return {
    employeeId,
    employeeName: readString(context, "employeeName", "employee_name", "empName"),
    userId: readString(context, "userId", "user_id", "loginUserId"),
    companyId: readString(context, "companyId", "company_id", "companyName", "company"),
    sessionParams: readSessionParams(context),
  };
}

export function useICoreContext(): UserContext | null {
  const [context, setContext] = useState(() => readICoreContext());

  useEffect(() => {
    const refreshContext = () => setContext(readICoreContext());

    const handleMessage = (event: MessageEvent<unknown>) => {
      const messageContext = readMessageContext(event.data);
      if (!messageContext) {
        return;
      }

      storeContext(messageContext);
      refreshContext();
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", refreshContext);
    refreshContext();

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", refreshContext);
    };
  }, []);

  return context;
}

function readContext(): Record<string, unknown> {
  return {
    ...readStoredContext(),
    ...readRootDatasetContext(),
    ...readParentContext(),
    ...readWindowContext(),
    ...readQueryContext(),
  };
}

function readWindowContext(): Record<string, unknown> {
  return (window.I_CORE_CHATBOT_CONTEXT as Record<string, unknown> | undefined) ?? {};
}

function readParentContext(): Record<string, unknown> {
  try {
    if (window.parent && window.parent !== window) {
      return (window.parent.I_CORE_CHATBOT_CONTEXT as Record<string, unknown> | undefined) ?? {};
    }
  } catch {
    // Cross-origin parent windows are expected in some deployments.
  }
  return {};
}

function readQueryContext(): Record<string, unknown> {
  const params = new URLSearchParams(window.location.search);
  const context = readQueryJsonContext(params);
  return {
    ...context,
    ...Object.fromEntries(params.entries()),
  };
}

function readQueryJsonContext(params: URLSearchParams): Record<string, unknown> {
  const raw = params.get("context");
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

function readMessageContext(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const payload = data as Record<string, unknown>;

  if (payload.type === "I_CORE_CHATBOT_CONTEXT" && payload.context) {
    const context = payload.context;
    if (context && typeof context === "object" && !Array.isArray(context)) {
      return context as Record<string, unknown>;
    }
  }

  if (readString(payload, "employeeId", "externalId", "employeeCode", "employee_id", "employee")) {
    return payload;
  }

  return null;
}

function storeContext(context: Record<string, unknown>): void {
  window.I_CORE_CHATBOT_CONTEXT = context as Window["I_CORE_CHATBOT_CONTEXT"];

  try {
    sessionStorage.setItem("I_CORE_CHATBOT_CONTEXT", JSON.stringify(context));
  } catch {
    // Some embedded browsers disable storage; the window value is enough for this page load.
  }
}

function readRootDatasetContext(): Record<string, unknown> {
  const root =
    document.getElementById("payroll-chatbot-root") ??
    document.querySelector<HTMLElement>("[data-chatbot-root]") ??
    document.getElementById("root");

  if (!root) {
    return {};
  }

  return {
    employeeId: root.dataset.employeeId,
    employeeCode: root.dataset.employeeCode,
    employeeName: root.dataset.employeeName,
    userId: root.dataset.userId,
    companyId: root.dataset.companyId,
    companyName: root.dataset.companyName,
  };
}

function readStoredContext(): Record<string, unknown> {
  return (
    readJsonStorage(sessionStorage, "I_CORE_CHATBOT_CONTEXT") ??
    readJsonStorage(sessionStorage, "iCoreChatbotContext") ??
    readJsonStorage(localStorage, "I_CORE_CHATBOT_CONTEXT") ??
    readJsonStorage(localStorage, "iCoreChatbotContext") ??
    {}
  );
}

function readJsonStorage(storage: Storage, key: string): Record<string, unknown> | null {
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function readString(context: Record<string, unknown> | undefined, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = context?.[key];
    if (typeof value === "string" && value.trim()) {
      const normalized = value.trim();
      if (normalized.toLowerCase() !== "null" && normalized.toLowerCase() !== "undefined") {
        return normalized;
      }
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return undefined;
}

function readSessionParams(context: Record<string, unknown> | undefined): Record<string, unknown> {
  const value = context?.sessionParams ?? context?.session_params;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
