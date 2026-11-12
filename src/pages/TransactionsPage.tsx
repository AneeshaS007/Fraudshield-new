import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  History,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Download,
  AlertTriangle,
  Calendar,
  Tag,
  TrendingUp,
  SlidersHorizontal,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../lib/api';
import { Transaction } from '../lib/types';
import { StatusBadge, VerificationBadge, SmsStatusBadge } from '../components/StatusBadge';

interface TransactionsPageProps {
  onNavigate: (page: any, params?: any) => void;
}

export function TransactionsPage({ onNavigate }: TransactionsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'merchant' | 'p2p' | 'bills' | 'high_risk'>('all');
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Categorize helper
  function getTransactionCategory(txn: Transaction): 'merchant' | 'p2p' | 'bills' | 'high_risk' {
    if (txn.risk_tier === 'high' || txn.risk_score >= 70) return 'high_risk';

    const vpa = (txn.payee_vpa || '').toLowerCase();
    const note = (txn.note || '').toLowerCase();

    if (
      vpa.includes('swiggy') ||
      vpa.includes('food') ||
      vpa.includes('store') ||
      vpa.includes('icici') ||
      vpa.includes('okbiz') ||
      vpa.includes('amazon') ||
      vpa.includes('flipkart') ||
      vpa.includes('merchant')
    ) {
      return 'merchant';
    }

    if (
      note.includes('bill') ||
      note.includes('rent') ||
      note.includes('electricity') ||
      note.includes('recharge') ||
      note.includes('wifi') ||
      note.includes('water')
    ) {
      return 'bills';
    }

    return 'p2p';
  }

  // Filtering Logic
  const filtered = transactions.filter((t) => {
    // 1. Search Term
    const matchesSearch =
      !searchTerm ||
      t.payee_vpa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.payee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Risk Tier Filter
    if (filterTier === 'safe' && t.risk_tier !== 'safe') return false;
    if (filterTier === 'medium' && t.risk_tier !== 'medium') return false;
    if (filterTier === 'high' && t.risk_tier !== 'high') return false;
    if (filterTier === 'successful' && t.status !== 'successful') return false;
    if (filterTier === 'failed' && t.status !== 'failed') return false;

    // 3. Category Filter
    const cat = getTransactionCategory(t);
    if (categoryFilter !== 'all' && cat !== categoryFilter) return false;

    // 4. Date Range Filter
    const txnDate = new Date(t.created_at);
    const now = new Date();

    if (dateRange === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (txnDate < startOfToday) return false;
    } else if (dateRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (txnDate < sevenDaysAgo) return false;
    } else if (dateRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (txnDate < thirtyDaysAgo) return false;
    } else if (dateRange === 'custom') {
      if (startDate && new Date(startDate) > txnDate) return false;
      if (endDate) {
        const endDay = new Date(endDate);
        endDay.setHours(23, 59, 59, 999);
        if (txnDate > endDay) return false;
      }
    }

    return true;
  });

  // Calculate Financial Oversight Metrics
  const totalVolume = filtered.reduce((acc, t) => acc + (t.amount || 0), 0);
  const avgTicket = filtered.length > 0 ? totalVolume / filtered.length : 0;
  const highRiskCount = filtered.filter((t) => t.risk_tier === 'high').length;
  const safeCount = filtered.filter((t) => t.risk_tier === 'safe').length;
  const protectionRate =
    filtered.length > 0 ? Math.round(((filtered.length - highRiskCount) / filtered.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Rich Earth Brown Header Banner Box */}
      <div className="rounded-3xl bg-[#8D6E63] text-white p-6 sm:p-8 space-y-4 shadow-xl border border-[#795B50]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A1887F]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F5F5F5] border border-white/20 mb-2">
              <History className="h-3.5 w-3.5 text-[#EFEBE9]" /> Financial Oversight & Audit
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Detailed Transaction <span className="text-[#D7CCC8]">History</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#F5F5F5]/90 max-w-2xl mt-1 leading-relaxed">
              Audited UPI transfers, date range filtering, category classification, pre-transfer risk scores, and MSG91 SMS tracking.
            </p>
          </div>
          <button
            onClick={loadTransactions}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-[#EFEBE9] text-[#302824] hover:bg-[#A1887F] hover:text-white px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md border border-[#BCAAA4]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Audits
          </button>
        </div>

        {/* FINANCIAL SUMMARY HIGHLIGHT CARDS (Dusty Beige & Soft Cream Boxes) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl bg-[#EFEBE9] text-[#302824] p-3.5 space-y-1 shadow-md border border-[#BCAAA4]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#524641] block">
              Filtered Volume
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#302824]">
              ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-[#524641] font-mono block">
              {filtered.length} matching records
            </span>
          </div>

          <div className="rounded-2xl bg-[#EFEBE9] text-[#302824] p-3.5 space-y-1 shadow-md border border-[#BCAAA4]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#524641] block">
              Average Ticket
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#302824]">
              ₹{avgTicket.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-[#524641] font-mono block">Average transfer size</span>
          </div>

          <div className="rounded-2xl bg-[#EFEBE9] text-[#302824] p-3.5 space-y-1 shadow-md border border-[#BCAAA4]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#524641] block">
              Safe Clearance Rate
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#4A7C59]">
              {protectionRate}% Cleared
            </span>
            <span className="text-[10px] text-[#524641] font-mono block">{safeCount} safe transfers</span>
          </div>

          <div className="rounded-2xl bg-[#EFEBE9] text-[#302824] p-3.5 space-y-1 shadow-md border border-[#BCAAA4]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#524641] block">
              High-Risk Alerts
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#8C3B32]">
              {highRiskCount} Flagged
            </span>
            <span className="text-[10px] text-[#524641] font-mono block">Fraud attempts isolated</span>
          </div>
        </div>
      </div>

      {/* ADVANCED FILTERING CONTROLS BAR (Dusty Beige Surface) */}
      <div className="rounded-3xl bg-[#D7CCC8] border border-[#A1887F]/50 p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#302824] flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-[#8D6E63]" /> Date Range & Category Controls
          </span>
          {(searchTerm || dateRange !== 'all' || categoryFilter !== 'all' || filterTier !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateRange('all');
                setStartDate('');
                setEndDate('');
                setCategoryFilter('all');
                setFilterTier('all');
              }}
              className="text-[11px] font-bold text-[#8D6E63] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#A1887F]" />
          <input
            type="text"
            placeholder="Search by Payee VPA, merchant name, transaction ID or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-[#BCAAA4] bg-[#EFEBE9] pl-10 pr-4 py-2.5 text-xs text-[#302824] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8D6E63] shadow-xs"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Date Range Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#524641] uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#8D6E63]" /> Date Filter
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-2 text-xs font-bold text-[#302824] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Category Filter Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#524641] uppercase tracking-wider flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-[#8D6E63]" /> Category Filter
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-2 text-xs font-bold text-[#302824] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="merchant">Merchants & Online Stores</option>
              <option value="p2p">Peer-to-Peer (P2P)</option>
              <option value="bills">Bills & Utility Payments</option>
              <option value="high_risk">High-Risk Fraud Alerts</option>
            </select>
          </div>

          {/* Risk Tier Filter Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#524641] uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-[#8D6E63]" /> Risk Tier
            </label>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-2 text-xs font-bold text-[#302824] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] cursor-pointer"
            >
              <option value="all">All Risk Tiers</option>
              <option value="safe">Low Risk (Safe)</option>
              <option value="medium">Medium Risk (Warning)</option>
              <option value="high">High Risk (Scam Alert)</option>
              <option value="successful">Successful Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#BCAAA4]/40 animate-in fade-in">
            <div>
              <label className="text-[10px] font-bold text-[#524641] block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-1.5 text-xs text-[#302824] font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#524641] block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-1.5 text-xs text-[#302824] font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions Feed (Warm Ivory Container) */}
      <div className="rounded-3xl bg-[#EFEBE9] border border-[#BCAAA4] p-6 space-y-4 shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#524641] flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-[#8D6E63]" /> Loading records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#524641] space-y-2">
            <History className="mx-auto h-8 w-8 opacity-40 text-[#A1887F]" />
            <p className="font-bold text-[#302824]">No transactions match your search & filter criteria.</p>
            <p className="text-[11px]">Adjust your date range or category filters above.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#BCAAA4]/60">
            {filtered.map((txn) => {
              const category = getTransactionCategory(txn);
              const catBadge =
                category === 'merchant'
                  ? { label: 'Merchant', color: 'bg-[#A1887F]/20 text-[#302824] border-[#A1887F]/40' }
                  : category === 'bills'
                  ? { label: 'Bills', color: 'bg-[#8D6E63]/20 text-[#8D6E63] border-[#8D6E63]/40' }
                  : category === 'high_risk'
                  ? { label: 'Fraud Risk', color: 'bg-[#8C3B32]/15 text-[#8C3B32] border-[#8C3B32]/30' }
                  : { label: 'P2P', color: 'bg-[#4A7C59]/15 text-[#4A7C59] border-[#4A7C59]/30' };

              return (
                <div
                  key={txn.id}
                  onClick={() => onNavigate('transaction-detail', { id: txn.id })}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 hover:bg-[#D7CCC8]/50 px-3 rounded-2xl transition-all cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${
                        txn.risk_tier === 'safe'
                          ? 'border-[#4A7C59]/30 bg-[#4A7C59]/10 text-[#4A7C59]'
                          : txn.risk_tier === 'medium'
                          ? 'border-[#B87A30]/30 bg-[#B87A30]/10 text-[#B87A30]'
                          : 'border-[#8C3B32]/30 bg-[#8C3B32]/10 text-[#8C3B32]'
                      }`}
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#302824] group-hover:text-[#8D6E63] transition-colors">
                          {txn.payee_name || txn.payee_vpa}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.color}`}>
                          {catBadge.label}
                        </span>
                        <StatusBadge status={txn.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#524641] font-mono">
                        <span className="font-semibold">{txn.payee_vpa}</span>
                        <span>·</span>
                        <span>
                          {new Date(txn.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(txn.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {txn.note && (
                        <span className="text-[11px] text-[#524641] block">
                          Purpose: <em className="text-[#302824] font-medium">{txn.note}</em>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 self-end md:self-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <VerificationBadge status={txn.verification_status} compact />
                      <SmsStatusBadge status={txn.sms_status} mobile={txn.sms_sent_to} />
                    </div>

                    <div className="text-right min-w-[100px]">
                      <span className="text-base sm:text-lg font-bold font-mono text-[#302824] block">
                        ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-[#524641] font-mono">
                        Risk: {txn.risk_score}/100
                      </span>
                    </div>

                    <ArrowRight className="h-4 w-4 text-[#A1887F] group-hover:text-[#8D6E63] group-hover:translate-x-1 transition-all hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
