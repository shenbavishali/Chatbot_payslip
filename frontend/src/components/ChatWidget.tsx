import { FormEvent, useState } from "react";
import { Bot, CalendarDays, Send, UserRound } from "lucide-react";
import { DataPreview } from "./DataPreview";
import { useChatStore } from "../stores/chatStore";
import { useICoreContext } from "../lib/icoreContext";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, index) => String(currentYear - index));

export function ChatWidget() {
  const [message, setMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const { messages, isSending, error, pendingIntent, sendMessage } = useChatStore();
  const context = useICoreContext();
  const showPayslipPeriodPicker = pendingIntent === "payslip";
  const inputPlaceholder =
    pendingIntent === "pay_summary"
      ? "Enter year, for example 2025"
      : "Ask about your payslip or pay summary";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSending) {
      return;
    }

    setMessage("");
    await sendMessage(trimmed);
  };

  const onPeriodSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) {
      return;
    }

    await sendMessage(`${selectedMonth} ${selectedYear}`);
  };

  return (
    <section className="flex h-full min-h-[520px] flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-base font-semibold text-slate-950">Payroll Assistant</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {messages.map((item) => {
            const hasData = Boolean(item.data);
            return (
            <article
              key={item.id}
              className={`flex gap-3 ${
                item.role === "user" ? "justify-end" : "justify-start"
              } ${item.role === "assistant" && hasData ? "w-full" : ""}`}
            >
              {item.role === "assistant" && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-emerald-700 text-white shadow-sm">
                  <Bot size={18} aria-hidden="true" />
                </span>
              )}

              <div
                className={`rounded-lg px-4 py-3 text-sm leading-6 shadow-sm ${
                  item.role === "user"
                    ? "max-w-[78%] bg-slate-950 text-white"
                    : hasData
                      ? "w-full max-w-none border border-slate-200 bg-white text-slate-800"
                      : "max-w-[78%] border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <p>{item.text}</p>
                <DataPreview data={item.data} context={context} answer={item.text} />
              </div>

              {item.role === "user" && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-800">
                  <UserRound size={18} aria-hidden="true" />
                </span>
              )}
            </article>
          );
          })}

          

          {!context && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Employee context was not provided by iCore.
            </div>
          )}

          {error && error !== "Employee context was not provided by iCore." && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isSending && (
            <article className="flex justify-start gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-emerald-700 text-white shadow-sm">
                <Bot size={18} aria-hidden="true" />
              </span>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                Checking payroll details...
              </div>
            </article>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.04)]">
        {showPayslipPeriodPicker && (
          <div className="mx-auto mb-3 w-full max-w-7xl">
            <form onSubmit={onPeriodSubmit} className="flex flex-wrap items-end gap-3">
              <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
                Month
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  disabled={isSending}
                  className="h-11 rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-slate-100"
                >
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
                Year
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  disabled={isSending}
                  className="h-11 rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-slate-100"
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={isSending}
                className="flex h-11 shrink-0 items-center gap-2 rounded bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CalendarDays size={17} aria-hidden="true" />
                Fetch
              </button>
            </form>
          </div>
        )}

        <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-7xl gap-3">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-w-0 flex-1 rounded border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
            placeholder={inputPlaceholder}
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={isSending}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-emerald-700 text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Send"
            title="Send"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
      </footer>
    </section>
  );
}
