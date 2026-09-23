"use client";

import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, Filter, Edit, Trash2, X, Check, ChevronDown, ChevronRight, ArrowLeft, ArrowRight, Calendar, AlertCircle, Plus } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { CATEGORIES, Transaction } from "@/lib/data";
type CURRENCY_SYMBOL = any;
const CURRENCY_SYMBOL: any = [];
type SEED_TRANSACTIONS = any;
const SEED_TRANSACTIONS: any = [];
type getCategoryColor = any;
const getCategoryColor: any = [];
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";

// ─── localStorage store ───────────────────────────────────────────────────────

const STORE_KEY = "fintrack_transactions";

function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return SEED_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return SEED_TRANSACTIONS;
    return JSON.parse(raw) as Transaction[];
  } catch {
    return SEED_TRANSACTIONS;
  }
}

function saveTransactions(txns: Transaction[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(txns));
  } catch {
    // ignore
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

type DatePreset = "all" | "daily" | "weekly" | "monthly" | "custom";

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getPresetRange(preset: DatePreset): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (preset === "daily") {
    return { from: startOfDay(now), to: now };
  }
  if (preset === "weekly") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: startOfDay(from), to: now };
  }
  if (preset === "monthly") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to: now };
  }
  return { from: null, to: null };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Category badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const color = getCategoryColor(category);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color + "22", color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {category}
    </span>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  message,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onCancel}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[hsl(var(--card))] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="mb-4 flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <p className="text-sm text-[hsl(var(--foreground))]">{message}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={onCancel}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="rounded-xl bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Edit / Add Modal ─────────────────────────────────────────────────────────

interface FormState {
  merchant: string;
  category: string;
  amount: string;
  date: string;
  note: string;
}

