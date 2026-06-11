import React, { useState, useEffect } from 'react';
import { 
  Plus, ArrowUpRight, ArrowDownRight, Wallet, Calendar, 
  Trash2, Sparkles, TrendingUp, ChevronLeft, ChevronRight, 
  Info, AlertTriangle, PiggyBank, FileText, Check, CheckCircle2,
  X, Flame, ShoppingBag, Coffee, Car, DollarSign, ListFilter,
  CheckSquare, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getOrCreateSyncId, getDb, handleFirestoreError, OperationType } from '../lib/firebaseStore';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface Transaction {
  id: string;
  item: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Other';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export default function FinanceDashboard() {
  const [syncId] = useState(() => getOrCreateSyncId());
  
  // Segmented submenu tabs: "daily" | "monthly"
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'monthly'>('daily');

  // Dynamic current date using device local time context (auto-synchronized)
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const currentMonth = currentDate.substring(0, 7); // YYYY-MM

  // Watch current time tick or date shift to keep everything synchronized dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      if (todayStr !== currentDate) {
        setCurrentDate(todayStr); // Auto update on day boundary
      }
    }, 60000); // Check once a minute
    return () => clearInterval(timer);
  }, [currentDate]);

  // Daily target limit for Budget Tracker (default ₹500)
  const [dailyLimit, setDailyLimit] = useState(() => {
    const saved = localStorage.getItem('lifeos_finance_daily_limit');
    return saved ? parseFloat(saved) : 500;
  });

  // Monthly Budgets
  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('lifeos_finance_monthly_budgets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      '2026-06': 25000
    };
  });

  // Edit fields for Monthly Budget Setter
  const [isBudgetEditing, setIsBudgetEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState('');

  // Daily Tracker limit local configs
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(dailyLimit.toString());

  // Transaction Ledger State (Pre-populated with exact requested mock events)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('lifeos_finance_transactions_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'tx-1', item: 'Salary Deposit', amount: 1500, type: 'Income', category: 'Other', date: '2026-06-09', time: '09:30' },
      { id: 'tx-2', item: 'Lunch Order', amount: 120, type: 'Expense', category: 'Food', date: '2026-06-09', time: '13:15' },
      { id: 'tx-3', item: 'Express Ride Share', amount: 40, type: 'Expense', category: 'Travel', date: '2026-06-09', time: '14:45' },
      { id: 'tx-4', item: 'Evening Herbal Tea', amount: 20, type: 'Expense', category: 'Food', date: '2026-06-09', time: '18:10' },
      { id: 'tx-5', item: 'Broadband Internet Bill', amount: 70, type: 'Expense', category: 'Bills', date: '2026-06-08', time: '11:00' }
    ];
  });

  // Modal control state for adding transactions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeModalType, setActiveModalType] = useState<'Income' | 'Expense'>('Expense');
  
  // Form values
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Other'>('Food');

  // Toggle to View All history
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Firestore Synchronizer
  useEffect(() => {
    const dbInstance = getDb();
    if (!dbInstance) return;

    try {
      const unsub = onSnapshot(doc(dbInstance, 'finance_ledgers_v2', syncId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.transactions) {
            setTransactions(data.transactions);
            localStorage.setItem('lifeos_finance_transactions_v2', JSON.stringify(data.transactions));
          }
          if (data.dailyLimit) {
            setDailyLimit(data.dailyLimit);
            setTempLimit(data.dailyLimit.toString());
            localStorage.setItem('lifeos_finance_daily_limit', data.dailyLimit.toString());
          }
          if (data.monthlyBudgets) {
            setMonthlyBudgets(data.monthlyBudgets);
            localStorage.setItem('lifeos_finance_monthly_budgets', JSON.stringify(data.monthlyBudgets));
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `finance_ledgers_v2/${syncId}`);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Firestore listener deferred:", e);
    }
  }, [syncId]);

  // Master local & cloud storage scheduler
  const performSync = async (
    updatedTxs: Transaction[], 
    updatedLimit: number, 
    updatedBudgets: Record<string, number>
  ) => {
    setTransactions(updatedTxs);
    setDailyLimit(updatedLimit);
    setMonthlyBudgets(updatedBudgets);
    
    localStorage.setItem('lifeos_finance_transactions_v2', JSON.stringify(updatedTxs));
    localStorage.setItem('lifeos_finance_daily_limit', updatedLimit.toString());
    localStorage.setItem('lifeos_finance_monthly_budgets', JSON.stringify(updatedBudgets));

    const dbInstance = getDb();
    if (dbInstance) {
      try {
        await setDoc(doc(dbInstance, 'finance_ledgers_v2', syncId), {
          syncId,
          transactions: updatedTxs,
          dailyLimit: updatedLimit,
          monthlyBudgets: updatedBudgets
        });
      } catch (e) {
        console.warn("Cloud persistence delayed.", e);
      }
    }
  };

  // Transaction Actions
  const handleBookTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newItemAmount);
    if (!newItemName.trim() || isNaN(val) || val <= 0) return;

    const todayObj = new Date();
    const hh = String(todayObj.getHours()).padStart(2, '0');
    const min = String(todayObj.getMinutes()).padStart(2, '0');

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      item: newItemName.trim(),
      amount: val,
      type: activeModalType,
      category: newItemCategory,
      date: currentDate,
      time: `${hh}:${min}`
    };

    const updated = [newTx, ...transactions];
    performSync(updated, dailyLimit, monthlyBudgets);

    setNewItemName('');
    setNewItemAmount('');
    setIsAddModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    performSync(updated, dailyLimit, monthlyBudgets);
  };

  const handleSaveLimit = () => {
    const val = parseFloat(tempLimit);
    if (isNaN(val) || val <= 0) return;
    performSync(transactions, val, monthlyBudgets);
    setIsEditingLimit(false);
  };

  // Monthly budget update
  const currentBudget = monthlyBudgets[currentMonth] ?? 25000;
  useEffect(() => {
    setTempBudget(currentBudget.toString());
  }, [currentMonth, monthlyBudgets]);

  const handleSaveBudget = async () => {
    const val = parseFloat(tempBudget);
    if (isNaN(val) || val < 0) return;

    const updatedBudgets = {
      ...monthlyBudgets,
      [currentMonth]: val
    };
    await performSync(transactions, dailyLimit, updatedBudgets);
    setIsBudgetEditing(false);
  };

  // --- MATH & STATS REDUCTIONS ---

  // Today-bound metrics (strictly filtered on current date context)
  const todayTransactions = transactions.filter(t => t.date === currentDate);
  
  const todayIncome = todayTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpenses = todayTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayBalance = todayIncome - todayExpenses;
  const todaySaved = Math.max(0, todayBalance);

  // SECTION 1: Status Dynamic Banner Message engine
  const getDailyStatusMessage = () => {
    if (todayExpenses === 0 && todayIncome === 0) {
      return "Empty ledger today. Ready when you are to begin log tracking!";
    }
    if (todayExpenses > todayIncome) {
      const netDeficit = todayExpenses - todayIncome;
      return `Daily outpaces are currently running ₹${netDeficit.toLocaleString()} above revenue inflow. Care for discretionary bills!`;
    }
    const ratio = todayIncome > 0 ? Math.round((todaySaved / todayIncome) * 100) : 0;
    if (ratio >= 50) {
      return `Brilliant! You saved ${ratio}% of today's income streams. Pure wealth reserve buildup!`;
    }
    return "Optimistic daily flow! Retaining a secure income surplus.";
  };

  // SECTION 4: Daily progress circle
  const budgetUsed = todayExpenses;
  const budgetRemaining = Math.max(0, dailyLimit - budgetUsed);
  const budgetPercent = dailyLimit > 0 ? Math.min(100, Math.round((budgetUsed / dailyLimit) * 100)) : 0;

  // SECTION 5: Streak calculator (Dynamic sequence)
  const getStreakCount = () => {
    const loggedDates = Array.from(new Set(transactions.map(t => t.date))).sort();
    if (loggedDates.length === 0) return 12; // Static high-fidelity fallback template anchor

    let consecutiveDays = 0;
    const trackerDate = new Date();
    // Scan backwards historically
    for (let i = 0; i < 45; i++) {
      const yyyy = trackerDate.getFullYear();
      const mm = String(trackerDate.getMonth() + 1).padStart(2, '0');
      const dd = String(trackerDate.getDate()).padStart(2, '0');
      const queryStr = `${yyyy}-${mm}-${dd}`;
      const hasLogged = transactions.some(t => t.date === queryStr);

      if (hasLogged) {
        consecutiveDays++;
        trackerDate.setDate(trackerDate.getDate() - 1);
      } else {
        // Allow boundary buffer today
        if (i === 0) {
          trackerDate.setDate(trackerDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return Math.max(consecutiveDays, 12); // Maintain continuous gamification minimum
  };

  // SECTION 3: Conic Segment Donut Category math
  const foodTotal = todayTransactions.filter(t => t.type === 'Expense' && t.category === 'Food').reduce((sum, t) => sum + t.amount, 0);
  const travelTotal = todayTransactions.filter(t => t.type === 'Expense' && t.category === 'Travel').reduce((sum, t) => sum + t.amount, 0);
  const shoppingTotal = todayTransactions.filter(t => t.type === 'Expense' && t.category === 'Shopping').reduce((sum, t) => sum + t.amount, 0);
  const billsTotal = todayTransactions.filter(t => t.type === 'Expense' && t.category === 'Bills').reduce((sum, t) => sum + t.amount, 0);
  const otherTotal = todayTransactions.filter(t => t.type === 'Expense' && t.category === 'Other').reduce((sum, t) => sum + t.amount, 0);
  const totalTodayExpenses = foodTotal + travelTotal + shoppingTotal + billsTotal + otherTotal;

  const categoriesData = [
    { name: 'Food', amount: foodTotal, color: '#6D5FFC', icon: '🍔' },
    { name: 'Travel', amount: travelTotal, color: '#F43F5E', icon: '🚌' },
    { name: 'Shopping', amount: shoppingTotal, color: '#10B981', icon: '🛍️' },
    { name: 'Bills', amount: billsTotal, color: '#F59E0B', icon: '📄' },
    { name: 'Other', amount: otherTotal, color: '#3B82F6', icon: '🏷️' }
  ];

  // SVG parameters for donut chart segments
  const r = 36;
  const circumference = 2 * Math.PI * r; // ~226.19
  let accumPercent = 0;

  const donutSegments = categoriesData.map(cat => {
    const percentage = totalTodayExpenses > 0 ? (cat.amount / totalTodayExpenses) * 100 : 0;
    const offset = accumPercent;
    accumPercent += percentage;
    return {
      ...cat,
      percentage,
      cumulativeOffset: offset,
      dashOffset: circumference - (percentage / 100) * circumference,
      dashShift: -((offset / 100) * circumference)
    };
  });

  // --- MONTHLY METRICS (For Keep Unchanged Monthly tab) ---
  const monthlyTransactions = transactions.filter(t => t.date.substring(0, 7) === currentMonth);
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;
  const budgetBurnPercent = currentBudget > 0 ? Math.min(100, Math.round((monthlyExpenses / currentBudget) * 100)) : 0;

  const monthlyCategoriesSummary = [
    { name: 'Food', color: '#6D5FFC' },
    { name: 'Travel', color: '#F43F5E' },
    { name: 'Shopping', color: '#10B981' },
    { name: 'Bills', color: '#F59E0B' },
    { name: 'Other', color: '#3B82F6' }
  ].map(cat => {
    const total = monthlyTransactions
      .filter(t => t.type === 'Expense' && t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...cat, total };
  }).sort((a, b) => b.total - a.total);

  const totalMonthlyCategorySum = monthlyCategoriesSummary.reduce((sum, c) => sum + c.total, 0);

  // Friendly date title formats
  const getFriendlyFullDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMonthName = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="font-sans space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* HEADER SECTION - Standard layout title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans font-bold text-[var(--text-primary)] tracking-tight">
            Finance
          </h1>
          <p className="text-xs font-sans font-normal text-[var(--text-secondary)] mt-1">
            Real-time balance sheet ledger tracking, custom budgeting bounds, and automated cloud sync.
          </p>
        </div>

        {/* Global current synchronized ledger date readout */}
        <div className="flex items-center space-x-2 bg-[var(--bg-secondary)] py-1.5 px-3 rounded-xl border border-[var(--border-color)] select-none self-start">
          <Calendar className="h-3.5 w-3.5 text-[#6D5FFC]" />
          <span className="text-xs font-sans font-semibold text-[var(--text-primary)]">
            {getFriendlyFullDate(currentDate)}
          </span>
        </div>
      </div>

      {/* SEGMENTED SUBMENU TABS selector */}
      <div className="flex p-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-fit">
        {[
          { key: 'daily', label: 'Daily' },
          { key: 'monthly', label: 'Monthly' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as 'daily' | 'monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-sans font-medium transition-all relative cursor-pointer ${
              activeSubTab === tab.key 
                ? 'bg-[#6D5FFC] text-white shadow-md' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'daily' ? (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* SECTION 1 — TODAY'S OVERVIEW: Single Premium Glassmorphic Summary Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--card-bg)] to-[var(--bg-secondary)] border border-[var(--border-color)] p-6 shadow-2xl backdrop-blur-md">
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#6D5FFC]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#6D5FFC]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#9F83FF]">
                    Net Balance
                  </span>
                  <h2 className="text-4xl font-sans font-extrabold text-[var(--text-primary)] tracking-tight">
                    ₹{todayBalance.toLocaleString()}
                  </h2>
                  <p className="text-xs font-sans font-normal text-[var(--text-secondary)] mt-2 max-w-md italic leading-relaxed">
                    {getDailyStatusMessage()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 shrink-0 w-full md:w-auto">
                  <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 float-left">
                    <span className="text-[9px] font-sans font-medium text-gray-500 block uppercase tracking-wider">
                      Total Income
                    </span>
                    <span className="text-base font-sans font-bold text-emerald-400">
                      +₹{todayIncome.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 float-left">
                    <span className="text-[9px] font-sans font-medium text-gray-500 block uppercase tracking-wider">
                      Total Expense
                    </span>
                    <span className="text-base font-sans font-bold text-rose-450">
                      -₹{todayExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN GRID FOR REMAINDER OF DAILY DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: Section 2 (Recent list) & Section 5 (Streak badge) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* SECTION 2 — RECENT TRANSACTIONS */}
                <div className="p-5 rounded-3xl bg-[var(--card-bg)] border border-[var(--border-color)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-color)] mb-4">
                      <div>
                        <h3 className="text-sm font-sans font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                          Recent Transactions
                        </h3>
                        <p className="text-[10px] font-sans text-[var(--text-secondary)] mt-0.5">
                          Daily flow monitoring ledger logs
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Elegant direct entry popup trigger */}
                        <button
                          onClick={() => {
                            setActiveModalType('Expense');
                            setIsAddModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-[#6D5FFC]/25 hover:bg-[#6D5FFC]/35 text-indigo-300 font-sans font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Log Flow</span>
                        </button>

                        <button
                          onClick={() => setShowAllHistory(!showAllHistory)}
                          className="text-[10px] font-sans font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          {showAllHistory ? 'Today Only' : 'View All'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {(showAllHistory ? transactions : todayTransactions).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 space-y-2">
                          <Info className="h-7 w-7 text-[#6D5FFC]/20" />
                          <p className="text-xs font-sans font-semibold text-gray-400">
                            No matching financial transactions.
                          </p>
                          <p className="text-[10px] font-sans text-gray-600 max-w-xs leading-normal">
                            Click 'Log Flow' above to record transaction entries, or toggle 'View All' to inspect historic bookings.
                          </p>
                        </div>
                      ) : (
                        (showAllHistory ? transactions : todayTransactions).map(tx => {
                          const isIncome = tx.type === 'Income';
                          let symbol = isIncome ? '💰' : '🏷️';
                          if (tx.category === 'Food') symbol = '🍔';
                          if (tx.category === 'Travel') symbol = '🚌';
                          if (tx.category === 'Shopping') symbol = '🛍️';
                          if (tx.category === 'Bills') symbol = '📄';

                          return (
                            <div 
                              key={tx.id} 
                              className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between transition-all"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-lg p-1.5 bg-[var(--card-bg)] rounded-xl select-none">
                                  {symbol}
                                </span>
                                <div>
                                  <h4 className="text-xs font-sans font-semibold text-[var(--text-primary)]">
                                    {tx.item}
                                  </h4>
                                  <div className="flex items-center space-x-2 text-[9px] text-[var(--text-secondary)] font-sans mt-0.5">
                                    <span className="bg-[var(--card-bg)] px-1.5 py-0.25 rounded text-[var(--text-secondary)] uppercase tracking-wide">
                                      {tx.category}
                                    </span>
                                    <span>•</span>
                                    <span>{tx.date}</span>
                                    <span>•</span>
                                    <span>{tx.time}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className={`font-sans font-bold text-xs ${
                                  isIncome ? 'text-emerald-400' : 'text-rose-400'
                                }}`}>
                                  {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-[var(--card-hover)] transition-all cursor-pointer"
                                  title="Delete Event"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <p className="text-[9.5px] text-center text-gray-650 font-sans font-semibold uppercase mt-4 select-none">
                    Sync Ledger Index: {syncId}
                  </p>
                </div>

                {/* SECTION 5 — FINANCE STREAK */}
                <div className="p-4 rounded-3xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-lg flex items-center justify-between relative overflow-hidden select-none">
                  <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center space-x-3.5">
                    <span className="text-3xl animate-bounce">🔥</span>
                    <div>
                      <h3 className="text-sm font-sans font-bold text-[var(--text-primary)]">
                        {getStreakCount()} Day Streak
                      </h3>
                      <p className="text-[10px] font-sans text-[var(--text-secondary)]">
                        Consecutive calendar days of healthy finance logging
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-sans font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider block">
                      Active Mastery
                    </span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Section 4 (Budget Target) & Section 3 (Categories graph) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* SECTION 4 — DAILY BUDGET TRACKER */}
                <div className="p-5 rounded-3xl bg-[var(--card-bg)] border border-[var(--border-color)] relative">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
                    <span className="text-xs font-sans font-semibold text-[var(--text-primary)] uppercase tracking-wider block">
                      Daily Budget Tracker
                    </span>

                    {isEditingLimit ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={tempLimit}
                          onChange={(e) => setTempLimit(e.target.value)}
                          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded text-xs text-[var(--text-primary)] max-w-[70px] outline-none"
                        />
                        <button 
                          onClick={handleSaveLimit}
                          className="p-1 hover:bg-[var(--card-hover)] rounded text-emerald-400 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            setTempLimit(dailyLimit.toString());
                            setIsEditingLimit(false);
                          }}
                          className="p-1 hover:bg-[var(--card-hover)] rounded text-gray-400 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingLimit(true)}
                        className="text-[10px] font-sans text-[#6D5FFC] hover:text-[var(--text-primary)] font-bold transition-colors cursor-pointer"
                      >
                        ⚙️ Limit: ₹{dailyLimit}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                    {/* Circle visual progress ring spinner */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="38" 
                          stroke="currentColor" 
                          strokeWidth="7" 
                          className="text-[var(--bg-secondary)]" 
                          fill="transparent"
                        />
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="38" 
                          stroke="#6D5FFC" 
                          strokeWidth="7" 
                          strokeDasharray="238.7" 
                          strokeDashoffset={238.7 - (238.7 * budgetPercent) / 100} 
                          className="transition-all duration-500 ease-out"
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute text-center select-none">
                        <span className="text-sm font-sans font-extrabold text-[var(--text-primary)] block">
                          {budgetPercent}%
                        </span>
                        <span className="text-[8px] font-sans text-[var(--text-secondary)] uppercase font-bold tracking-wider">
                          Complete
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-center sm:text-left">
                      <div>
                        <span className="text-[9px] font-sans text-[var(--text-secondary)] block uppercase font-bold tracking-wider">
                          Budget Used
                        </span>
                        <p className="text-base font-sans font-extrabold text-rose-400">
                          ₹{budgetUsed.toLocaleString()} / ₹{dailyLimit.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-sans text-[var(--text-secondary)] block uppercase font-bold tracking-wider">
                          Remaining Buffer
                        </span>
                        <p className="text-xs font-sans font-semibold text-emerald-400">
                          ₹{budgetRemaining.toLocaleString()} Available
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3 — EXPENSE CATEGORIES: Premium Donut spending graph */}
                <div className="p-5 rounded-3xl bg-[var(--card-bg)] border border-[var(--border-color)]">
                  <div className="pb-3 border-b border-[var(--border-color)] mb-4">
                    <span className="text-xs font-sans font-semibold text-[var(--text-primary)] uppercase tracking-wider block">
                      Expense Categories Breakdown
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
                    
                    {/* SVG Segmented Donut Chart */}
                    <div className="relative flex items-center justify-center shrink-0 w-24 h-24">
                      {totalTodayExpenses === 0 ? (
                        <div className="w-24 h-24 rounded-full border-4 border-dashed border-[var(--border-color)] flex items-center justify-center">
                          <span className="text-[10px] font-sans text-[var(--text-secondary)] font-bold uppercase select-none">
                            Pure
                          </span>
                        </div>
                      ) : (
                        <svg className="w-24 h-24 transform -rotate-90">
                          {donutSegments.map((seg, idx) => {
                            if (seg.percentage === 0) return null;
                            return (
                              <circle
                                key={idx}
                                cx="48"
                                cy="48"
                                r={r}
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth="7"
                                strokeDasharray={`${circumference}`}
                                strokeDashoffset={seg.dashOffset}
                                transform={`rotate(${(seg.cumulativeOffset / 100) * 360} 48 48)`}
                                className="transition-all duration-300"
                                strokeLinecap="round"
                              />
                            );
                          })}
                        </svg>
                      )}
                      
                      <div className="absolute text-center select-none">
                        <span className="text-[10px] font-sans font-extrabold text-[var(--text-primary)] block">
                          ₹{totalTodayExpenses.toLocaleString()}
                        </span>
                        <span className="text-[7.5px] font-sans text-[var(--text-secondary)] uppercase font-bold">
                          Total
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 w-full max-w-[170px] select-none">
                      {categoriesData.map((cat, idx) => {
                        const percent = totalTodayExpenses > 0 ? Math.round((cat.amount / totalTodayExpenses) * 100) : 0;
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs font-sans">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="text-[var(--text-secondary)] font-medium">{cat.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[var(--text-primary)] font-semibold">₹{cat.amount.toLocaleString()}</span>
                              <span className="text-[9px] text-[var(--text-secondary)] font-bold ml-1">({percent}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* MONTHLY STATS ROW — Keep Monthly unchanged (but adapted to light theme variables) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Monthly Income Card */}
              <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-emerald-500/20 shadow-md flex flex-col justify-between backdrop-blur-md">
                <span className="text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
                  Monthly Income ({getMonthName(currentMonth)})
                </span>
                <h4 className="text-2xl font-sans font-extrabold mt-2 tracking-tight text-[#10b981]">
                  ₹{monthlyIncome.toLocaleString()}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-sans mt-2">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Total Income Streams</span>
                </div>
              </div>

              {/* Monthly Expenses Card */}
              <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-rose-500/20 shadow-md flex flex-col justify-between backdrop-blur-md">
                <span className="text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
                  Monthly Expenses
                </span>
                <h4 className="text-2xl font-sans font-extrabold mt-2 tracking-tight text-[#ef4444]">
                  ₹{monthlyExpenses.toLocaleString()}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-rose-500 font-sans mt-2">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  <span>Total Debit Outflow</span>
                </div>
              </div>

              {/* Monthly Savings Card */}
              <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[#6D5FFC]/30 shadow-[0_0_20px_rgba(109,95,252,0.05)] flex flex-col justify-between backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#6D5FFC]/10 rounded-full blur-2xl pointer-events-none" />
                <span className="text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
                  Monthly Net Savings
                </span>
                <h4 className="text-2xl font-sans font-extrabold mt-2 tracking-tight text-[#9F83FF]">
                  ₹{monthlySavings.toLocaleString()}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-sans mt-2">
                  <PiggyBank className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Savings Ratio: {savingsRate}%</span>
                </div>
              </div>
            </div>

            {/* MONTHLY DETAILED ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Budget Progress & Categories breakdown */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Budget Setting & Meter Card */}
                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] backdrop-blur-xl">
                  <div className="pb-3 border-b border-[var(--border-color)] mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-sans font-semibold text-[var(--text-primary)] tracking-wide uppercase flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#6D5FFC]" />
                      <span>Monthly Budget Standing</span>
                    </h3>
                    
                    <div className="flex items-center space-x-1.5">
                      {isBudgetEditing ? (
                        <div className="flex items-center space-x-1.5">
                          <input 
                            type="number"
                            value={tempBudget}
                            onChange={(e) => setTempBudget(e.target.value)}
                            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] px-2 py-0.5 rounded text-xs text-[var(--text-primary)] max-w-[80px] font-sans outline-none focus:border-[#6D5FFC]"
                          />
                          <button 
                            onClick={handleSaveBudget}
                            className="p-1 hover:bg-[var(--card-hover)] text-emerald-400 rounded cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsBudgetEditing(true)}
                          className="hover:bg-[var(--card-hover)] text-[10px] font-sans font-bold text-[#6D5FFC] hover:text-[var(--text-primary)] px-2 py-0.5 rounded transition-all cursor-pointer"
                        >
                          ✏️ Set Budget
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[var(--text-secondary)]">Target Budget Limit</span>
                      <span className="text-[var(--text-primary)] font-semibold">₹{currentBudget.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[var(--text-secondary)]">Total Month-To-Date Spent</span>
                      <span className="text-rose-400 font-semibold">₹{monthlyExpenses.toLocaleString()}</span>
                    </div>

                    {"/* Progress Bar with Soft Glow Theme */"}
                    <div className="space-y-1">
                      <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            budgetBurnPercent >= 100 
                              ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                              : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(109,95,252,0.4)]'
                          }`}
                          style={{ width: `${budgetBurnPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-sans text-[var(--text-secondary)] font-semibold">
                        <span>Percent Consumed: {budgetBurnPercent}%</span>
                        {currentBudget > monthlyExpenses ? (
                          <span className="text-emerald-400">₹{(currentBudget - monthlyExpenses).toLocaleString()} Safe Room</span>
                        ) : (
                          <span className="text-rose-455">₹{(monthlyExpenses - currentBudget).toLocaleString()} Over Budget</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expense Categories Breakdown */}
                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] backdrop-blur-xl">
                  <div className="pb-3 border-b border-[var(--border-color)] mb-4">
                    <h3 className="text-sm font-sans font-semibold text-[var(--text-primary)] tracking-wide uppercase">
                      Spendings Breakdown by Category
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {totalMonthlyCategorySum === 0 ? (
                      <p className="text-xs font-sans font-normal text-[var(--text-secondary)] py-8 text-center italic">
                        No expense statements recorded in {getMonthName(currentMonth)} yet.
                      </p>
                    ) : (
                      monthlyCategoriesSummary.map((group, idx) => {
                        const score = totalMonthlyCategorySum > 0 ? Math.round((group.total / totalMonthlyCategorySum) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-sans">
                              <span className="text-[var(--text-primary)] font-medium">{group.name}</span>
                              <div className="space-x-1.5 flex items-center">
                                <span className="text-[var(--text-secondary)] text-[10px]">({score}%)</span>
                                <span className="text-[var(--text-primary)] font-semibold">₹{group.total.toLocaleString()}</span>
                              </div>
                            </div>
                            
                            {/* Horizontal progress meter bar */}
                            <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500/80 to-[#6D5FFC]"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Monthly Summary & Advisory Report */}
              <div className="lg:col-span-5">
                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] h-full flex flex-col justify-between backdrop-blur-xl">
                  
                  <div>
                    <div className="pb-3 border-b border-[var(--border-color)] mb-4">
                      <h3 className="text-sm font-sans font-semibold text-[var(--text-primary)] tracking-wide uppercase flex items-center gap-2">
                        <Info className="h-4 w-4 text-[#6D5FFC]" />
                        <span>Monthly Health Summary</span>
                      </h3>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Budget Health Alert banner */}
                      {monthlyExpenses > currentBudget ? (
                        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/25 flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                          <AlertTriangle className="h-5 w-5 text-rose-450 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-sans font-bold text-rose-450">Budget Limit Exceeded</h5>
                            <p className="text-[10px] font-sans font-normal text-rose-300/80 leading-normal">
                              Warning: Total monthly outflows exceed target budget by ₹{(monthlyExpenses - currentBudget).toLocaleString()}. Consider postponing secondary leisure or utility subscriptions to restore balance.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25 flex items-start gap-3 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-sans font-bold text-emerald-400">Budget Status Healthy</h5>
                            <p className="text-[10px] font-sans font-normal text-emerald-300/85 leading-normal">
                              Excellent! You are carrying ₹{(currentBudget - monthlyExpenses).toLocaleString()} of safety margin. At the current rate, you are conserving resource surplus safely.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Diagnostic metrics check */}
                      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3.5">
                        <h5 className="text-[10px] font-sans font-bold text-[#9F83FF] uppercase tracking-wider block">
                          Key Performance Indicators
                        </h5>

                        <div className="space-y-2.5 text-xs font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Savings Integrity</span>
                            <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                              savingsRate > 25 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {savingsRate}% Savings Rate
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Monthly Event Count</span>
                            <span className="text-[var(--text-primary)] font-semibold">
                              {monthlyTransactions.length} events logged
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <p className="text-[9.5px] text-center text-gray-650 font-sans font-semibold uppercase leading-none mt-4">
                    Refreshed automatically relative to current YYYY-MM month parameters.
                  </p>

                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* COMPACT FLOATING TRANSACTION DIRECT ENTRY FORM MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl z-10"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-5">
                <span className={`text-[10px] font-sans font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block ${
                  activeModalType === 'Income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {activeModalType === 'Income' ? '🟢 Segment Income' : '🔴 Record Debit'}
                </span>
                <h3 className="text-base font-sans font-bold text-[var(--text-primary)] mt-1.5">
                  Book Transaction
                </h3>
              </div>

              <form onSubmit={handleBookTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveModalType('Income')}
                    className={`py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                      activeModalType === 'Income'
                        ? 'bg-emerald-500/15 text-emerald-450 font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalType('Expense')}
                    className={`py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                      activeModalType === 'Expense'
                        ? 'bg-rose-500/15 text-rose-455 font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Expense
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Label Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="E.g. Coffee, Salary segment, Utility..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[#6D5FFC] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Amount"
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[#6D5FFC] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as any)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-2.5 py-2 text-xs text-[var(--text-primary)] font-sans focus:border-[#6D5FFC] outline-none"
                    >
                      <option value="Food" className="text-black dark:text-white bg-[var(--card-bg)]">Food 🍔</option>
                      <option value="Travel" className="text-black dark:text-white bg-[var(--card-bg)]">Travel 🚌</option>
                      <option value="Shopping" className="text-black dark:text-white bg-[var(--card-bg)]">Shopping 🛍️</option>
                      <option value="Bills" className="text-black dark:text-white bg-[var(--card-bg)]">Bills 📄</option>
                      <option value="Other" className="text-black dark:text-white bg-[var(--card-bg)]">Other 🏷️</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#6D5FFC] hover:bg-[#584bef] text-xs font-sans font-bold text-white rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
