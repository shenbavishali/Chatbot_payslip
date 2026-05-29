import { create } from "zustand";
import { config } from "../lib/config";
import { readICoreContext } from "../lib/icoreContext";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  data?: PayrollApiData;
};

type ChatState = {
  messages: ChatMessage[];
  isSending: boolean;
  error?: string;
  pendingIntent?: string;
  sendMessage: (text: string) => Promise<void>;
};

export type PayrollData = {
  employee: string;
  period: string;
  basic: number;
  hra: number;
  otherDeductions: number;
  netSalary: number;
};

export type PayrollApiData =
  | PayrollData
  | { result?: PayrollData | Record<string, unknown>[] }
  | Record<string, unknown>
  | Record<string, unknown>[];

type ChatApiResponse = {
  intent: string;
  answer: string;
  data?: PayrollApiData;
  pending_intent?: string | null;
  required_inputs?: string[];
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Hi, I can help with your payslip and pay summary.",
    },
  ],
  isSending: false,
  sendMessage: async (text: string) => {
    const context = readICoreContext();

    if (!context) {
      set({ error: "Employee context was not provided by iCore." });
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };

    const pendingIntent = useChatStore.getState().pendingIntent;
    const sessionParams = {
      ...(context.sessionParams ?? {}),
      ...(pendingIntent ? { pending_intent: pendingIntent } : {}),
    };

    const requestPayload = {
      message: text,
      context: {
        employee_id: context.employeeId,
        employee_name: context.employeeName,
        user_id: context.userId,
        company_id: context.companyId,
        session_params: sessionParams,
      },
    };

    console.log("[Chat API] request URL", config.chatApiUrl);
    console.log("[Chat API] request payload", requestPayload);

    set((state) => ({
      messages: [...state.messages, userMessage],
      isSending: true,
      error: undefined,
    }));

    try {
      const response = await fetch(config.chatApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      console.log("[Chat API] response status", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Chat API] error response", errorText);
        let detail = errorText;
        try {
          const errorPayload = JSON.parse(errorText) as { detail?: unknown };
          if (typeof errorPayload.detail === "string") {
            detail = errorPayload.detail;
          }
        } catch {
          // Keep the raw response text when it is not JSON.
        }
        throw new Error(detail || `Chat API failed with status ${response.status}`);
      }

      const payload = (await response.json()) as ChatApiResponse;
      console.log("[Chat API] response payload", payload);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: payload.answer,
        data: payload.data,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isSending: false,
        pendingIntent: payload.pending_intent ?? undefined,
      }));
    } catch (error) {
      set({
        isSending: false,
        error: error instanceof Error ? error.message : "Unable to send message.",
      });
      console.error("[Chat API] request failed", error);
    }
  },
}));
