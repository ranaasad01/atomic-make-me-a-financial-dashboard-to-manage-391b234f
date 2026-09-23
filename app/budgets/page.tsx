"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Plus, Edit, Trash2, X, Check, AlertCircle, AlertTriangle, ChevronDown, Target, TrendingUp, Wallet } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CATEGORIES, MONTHLY_BUDGET, CURRENCY, getCategoryMeta } from "@/lib/data";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BudgetEntry {
  id: string;
  category: string;
  limit: number;
  spent: number;
  alertThreshold: number;
  note: string;
  rollover: boolean;
}

type FormState = {
  category: string;
  limit: number;
  spent: number;
  alertThreshold: number;
  note: string;
  rollover: boolean;
};

// ─── Default seed budgets ─────────────────────────────────────────────────────

const DEFAULT_BUDGETS: BudgetEntry[] = [
  { id: "b1", category: "Food & Dining",     limit: 500,  spent: 312.45, alertThreshold: 80, note: "Groceries + dining out", rollover: false },
  { id: "b2", category: "Housing & Rent",    limit: 1200, spent: 1200,   alertThreshold: 90, note: "Monthly rent",           rollover: false },
  { id: "b3", category: "Transport",         limit: 150,  spent: 87.6,   alertThreshold: 75, note: "Uber + metro",           rollover: true  },
  { id: "b4", category: "Health & Wellness", limit: 200,  spent: 56.15,  alertThreshold: 80, note: "Gym + pharmacy",         rollover: false },
  { id: "b5", category: "Entertainment",     limit: 100,  spent: 92.97,  alertThreshold: 85, note: "Streaming + events",     rollover: false },
  { id: "b6", category: "Shopping",          limit: 250,  spent: 89,     alertThreshold: 80, note: "Clothing + misc",        rollover: false },
  { id: "b7", category: "Utilities",         limit: 180,  spent: 98,     alertThreshold: 75, note: "Electric + internet",    rollover: false },
  { id: "b8", category: "Subscriptions",     limit: 60,   spent: 45.97,  alertThreshold: 90, note: "SaaS + media",           rollover: true  },
];

const STORAGE_KEY = "fintrack_budgets";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function utilPct(spent: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min((spent / limit) * 100, 100);
}

function statusColor(pct: number, threshold: number): "green" | "yellow" | "red" {
  if (pct >= 100) return "red";
  if (pct >= threshold) return "yellow";
  return "green";
}

