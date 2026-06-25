// Lightweight i18n system with English and Hindi translations.
// Stores the selected language in localStorage and provides a React hook.

import { create } from "zustand";

export type Lang = "en" | "hi";

type Dict = Record<string, string>;

const en: Dict = {
  // App / nav
  "app.title": "Staff Attendance & Weekly Wages Manager",
  "nav.dashboard": "Dashboard",
  "nav.workers": "Workers",
  "nav.attendance": "Attendance",
  "nav.salary": "Salary Calculator",
  "nav.reports": "Reports",
  "nav.settings": "Settings",

  // Dashboard
  "dash.subtitle": "Workforce overview for today",
  "dash.totalWorkers": "Total Workers",
  "dash.presentToday": "Present Today",
  "dash.absentToday": "Absent Today",
  "dash.weeklySalary": "Weekly Salary",
  "dash.attendanceRate": "Attendance Rate",
  "dash.recentActivities": "Recent Activities",
  "dash.trend": "7-Day Attendance Trend",
  "dash.empty.title": "Welcome! Your workspace is empty.",
  "dash.empty.desc": "Add workers manually or load demo data to explore the app.",
  "dash.empty.cta": "Load demo data",

  // Workers
  "workers.subtitle": "Add, edit and manage your staff",
  "workers.search": "Search by name, worker ID or mobile…",
  "workers.add": "Add Worker",
  "workers.showing": "Showing",
  "workers.of": "of",
  "workers.noResults": "No workers found",

  // Attendance
  "att.subtitle": "Mark daily attendance & view history",
  "att.mark": "Mark Attendance",
  "att.history": "History",
  "att.date": "Attendance Date",
  "att.allPresent": "All Present",
  "att.allAbsent": "All Absent",
  "att.allLeave": "All Leave",
  "att.save": "Save Attendance",
  "att.unsaved": "Unsaved changes",
  "att.saved": "All changes saved",

  // Salary
  "salary.subtitle": "Compute weekly wages automatically",
  "salary.period": "Select Period",
  "salary.current": "Current Week",
  "salary.previous": "Previous Week",
  "salary.custom": "Custom Range",
  "salary.breakdown": "Weekly Salary Breakdown",
  "salary.save": "Save Records",
  "salary.total": "Total Weekly Salary",

  // Reports
  "reports.subtitle": "Generate, export & print reports",
  "reports.weekly": "Weekly Salary",
  "reports.attendance": "Attendance",

  // Settings
  "settings.subtitle": "Configure rates, backup & theme",
  "settings.business": "Business Profile",
  "settings.salaryConfig": "Salary Configuration",
  "settings.appearance": "Appearance",
  "settings.backup": "Backup & Restore",
  "settings.save": "Save Settings",

  // Common statuses
  "status.present": "Present",
  "status.halfDay": "Half Day",
  "status.absent": "Absent",
  "status.leave": "Leave",
  "status.active": "Active",
  "status.inactive": "Inactive",
};

const hi: Dict = {
  // App / nav
  "app.title": "स्टाफ उपस्थिति एवं साप्ताहिक मज़दूरी प्रबंधक",
  "nav.dashboard": "डैशबोर्ड",
  "nav.workers": "कर्मचारी",
  "nav.attendance": "उपस्थिति",
  "nav.salary": "वेतन कैलकुलेटर",
  "nav.reports": "रिपोर्ट",
  "nav.settings": "सेटिंग्स",

  // Dashboard
  "dash.subtitle": "आज का कार्यबल अवलोकन",
  "dash.totalWorkers": "कुल कर्मचारी",
  "dash.presentToday": "आज उपस्थित",
  "dash.absentToday": "आज अनुपस्थित",
  "dash.weeklySalary": "साप्ताहिक वेतन",
  "dash.attendanceRate": "उपस्थिति दर",
  "dash.recentActivities": "हाल की गतिविधियाँ",
  "dash.trend": "7-दिन उपस्थिति रुझान",
  "dash.empty.title": "स्वागत है! आपका कार्यक्षेत्र खाली है।",
  "dash.empty.desc": "कर्मचारी स्वयं जोड़ें या ऐप देखने के लिए डेमो डेटा लोड करें।",
  "dash.empty.cta": "डेमो डेटा लोड करें",

  // Workers
  "workers.subtitle": "अपने कर्मचारियों को जोड़ें, संपादित करें और प्रबंधित करें",
  "workers.search": "नाम, कर्मचारी आईडी या मोबाइल से खोजें…",
  "workers.add": "कर्मचारी जोड़ें",
  "workers.showing": "दिखा रहे हैं",
  "workers.of": "में से",
  "workers.noResults": "कोई कर्मचारी नहीं मिला",

  // Attendance
  "att.subtitle": "दैनिक उपस्थिति दर्ज करें और इतिहास देखें",
  "att.mark": "उपस्थिति दर्ज करें",
  "att.history": "इतिहास",
  "att.date": "उपस्थिति तिथि",
  "att.allPresent": "सभी उपस्थित",
  "att.allAbsent": "सभी अनुपस्थित",
  "att.allLeave": "सभी अवकाश",
  "att.save": "उपस्थिति सहेजें",
  "att.unsaved": "सहेजे न गए बदलाव",
  "att.saved": "सभी बदलाव सहेजे गए",

  // Salary
  "salary.subtitle": "साप्ताहिक वेतन स्वचालित गणना करें",
  "salary.period": "अवधि चुनें",
  "salary.current": "वर्तमान सप्ताह",
  "salary.previous": "पिछला सप्ताह",
  "salary.custom": "कस्टम अवधि",
  "salary.breakdown": "साप्ताहिक वेतन विवरण",
  "salary.save": "रिकॉर्ड सहेजें",
  "salary.total": "कुल साप्ताहिक वेतन",

  // Reports
  "reports.subtitle": "रिपोर्ट बनाएँ, निर्यात और प्रिंट करें",
  "reports.weekly": "साप्ताहिक वेतन",
  "reports.attendance": "उपस्थिति",

  // Settings
  "settings.subtitle": "दरें, बैकअप और थीम कॉन्फ़िगर करें",
  "settings.business": "व्यवसाय प्रोफ़ाइल",
  "settings.salaryConfig": "वेतन कॉन्फ़िगरेशन",
  "settings.appearance": "रूप",
  "settings.backup": "बैकअप और पुनर्स्थापना",
  "settings.save": "सेटिंग्स सहेजें",

  // Common statuses
  "status.present": "उपस्थित",
  "status.halfDay": "अर्ध दिवस",
  "status.absent": "अनुपस्थित",
  "status.leave": "अवकाश",
  "status.active": "सक्रिय",
  "status.inactive": "निष्क्रिय",
};

const DICTS: Record<Lang, Dict> = { en, hi };

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("swm_lang");
  return stored === "hi" ? "hi" : "en";
}

export const useI18n = create<I18nState>((set, get) => ({
  lang: getInitialLang(),
  setLang: (l) => {
    if (typeof window !== "undefined") localStorage.setItem("swm_lang", l);
    set({ lang: l });
  },
  t: (key) => {
    const { lang } = get();
    return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
  },
}));

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];
