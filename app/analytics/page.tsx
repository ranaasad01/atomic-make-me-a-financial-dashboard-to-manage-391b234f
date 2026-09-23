"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart2, LineChart as LineChartIcon, Calendar, ArrowUpRight, ArrowDownRight, ShoppingBag, Zap } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Reveal } from "@/components/Reveal";
type MONTHLY_TREND_DATA = any;
const MONTHLY_TREND_DATA: any = [];
type SEED_TRANSACTIONS = any;
const SEED_TRANSACTIONS: any = [];
type CURRENCY_SYMBOL = any;
const CURRENCY_SYMBOL: any = [];
type getCategoryColor = any;
const getCategoryColor: any = [];
import { cn } from "@/lib/utils";
import { staggerContainer, fadeInUp } from "@/lib/motion";

// ─── Date range options ───────────────────────────────────────────────────────
const DATE_RANGES = [
  { label: "Last 3 months", value: 3 },
  { label: "Last 6 months", value: 6 },
  { label: "Last 12 months", value: 12 },
] as const;
type DateRangeValue = (typeof DATE_RANGES)[number]["value"];

// ─── Chart type toggle ────────────────────────────────────────────────────────
type ChartType = "line" | "bar";

// ─── Category breakdown computed from SEED_TRANSACTIONS ──────────────────────
function useCategoryBreakdown(months: number) {
  return useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const filtered = SEED_TRANSACTIONS.filter(
      (tx) => new Date(tx.date) >= cutoff
    );
    const map: Record<string, number> = {};
    for (const tx of filtered) {
      map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
    }
    return Object.entries(map)
      .map(([category, total]) => ({
        category,
        total: Math.round(total * 100) / 100,
        color: getCategoryColor(category),
      }))
      .sort((a, b) => b.total - a.total);
  }, [months]);
}

// ─── Insight computations ─────────────────────────────────────────────────────
function useInsights() {
  return useMemo(() => {
    const sorted = [...SEED_TRANSACTIONS].sort(
      (a, b) => b.amount - a.amount
    );
    const biggest = sorted[0];

    // Month-over-month: compare current month total vs previous month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisTotal = SEED_TRANSACTIONS.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((s, tx) => s + tx.amount, 0);

    const prevTotal = SEED_TRANSACTIONS.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    }).reduce((s, tx) => s + tx.amount, 0);

    const momChange =
      prevTotal > 0
        ? Math.round(((thisTotal - prevTotal) / prevTotal) * 1000) / 10
        : 0;

    // Top category this month
    const catMap: Record<string, number> = {};
    SEED_TRANSACTIONS.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).forEach((tx) => {
      catMap[tx.category] = (catMap[tx.category] ?? 0) + tx.amount;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    return { biggest, momChange, thisTotal, prevTotal, topCat };
  }, []);
}

// ─── Custom tooltip for trend chart ──────────────────────────────────────────
function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 shadow-lg">
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[var(--accent)]">
        {CURRENCY_SYMBOL}
        {payload[0].value.toLocaleString("en-US")}
      </p>
    </div>
  );
}

