// Shared TypeScript types mirroring the Prisma models.
export interface Worker {
  id: string;
  workerId: string;
  name: string;
  phone: string;
  address: string;
  role: string;
  joiningDate: string;
  dailyWage: number;
  weeklyOff: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = "Present" | "Half Day" | "Absent" | "Leave";

export interface Attendance {
  id: string;
  workerId: string;
  worker?: Worker;
  date: string;
  status: AttendanceStatus;
  overtimeHours: number;
  remarks: string;
  createdAt: string;
}

export interface Salary {
  id: string;
  workerId: string;
  worker?: Worker;
  weekStart: string;
  weekEnd: string;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  weeklySalary: number;
  createdAt: string;
}

export interface Settings {
  id: string;
  overtimeRate: number;
  leavePaid: boolean;
  businessName: string;
  currency: string;
  theme: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardData {
  today: string;
  totalWorkers: number;
  activeWorkers: number;
  inactiveWorkers: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  notMarked: number;
  attendancePercentage: number;
  totalWeeklySalary: number;
  weekStart: string;
  weekEnd: string;
  trend: {
    date: string;
    present: number;
    absent: number;
    leave: number;
    half: number;
  }[];
  recentActivities: {
    type: "attendance" | "worker";
    id: string;
    workerName: string;
    status: string;
    date: string;
    createdAt: string;
  }[];
}

export interface WeeklyReportRow {
  workerId: string;
  name: string;
  role: string;
  dailyWage: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  weeklySalary: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  businessName: string;
  currency: string;
  overtimeRate: number;
  items: WeeklyReportRow[];
  totalSalary: number;
  totalOvertime: number;
}

export interface AttendanceReportRow {
  workerId: string;
  name: string;
  role: string;
  present: number;
  halfDay: number;
  absent: number;
  leave: number;
  overtimeHours: number;
  totalMarked: number;
}

export interface AttendanceReport {
  startDate: string;
  endDate: string;
  businessName: string;
  currency: string;
  items: AttendanceReportRow[];
  totalPresent: number;
  totalHalfDay: number;
  totalAbsent: number;
  totalLeave: number;
}

export interface SalaryCalcResult {
  weekStart: string;
  weekEnd: string;
  count: number;
  totalSalary: number;
  items: (WeeklyReportRow & { worker: Worker })[];
}
