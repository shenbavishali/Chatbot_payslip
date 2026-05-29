# Chatbot Payslip

Standard payroll chatbot application.

## Stack

- Frontend: React, Tailwind CSS, Zustand
- Backend: Python, FastAPI
- Database: MySQL
- Integration: consumes existing Java payroll REST APIs

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Configure Java payroll API URLs in `backend/config/app.yml`.

Create the MySQL audit table:

```bash
mysql -u payroll_user -p payroll_chatbot < schema.sql
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_CHAT_API_URL` if the FastAPI URL differs from `http://localhost:8001/api/chat`.

## Required iCore Context

The frontend expects iCore to provide:

```js
window.I_CORE_CHATBOT_CONTEXT = {
  employeeId: "EMP001",
  userId: "USR001",
  companyId: "COMP001",
  sessionParams: {}
};
```

No separate chatbot login is implemented; iCore owns authentication and passes the logged-in context.
