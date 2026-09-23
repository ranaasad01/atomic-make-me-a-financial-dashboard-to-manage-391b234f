"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Plus, Edit, Trash2, X, AlertCircle, AlertTriangle, Target, TrendingUp, Wallet } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CATEGORIES, CURRENCY, getCategoryMeta } from "@/lib/data";

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
  if (!limit) return 0;
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

const EMPTY_FORM: FormState = {
  category: CATEGORIES[0]?.name ?? "",
  limit: 500,
  spent: 0,
  alertThreshold: 80,
  note: "",
  rollover: false,
};

function newId() {
  return "b" + Date.now().toString(36);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BudgetsPage() {
  const t = useTranslations();

  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"category" | "spent" | "limit" | "pct">("pct");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setMounted(true);
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
      // ignore parse errors
    }
    setBudgets(DEFAULT_BUDGETS);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (mounted && budgets.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
      } catch {
        // ignore storage errors
      }
    }
  }, [budgets, mounted]);

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalBudgeted = useMemo(
    () => (budgets ?? []).reduce((s, b) => s + (b?.limit ?? 0), 0),
    [budgets]
  );
  const totalSpent = useMemo(
    () => (budgets ?? []).reduce((s, b) => s + (b?.spent ?? 0), 0),
    [budgets]
  );
  const overBudgetCount = useMemo(
    () => (budgets ?? []).filter((b) => (b?.spent ?? 0) >= (b?.limit ?? 0)).length,
    [budgets]
  );
  const nearLimitCount = useMemo(
    () =>
      (budgets ?? []).filter((b) => {
        const pct = utilPct(b?.spent ?? 0, b?.limit ?? 0);
        return pct >= (b?.alertThreshold ?? 80) && pct < 100;
      }).length,
    [budgets]
  );

  // ── Sorted list ──────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    const list = [...(budgets ?? [])];
    list.sort((a, b) => {
      if (sortBy === "category") return (a?.category ?? "").localeCompare(b?.category ?? "");
      if (sortBy === "spent") return (b?.spent ?? 0) - (a?.spent ?? 0);
      if (sortBy === "limit") return (b?.limit ?? 0) - (a?.limit ?? 0);
      // pct
      return utilPct(b?.spent ?? 0, b?.limit ?? 0) - utilPct(a?.spent ?? 0, a?.limit ?? 0);
    });
    return list;
  }, [budgets, sortBy]);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((b: BudgetEntry) => {
    setEditId(b?.id ?? null);
    setForm({
      category: b?.category ?? CATEGORIES[0]?.name ?? "",
      limit: b?.limit ?? 0,
      spent: b?.spent ?? 0,
      alertThreshold: b?.alertThreshold ?? 80,
      note: b?.note ?? "",
      rollover: b?.rollover ?? false,
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleSave = useCallback(() => {
    if (!(form.category ?? "").trim()) return;
    if ((form.limit ?? 0) <= 0) return;
    if (editId) {
      setBudgets((prev) =>
        (prev ?? []).map((b) =>
          b?.id === editId ? { ...b, ...form } : b
        )
      );
    } else {
      const entry: BudgetEntry = { id: newId(), ...form };
      setBudgets((prev) => [...(prev ?? []), entry]);
    }
    closeModal();
  }, [form, editId, closeModal]);

  const handleDelete = useCallback((id: string) => {
    setBudgets((prev) => (prev ?? []).filter((b) => b?.id !== id));
    setDeleteId(null);
  }, []);

  const setField = useCallback(
    <K extends keyof FormState>(key: K, val: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: val })),
    []
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-1">Budget Manager</h1>
              <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
                Set limits, track spending, and stay on target.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#0f172a" }}
            >
              <Plus className="w-4 h-4" />
              Add Budget
            </button>
          </div>
        </Reveal>

        {/* Summary cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Budgeted", value: `${CURRENCY ?? "$"}${totalBudgeted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, color: "var(--primary)" },
            { label: "Total Spent",    value: `${CURRENCY ?? "$"}${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,    icon: TrendingUp, color: "var(--accent)" },
            { label: "Over Budget",    value: String(overBudgetCount),  icon: AlertCircle,   color: "var(--destructive)" },
            { label: "Near Limit",     value: String(nearLimitCount),   icon: AlertTriangle, color: "#f59e0b" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              variants={fadeInUp}
              className="glass rounded-2xl p-5 card-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Sort bar */}
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Sort by:</span>
            {(["pct", "spent", "limit", "category"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: sortBy === s ? "rgba(56,189,248,0.12)" : "transparent",
                  color: sortBy === s ? "var(--primary)" : "var(--muted-foreground)",
                  border: `1px solid ${sortBy === s ? "var(--primary)" : "var(--border)"}`,
                }}
              >
                {s === "pct" ? "% Used" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Budget cards grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {(sorted ?? []).map((budget) => {
            const meta = getCategoryMeta(budget?.category ?? "");
            const color = meta?.color ?? "#94a3b8";
            const emoji = meta?.emoji ?? "📦";
            const pct = utilPct(budget?.spent ?? 0, budget?.limit ?? 0);
            const status = statusColor(pct, budget?.alertThreshold ?? 80);
            const cls = STATUS_CLASSES[status] ?? STATUS_CLASSES.green;
            const remaining = (budget?.limit ?? 0) - (budget?.spent ?? 0);

            return (
              <motion.div
                key={budget?.id ?? budget?.category ?? Math.random().toString()}
                variants={scaleIn}
                className="glass rounded-2xl p-5 card-shadow flex flex-col gap-4 group"
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${color}20` }}
                    >
                      {emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {budget?.category ?? ""}
                      </p>
                      {(budget?.note ?? "") && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                          {budget.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(budget)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                    </button>
                    <button
                      onClick={() => setDeleteId(budget?.id ?? null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={cn("text-xs font-semibold", cls.text)}>
                      {pct.toFixed(1)}% used
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {CURRENCY ?? "$"}{(budget?.spent ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {CURRENCY ?? "$"}{(budget?.limit ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <motion.div
                      className={cn("h-full rounded-full", cls.bar)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", cls.badge)}
                  >
                    {status === "red" ? "Over budget" : status === "yellow" ? "Near limit" : "On track"}
                  </span>
                  <span className="text-xs" style={{ color: remaining >= 0 ? "var(--muted-foreground)" : "var(--destructive)" }}>
                    {remaining >= 0
                      ? `${CURRENCY ?? "$"}${remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left`
                      : `${CURRENCY ?? "$"}${Math.abs(remaining).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over`}
                  </span>
                </div>

                {/* Rollover indicator */}
                {budget?.rollover && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Rollover enabled</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty state */}
        {(budgets ?? []).length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Target className="w-12 h-12" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>No budgets yet</p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Add your first budget to start tracking.</p>
            <button
              onClick={openAdd}
              className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#0f172a" }}
            >
              Add Budget
            </button>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} onClick={closeModal} />
            <motion.div
              className="relative glass rounded-2xl p-6 w-full max-w-md card-shadow"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  {editId ? "Edit Budget" : "Add Budget"}
                </h2>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Category</label>
                  <select
                    value={form.category ?? ""}
                    onChange={(e) => setField("category", e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={{ background: "var(--background)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    {(CATEGORIES ?? []).map((c) => (
                      <option key={c?.name ?? ""} value={c?.name ?? ""}>{c?.emoji ?? ""} {c?.name ?? ""}</option>
                    ))}
                  </select>
                </div>

                {/* Limit */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Monthly Limit ({CURRENCY ?? "$"})</label>
                  <input
                    type="number"
                    min={1}
                    value={form.limit ?? 0}
                    onChange={(e) => setField("limit", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={{ background: "var(--background)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>

                {/* Spent */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Amount Spent ({CURRENCY ?? "$"})</label>
                  <input
                    type="number"
                    min={0}
                    value={form.spent ?? 0}
                    onChange={(e) => setField("spent", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={{ background: "var(--background)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>

                {/* Alert threshold */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Alert Threshold (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.alertThreshold ?? 80}
                    onChange={(e) => setField("alertThreshold", parseInt(e.target.value) || 80)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={{ background: "var(--background)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Note (optional)</label>
                  <input
                    type="text"
                    value={form.note ?? ""}
                    onChange={(e) => setField("note", e.target.value)}
                    placeholder="e.g. Groceries + dining out"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={{ background: "var(--background)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  />
                </div>

                {/* Rollover toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setField("rollover", !(form.rollover ?? false))}
                    className="w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer"
                    style={{ background: (form.rollover ?? false) ? "var(--primary)" : "var(--border)" }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                      style={{ transform: (form.rollover ?? false) ? "translateX(20px)" : "translateX(2px)" }}
                    />
                  </div>
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>Enable rollover</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#0f172a" }}
                >
                  {editId ? "Save Changes" : "Add Budget"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setDeleteId(null)} />
            <motion.div
              className="relative glass rounded-2xl p-6 w-full max-w-sm card-shadow"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>Delete this budget?</p>
                  <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteId ?? "")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
