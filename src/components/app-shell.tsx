"use client";

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calculator,
  FileBarChart,
  Settings as SettingsIcon,
  Fingerprint,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAppStore, type ViewKey } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { LangSelector } from "@/components/lang-selector";
import { DashboardView } from "@/components/views/dashboard-view";
import { WorkersView } from "@/components/views/workers-view";
import { AttendanceView } from "@/components/views/attendance-view";
import { SalaryView } from "@/components/views/salary-view";
import { ReportsView } from "@/components/views/reports-view";
import { SettingsView } from "@/components/views/settings-view";

const NAV_ITEMS: {
  key: ViewKey;
  labelKey: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { key: "workers", labelKey: "nav.workers", icon: Users },
  { key: "attendance", labelKey: "nav.attendance", icon: CalendarCheck },
  { key: "salary", labelKey: "nav.salary", icon: Calculator },
  { key: "reports", labelKey: "nav.reports", icon: FileBarChart },
  { key: "settings", labelKey: "nav.settings", icon: SettingsIcon },
];

const VIEW_META: Record<ViewKey, { titleKey: string; subtitleKey: string }> = {
  dashboard: { titleKey: "nav.dashboard", subtitleKey: "dash.subtitle" },
  workers: { titleKey: "nav.workers", subtitleKey: "workers.subtitle" },
  attendance: { titleKey: "nav.attendance", subtitleKey: "att.subtitle" },
  salary: { titleKey: "nav.salary", subtitleKey: "salary.subtitle" },
  reports: { titleKey: "nav.reports", subtitleKey: "reports.subtitle" },
  settings: { titleKey: "nav.settings", subtitleKey: "settings.subtitle" },
};

export function AppShell() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const logout = useAppStore((s) => s.logout);
  const settings = useAppStore((s) => s.settings);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const { t } = useI18n();

  const meta = VIEW_META[view];

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar">
        <SidebarContent
          view={view}
          setView={setView}
          settings={settings}
          logout={logout}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r bg-sidebar shadow-2xl">
            <div className="flex justify-end p-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent
              view={view}
              setView={setView}
              settings={settings}
              logout={logout}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
              {t(meta.titleKey)}
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {t(meta.subtitleKey)}
            </p>
          </div>
          <LangSelector />
          <NotificationBell />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="hidden sm:inline-flex"
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            Logout
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          <div key={view} className="animate-in fade-in-50 duration-300">
            {view === "dashboard" && <DashboardView />}
            {view === "workers" && <WorkersView />}
            {view === "attendance" && <AttendanceView />}
            {view === "salary" && <SalaryView />}
            {view === "reports" && <ReportsView />}
            {view === "settings" && <SettingsView />}
          </div>
        </main>

        <footer className="mt-auto border-t bg-background px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
          <p>
            Staff Attendance &amp; Weekly Wages Manager • Offline-first •{" "}
            <span className="text-primary font-medium">v1.0</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  view,
  setView,
  settings,
  logout,
  t,
}: {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  settings: { businessName: string } | null;
  logout: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
          <Fingerprint className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-sidebar-foreground">
            {settings?.businessName || "Staff Manager"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Admin workspace
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-[1.15rem] w-[1.15rem] shrink-0",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                )}
              />
              <span className="flex-1 truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
