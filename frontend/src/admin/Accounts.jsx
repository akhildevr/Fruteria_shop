import { useEffect, useMemo, useState } from "react";
import { fetchOrders, fetchMonthlyExpenses } from "../utils/api";
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
  const [activeTab, setActiveTab] = useState("Sales");
  const [orders, setOrders] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (activeTab === "Sales") {
          const response = await fetchOrders();
          setOrders(response.data || []);
        } else {
          const response = await fetchMonthlyExpenses(selectedYear);
          setMonthlyExpenses(response.data || []);
        }
      } catch (error) {
        console.error("Error fetching data for accounts page", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, selectedYear]);

  const filteredMonthlyExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return monthlyExpenses.filter(m => {
      const [y, mm] = m.month.split("-").map(Number);
      if (y < currentYear) return true;
      if (y > currentYear) return false;
      return (mm - 1) <= currentMonth;
    });
  }, [monthlyExpenses]);

  const expenseSummary = useMemo(() => {
    return filteredMonthlyExpenses.reduce(
      (acc, m) => {
        acc.totalPurchase += m.totalPurchase || 0;
        acc.staffSalary += m.staffSalary || 0;
        acc.roomRent += m.roomRent || 0;
        acc.shopRent += m.shopRent || 0;
        acc.shopDeposit += m.shopDeposit || 0;
        acc.roomDeposit += m.roomDeposit || 0;
        acc.otherExpenses += m.otherExpenses || 0;
        acc.grandTotal += (m.totalPurchase || 0) + (m.staffSalary || 0) + (m.roomRent || 0) + (m.shopRent || 0) + (m.shopDeposit || 0) + (m.roomDeposit || 0) + (m.otherExpenses || 0);
        return acc;
      },
      {
        totalPurchase: 0,
        staffSalary: 0,
        roomRent: 0,
        shopRent: 0,
        shopDeposit: 0,
        roomDeposit: 0,
        otherExpenses: 0,
        grandTotal: 0,
      }
    );
  }, [filteredMonthlyExpenses]);

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const { start: createdAt } = getDayBucket(order.billDate || order.createdAt);
        const year = createdAt.getFullYear();
        if (year !== selectedYear) return acc;

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
      if (year !== selectedYear) return; // Only show records matching the selectedYear

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

      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 p-1 bg-white/50 border border-slate-200 rounded-2xl w-fit shadow-sm">
            {["Sales", "Expense"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-slate-900 text-white shadow-lg scale-[1.02]"
                    : "text-slate-500 hover:bg-slate-200/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-black text-slate-900 shadow-sm focus:ring-2 focus:ring-slate-900 outline-none"
          >
            {[2026, 2027].map(y => <option key={y} value={y}>{y} Financial Year</option>)}
          </select>
        </div>

        {activeTab === "Sales" ? (
          <>
            <div className="premium-card border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Accounts Overview
                  </p>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Daily Collections
                  </h3>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {orders.length} bills tracked
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[15px] font-bold uppercase tracking-wider text-slate-500">Cash</p>
                  <p className="mt-1 text-xl font-black text-emerald-600">{formatCurrency(summary.cash)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[15px] font-bold uppercase tracking-wider text-slate-500">UPI</p>
                  <p className="mt-1 text-xl font-black text-sky-600">{formatCurrency(summary.upi)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[15px] font-bold uppercase tracking-wider text-slate-500">Swiggy</p>
                  <p className="mt-1 text-xl font-black text-purple-600">{formatCurrency(summary.swiggy)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[15px] font-bold uppercase tracking-wider text-slate-500">Total Collection</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(summary.total)}</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-center text-slate-600 shadow-xl">
                Loading sales summary...
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

                        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3 lg:grid-cols-4">
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
                                  <p className="text-xs text-slate-500">Daily breakdown</p>
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
                                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Total</span>
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
          </>
        ) : (
          <div className="space-y-6">
            <div className="premium-card border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Expense Overview
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Monthly Expense Summary
                  </h2>
                </div>
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-700">
                  {filteredMonthlyExpenses.length} months tracked
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 w-full pb-1">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Purchase</p>
                  <p className="mt-1 text-base font-black text-slate-700">{formatCurrency(expenseSummary.totalPurchase)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Staff Salary</p>
                  <p className="mt-1 text-base font-black text-emerald-600">{formatCurrency(expenseSummary.staffSalary)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Room Rent</p>
                  <p className="mt-1 text-base font-black text-sky-600">{formatCurrency(expenseSummary.roomRent)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Shop Rent</p>
                  <p className="mt-1 text-base font-black text-purple-600">{formatCurrency(expenseSummary.shopRent)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Shop Deposit</p>
                  <p className="mt-1 text-base font-black text-amber-600">{formatCurrency(expenseSummary.shopDeposit)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Room Deposit</p>
                  <p className="mt-1 text-base font-black text-rose-600">{formatCurrency(expenseSummary.roomDeposit)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Other</p>
                  <p className="mt-1 text-base font-black text-orange-600">{formatCurrency(expenseSummary.otherExpenses)}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <div className="rounded-2xl border border-slate-900 bg-slate-900 px-8 py-4 shadow-xl text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black">Grand Total</p>
                  <p className="mt-1 text-2xl font-black text-white">{formatCurrency(expenseSummary.grandTotal)}</p>
                </div>
              </div>
            </div>

            <div className="premium-card border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Expense Breakdown
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-500 animate-pulse font-bold italic">
                  Loading monthly expense data...
                </div>
              ) : filteredMonthlyExpenses.length === 0 ? (
                <div className="py-20 text-center text-slate-500">
                  No expense records found for {selectedYear} (before current month).
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMonthlyExpenses.map((m) => {
                    const rowTotal = m.totalPurchase + m.staffSalary + m.roomRent + m.shopRent + m.shopDeposit + m.roomDeposit + m.otherExpenses;

                    const expenseFields = [
                      { label: "Purchase", value: m.totalPurchase, color: "text-slate-300", valColor: "text-white" },
                      { label: "Staff Salary", value: m.staffSalary, color: "text-slate-300", valColor: "text-white" },
                      { label: "Room Rent", value: m.roomRent, color: "text-slate-300", valColor: "text-white" },
                      { label: "Shop Rent", value: m.shopRent, color: "text-slate-300", valColor: "text-white" },
                      { label: "Shop Deposit", value: m.shopDeposit, color: "text-slate-300", valColor: "text-white" },
                      { label: "Room Deposit", value: m.roomDeposit, color: "text-slate-300", valColor: "text-white" },
                      { label: "Other", value: m.otherExpenses, color: "text-slate-300", valColor: "text-white" },
                    ];

                    return (
                      <div
                        key={m.month}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl"
                      >
                        <div className="flex w-full flex-col gap-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-5 text-left text-white lg:flex-row lg:items-center lg:justify-between">
                          <div className="shrink-0">
                            <p className="text-xl font-black tracking-wide text-white">{m.label}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Monthly breakdown</p>
                          </div>

                          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:w-auto">
                            {expenseFields.map((field, fIdx) => (
                              <div key={fIdx} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-sm backdrop-blur-sm">
                                <span className={`block text-[10px] font-bold uppercase tracking-[0.2em] ${field.color}`}>
                                  {field.label}
                                </span>
                                <p className={`mt-0.5 text-sm font-black ${field.valColor}`}>
                                  {field.value > 0 ? formatCurrency(field.value) : "—"}
                                </p>
                              </div>
                            ))}
                            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/20 px-3 py-2 shadow-sm backdrop-blur-sm">
                              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">
                                Total
                              </span>
                              <p className="mt-0.5 text-sm font-black text-rose-100">
                                {formatCurrency(rowTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
               <div className="premium-card p-6 border border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4">Staff Expense Policy</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Staff Salary totals automatically include monthly advances. Other expenses capture food and miscellaneous costs.
                    Room rent and deposits are tracked separately for consolidated accounting.
                  </p>
               </div>
               <div className="premium-card p-6 border border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4">Reporting Logic</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Purchases are aggregated from inventory records. Shop rent and deposits are sourced from operations expenses.
                    Data is grouped by calendar month based on transaction dates.
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