// ─── Custom tooltip for donut ─────────────────────────────────────────────────
function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 shadow-lg">
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.name}</p>
      <p className="mt-1 text-base font-semibold" style={{ color: item.payload.color }}>
        {CURRENCY_SYMBOL}
        {item.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const t = useTranslations();
  const [dateRange, setDateRange] = useState<DateRangeValue>(6);
  const [chartType, setChartType] = useState<ChartType>("line");

  const trendData = useMemo(() => {
    const all = Array.isArray(MONTHLY_TREND_DATA) ? MONTHLY_TREND_DATA : [];
    return all.slice(-dateRange);
  }, [dateRange]);

  const categoryBreakdown = useCategoryBreakdown(dateRange);
  const { biggest, momChange, thisTotal, topCat } = useInsights();

  const totalSpend = categoryBreakdown.reduce((s, c) => s + c.total, 0);

  const insightCards = [
    {
      id: "top-cat",
      icon: ShoppingBag,
      label: t("analytics.insights.topCategory"),
      value: topCat ? topCat[0] : "N/A",
      sub: topCat
        ? `${CURRENCY_SYMBOL}${topCat[1].toFixed(2)} this month`
        : "No data",
      positive: false,
      color: topCat ? getCategoryColor(topCat[0]) : "#94a3b8",
    },
    {
      id: "mom",
      icon: momChange >= 0 ? TrendingUp : TrendingDown,
      label: t("analytics.insights.momChange"),
      value: `${momChange >= 0 ? "+" : ""}${momChange}%`,
      sub: `vs. last month`,
      positive: momChange < 0,
      color: momChange < 0 ? "#4ade80" : "#f87171",
    },
    {
      id: "biggest",
      icon: Zap,
      label: t("analytics.insights.biggestExpense"),
      value: biggest ? `${CURRENCY_SYMBOL}${biggest.amount.toFixed(2)}` : "N/A",
      sub: biggest ? `${biggest.merchant}` : "No data",
      positive: false,
      color: "#818cf8",
    },
    {
      id: "total",
      icon: TrendingUp,
      label: t("analytics.insights.totalThisMonth"),
      value: `${CURRENCY_SYMBOL}${thisTotal.toFixed(2)}`,
      sub: "Current month spend",
      positive: false,
      color: "#38bdf8",
    },
  ];

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">

        {/* ── Header ── */}
        <Reveal>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("analytics.eyebrow")}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                {t("analytics.heading")}
              </h1>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                {t("analytics.subheading")}
              </p>
            </div>

            {/* Date range filter */}
            <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">
              <Calendar className="ml-2 h-4 w-4 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
              {DATE_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setDateRange(r.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    dateRange === r.value
                      ? "bg-[var(--accent)] text-black shadow-sm"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Spending Trend Chart ── */}
        <Reveal>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.18)]">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  {t("analytics.trend.title")}
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {t("analytics.trend.subtitle")}
                </p>
              </div>
              {/* Chart type toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1">
                <button
                  onClick={() => setChartType("line")}
                  aria-label="Line chart"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    chartType === "line"
                      ? "bg-[var(--accent)] text-black"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  <LineChartIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("analytics.trend.lineToggle")}
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  aria-label="Bar chart"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    chartType === "bar"
                      ? "bg-[var(--accent)] text-black"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("analytics.trend.barToggle")}
                </button>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              {chartType === "line" ? (
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                    width={52}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "var(--accent)" }}
                  />
                </LineChart>
              ) : (
                <BarChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                    width={52}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Bar dataKey="spent" radius={[6, 6, 0, 0]}>
                    {trendData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === trendData.length - 1
                            ? "var(--accent)"
                            : "hsl(var(--muted-foreground) / 0.3)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Reveal>

        {/* ── Category Breakdown + Ranked Table ── */}
        <Reveal>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Donut chart */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.18)]">
              <h2 className="mb-1 text-lg font-semibold text-[hsl(var(--foreground))]">
                {t("analytics.donut.title")}
              </h2>
              <p className="mb-4 text-xs text-[hsl(var(--muted-foreground))]">
                {t("analytics.donut.subtitle")}
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Ranked table */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.18)]">
              <h2 className="mb-1 text-lg font-semibold text-[hsl(var(--foreground))]">
                {t("analytics.table.title")}
              </h2>
              <p className="mb-4 text-xs text-[hsl(var(--muted-foreground))]">
                {t("analytics.table.subtitle")}
              </p>
              <div className="space-y-3">
                {categoryBreakdown.map((cat, i) => {
                  const pct = totalSpend > 0 ? (cat.total / totalSpend) * 100 : 0;
                  return (
                    <motion.div
                      key={cat.category}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
                      className="group"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {cat.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {pct.toFixed(1)}%
                          </span>
                          <span className="min-w-[64px] text-right text-sm font-semibold text-[hsl(var(--foreground))]">
                            {CURRENCY_SYMBOL}
                            {cat.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--border))]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: cat.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.05 + 0.1, duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Insight Cards ── */}
        <Reveal>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">
              {t("analytics.insights.heading")}
            </h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {insightCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.id}
                    variants={fadeInUp}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.14)] transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_12px_32px_-8px_rgba(0,0,0,0.2)]"
                  >
                    <div
                      className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${card.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: card.color }} aria-hidden="true" />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{card.label}</p>
                    <p className="mt-1 text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                      {card.value}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      {card.id === "mom" ? (
                        momChange >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-green-400" aria-hidden="true" />
                        )
                      ) : null}
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{card.sub}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </Reveal>

        {/* ── Recent Transactions Snapshot ── */}
        <Reveal>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.18)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  {t("analytics.recent.title")}
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {t("analytics.recent.subtitle")}
                </p>
              </div>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {SEED_TRANSACTIONS.slice(0, 6).map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold"
                      style={{
                        backgroundColor: `${getCategoryColor(tx.category)}20`,
                        color: getCategoryColor(tx.category),
                      }}
                    >
                      {tx.merchant.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {tx.merchant}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {tx.category} · {tx.date}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    -{CURRENCY_SYMBOL}
                    {tx.amount.toFixed(2)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

      </div>
    </main>
  );
}