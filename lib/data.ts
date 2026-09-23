export const APP_NAME = "FinTrack";
export const APP_TAGLINE = "Your personal finance command center";
export const APP_VERSION = "1.0.0";

export const CURRENCY = "$";
export const MONTHLY_BUDGET = 3000;

export interface NavLink {
  label: string;
  href: string;
  key: string;
  icon?: string;
}

export const navLinks: NavLink[] = [
  { label: "Dashboard", href: "/", key: "dashboard" },
  { label: "Transactions", href: "/transactions", key: "transactions" },
  { label: "Budgets", href: "/budgets", key: "budgets" },
  { label: "Analytics", href: "/analytics", key: "analytics" },
];

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  alertThreshold: number;
  note?: string;
  rollover: boolean;
}

export interface CategoryMeta {
  name: string;
  color: string;
  emoji: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { name: "Food & Dining", color: "#38bdf8", emoji: "🍔" },
  { name: "Housing & Rent", color: "#22d3ee", emoji: "🏠" },
  { name: "Transport", color: "#818cf8", emoji: "🚌" },
  { name: "Health & Wellness", color: "#34d399", emoji: "💊" },
  { name: "Entertainment", color: "#f472b6", emoji: "🎬" },
  { name: "Shopping", color: "#fb923c", emoji: "🛍️" },
  { name: "Utilities", color: "#facc15", emoji: "⚡" },
  { name: "Education", color: "#a78bfa", emoji: "📚" },
  { name: "Subscriptions", color: "#f87171", emoji: "☕" },
  { name: "Savings", color: "#22c55e", emoji: "💰" },
  { name: "Other", color: "#94a3b8", emoji: "📦" },
];

export function getCategoryMeta(name: string): CategoryMeta {
  return (
    CATEGORIES.find((c) => c.name === name) ?? {
      name,
      color: "#94a3b8",
      emoji: "📦",
    }
  );
}

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "t1", merchant: "Whole Foods Market", category: "Food & Dining", amount: 67.40, date: "2025-07-14", note: "Weekly grocery run" },
  { id: "t2", merchant: "Uber", category: "Transport", amount: 14.20, date: "2025-07-14", note: "Ride to downtown office" },
  { id: "t3", merchant: "Netflix", category: "Entertainment", amount: 15.99, date: "2025-07-13", note: "Monthly subscription" },
  { id: "t4", merchant: "CVS Pharmacy", category: "Health & Wellness", amount: 28.75, date: "2025-07-13", note: "Cold medicine and vitamins" },
  { id: "t5", merchant: "Con Edison", category: "Utilities", amount: 98.00, date: "2025-07-12", note: "Monthly electricity bill" },
  { id: "t6", merchant: "Zara", category: "Shopping", amount: 89.00, date: "2025-07-11", note: "Summer jacket" },
  { id: "t7", merchant: "Chipotle", category: "Food & Dining", amount: 13.85, date: "2025-07-11", note: "Lunch" },
  { id: "t8", merchant: "Spotify", category: "Entertainment", amount: 10.99, date: "2025-07-10", note: "Monthly subscription" },
  { id: "t9", merchant: "Whole Foods Market", category: "Food & Dining", amount: 84.32, date: "2025-06-14", note: "Weekly grocery run" },
  { id: "t10", merchant: "Uber", category: "Transport", amount: 12.50, date: "2025-06-13", note: "Commute to downtown office" },
  { id: "t11", merchant: "Netflix", category: "Entertainment", amount: 15.99, date: "2025-06-12", note: "Monthly streaming subscription" },
  { id: "t12", merchant: "CVS Pharmacy", category: "Health & Wellness", amount: 27.40, date: "2025-06-11", note: "Vitamins and cold medicine" },
  { id: "t13", merchant: "Con Edison", category: "Utilities", amount: 94.00, date: "2025-06-10", note: "Monthly electricity bill" },
  { id: "t14", merchant: "Chipotle", category: "Food & Dining", amount: 13.75, date: "2025-06-10", note: "Lunch with coworker" },
  { id: "t15", merchant: "Amazon", category: "Shopping", amount: 46.99, date: "2025-06-09", note: "USB-C hub and cable" },
  { id: "t16", merchant: "Planet Fitness", category: "Health & Wellness", amount: 24.99, date: "2025-06-08", note: "Monthly gym membership" },
  { id: "t17", merchant: "Spotify", category: "Entertainment", amount: 10.99, date: "2025-06-07", note: "Premium music plan" },
  { id: "t18", merchant: "Metro Card", category: "Transport", amount: 33.00, date: "2025-06-06", note: "Monthly transit refill" },
  { id: "t19", merchant: "Rent", category: "Housing & Rent", amount: 1450.00, date: "2025-06-01", note: "June rent payment" },
  { id: "t20", merchant: "Savings Transfer", category: "Savings", amount: 200.00, date: "2025-06-01", note: "Monthly savings goal deposit" },
];

export const INITIAL_BUDGETS: Budget[] = [
  { id: "b1", category: "Food & Dining", limit: 600, alertThreshold: 80, note: "Includes groceries and takeout", rollover: false },
  { id: "b2", category: "Housing & Rent", limit: 1200, alertThreshold: 80, note: "Monthly rent", rollover: false },
  { id: "b3", category: "Transport", limit: 200, alertThreshold: 80, note: "Uber and transit", rollover: false },
  { id: "b4", category: "Entertainment", limit: 120, alertThreshold: 80, note: "Streaming and events", rollover: false },
  { id: "b5", category: "Health & Wellness", limit: 150, alertThreshold: 80, note: "Pharmacy and gym", rollover: false },
  { id: "b6", category: "Shopping", limit: 250, alertThreshold: 80, note: "Clothing and household", rollover: false },
  { id: "b7", category: "Education", limit: 100, alertThreshold: 80, note: "Books and courses", rollover: true },
  { id: "b8", category: "Subscriptions", limit: 80, alertThreshold: 80, note: "All recurring subscriptions", rollover: false },
];