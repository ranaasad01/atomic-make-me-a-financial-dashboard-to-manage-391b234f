"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { MONTHLY_BUDGET, CATEGORIES } from "@/lib/data";
type CURRENCY_SYMBOL = any;
const CURRENCY_SYMBOL: any = [];
type SEED_TRANSACTIONS = any;
const SEED_TRANSACTIONS: any = [];
type SEED_BUDGETS = any;
const SEED_BUDGETS: any = [];
type getCategoryColor = any;
const getCategoryColor: any = [];
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/motion";
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, ArrowRight, Bell, PieChart, BarChart2, Shield, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import Link from "next/link";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const MONTHLY_TREND_DATA_LOCAL = [
  { month: "Feb", spent: 2410 },
  { month: "Mar", spent: 2780 },
  { month: "Apr", spent: 2190 },
  { month: "May", spent: 2950 },
  { month: "Jun", spent: 2630 },
  { month: "Jul", spent: 2320 },
];

const FEATURES = [
  {
    icon: PieChart,
    title: "Spending Breakdown",
    desc: "See exactly where your money goes with interactive category charts updated in real time.",
  },
  {
    icon: Bell,
    title: "Budget Alerts",
    desc: "Get notified before you overspend. Set thresholds per category and stay on track effortlessly.",
  },
  {
    icon: BarChart2,
    title: "Trend Analytics",
    desc: "Spot patterns across months. Understand your habits and make smarter financial decisions.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    desc: "Your data is encrypted end-to-end. Only you can see your financial picture.",
  },
  {
    icon: Zap,
    title: "Instant Logging",
    desc: "Add a transaction in seconds. No friction, no forms — just fast, clean expense tracking.",
  },
  {
    icon: CheckCircle,
    title: "Budget Rollover",
    desc: "Unused budget rolls over to next month automatically, so nothing goes to waste.",
  },
];

