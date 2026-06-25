// Export utilities: PDF (jsPDF + autotable), Excel (xlsx), and Print.
// All run client-side in the browser.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type {
  WeeklyReport,
  AttendanceReport,
} from "./types";
import { formatDate, formatCurrency } from "./date-utils";

/** Exports a weekly salary report to a styled PDF. */
export function exportWeeklySalaryPDF(report: WeeklyReport) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const sym = report.currency;

  // Header band.
  doc.setFillColor(34, 139, 87); // green
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(report.businessName || "Weekly Salary Report", 40, 28);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Weekly Salary Report  •  ${formatDate(report.weekStart)} — ${formatDate(
      report.weekEnd,
    )}`,
    40,
    46,
  );

  autoTable(doc, {
    startY: 80,
    head: [
      [
        "Worker ID",
        "Name",
        "Role",
        "Present",
        "Half",
        "Absent",
        "Leave",
        "OT (hrs)",
        "Daily Wage",
        "Weekly Salary",
      ],
    ],
    body: report.items.map((r) => [
      r.workerId,
      r.name,
      r.role || "—",
      r.presentDays,
      r.halfDays,
      r.absentDays,
      r.leaveDays,
      r.overtimeHours,
      formatCurrency(r.dailyWage, sym),
      formatCurrency(r.weeklySalary, sym),
    ]),
    foot: [
      [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        report.totalOvertime,
        "Total",
        formatCurrency(report.totalSalary, sym),
      ],
    ],
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [34, 139, 87], textColor: 255 },
    footStyles: { fillColor: [223, 240, 230], textColor: 20, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 250, 247] },
  });

  doc.save(
    `weekly-salary-${report.weekStart}-to-${report.weekEnd}.pdf`,
  );
}

/** Exports an attendance report to a styled PDF. */
export function exportAttendancePDF(report: AttendanceReport) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFillColor(34, 139, 87);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(report.businessName || "Attendance Report", 40, 28);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Attendance Report  •  ${formatDate(report.startDate)} — ${formatDate(
      report.endDate,
    )}`,
    40,
    46,
  );

  autoTable(doc, {
    startY: 80,
    head: [
      [
        "Worker ID",
        "Name",
        "Role",
        "Present",
        "Half Day",
        "Absent",
        "Leave",
        "OT (hrs)",
        "Marked",
      ],
    ],
    body: report.items.map((r) => [
      r.workerId,
      r.name,
      r.role || "—",
      r.present,
      r.halfDay,
      r.absent,
      r.leave,
      r.overtimeHours,
      r.totalMarked,
    ]),
    foot: [
      [
        "",
        "",
        "Total",
        report.totalPresent,
        report.totalHalfDay,
        report.totalAbsent,
        report.totalLeave,
        "",
        "",
      ],
    ],
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [34, 139, 87], textColor: 255 },
    footStyles: { fillColor: [223, 240, 230], textColor: 20, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 250, 247] },
  });

  doc.save(
    `attendance-${report.startDate}-to-${report.endDate}.pdf`,
  );
}

