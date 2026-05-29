import { Download, Eye, FileSpreadsheet, FileText } from "lucide-react";
import type { UserContext } from "../lib/icoreContext";
import type { PayrollApiData, PayrollData } from "../stores/chatStore";

type PayslipCardProps = {
  data?: PayrollApiData;
  context?: UserContext | null;
  answer?: string;
};

type ExportContext = {
  employeeName?: string;
  employeeId?: string;
  companyName?: string;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const MONTH_COLUMNS = [
  { key: "january", label: "Jan", aliases: ["january", "jan", "janAmount", "amountJan"] },
  { key: "february", label: "Feb", aliases: ["february", "feb", "febAmount", "amountFeb"] },
  { key: "march", label: "Mar", aliases: ["march", "mar", "marAmount", "amountMar"] },
  { key: "april", label: "Apr", aliases: ["april", "apr", "aprAmount", "amountApr"] },
  { key: "may", label: "May", aliases: ["may", "mayAmount", "amountMay"] },
  { key: "june", label: "Jun", aliases: ["june", "jun", "junAmount", "amountJun"] },
  { key: "july", label: "Jul", aliases: ["july", "jul", "julAmount", "amountJul"] },
  { key: "august", label: "Aug", aliases: ["august", "aug", "augAmount", "amountAug"] },
  { key: "september", label: "Sep", aliases: ["september", "sep", "sept", "sepAmount", "amountSep"] },
  { key: "october", label: "Oct", aliases: ["october", "oct", "octAmount", "amountOct"] },
  { key: "november", label: "Nov", aliases: ["november", "nov", "novAmount", "amountNov"] },
  { key: "december", label: "Dec", aliases: ["december", "dec", "decAmount", "amountDec"] },
];

const COMPONENT_KEYS = [
  "component",
  "componentName",
  "payComponent",
  "payComponentName",
  "salaryComponent",
  "salaryComponentName",
  "payHead",
  "payHeadName",
  "name",
  "description",
];

const MONTH_KEYS = ["month", "monthName", "period", "payMonth", "payrollMonth"];
const AMOUNT_KEYS = ["amount", "value", "total", "payAmount", "componentAmount"];
const SUMMARY_COMPONENT_ORDER = [
  "Basic Salary",
  "HRA",
  "Transport Allowance",
  "Annual Leave Encashment",
  "TOTAL",
];

export function DataPreview({ data, context, answer }: PayslipCardProps) {
  const payslip = resolvePayslipData(data);
  const payslipDocument = resolvePayslipDocument(data);
  const summaryRows = buildSummaryRows(resolveSummaryRows(data));
  const exportContext = buildExportContext(context);

  if (payslip) {
    return (
      <dl className="mt-3 grid min-w-64 grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Employee</dt>
          <dd className="mt-1 font-semibold text-slate-950">{payslip.employee}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Period</dt>
          <dd className="mt-1 font-semibold text-slate-950">{payslip.period}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Basic</dt>
          <dd className="mt-1 font-semibold text-slate-950">{currency.format(payslip.basic)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">HRA</dt>
          <dd className="mt-1 font-semibold text-slate-950">{currency.format(payslip.hra)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Deductions</dt>
          <dd className="mt-1 font-semibold text-slate-950">
            {currency.format(payslip.otherDeductions)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-stone-500">Net Salary</dt>
          <dd className="mt-1 font-semibold text-emerald-700">
            {currency.format(payslip.netSalary)}
          </dd>
        </div>
      </dl>
    );
  }

  if (payslipDocument) {
    const payslipPdf = buildPayslipPdfModel(data, context, payslipDocument, answer);

    return (
      <div className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold text-slate-950">
              <FileText size={17} aria-hidden="true" />
              Payslip Document
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium uppercase text-slate-500">Employee Name</div>
              <div className="mt-1 font-semibold text-slate-950">{payslipPdf.employeeName}</div>
            </div>
          </div>

          <button
              type="button"
              onClick={() => viewPayslipPdf(payslipPdf)}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-600 hover:text-emerald-700"
            >
              <Eye size={15} aria-hidden="true" />
              View
          </button>
        </div>
      </div>
    );
  }

  if (summaryRows.length > 0) {
    return (
      <div className="mt-3 w-full rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Download size={16} aria-hidden="true" />
            Pay Summary Report
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadPaySummaryPdf(summaryRows, exportContext)}
              className="inline-flex h-9 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-600 hover:text-emerald-700"
            >
              <FileText size={15} aria-hidden="true" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => downloadPaySummaryExcel(summaryRows, exportContext)}
              className="inline-flex h-9 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-600 hover:text-emerald-700"
            >
              <FileSpreadsheet size={15} aria-hidden="true" />
              Excel
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-[12px]">
            <colgroup>
              <col className="w-[220px]" />
              {MONTH_COLUMNS.map((month) => (
                <col key={month.key} className="w-[75px]" />
              ))}
              <col className="w-[90px]" />
            </colgroup>
            <thead className="bg-slate-100 text-[11px] uppercase text-slate-700">
              <tr>
                <th className="sticky left-0 z-10 border-b border-r border-slate-300 bg-slate-100 px-3 py-2.5 font-semibold tracking-wide">
                  Component
                </th>
                {MONTH_COLUMNS.map((month) => (
                  <th key={month.key} className="border-b border-r border-slate-300 px-2 py-2.5 text-right font-semibold tracking-wide last:border-r-0">
                    {month.label}
                  </th>
                ))}
                <th className="border-b border-slate-300 px-2 py-2.5 text-right font-semibold tracking-wide">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.component} className="odd:bg-white even:bg-slate-50 hover:bg-emerald-50/50">
                  <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-3 py-2.5 text-left font-semibold leading-4 text-slate-900">
                    {row.component}
                  </th>
                  {MONTH_COLUMNS.map((month) => (
                    <td key={month.key} className="border-b border-r border-slate-200 px-2 py-2.5 text-right font-medium tabular-nums text-slate-900 last:border-r-0">
                      {formatValue(row.months[month.key])}
                    </td>
                  ))}
                  <td className="border-b border-slate-200 px-2 py-2.5 text-right font-semibold tabular-nums text-slate-950">
                    {formatTotal(row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

type SummaryMatrixRow = {
  component: string;
  months: Record<string, unknown>;
};

type PayslipDocument = {
  fileName?: string;
  pdfBase64?: string;
  documentType?: string;
  employeeId?: string;
  fiscalYear?: string;
  payPeriod?: string;
};

type PayslipLine = {
  label: string;
  amount: number;
};

type PayslipPdfModel = {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  location: string;
  currency: string;
  payPeriod: string;
  payMode: string;
  dateOfJoining: string;
  bankName: string;
  accountNo: string;
  workDays: string;
  otHours: string;
  paidLeave: string;
  lop: string;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  netPay: number;
  pdfBase64?: string;
};

function resolvePayslipData(data?: PayrollApiData): PayrollData | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  if ("result" in data && data.result && typeof data.result === "object") {
    return resolvePayslipData(data.result as PayrollApiData);
  }

  const candidate = data as Record<string, unknown>;
  if (
    typeof candidate.employee === "string" &&
    typeof candidate.period === "string" &&
    typeof candidate.basic === "number" &&
    typeof candidate.hra === "number" &&
    typeof candidate.otherDeductions === "number" &&
    typeof candidate.netSalary === "number"
  ) {
    return candidate as PayrollData;
  }

  return null;
}

function resolvePayslipDocument(data?: PayrollApiData): PayslipDocument | null {
  const records = resolveRecords(data);
  const candidate = records.find(
    (record) =>
      readStringValue(record, ["pdf", "pdfBase64", "attachment", "attachmentBase64"]) ||
      readStringValue(record, ["fileName", "filename", "filePath", "path"]),
  );

  if (!candidate) {
    return null;
  }

  const fileName = readStringValue(candidate, ["fileName", "filename", "filePath", "path"]);
  const pdfBase64 = readStringValue(candidate, ["pdf", "pdfBase64", "attachment", "attachmentBase64"]);
  if (!fileName && !pdfBase64) {
    return null;
  }

  return {
    fileName,
    pdfBase64,
    documentType: readStringValue(candidate, ["documentType", "docType", "type"]),
    employeeId: readStringValue(candidate, ["employeeId", "employee", "personnelId"]),
    fiscalYear: readStringValue(candidate, ["fiscalYear", "year"]),
    payPeriod: readStringValue(candidate, ["payPeriod", "period", "payrollPeriod", "monthYear"]),
  };
}

function buildPayslipPdfModel(
  data: PayrollApiData | undefined,
  context: UserContext | null | undefined,
  document: PayslipDocument,
  answer?: string,
): PayslipPdfModel {
  const records = resolveRecords(data);
  const primary = records[0] ?? {};
  const params = context?.sessionParams ?? {};
  const readValue = (...keys: string[]) =>
    readStringValue(primary, keys) ?? readStringValue(params, keys);
  const employeeName =
    readValue("employeeName", "employee_name", "empName", "name") ?? context?.employeeName ?? "-";
  const employeeId = document.employeeId ?? context?.employeeId ?? readValue("employeeId", "employee") ?? "-";
  const payPeriod = resolvePayPeriod(primary, answer, document);
  const earnings = resolvePayslipLines(primary, "earnings") ?? resolveDefaultEarnings(primary);
  const deductions = resolvePayslipLines(primary, "deductions") ?? resolveDefaultDeductions(primary);
  const totalEarnings = sumLines(earnings);
  const totalDeductions = sumLines(deductions);
  const netPay =
    readNumberValue(primary, ["netSalary", "netPay", "netAmount", "net"]) ??
    totalEarnings - totalDeductions;

  return {
    employeeId,
    employeeName,
    department: readValue("department", "departmentName", "deptName") ?? "-",
    designation: readValue("designation", "designationName", "position", "jobTitle") ?? "-",
    location: readValue("location", "workLocation", "office", "branch") ?? "-",
    currency: readValue("currency", "currencyCode") ?? "AED",
    payPeriod,
    payMode: readValue("payMode", "paymentMode", "modeOfPayment") ?? "-",
    dateOfJoining: readValue("dateOfJoining", "doj", "joiningDate") ?? "-",
    bankName: readValue("bankName", "bank", "bankCode") ?? "-",
    accountNo: readValue("accountNo", "accountNumber", "bankAccountNo", "iban") ?? "-",
    workDays: readValue("workDays", "workingDays", "paidDays") ?? "-",
    otHours: readValue("otHours", "overtimeHours", "othrs") ?? "0",
    paidLeave: readValue("paidLeave", "paidLeaves") ?? "0.00",
    lop: readValue("lop", "lossOfPay", "lopDays") ?? "0.00",
    earnings,
    deductions,
    netPay,
    pdfBase64: document.pdfBase64,
  };
}

function resolveSummaryRows(data?: PayrollApiData): Record<string, unknown>[] {
  return resolveRecords(data);
}

function resolveRecords(data?: PayrollApiData): Record<string, unknown>[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

  if (typeof data === "object" && "result" in data) {
    if (Array.isArray(data.result)) {
      return data.result.filter(isRecord);
    }
    if (isRecord(data.result)) {
      return [data.result];
    }
  }

  return isRecord(data) ? [data] : [];
}

function buildSummaryRows(rows: Record<string, unknown>[]): SummaryMatrixRow[] {
  if (rows.length === 0) {
    return [];
  }

  const grouped = new Map<string, SummaryMatrixRow>();

  for (const row of rows) {
    const component = readStringValue(row, COMPONENT_KEYS);
    const rowMonth = resolveMonthKey(readStringValue(row, MONTH_KEYS));
    const amount = readFirstValue(row, AMOUNT_KEYS);

    if (component && rowMonth && amount !== undefined) {
      const matrixRow = getOrCreateSummaryRow(grouped, component);
      matrixRow.months[rowMonth] = amount;
      continue;
    }

    if (component) {
      const monthValues = readMonthValues(row);
      if (Object.keys(monthValues).length > 0) {
        const matrixRow = getOrCreateSummaryRow(grouped, component);
        matrixRow.months = { ...matrixRow.months, ...monthValues };
      }
      continue;
    }

    const rowMonthOnly = resolveMonthKey(readStringValue(row, MONTH_KEYS));
    if (rowMonthOnly) {
      for (const [key, value] of Object.entries(row)) {
        if (isMetadataKey(key) || !isDisplayableValue(value)) {
          continue;
        }
        const matrixRow = getOrCreateSummaryRow(grouped, formatLabel(key));
        matrixRow.months[rowMonthOnly] = value;
      }
    }
  }

  return sortSummaryRows(
    Array.from(grouped.values()).filter((row) =>
      MONTH_COLUMNS.some((month) => row.months[month.key] !== undefined),
    ),
  );
}

function getOrCreateSummaryRow(grouped: Map<string, SummaryMatrixRow>, component: string): SummaryMatrixRow {
  const existing = grouped.get(component);
  if (existing) {
    return existing;
  }

  const row = { component, months: {} };
  grouped.set(component, row);
  return row;
}

function sortSummaryRows(rows: SummaryMatrixRow[]): SummaryMatrixRow[] {
  return [...rows].sort((first, second) => {
    const firstIndex = summaryComponentOrderIndex(first.component);
    const secondIndex = summaryComponentOrderIndex(second.component);

    if (firstIndex !== secondIndex) {
      return firstIndex - secondIndex;
    }

    return first.component.localeCompare(second.component);
  });
}

function summaryComponentOrderIndex(component: string): number {
  const normalized = normalizeKey(component);
  const index = SUMMARY_COMPONENT_ORDER.findIndex((item) => normalizeKey(item) === normalized);
  return index === -1 ? SUMMARY_COMPONENT_ORDER.length : index;
}

function readMonthValues(row: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const month of MONTH_COLUMNS) {
    for (const alias of month.aliases) {
      const value = readCaseInsensitive(row, alias);
      if (value !== undefined) {
        values[month.key] = value;
        break;
      }
    }
  }

  return values;
}

function resolveMonthKey(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return MONTH_COLUMNS.find((month) =>
    month.aliases.some((alias) => normalized.includes(alias.toLowerCase())),
  )?.key;
}

function readStringValue(row: Record<string, unknown>, keys: string[]): string | undefined {
  const value = readFirstValue(row, keys);
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return undefined;
}

function readFirstValue(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = readCaseInsensitive(row, key);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function readCaseInsensitive(row: Record<string, unknown>, key: string): unknown {
  const normalizedKey = normalizeKey(key);
  const matchedKey = Object.keys(row).find((candidate) => normalizeKey(candidate) === normalizedKey);
  return matchedKey ? row[matchedKey] : undefined;
}

function normalizeKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isMetadataKey(key: string): boolean {
  return [
    ...COMPONENT_KEYS,
    ...MONTH_KEYS,
    "employee",
    "employeeId",
    "employeeName",
    "company",
    "companyId",
    "year",
    "fiscalYear",
  ].some((metadataKey) => normalizeKey(metadataKey) === normalizeKey(key));
}

function isDisplayableValue(value: unknown): boolean {
  return typeof value === "number" || (typeof value === "string" && value.trim().length > 0);
}

function resolvePayPeriod(
  record: Record<string, unknown>,
  answer: string | undefined,
  document: PayslipDocument,
): string {
  const explicit = readStringValue(record, ["payPeriod", "period", "payrollPeriod", "monthYear"]);
  if (explicit) {
    return explicit;
  }

  const answerMatch = answer?.match(/for\s+([A-Za-z]+\s+\d{4})/i);
  if (answerMatch) {
    return answerMatch[1].replace(/\s+/, "-");
  }

  const fileMatch = document.fileName?.match(/\\(\d{6})-(\d{6})\\/);
  if (fileMatch) {
    const start = fileMatch[1];
    const month = Number(start.slice(2, 4));
    const year = `20${start.slice(0, 2)}`;
    return `${shortMonthName(month)}-${year}`;
  }

  return document.fiscalYear ? `-${document.fiscalYear}` : "-";
}

function resolveDefaultEarnings(record: Record<string, unknown>): PayslipLine[] {
  const earnings = [
    { label: "Basic Salary", amount: readNumberValue(record, ["basic", "basicSalary"]) ?? 0 },
    { label: "HRA", amount: readNumberValue(record, ["hra", "houseRentAllowance"]) ?? 0 },
    {
      label: "Transport Allowance",
      amount: readNumberValue(record, ["transportAllowance", "transport", "conveyance"]) ?? 0,
    },
  ].filter((line) => line.amount !== 0);

  return earnings.length > 0 ? earnings : [{ label: "Basic Salary", amount: 0 }];
}

function resolveDefaultDeductions(record: Record<string, unknown>): PayslipLine[] {
  const deductionAmount =
    readNumberValue(record, ["otherDeductions", "deductions", "totalDeductions"]) ?? 0;
  return deductionAmount > 0 ? [{ label: "Deductions", amount: deductionAmount }] : [];
}

function resolvePayslipLines(
  record: Record<string, unknown>,
  key: "earnings" | "deductions",
): PayslipLine[] | null {
  const value = readCaseInsensitive(record, key);
  if (!Array.isArray(value)) {
    return null;
  }

  const lines = value
    .filter(isRecord)
    .map((item) => {
      const label =
        readStringValue(item, ["label", "name", "component", "componentName", "payHeadName"]) ?? "";
      const amount = readNumberValue(item, ["amount", "value", "total", "componentAmount"]);
      return label && amount !== undefined ? { label, amount } : null;
    })
    .filter((line): line is PayslipLine => Boolean(line));

  return lines.length > 0 ? lines : null;
}

function sumLines(lines: PayslipLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

function readNumberValue(row: Record<string, unknown>, keys: string[]): number | undefined {
  const value = readFirstValue(row, keys);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

async function viewPayslipPdf(model: PayslipPdfModel): Promise<void> {
  if (model.pdfBase64) {
    openPdfBlob(base64ToPdfBlob(model.pdfBase64), `payslip-${model.employeeId}-${model.payPeriod}.pdf`);
    return;
  }

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  drawPayslip(doc, model);

  openPdfBlob(doc.output("blob"), `payslip-${model.employeeId}-${model.payPeriod}.pdf`);
}

function openPdfBlob(blob: Blob, fallbackFilename: string): void {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    const link = document.createElement("a");
    link.href = url;
    link.download = fallbackFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function base64ToPdfBlob(value: string): Blob {
  const base64 = value.includes(",") ? value.split(",").pop() ?? "" : value;
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: "application/pdf" });
}

type PdfDoc = InstanceType<typeof import("jspdf").default>;

function drawPayslip(doc: PdfDoc, model: PayslipPdfModel): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 30;
  const top = 24;
  const width = pageWidth - left * 2;
  const line = "#111111";
  const headerFill = "#bfbfbf";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Earning Statement", pageWidth / 2, top, { align: "center" });

  const infoY = top + 14;
  const infoRow = 18;
  const infoCol = width / 4;
  const infoRows = [
    ["Employee ID & Name", "Department & Designation", "Location & Currency", "Pay Period"],
    [model.employeeId, model.department, model.location, model.payPeriod],
    [model.employeeName, model.designation, model.currency, ""],
    ["Pay Mode & D.O.J", "Bank & Account No", "Hours Breakup", ""],
    [model.payMode, model.bankName, `Work Days: ${model.workDays}`, `OT Hrs:${model.otHours}`],
    [model.dateOfJoining, model.accountNo, `Paid Leave: ${model.paidLeave}`, `LOP:${model.lop}`],
  ];

  doc.setLineWidth(0.8);
  doc.rect(left, infoY, width, infoRow * 6);
  for (let row = 0; row < 6; row += 1) {
    if (row === 0 || row === 3) {
      doc.setFillColor(headerFill);
      doc.rect(left, infoY + row * infoRow, width, infoRow, "F");
    }
  }
  for (let col = 1; col < 4; col += 1) {
    doc.line(left + infoCol * col, infoY, left + infoCol * col, infoY + infoRow * 6);
  }
  doc.line(left, infoY + infoRow * 3, left + width, infoY + infoRow * 3);

  infoRows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const x = left + infoCol * colIndex + 4;
      const y = infoY + infoRow * rowIndex + 13;
      doc.setFont("helvetica", rowIndex === 0 || rowIndex === 3 || value.includes(":") ? "bold" : "normal");
      doc.setFontSize(rowIndex === 0 || rowIndex === 3 ? 11 : 10);
      doc.text(String(value), x, y);
    });
  });

  const tableY = infoY + infoRow * 6 + 8;
  const tableH = 242;
  const gap = 7;
  const sideW = (width - gap) / 2;
  const labelW = sideW * 0.62;
  const amountW = sideW - labelW;
  const rowH = 38;
  const headerH = 38;
  const totalY = tableY + headerH + rowH * 3;
  const netY = totalY + rowH + 31;

  drawSideTable(doc, {
    x: left,
    y: tableY,
    width: sideW,
    height: tableH,
    labelWidth: labelW,
    amountWidth: amountW,
    title: "Earnings",
    lines: model.earnings,
    totalLabel: "Total Earnings :",
    total: sumLines(model.earnings),
    headerFill,
    line,
  });

  drawSideTable(doc, {
    x: left + sideW + gap,
    y: tableY,
    width: sideW,
    height: tableH,
    labelWidth: labelW,
    amountWidth: amountW,
    title: "Deductions",
    lines: model.deductions,
    totalLabel: "Total Deductions :",
    total: sumLines(model.deductions),
    headerFill,
    line,
  });

  doc.setFillColor(headerFill);
  doc.rect(left + sideW + gap, netY, sideW, rowH - 6, "F");
  doc.setDrawColor(line);
  doc.rect(left + sideW + gap, netY, sideW, rowH - 6);
  doc.line(left + sideW + gap + labelW, netY, left + sideW + gap + labelW, netY + rowH - 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Net Pay :", left + sideW + gap + labelW - 4, netY + 22, { align: "right" });
  doc.text(formatAmount(model.netPay), left + width - 5, netY + 22, { align: "right" });
}

function drawSideTable(
  doc: PdfDoc,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    labelWidth: number;
    amountWidth: number;
    title: string;
    lines: PayslipLine[];
    totalLabel: string;
    total: number;
    headerFill: string;
    line: string;
  },
): void {
  const headerH = 38;
  const rowH = 38;
  const totalY = options.y + headerH + rowH * 3;

  doc.setDrawColor(options.line);
  doc.setLineWidth(0.8);
  doc.rect(options.x, options.y, options.width, options.height);
  doc.line(options.x + options.labelWidth, options.y, options.x + options.labelWidth, options.y + options.height);

  doc.setFillColor(options.headerFill);
  doc.rect(options.x, options.y, options.width, headerH, "F");
  doc.rect(options.x, totalY, options.width, rowH, "F");

  for (let index = 1; index <= 4; index += 1) {
    const y = options.y + headerH + rowH * index;
    doc.line(options.x, y, options.x + options.width, y);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(options.title, options.x + 5, options.y + 23);
  doc.text("Amount", options.x + options.width - 5, options.y + 23, { align: "right" });

  doc.setFont("helvetica", "normal");
  options.lines.slice(0, 3).forEach((item, index) => {
    const y = options.y + headerH + rowH * index + 23;
    doc.text(item.label, options.x + 5, y);
    doc.text(formatAmount(item.amount), options.x + options.width - 5, y, { align: "right" });
  });

  doc.text(options.totalLabel, options.x + options.labelWidth - 4, totalY + 23, { align: "right" });
  doc.text(formatAmount(options.total), options.x + options.width - 5, totalY + 23, { align: "right" });
}

function shortMonthName(month: number): string {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    month - 1
  ] ?? "-";
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function downloadPaySummaryPdf(
  rows: SummaryMatrixRow[],
  context: ExportContext,
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const document = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const headers = ["Component", ...MONTH_COLUMNS.map((month) => month.label)];
  const body = rows.map((row) => [
    row.component,
    ...MONTH_COLUMNS.map((month) => formatValue(row.months[month.key])),
    formatTotal(row),
  ]);
  headers.push("Total");

  document.setFontSize(14);
  document.text("Pay Summary Report", 40, 36);
  document.setFontSize(9);
  const contextLines = buildContextLines(context);
  contextLines.forEach((line, index) => {
    document.text(line, 40, 54 + index * 14);
  });
  autoTable(document, {
    head: [headers],
    body,
    startY: contextLines.length > 0 ? 66 + contextLines.length * 14 : 52,
    styles: {
      fontSize: 7,
      cellPadding: 4,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.5,
    },
    bodyStyles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: "bold" },
    },
    margin: { left: 30, right: 30 },
  });

  document.save(`pay-summary-${fileDateStamp()}.pdf`);
}

