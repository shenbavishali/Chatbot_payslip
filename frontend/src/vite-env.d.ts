/// <reference types="vite/client" />

interface ICoreChatbotContext {
  employeeId?: string;
  externalId?: string;
  employeeCode?: string;
  employee_id?: string;
  employee?: string;
  empCode?: string;
  emp_id?: string;
  personnelExternalId?: string;
  personnelId?: string;
  employeeName?: string;
  employee_name?: string;
  empName?: string;
  userId?: string;
  user_id?: string;
  loginUserId?: string;
  companyId?: string;
  company_id?: string;
  companyName?: string;
  company?: string;
  sessionParams?: Record<string, unknown>;
  session_params?: Record<string, unknown>;
}

interface Window {
  I_CORE_CHATBOT_CONTEXT?: ICoreChatbotContext;
}

interface ImportMetaEnv {
  readonly VITE_CHAT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