export default function HomePage() {
  const t = useTranslations();
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, []);

  const recentTxns = SEED_TRANSACTIONS.slice(0, 5);

  const totalSpent = SEED_TRANSACTIONS.filter((tx) =>
    tx.date.startsWith("2025-07")
  ).reduce((sum, tx) => sum + tx.amount, 0);

  const remaining = MONTHLY_BUDGET - totalSpent;
  const spentPct = Math.min((totalSpent / MONTHLY_BUDGET) * 100, 100);

  const categoryTotals: Record<string, number> = {};
  SEED_TRANSACTIONS.filter((tx) => tx.date.startsWith("2025-07")).forEach(
    (tx) => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + tx.amount;
    }
  );
  const pieData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const budgetAlerts = SEED_BUDGETS.filter((b) => {
    const spent = categoryTotals[b.category] ?? 0;
    return spent / b.limit >= b.alertThreshold / 100;
  });

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ── HERO ── */}
      <Reveal>
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--accent)]/10 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left copy */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-6"
              >
                <motion.span
                  variants={fadeInUp}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]"
                >
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("hero.badge")}
                </motion.span>

                <motion.h1
                  variants={fadeInUp}
                  className="text-4xl font-bold leading-tight tracking-tight text-[hsl(var(--foreground))] sm:text-5xl lg:text-6xl"
                >
                  {t("hero.headline")}
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="max-w-lg text-lg leading-relaxed text-[hsl(var(--muted-foreground))]"
                >
                  {t("hero.subhead")}
                </motion.p>

                <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                  <Link
                    href="/transactions"
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[hsl(var(--background))] shadow-[0_4px_24px_-4px_var(--accent)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_8px_32px_-4px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    {t("hero.cta_primary")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/analytics"
                    className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-300 hover:border-[var(--accent)]/40 hover:bg-[hsl(var(--card))]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    {t("hero.cta_secondary")}
                  </Link>
                </motion.div>

                {user && (
                  <motion.p
                    variants={fadeInUp}
                    className="text-sm text-[hsl(var(--muted-foreground))]"
                  >
                    {t("hero.welcome_back")}{" "}
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      {user.email}
                    </span>
                  </motion.p>
                )}
              </motion.div>

              {/* Right — mini dashboard card */}
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="relative"
              >
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_48px_-12px_rgba(0,0,0,0.18)]">
                  {/* Budget ring summary */}
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                        {t("hero.card.month")}
                      </p>
                      <p className="mt-0.5 text-2xl font-bold text-[hsl(var(--foreground))]">
                        {CURRENCY_SYMBOL}
                        {totalSpent.toFixed(2)}
                        <span className="ml-1 text-sm font-normal text-[hsl(var(--muted-foreground))]">
                          / {CURRENCY_SYMBOL}
                          {MONTHLY_BUDGET.toLocaleString("en-US")}
                        </span>
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15">
                      <Wallet
                        className="h-6 w-6 text-[var(--accent)]"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--accent)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${spentPct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                    />
                  </div>
                  <p className="mb-5 text-right text-xs text-[hsl(var(--muted-foreground))]">
                    {CURRENCY_SYMBOL}
                    {remaining.toFixed(2)} {t("hero.card.remaining")}
                  </p>

                  {/* Recent transactions mini list */}
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    {t("hero.card.recent")}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {recentTxns.map((tx) => (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))]/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ background: getCategoryColor(tx.category) }}
                            aria-hidden="true"
                          />
                          <span className="max-w-[140px] truncate text-sm font-medium text-[hsl(var(--foreground))]">
                            {tx.merchant}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          -{CURRENCY_SYMBOL}
                          {tx.amount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/transactions"
                    className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--accent)] transition-opacity hover:opacity-80"
                  >
                    {t("hero.card.view_all")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── STATS ROW ── */}
      <Reveal>
        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-2 gap-6 sm:grid-cols-4"
            >
              {[
                {
                  label: t("stats.total_spent"),
                  value: `${CURRENCY_SYMBOL}${totalSpent.toFixed(0)}`,
                  sub: t("stats.this_month"),
                  icon: TrendingDown,
                  color: "#f472b6",
                },
                {
                  label: t("stats.remaining"),
                  value: `${CURRENCY_SYMBOL}${remaining.toFixed(0)}`,
                  sub: t("stats.budget_left"),
                  icon: Wallet,
                  color: "var(--accent)",
                },
                {
                  label: t("stats.transactions"),
                  value: `${SEED_TRANSACTIONS.filter((tx) => tx.date.startsWith("2025-07")).length}`,
                  sub: t("stats.this_month"),
                  icon: ShoppingCart,
                  color: "#818cf8",
                },
                {
                  label: t("stats.alerts"),
                  value: `${budgetAlerts.length}`,
                  sub: t("stats.budget_alerts"),
                  icon: AlertCircle,
                  color: "#fb923c",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  className="flex flex-col gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${stat.color}20` }}
                  >
                    <stat.icon
                      className="h-5 w-5"
                      style={{ color: stat.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                    {stat.value}
                  </p>
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {stat.label}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {stat.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── SPENDING BREAKDOWN + TREND ── */}
      <Reveal>
        <section
          id="overview"
          className="px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("breakdown.eyebrow")}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                {t("breakdown.heading")}
              </h2>
              <p className="mt-3 max-w-xl text-[hsl(var(--muted-foreground))]">
                {t("breakdown.subhead")}
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Pie chart */}
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
                <p className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">
                  {t("breakdown.pie_title")}
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCategoryColor(entry.name)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `${CURRENCY_SYMBOL}${value.toFixed(2)}`
                      }
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
                <ul className="mt-4 flex flex-col gap-2">
                  {pieData.map((entry) => (
                    <li
                      key={entry.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ background: getCategoryColor(entry.name) }}
                          aria-hidden="true"
                        />
                        <span className="text-[hsl(var(--foreground))]">
                          {entry.name}
                        </span>
                      </div>
                      <span className="font-semibold text-[hsl(var(--foreground))]">
                        {CURRENCY_SYMBOL}
                        {entry.value.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bar chart — monthly trend */}
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
                <p className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">
                  {t("breakdown.bar_title")}
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={MONTHLY_TREND_DATA_LOCAL}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        `${CURRENCY_SYMBOL}${value.toLocaleString("en-US")}`
                      }
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="spent"
                      fill="var(--accent)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <TrendingUp
                    className="h-4 w-4 text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  {t("breakdown.bar_note")}
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── FEATURES ── */}
      <Reveal>
        <section
          id="features"
          className="bg-[hsl(var(--card))] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("features.eyebrow")}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                {t("features.heading")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[hsl(var(--muted-foreground))]">
                {t("features.subhead")}
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  variants={fadeInUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.16)]"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/15 transition-colors duration-300 group-hover:bg-[var(--accent)]/25">
                    <feat.icon
                      className="h-5 w-5 text-[var(--accent)]"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-[hsl(var(--foreground))]">
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {feat.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── BUDGET ALERTS STRIP ── */}
      <Reveal>
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
              {/* Copy */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  {t("alerts.eyebrow")}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                  {t("alerts.heading")}
                </h2>
                <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {t("alerts.body")}
                </p>
                <Link
                  href="/budgets"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--background))] transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {t("alerts.cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {/* Budget cards */}
              <div className="flex flex-col gap-3">
                {SEED_BUDGETS.slice(0, 4).map((budget) => {
                  const spent = categoryTotals[budget.category] ?? 0;
                  const pct = Math.min((spent / budget.limit) * 100, 100);
                  const isAlert = pct >= budget.alertThreshold;
                  return (
                    <div
                      key={budget.id}
                      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{
                              background: getCategoryColor(budget.category),
                            }}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                            {budget.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAlert && (
                            <AlertCircle
                              className="h-4 w-4 text-[#fb923c]"
                              aria-label="Budget alert"
                            />
                          )}
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {CURRENCY_SYMBOL}
                            {spent.toFixed(0)} / {CURRENCY_SYMBOL}
                            {budget.limit}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: isAlert
                              ? "#fb923c"
                              : getCategoryColor(budget.category),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── CTA BANNER ── */}
      <Reveal>
        <section className="px-4 pb-24 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-3xl bg-[var(--accent)] px-8 py-14 text-center shadow-[0_8px_48px_-8px_var(--accent)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
              >
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              </div>
              <h2 className="relative text-3xl font-bold tracking-tight text-[hsl(var(--background))] sm:text-4xl">
                {t("cta.heading")}
              </h2>
              <p className="relative mx-auto mt-4 max-w-lg text-[hsl(var(--background))]/80">
                {t("cta.body")}
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/transactions"
                  className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--background))] px-6 py-3 text-sm font-semibold text-[var(--accent)] transition-all duration-300 hover:bg-[hsl(var(--background))]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--background))]"
                >
                  {t("cta.btn_primary")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/analytics"
                  className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--background))]/30 bg-transparent px-6 py-3 text-sm font-semibold text-[hsl(var(--background))] transition-all duration-300 hover:bg-[hsl(var(--background))]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--background))]"
                >
                  {t("cta.btn_secondary")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </main>
  );
}