function downloadPaySummaryExcel(rows: SummaryMatrixRow[], context: ExportContext): void {
  const html = buildExcelHtml(rows, context);
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(blob, `pay-summary-${fileDateStamp()}.xls`);
}

function buildExcelHtml(rows: SummaryMatrixRow[], context: ExportContext): string {
  const headers = ["Component", ...MONTH_COLUMNS.map((month) => month.label)];
  headers.push("Total");
  const headerCells = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const contextRows = buildContextRows(context);
  const bodyRows = rows
    .map((row) => {
      const cells = [
        `<td>${escapeHtml(row.component)}</td>`,
        ...MONTH_COLUMNS.map((month) => `<td>${escapeHtml(formatValue(row.months[month.key]))}</td>`),
        `<td>${escapeHtml(formatTotal(row))}</td>`,
      ];
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #f1f5f9; font-weight: 700; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
    td:not(:first-child), th:not(:first-child) { text-align: right; }
  </style>
</head>
<body>
  <table>
    <tbody>${contextRows}</tbody>
  </table>
  <br />
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}

function buildExportContext(context?: UserContext | null): ExportContext {
  return {
    employeeName: context?.employeeName,
    employeeId: context?.employeeId,
    companyName: context?.companyId,
  };
}

function buildContextLines(context: ExportContext): string[] {
  return [
    ["Employee Name", context.employeeName],
    ["Employee ID", context.employeeId],
    ["Company Name", context.companyName],
  ]
    .filter((item): item is [string, string] => Boolean(item[1]))
    .map(([label, value]) => `${label}: ${value}`);
}

function buildContextRows(context: ExportContext): string {
  const rows = [
    ["Employee Name", context.employeeName],
    ["Employee ID", context.employeeId],
    ["Company Name", context.companyName],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return rows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fileDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

function formatValue(value: unknown): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "-";
  }
  return JSON.stringify(value);
}

function formatTotal(row: SummaryMatrixRow): string {
  const total = MONTH_COLUMNS.reduce((sum, month) => {
    const value = row.months[month.key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return sum + value;
    }
    if (typeof value === "string") {
      const parsed = Number(value.replace(/,/g, ""));
      return Number.isFinite(parsed) ? sum + parsed : sum;
    }
    return sum;
  }, 0);

  return total === 0 ? "-" : formatAmount(total);
}
