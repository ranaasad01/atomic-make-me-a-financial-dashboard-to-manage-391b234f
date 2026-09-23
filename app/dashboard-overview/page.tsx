"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, ArrowUpRight, ArrowDownRight, Plus, Bell, Calendar, ShoppingBag, Utensils, Car, Heart, Zap, Wifi, BookOpen, Star, MoreHorizontal, CheckCircle, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/motion";
import { MONTHLY_BUDGET, CATEGORIES } from "@/lib/data";
type CURRENCY_SYMBOL = any;
const CURRENCY_SYMBOL: any = [];
type SEED_TRANSACTIONS = any;
const SEED_TRANSACTIONS: any = [];
type SEED_BUDGETS = any;
const SEED_BUDGETS: any = [];
type getCategoryColor = any;
const getCategoryColor: any = [];
import { createClient } from "@/lib/supabase/client";

// ─── Inline helpers ────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Food & Dining": <Utensils className="h-4 w-4" />,
  "Housing & Rent": <Star className="h-4 w-4" />,
  Transport: <Car className="h-4 w-4" />,
  "Health & Wellness": <Heart className="h-4 w-4" />,
  Entertainment: <Wifi className="h-4 w-4" />,
  Shopping: <ShoppingBag className="h-4 w-4" />,
  Utilities: <Zap className="h-4 w-4" />,
  Education: <BookOpen className="h-4 w-4" />,
  Subscriptions: <CreditCard className="h-4 w-4" />,
  Savings: <Target className="h-4 w-4" />,
  Other: <MoreHorizontal className="h-4 w-4" />,
};

const MONTHLY_TREND = [
  { month: "Feb", spent: 2410 },
  { month: "Mar", spent: 2780 },
  { month: "Apr", spent: 2250 },
  { month: "May", spent: 2960 },
  { month: "Jun", spent: 2640 },
  { month: "Jul", spent: 320 },
];

function formatCurrency(amount: number) {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  icon: React.ReactNode;
  accent?: boolean;
}

function StatCard({ label, value, sub, trend, trendValue, icon, accent }: StatCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        accent
          ? "border-[var(--accent)]/30 bg-[var(--accent)]/10"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
      } shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            accent
              ? "bg-[var(--accent)]/20 text-[var(--accent)]"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          {icon}
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            trend === "up"
              ? "bg-emerald-500/10 text-emerald-400"
              : trend === "down"
              ? "bg-rose-500/10 text-rose-400"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          {trend === "up" ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : trend === "down" ? (
            <ArrowDownRight className="h-3 w-3" />
          ) : null}
          {trendValue}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          {value}
        </p>
        <p className="mt-0.5 text-sm font-medium text-[hsl(var(--foreground))]">{label}</p>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{sub}</p>
      </div>
    </motion.div>
  );
}

interface BudgetBarProps {
  category: string;
  spent: number;
  limit: number;
}