/** Exports a weekly salary report to an .xlsx workbook. */
export function exportWeeklySalaryExcel(report: WeeklyReport) {
  const rows = report.items.map((r) => ({
    "Worker ID": r.workerId,
    Name: r.name,
    Role: r.role,
    Present: r.presentDays,
    "Half Day": r.halfDays,
    Absent: r.absentDays,
    Leave: r.leaveDays,
    "Overtime Hours": r.overtimeHours,
    "Daily Wage": r.dailyWage,
    "Weekly Salary": r.weeklySalary,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  // Append total row.
  XLSX.utils.sheet_add_json(
    ws,
    [
      {
        "Worker ID": "",
        Name: "",
        Role: "",
        Present: "",
        "Half Day": "",
        Absent: "",
        Leave: "",
        "Overtime Hours": report.totalOvertime,
        "Daily Wage": "",
        "Weekly Salary": report.totalSalary,
      },
    ],
    { origin: -1, skipHeader: true },
  );
  ws["!cols"] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Weekly Salary");
  XLSX.writeFile(
    wb,
    `weekly-salary-${report.weekStart}-to-${report.weekEnd}.xlsx`,
  );
}

/** Exports an attendance report to an .xlsx workbook. */
export function exportAttendanceExcel(report: AttendanceReport) {
  const rows = report.items.map((r) => ({
    "Worker ID": r.workerId,
    Name: r.name,
    Role: r.role,
    Present: r.present,
    "Half Day": r.halfDay,
    Absent: r.absent,
    Leave: r.leave,
    "Overtime Hours": r.overtimeHours,
    "Days Marked": r.totalMarked,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.sheet_add_json(
    ws,
    [
      {
        "Worker ID": "",
        Name: "",
        Role: "TOTAL",
        Present: report.totalPresent,
        "Half Day": report.totalHalfDay,
        Absent: report.totalAbsent,
        Leave: report.totalLeave,
        "Overtime Hours": "",
        "Days Marked": "",
      },
    ],
    { origin: -1, skipHeader: true },
  );
  ws["!cols"] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 14 },
    { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `attendance-${report.startDate}-to-${report.endDate}.xlsx`);
}

/** Opens a print-friendly window for the given report type. */
export function printReport(
  type: "weekly" | "attendance",
  report: WeeklyReport | AttendanceReport,
) {
  const sym = "currency" in report ? report.currency : "₹";
  const win = window.open("", "_blank", "width=1000,height=700");
  if (!win) return;

  let title = "";
  let dateLabel = "";
  let thead = "";
  let tbody = "";
  let tfoot = "";

  if (type === "weekly") {
    const r = report as WeeklyReport;
    title = "Weekly Salary Report";
    dateLabel = `${formatDate(r.weekStart)} — ${formatDate(r.weekEnd)}`;
    thead =
      "<th>Worker ID</th><th>Name</th><th>Role</th><th>Present</th><th>Half</th><th>Absent</th><th>Leave</th><th>OT (hrs)</th><th>Daily Wage</th><th>Weekly Salary</th>";
    tbody = r.items
      .map(
        (row) =>
          `<tr><td>${row.workerId}</td><td>${row.name}</td><td>${row.role || "—"}</td><td>${row.presentDays}</td><td>${row.halfDays}</td><td>${row.absentDays}</td><td>${row.leaveDays}</td><td>${row.overtimeHours}</td><td>${formatCurrency(row.dailyWage, sym)}</td><td><b>${formatCurrency(row.weeklySalary, sym)}</b></td></tr>`,
      )
      .join("");
    tfoot = `<tr class="foot"><td colspan="7"></td><td>${r.totalOvertime}</td><td>Total</td><td>${formatCurrency(r.totalSalary, sym)}</td></tr>`;
  } else {
    const r = report as AttendanceReport;
    title = "Attendance Report";
    dateLabel = `${formatDate(r.startDate)} — ${formatDate(r.endDate)}`;
    thead =
      "<th>Worker ID</th><th>Name</th><th>Role</th><th>Present</th><th>Half Day</th><th>Absent</th><th>Leave</th><th>OT (hrs)</th><th>Marked</th>";
    tbody = r.items
      .map(
        (row) =>
          `<tr><td>${row.workerId}</td><td>${row.name}</td><td>${row.role || "—"}</td><td>${row.present}</td><td>${row.halfDay}</td><td>${row.absent}</td><td>${row.leave}</td><td>${row.overtimeHours}</td><td>${row.totalMarked}</td></tr>`,
      )
      .join("");
    tfoot = `<tr class="foot"><td colspan="2"></td><td>TOTAL</td><td>${r.totalPresent}</td><td>${r.totalHalfDay}</td><td>${r.totalAbsent}</td><td>${r.totalLeave}</td><td></td><td></td></tr>`;
  }

  win.document.write(`
    <!DOCTYPE html><html><head><title>${title}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; color: #1a2e22; }
      .header { background: #228b57; color: #fff; padding: 18px 24px; border-radius: 8px; margin-bottom: 18px; }
      .header h1 { margin: 0 0 4px; font-size: 20px; }
      .header p { margin: 0; font-size: 13px; opacity: .92; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #228b57; color: #fff; padding: 8px 10px; text-align: left; border: 1px solid #1f7a4c; }
      td { padding: 7px 10px; border: 1px solid #d7e6dd; }
      tr:nth-child(even) td { background: #f3faf6; }
      tr.foot td { background: #dff0e6; font-weight: bold; }
      .footer { margin-top: 18px; font-size: 11px; color: #6b7c73; text-align: center; }
      @media print { .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head>
    <body>
      <div class="header"><h1>${(report as { businessName?: string }).businessName || title}</h1><p>${title} • ${dateLabel}</p></div>
      <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody><tfoot>${tfoot}</tfoot></table>
      <div class="footer">Generated on ${new Date().toLocaleString()}</div>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
