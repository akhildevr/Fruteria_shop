import { useEffect, useMemo, useState } from "react";
import { fetchOrders } from "../utils/api";
import AdminNavbar from "./AdminNavbar";
import { getPaymentMethodType } from "../utils/paymentMethod";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);


const getDayBucket = (value) => {
  const date = new Date(value);
  const normalized = new Date(date);

  if (normalized.getHours() < 2) {
    normalized.setDate(normalized.getDate() - 1);
  }

  normalized.setHours(2, 0, 0, 0);


  const start = new Date(normalized);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const Accounts = () => {
  const [orders, setOrders] = useState([]);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetchOrders();
        setOrders(response.data || []);
      } catch (error) {
        console.error("Error fetching orders for accounts page", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const amount = Number(order.finalTotal) || 0;
        const paymentType = getPaymentMethodType(order.paymentMethod);

        acc.total += amount;
        if (paymentType === "UPI") {
          acc.upi += amount;
        } else if (paymentType === "Swiggy") {
          acc.swiggy += amount;
        } else {
          acc.cash += amount;
        }

        return acc;
      },
      { total: 0, cash: 0, upi: 0, swiggy: 0 }
    );
  }, [orders]);

  const monthWiseData = useMemo(() => {
    const grouped = new Map();

    orders.forEach((order) => {
      const { start: createdAt } = getDayBucket(order.billDate || order.createdAt);

      const year = createdAt.getFullYear();
      const month = String(createdAt.getMonth() + 1).padStart(2, "0");
      const day = String(createdAt.getDate()).padStart(2, "0");
      const monthKey = `${year}-${month}`;
      const dayKey = `${year}-${month}-${day}`;

      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, {
          key: monthKey,
          label: createdAt.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          }),
          total: 0,
          cash: 0,
          upi: 0,
          swiggy: 0,
          days: new Map(),
        });
      }

      const monthEntry = grouped.get(monthKey);
      const amount = Number(order.finalTotal) || 0;
      const paymentType = getPaymentMethodType(order.paymentMethod);

      monthEntry.total += amount;
      if (paymentType === "UPI") {
        monthEntry.upi += amount;
      } else if (paymentType === "Swiggy") {
        monthEntry.swiggy += amount;
      } else {
        monthEntry.cash += amount;
      }

      if (!monthEntry.days.has(dayKey)) {
        monthEntry.days.set(dayKey, {
          key: dayKey,
          label: createdAt.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          total: 0,
          cash: 0,
          upi: 0,
          swiggy: 0,
        });
      }

      const dayEntry = monthEntry.days.get(dayKey);
      dayEntry.total += amount;
      if (paymentType === "UPI") {
        dayEntry.upi += amount;
      } else if (paymentType === "Swiggy") {
        dayEntry.swiggy += amount;
      } else {
        dayEntry.cash += amount;
      }
    });

    return Array.from(grouped.values())
      .map((month) => ({
        ...month,
        days: Array.from(month.days.values()).sort((a, b) => b.key.localeCompare(a.key)),
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [orders]);

  useEffect(() => {
    if (monthWiseData.length > 0) {
      setExpandedMonths((prev) => {
        const nextState = {};
        monthWiseData.forEach((month, index) => {
          nextState[month.key] = prev[month.key] ?? index === 0;
        });
        return nextState;
      });
    }
  }, [monthWiseData]);

  return (
    <div className="min-h-screen px-3 py-6 text-slate-900" style={{ background: 'linear-gradient(180deg, #f7fafc 0%, #e2e8f0 45%, #ffffff 100%)' }}>
      <AdminNavbar />

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="premium-card border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Accounts Overview
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Daily Collections
              </h1>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700">
              {orders.length} bills tracked
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Total Collection</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(summary.total)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Cash</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{formatCurrency(summary.cash)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">UPI</p>
              <p className="mt-2 text-2xl font-black text-sky-600">{formatCurrency(summary.upi)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Swiggy</p>
              <p className="mt-2 text-2xl font-black text-purple-600">{formatCurrency(summary.swiggy)}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-center text-slate-600 shadow-xl">
            Loading account summary...
          </div>
        ) : monthWiseData.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-center text-slate-600 shadow-xl">
            No sales data found yet.
          </div>
        ) : (
          <div className="space-y-4">
            {monthWiseData.map((month) => {
              const isExpanded = expandedMonths[month.key] ?? true;

              return (
                <div
                  key={month.key}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMonths((prev) => ({
                        ...prev,
                        [month.key]: !prev[month.key],
                      }))
                    }
                    className="flex w-full flex-col gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-4 text-left text-white sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div>
                      <p className="text-lg font-black tracking-wide text-white">{month.label}</p>
                      <p className="text-sm text-slate-300">
                        {month.days.length} days • daily cash, UPI, Swiggy, and total
                      </p>
                    </div>

                    <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm shadow-sm backdrop-blur-sm">
                        <span className="block text-xs uppercase tracking-[0.2em] text-slate-300">Cash</span>
                        <p className="mt-1 font-black text-emerald-300">{formatCurrency(month.cash)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm shadow-sm backdrop-blur-sm">
                        <span className="block text-xs uppercase tracking-[0.2em] text-slate-300">UPI</span>
                        <p className="mt-1 font-black text-sky-300">{formatCurrency(month.upi)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm shadow-sm backdrop-blur-sm">
                        <span className="block text-xs uppercase tracking-[0.2em] text-slate-300">Swiggy</span>
                        <p className="mt-1 font-black text-purple-300">{formatCurrency(month.swiggy)}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm shadow-sm backdrop-blur-sm">
                        <span className="block text-xs uppercase tracking-[0.2em] text-slate-300">Total</span>
                        <p className="mt-1 font-black text-amber-300">{formatCurrency(month.total)}</p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                      <div className="space-y-3">
                        {month.days.map((day) => (
                          <div
                            key={day.key}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{day.label}</p>
                              <p className="text-xs text-slate-500">Day total only</p>
                            </div>

                            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-4">
                              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Cash</span>
                                <p className="mt-1 font-semibold text-emerald-600">{formatCurrency(day.cash)}</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">UPI</span>
                                <p className="mt-1 font-semibold text-sky-600">{formatCurrency(day.upi)}</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Swiggy</span>
                                <p className="mt-1 font-semibold text-purple-600">{formatCurrency(day.swiggy)}</p>
                              </div>
                              <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm">
                                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Day Total</span>
                                <p className="mt-1 font-semibold text-amber-600">{formatCurrency(day.total)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