function BudgetBar({ category, spent, limit }: BudgetBarProps) {
  const pct = Math.min((spent / limit) * 100, 100);
  const color = getCategoryColor(category);
  const over = spent > limit;
  const warn = pct >= 80 && !over;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-[hsl(var(--foreground))]">{category}</span>
        </div>
        <div className="flex items-center gap-2">
          {over && <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}
          {warn && <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
          <span
            className={`text-xs font-medium ${
              over
                ? "text-rose-400"
                : warn
                ? "text-amber-400"
                : "text-[hsl(var(--muted-foreground))]"
            }`}
          >
            {formatCurrency(spent)} / {formatCurrency(limit)}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: over ? "#f43f5e" : color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 shadow-lg">
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="text-sm font-bold text-[hsl(var(--foreground))]">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardOverviewPage() {
  const t = useTranslations();
  const [userName, setUserName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email;
      if (email) {
        setUserName(email.split("@")[0]);
      }
    });
  }, []);

  // Derive stats from seed data
  const currentMonthTransactions = useMemo(
    () => SEED_TRANSACTIONS.filter((tx) => tx.date.startsWith("2025-07")),
    []
  );

  const totalSpentThisMonth = useMemo(
    () => currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [currentMonthTransactions]
  );

  const remaining = MONTHLY_BUDGET - totalSpentThisMonth;
  const budgetUsedPct = Math.round((totalSpentThisMonth / MONTHLY_BUDGET) * 100);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTransactions.forEach((tx) => {
      map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions]);

  // Budget progress from seed budgets
  const budgetProgress = useMemo(() => {
    return (Array.isArray(SEED_BUDGETS) ? SEED_BUDGETS : []).slice(0, 5).map((b) => {
      const spent = currentMonthTransactions
        .filter((tx) => tx.category === b.category)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { category: b.category, spent, limit: b.limit };
    });
  }, [currentMonthTransactions]);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(
    () => [...SEED_TRANSACTIONS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    []
  );

  const greeting = mounted
    ? new Date().getHours() < 12
      ? t("dashboard.greetingMorning")
      : new Date().getHours() < 18
      ? t("dashboard.greetingAfternoon")
      : t("dashboard.greetingEvening")
    : t("dashboard.greetingMorning");

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* ── Header ── */}
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                {greeting}
                {userName ? `, ${userName}` : ""}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                {t("dashboard.title")}
              </h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {t("dashboard.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Calendar className="h-4 w-4" />
                <span>{t("dashboard.currentPeriod")}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[hsl(var(--background))] shadow-[0_0_16px_rgba(56,189,248,0.25)] transition-all duration-200 hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                {t("dashboard.addExpense")}
              </motion.button>
            </div>
          </div>
        </Reveal>

        {/* ── Stat Cards ── */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              label={t("dashboard.stats.totalSpent")}
              value={formatCurrency(totalSpentThisMonth)}
              sub={t("dashboard.stats.totalSpentSub")}
              trend="up"
              trendValue={`${budgetUsedPct}%`}
              icon={<DollarSign className="h-5 w-5" />}
              accent
            />
            <StatCard
              label={t("dashboard.stats.remaining")}
              value={formatCurrency(remaining)}
              sub={t("dashboard.stats.remainingSub")}
              trend={remaining < 500 ? "down" : "neutral"}
              trendValue={remaining < 500 ? t("dashboard.stats.low") : t("dashboard.stats.ok")}
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label={t("dashboard.stats.transactions")}
              value={String(currentMonthTransactions.length)}
              sub={t("dashboard.stats.transactionsSub")}
              trend="neutral"
              trendValue={t("dashboard.stats.thisMonth")}
              icon={<CreditCard className="h-5 w-5" />}
            />
            <StatCard
              label={t("dashboard.stats.avgPerDay")}
              value={formatCurrency(totalSpentThisMonth / 14)}
              sub={t("dashboard.stats.avgPerDaySub")}
              trend="down"
              trendValue="-8%"
              icon={<TrendingDown className="h-5 w-5" />}
            />
          </motion.div>
        </Reveal>

        {/* ── Spending Trend + Category Breakdown ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    {t("dashboard.chart.title")}
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {t("dashboard.chart.sub")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--muted))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t("dashboard.chart.last6")}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={MONTHLY_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#spendGrad)"
                    dot={{ fill: "var(--accent)", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "var(--accent)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
              <h2 className="mb-1 text-base font-semibold text-[hsl(var(--foreground))]">
                {t("dashboard.pie.title")}
              </h2>
              <p className="mb-4 text-xs text-[hsl(var(--muted-foreground))]">
                {t("dashboard.pie.sub")}
              </p>
              <div className="flex justify-center">
                <PieChart width={160} height={160}>
                  <Pie
                    data={categoryBreakdown}
                    cx={75}
                    cy={75}
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={i} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="mt-3 space-y-2">
                {categoryBreakdown.slice(0, 4).map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: getCategoryColor(entry.name) }}
                      />
                      <span className="text-[hsl(var(--foreground))]">{entry.name}</span>
                    </div>
                    <span className="font-medium text-[hsl(var(--muted-foreground))]">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Budget Progress + Recent Transactions ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    {t("dashboard.budgets.title")}
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {t("dashboard.budgets.sub")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  {t("dashboard.budgets.onTrack")}
                </div>
              </div>
              <div className="space-y-4">
                {budgetProgress.map((b) => (
                  <BudgetBar key={b.category} {...b} />
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-[hsl(var(--muted))] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {t("dashboard.budgets.overall")}
                  </span>
                  <span className="font-bold text-[var(--accent)]">{budgetUsedPct}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--border))]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetUsedPct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {formatCurrency(totalSpentThisMonth)} {t("dashboard.budgets.of")}{" "}
                  {formatCurrency(MONTHLY_BUDGET)} {t("dashboard.budgets.used")}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    {t("dashboard.recent.title")}
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {t("dashboard.recent.sub")}
                  </p>
                </div>
                <Bell className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div className="space-y-1">
                {recentTransactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}
                    whileHover={{ x: 3, transition: { duration: 0.15 } }}
                    className="flex items-center gap-3 rounded-xl p-3 transition-colors duration-150 hover:bg-[hsl(var(--muted))]"
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${getCategoryColor(tx.category)}20`, color: getCategoryColor(tx.category) }}
                    >
                      {CATEGORY_ICONS[tx.category] ?? <MoreHorizontal className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                        {tx.merchant}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {tx.category} · {formatDate(tx.date)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-semibold text-rose-400">
                      -{formatCurrency(tx.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {t("dashboard.recent.total5")}
                  </span>
                  <span className="font-bold text-[hsl(var(--foreground))]">
                    {formatCurrency(recentTransactions.reduce((s, tx) => s + tx.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Quick Insights ── */}
        <Reveal>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
            <h2 className="mb-4 text-base font-semibold text-[hsl(var(--foreground))]">
              {t("dashboard.insights.title")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {t("dashboard.insights.saving")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[hsl(var(--foreground))]">
                  {t("dashboard.insights.savingText")}
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {t("dashboard.insights.watch")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[hsl(var(--foreground))]">
                  {t("dashboard.insights.watchText")}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="flex items-center gap-2 text-[var(--accent)]">
                  <Star className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {t("dashboard.insights.tip")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[hsl(var(--foreground))]">
                  {t("dashboard.insights.tipText")}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

      </div>
    </main>
  );
}