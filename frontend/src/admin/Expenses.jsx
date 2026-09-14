import { useState } from "react";
import AdminNavbar from "./AdminNavbar";
import { StaffExpensesContent } from "./StaffExpenses";
import { ShopExpensesContent } from "./ShopExpenses";

const Expenses = () => {
  const [activeTab, setActiveTab] = useState("Staff");

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 p-1 bg-white/5 border border-slate-700/50 rounded-2xl w-fit shadow-2xl backdrop-blur-md">
            {["Staff", "Shop"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                    : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-2">
          {activeTab === "Staff" ? <StaffExpensesContent /> : <ShopExpensesContent />}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
