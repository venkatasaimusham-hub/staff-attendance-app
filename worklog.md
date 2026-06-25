---
Task ID: 1
Agent: Main Orchestrator (Z.ai Code)
Task: Audit the entire project, remove i18n/useI18n/LangSelector/translation files/unused components, keep only Dashboard/Workers/Attendance/Salary/Reports/Settings, fix all runtime errors, and ensure the project starts successfully.

Work Log:
- Audited the project tree and identified unnecessary feature files: src/lib/i18n.ts, src/components/lang-selector.tsx, src/components/notification-bell.tsx, src/app/api/notifications/route.ts (notifications feature not in keep-list), src/components/theme-provider.tsx (unused — providers.tsx already wires NextThemesProvider directly).
- Deleted all five files plus the now-empty src/app/api/notifications directory.
- Rewrote src/components/app-shell.tsx:
  * Dropped imports for useI18n, LangSelector, NotificationBell.
  * Replaced i18n key-based NAV_ITEMS/VIEW_META with hardcoded English labels/subtitles.
  * Fixed a latent runtime bug: SidebarContent declared a required `t: (key: string) => string` prop but both call sites failed to pass it — clicking any nav button would have thrown `t is not a function`. Removed the `t` prop entirely so labels resolve directly via `item.label`.
  * Removed `<LangSelector />` and `<NotificationBell />` slots from the header; kept ThemeToggle + Logout.
- Fixed a CSS colour bug in src/components/views/dashboard-view.tsx: the trend chart wrapped OKLCH-valued CSS variables inside `hsl(...)` (e.g. `hsl(var(--border) / 0.5)`, `hsl(var(--popover))`), which produced invalid colour strings. Replaced every `hsl(var(--x))` with `var(--x)` (and added `strokeOpacity={0.5}` to keep the gridline faint).
- Ran `bun run lint` → 0 errors, 0 warnings.
- Verified the dev server (already running on :3000) recompiled cleanly after each edit.
- End-to-end browser-verified via Agent Browser:
  * Login with admin123 → succeeds.
  * Dashboard renders 4 stat cards (7 workers, 4 present, 2 absent, ₹6,850 weekly salary), the 7-day attendance trend chart (now with valid colours), 57% attendance-rate progress, today tiles, and 10 recent activities.
  * Workers view: 6 demo worker cards with View/Edit/Delete, search, status filter, pagination, and Add Worker dialog (all fields present).
  * Attendance view: Mark Attendance tab (date, All Present/Absent/Leave quick actions, per-worker status dropdowns, OT inputs, remarks, sticky Save bar) + History tab.
  * Salary Calculator: range buttons (Current/Previous/Custom), auto-calc runs on range change, summary cards + breakdown table render with correct numbers (e.g. Arjun Singh ₹2,300, Mohammed Irfan ₹1,650).
  * Reports view: Weekly Salary + Attendance tabs, date pickers, prev/next week nav, PDF/Excel/Print export buttons.
  * Settings view: Business Profile, Salary Configuration, Appearance (dark-mode switch), Backup & Restore, Save Settings.
  * Mobile viewport (390×844): hamburger drawer opens with all 6 nav items + Sign out; sticky footer pinned to bottom.
  * Desktop viewport (1280×800): sidebar + content + footer layout intact.
  * Browser errors/console: clean (only the standard React DevTools info and HMR connected logs).

Stage Summary:
- Files deleted (5): src/lib/i18n.ts, src/components/lang-selector.tsx, src/components/notification-bell.tsx, src/app/api/notifications/route.ts, src/components/theme-provider.tsx.
- Files rewritten (2): src/components/app-shell.tsx (full rewrite, removed i18n + notifications + fixed SidebarContent `t`-prop bug), src/components/views/dashboard-view.tsx (hsl/oklch colour fix in the recharts CartesianGrid/XAxis/YAxis/Tooltip).
- Final feature set (exactly the requested six): Dashboard, Workers, Attendance, Salary Calculator, Reports, Settings — all wired through the AppShell nav and verified end-to-end.
- Lint: 0 errors, 0 warnings. Dev server: clean recompiles, all API routes return 200. Browser verification: all 6 views render and core interactions (login, nav, drawer, dialogs, data tables) work without runtime errors.