const STATUS_CLASSES = {
  green:  { bar: "bg-emerald-400",  text: "text-emerald-400",  badge: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  yellow: { bar: "bg-amber-400",    text: "text-amber-400",    badge: "bg-amber-400/10 text-amber-400 border-amber-400/20"       },
  red:    { bar: "bg-rose-500",     text: "text-rose-400",     badge: "bg-rose-500/10 text-rose-400 border-rose-500/20"          },
};

// ─── Arc component ────────────────────────────────────────────────────────────

function SummaryArc({ pct }: { pct: number }) {
  const r = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = -210;
  const sweep = 240;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (start: number, end: number) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
    const e = { x: cx + r * Math.cos(toRad(end)),   y: cy + r * Math.sin(toRad(end))   };
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const filledEnd = startAngle + sweep * (pct / 100);
  const color = pct >= 90 ? "#f43f5e" : pct >= 75 ? "#fbbf24" : "#34d399";

  return (
    <svg viewBox="0 0 180 180" className="w-44 h-44">
      <path
        d={arcPath(startAngle, startAngle + sweep)}
        fill="none"
        stroke="rgba(51,65,85,0.6)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {pct > 0 && (
        <path
          d={arcPath(startAngle, filledEnd)}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="700">
        {Math.round(pct)}%
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#94a3b8" fontSize="11">
        of budget used
      </text>
    </svg>
  );
}

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM: FormState = {
  category: CATEGORIES[0]?.name ?? '',
  limit: 500,
  spent: 0,
  alertThreshold: 80,
  note: '',
  rollover: false,
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function BudgetsPage() {
  const t = useTranslations();

  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [sortBy, setSortBy] = useState<"category" | "spent" | "limit" | "pct">("pct");

  // ── Load from localStorage ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBudgets(parsed);
          return;
        }
      }
    } catch {
      // fall through to default
    }
    setBudgets(DEFAULT_BUDGETS);
  }, []);

  // ── Persist to localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    if (budgets.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
      } catch {
        // storage quota exceeded — ignore
      }
    }
  }, [budgets]);

  // ── Summary stats ───────────────────────────────────────────────────────────
  const totalBudget = useMemo(
    () => (budgets ?? []).reduce((s, b) => s + (b.limit ?? 0), 0),
    [budgets]
  );
  const totalSpent = useMemo(
    () => (budgets ?? []).reduce((s, b) => s + (b.spent ?? 0), 0),
    [budgets]
  );
  const totalRemaining = totalBudget - totalSpent;
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const alertCount = useMemo(
    () =>
      (budgets ?? []).filter((b) => {
        const pct = utilPct(b.spent ?? 0, b.limit ?? 0);
        return pct >= (b.alertThreshold ?? 80);
      }).length,
    [budgets]
  );

  // ── Sorted budgets ──────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const list = [...(budgets ?? [])];
    switch (sortBy) {
      case "category": return list.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? ''));
      case "spent":    return list.sort((a, b) => (b.spent ?? 0) - (a.spent ?? 0));
      case "limit":    return list.sort((a, b) => (b.limit ?? 0) - (a.limit ?? 0));
      case "pct":      return list.sort((a, b) => utilPct(b.spent ?? 0, b.limit ?? 0) - utilPct(a.spent ?? 0, a.limit ?? 0));
      default:         return list;
    }
  }, [budgets, sortBy]);

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((b: BudgetEntry) => {
    setEditingId(b.id);
    setForm({
      category: b.category ?? CATEGORIES[0]?.name ?? '',
      limit: b.limit ?? 500,
      spent: b.spent ?? 0,
      alertThreshold: b.alertThreshold ?? 80,
      note: b.note ?? '',
      rollover: b.rollover ?? false,
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.category) return;
    if (editingId) {
      setBudgets((prev) =>
        (prev ?? []).map((b) =>
          b.id === editingId ? { ...b, ...form } : b
        )
      );
    } else {
      const newEntry: BudgetEntry = {
        id: `b${Date.now()}`,
        ...form,
      };
      setBudgets((prev) => [...(prev ?? []), newEntry]);
    }
    closeModal();
  }, [editingId, form, closeModal]);

  const handleDelete = useCallback((id: string) => {
    setBudgets((prev) => (prev ?? []).filter((b) => b.id !== id));
    setDeleteId(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                Budget Manager
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                Set limits, track spending, and stay on target.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#0f172a" }}
            >
              <Plus className="w-4 h-4" />
              Add Budget
            </button>
          </div>
        </Reveal>

        {/* ── Summary cards ── */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {/* Arc gauge */}
            <motion.div
              variants={scaleIn}
              className="glass rounded-2xl p-5 flex flex-col items-center justify-center card-shadow sm:col-span-2 lg:col-span-1"
            >
              <SummaryArc pct={overallPct} />
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Overall utilization</p>
            </motion.div>

            {/* Total budget */}
            <motion.div variants={fadeInUp} className="glass rounded-2xl p-5 card-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,189,248,0.12)" }}>
                  <Wallet className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Total Budget</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                {CURRENCY}{(totalBudget ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </motion.div>

            {/* Total spent */}
            <motion.div variants={fadeInUp} className="glass rounded-2xl p-5 card-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(244,63,94,0.12)" }}>
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Total Spent</span>
              </div>
              <p className="text-2xl font-bold text-rose-400">
                {CURRENCY}{(totalSpent ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </motion.div>

            {/* Remaining */}
            <motion.div variants={fadeInUp} className="glass rounded-2xl p-5 card-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(52,211,153,0.12)" }}>
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Remaining</span>
              </div>
              <p className={cn("text-2xl font-bold", totalRemaining >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {CURRENCY}{Math.abs(totalRemaining ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {totalRemaining < 0 && <span className="text-sm ml-1">over</span>}
              </p>
            </motion.div>
          </motion.div>
        </Reveal>

        {/* ── Alert banner ── */}
        {alertCount > 0 && (
          <Reveal>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border"
              style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.25)" }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">
                <span className="font-semibold">{alertCount} budget{alertCount > 1 ? "s" : ""}</span> have reached their alert threshold.
              </p>
            </div>
          </Reveal>
        )}

        {/* ── Sort controls ── */}
        <Reveal>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Sort by:</span>
            {(["pct", "spent", "limit", "category"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200",
                  sortBy === opt
                    ? "border-[var(--primary)] text-[var(--primary)] bg-[rgba(56,189,248,0.08)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                )}
              >
                {opt === "pct" ? "Utilization" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </Reveal>

        {/* ── Budget grid ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {(sorted ?? []).map((budget) => {
            const pct = utilPct(budget.spent ?? 0, budget.limit ?? 0);
            const status = statusColor(pct, budget.alertThreshold ?? 80);
            const cls = STATUS_CLASSES[status];
            const meta = getCategoryMeta(budget.category ?? 'Other');
            const remaining = (budget.limit ?? 0) - (budget.spent ?? 0);

            return (
              <motion.div
                key={budget.id}
                variants={fadeInUp}
                className="glass rounded-2xl p-5 card-shadow flex flex-col gap-4 group"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${meta.color}18` }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
                        {budget.category ?? 'Other'}
                      </p>
                      {budget.note && (
                        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                          {budget.note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Status badge */}
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", cls.badge)}>
                      {status === "red" ? "Over" : status === "yellow" ? "Alert" : "OK"}
                    </span>
                    {/* Actions */}
                    <button
                      onClick={() => openEdit(budget)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/5"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-label="Edit budget"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(budget.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-500/10"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-label="Delete budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {CURRENCY}{(budget.spent ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="mx-1" style={{ color: "var(--border)" }}>/</span>
                      {CURRENCY}{(budget.limit ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={cn("text-xs font-semibold", cls.text)}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.6)" }}>
                    <motion.div
                      className={cn("h-full rounded-full", cls.bar)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  {/* Alert threshold marker */}
                  <div className="relative h-0">
                    <div
                      className="absolute top-0 w-0.5 h-2 -translate-y-2 bg-amber-400/60 rounded-full"
                      style={{ left: `${Math.min(budget.alertThreshold ?? 80, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {remaining >= 0
                      ? <>{CURRENCY}{remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left</>
                      : <span className="text-rose-400">{CURRENCY}{Math.abs(remaining).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over</span>
                    }
                  </span>
                  <div className="flex items-center gap-2">
                    {budget.rollover && (
                      <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: "var(--accent)", borderColor: "rgba(34,211,238,0.25)", background: "rgba(34,211,238,0.08)" }}>
                        Rollover
                      </span>
                    )}
                    {status === "yellow" && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                    {status === "red" && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Empty state ── */}
        {(budgets ?? []).length === 0 && (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(56,189,248,0.08)" }}>
                <Target className="w-8 h-8" style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>No budgets yet</p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Add your first budget to start tracking.</p>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#0f172a" }}
              >
                <Plus className="w-4 h-4" />
                Add Budget
              </button>
            </div>
          </Reveal>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="glass rounded-2xl p-6 w-full max-w-md card-shadow"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                    {editingId ? "Edit Budget" : "Add Budget"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2.5 text-sm appearance-none pr-8 border outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all"
                        style={{
                          background: "rgba(15,23,42,0.8)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        {(CATEGORIES ?? []).map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.emoji} {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                    </div>
                  </div>

                  {/* Limit */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Monthly Limit ({CURRENCY})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={form.limit}
                      onChange={(e) => setForm((prev) => ({ ...prev, limit: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all"
                      style={{
                        background: "rgba(15,23,42,0.8)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  {/* Spent (editable for manual override) */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Amount Spent ({CURRENCY})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.spent}
                      onChange={(e) => setForm((prev) => ({ ...prev, spent: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all"
                      style={{
                        background: "rgba(15,23,42,0.8)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  {/* Alert threshold */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Alert Threshold: <span style={{ color: "var(--primary)" }}>{form.alertThreshold}%</span>
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={form.alertThreshold}
                      onChange={(e) => setForm((prev) => ({ ...prev, alertThreshold: parseInt(e.target.value, 10) }))}
                      className="w-full accent-[var(--primary)]"
                    />
                    <div className="flex justify-between text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={form.note}
                      onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="e.g. Groceries + dining out"
                      className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all"
                      style={{
                        background: "rgba(15,23,42,0.8)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  {/* Rollover toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Rollover unused budget</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Carry leftover to next month</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, rollover: !prev.rollover }))}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                        form.rollover ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                      )}
                      aria-checked={form.rollover}
                      role="switch"
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300",
                          form.rollover ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Modal actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 hover:bg-white/5"
                    style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#0f172a" }}
                  >
                    <Check className="w-4 h-4" />
                    {editingId ? "Save Changes" : "Add Budget"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              key="del-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              key="del-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="glass rounded-2xl p-6 w-full max-w-sm card-shadow"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                    <Trash2 className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>Delete Budget</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 hover:bg-white/5"
                    style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteId)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 bg-rose-500 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