const EMPTY_FORM: FormState = {
  merchant: "",
  category: CATEGORIES[0]?.name ?? "Food & Dining",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

function txnToForm(t: Transaction): FormState {
  return {
    merchant: t.merchant,
    category: t.category,
    amount: String(t.amount),
    date: t.date,
    note: t.note,
  };
}

function EditModal({
  open,
  transaction,
  onSave,
  onClose,
}: {
  open: boolean;
  transaction: Transaction | null;
  onSave: (updated: Transaction) => void;
  onClose: () => void;
}) {
  const isNew = transaction === null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  useEffect(() => {
    if (open) {
      setForm(transaction ? txnToForm(transaction) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, transaction]);

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.merchant.trim()) e.merchant = "Merchant is required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    const updated: Transaction = {
      id: transaction?.id ?? `t${Date.now()}`,
      merchant: form.merchant.trim(),
      category: form.category,
      amount: parseFloat(Number(form.amount).toFixed(2)),
      date: form.date,
      note: form.note.trim(),
    };
    onSave(updated);
  }

  function field(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[hsl(var(--card))] shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                  {isNew ? "Add Transaction" : "Edit Transaction"}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/5 hover:text-[hsl(var(--foreground))]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                {/* Merchant */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Merchant
                  </label>
                  <input
                    value={form.merchant}
                    onChange={(e) => field("merchant", e.target.value)}
                    placeholder="e.g. Whole Foods Market"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition-colors"
                  />
                  {errors.merchant && (
                    <p className="mt-1 text-xs text-red-400">{errors.merchant}</p>
                  )}
                </div>

                {/* Category + Amount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => field("category", e.target.value)}
                        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition-colors"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.key} value={c.name} className="bg-[hsl(var(--card))]">
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      Amount ({CURRENCY_SYMBOL})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => field("amount", e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition-colors"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-xs text-red-400">{errors.amount}</p>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => field("date", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition-colors"
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-400">{errors.date}</p>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Note
                    <span className="ml-1 text-[hsl(var(--muted-foreground))]/60">(optional)</span>
                  </label>
                  <input
                    value={form.note}
                    onChange={(e) => field("note", e.target.value)}
                    placeholder="Brief description..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition-colors"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isNew ? "Add" : "Save changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Page constants ───────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: "All time", value: "all" },
  { label: "Today", value: "daily" },
  { label: "Last 7 days", value: "weekly" },
  { label: "This month", value: "monthly" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mounted, setMounted] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // pagination
  const [page, setPage] = useState(1);

  // modals
  const [editTarget, setEditTarget] = useState<Transaction | null | undefined>(undefined); // undefined = closed, null = new
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  // load from localStorage on mount
  useEffect(() => {
    setTransactions(loadTransactions());
    setMounted(true);
  }, []);

  // persist on change
  useEffect(() => {
    if (mounted) saveTransactions(transactions);
  }, [transactions, mounted]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback((updated: Transaction) => {
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    setEditTarget(undefined);
  }, []);

  const handleDelete = useCallback((txn: Transaction) => {
    setDeleteTarget(txn);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...transactions];

    // search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.note.toLowerCase().includes(q)
      );
    }

    // category
    if (categoryFilter !== "All") {
      list = list.filter((t) => t.category === categoryFilter);
    }

    // date
    if (datePreset !== "all") {
      let from: Date | null = null;
      let to: Date | null = null;

      if (datePreset === "custom") {
        from = customFrom ? new Date(customFrom + "T00:00:00") : null;
        to = customTo ? new Date(customTo + "T23:59:59") : null;
      } else {
        const range = getPresetRange(datePreset);
        from = range.from;
        to = range.to;
      }

      if (from || to) {
        list = list.filter((t) => {
          const d = new Date(t.date + "T00:00:00");
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });
      }
    }

    // sort newest first
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [transactions, search, categoryFilter, datePreset, customFrom, customTo]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, datePreset, customFrom, customTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // summary stats
  const totalSpend = useMemo(
    () => filtered.reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );
  const avgTransaction = filtered.length > 0 ? totalSpend / filtered.length : 0;
  const largestTxn = filtered.reduce(
    (max, t) => (t.amount > max ? t.amount : max),
    0
  );

  const categoryOptions = useMemo(
    () => ["All", ...CATEGORIES.map((c) => c.name)],
    []
  );

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* ── Header ── */}
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                Transactions
              </h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Browse, search, and manage every expense in one place.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setEditTarget(null)}
              className="flex items-center gap-2 self-start rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-opacity hover:opacity-90 sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </motion.button>
          </div>
        </Reveal>

        {/* ── Summary stats ── */}
        <Reveal delay={0.05}>
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              {
                label: "Total Spend",
                value: `${CURRENCY_SYMBOL}${formatAmount(totalSpend)}`,
                sub: `across ${filtered.length} transaction${filtered.length !== 1 ? "s" : ""}`,
              },
              {
                label: "Average Transaction",
                value: `${CURRENCY_SYMBOL}${formatAmount(avgTransaction)}`,
                sub: "per transaction",
              },
              {
                label: "Largest Expense",
                value: `${CURRENCY_SYMBOL}${formatAmount(largestTxn)}`,
                sub: "single transaction",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="rounded-2xl border border-white/10 bg-[hsl(var(--card))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold text-[var(--accent)]">{stat.value}</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* ── Filters ── */}
        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-white/10 bg-[hsl(var(--card))] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search merchant, category, or note..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition-colors"
                />
              </div>

              {/* Category */}
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2.5 pl-8 pr-8 text-sm text-[hsl(var(--foreground))] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition-colors"
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} className="bg-[hsl(var(--card))]">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              </div>
            </div>

            {/* Date presets */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDatePreset(p.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    datePreset === p.value
                      ? "bg-[var(--accent)] text-black"
                      : "border border-white/10 text-[hsl(var(--muted-foreground))] hover:bg-white/5"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setDatePreset("custom")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  datePreset === "custom"
                    ? "bg-[var(--accent)] text-black"
                    : "border border-white/10 text-[hsl(var(--muted-foreground))] hover:bg-white/5"
                }`}
              >
                Custom
              </button>

              {/* Custom date inputs */}
              <AnimatePresence>
                {datePreset === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[hsl(var(--foreground))] focus:border-[var(--accent)] focus:outline-none transition-colors"
                    />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">to</span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[hsl(var(--foreground))] focus:border-[var(--accent)] focus:outline-none transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        {/* ── Transaction table ── */}
        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
            {/* Table header */}
            <div className="hidden grid-cols-[1fr_160px_100px_120px_40px] gap-4 border-b border-white/10 px-6 py-3 sm:grid">
              {["Merchant", "Category", "Amount", "Date", ""].map((h, i) => (
                <span
                  key={i}
                  className={`text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] ${
                    i === 2 ? "text-right" : ""
                  }`}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <AnimatePresence mode="popLayout">
              {paginated.length === 0 ? (
                <motion.div
                  key="empty"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center justify-center gap-3 py-16 text-center"
                >
                  <Search className="h-8 w-8 text-[hsl(var(--muted-foreground))]/40" />
                  <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    No transactions match your filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("All");
                      setDatePreset("all");
                    }}
                    className="text-xs text-[var(--accent)] underline-offset-2 hover:underline"
                  >
                    Clear all filters
                  </button>
                </motion.div>
              ) : (
                paginated.map((txn, i) => (
                  <motion.div
                    key={txn.id}
                    layout
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-b border-white/5 last:border-0"
                  >
                    {/* Desktop row */}
                    <div className="hidden grid-cols-[1fr_160px_100px_120px_40px] items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.03] sm:grid">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                          {txn.merchant}
                        </p>
                        {txn.note && (
                          <p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">
                            {txn.note}
                          </p>
                        )}
                      </div>
                      <div>
                        <CategoryBadge category={txn.category} />
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {CURRENCY_SYMBOL}{formatAmount(txn.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDate(txn.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setEditTarget(txn)}
                          className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/10 hover:text-[hsl(var(--foreground))]"
                          aria-label="Edit transaction"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(txn)}
                          className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="flex items-start justify-between gap-3 px-4 py-4 sm:hidden">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                          {txn.merchant}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <CategoryBadge category={txn.category} />
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {formatDate(txn.date)}
                          </span>
                        </div>
                        {txn.note && (
                          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                            {txn.note}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {CURRENCY_SYMBOL}{formatAmount(txn.amount)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditTarget(txn)}
                            className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/10"
                            aria-label="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(txn)}
                            className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-red-500/10 hover:text-red-400"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-white/10 px-6 py-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/5 disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "…" ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-xs text-[hsl(var(--muted-foreground))]">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`min-w-[28px] rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                            page === p
                              ? "bg-[var(--accent)] text-black"
                              : "text-[hsl(var(--muted-foreground))] hover:bg-white/5"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/5 disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Modals ── */}
      <EditModal
        open={editTarget !== undefined}
        transaction={editTarget ?? null}
        onSave={handleSave}
        onClose={() => setEditTarget(undefined)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        message={`Delete "${deleteTarget?.merchant}" for ${CURRENCY_SYMBOL}${formatAmount(deleteTarget?.amount ?? 0)}? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}