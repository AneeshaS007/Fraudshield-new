import { useState, useEffect } from 'react';
import {
  QrCode,
  Send,
  Siren,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Bell,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Sliders,
  Calendar,
  Filter,
  Search,
  Tag,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AiOrb } from '../components/AiOrb';
import { StatusBadge, VerificationBadge, SmsStatusBadge } from '../components/StatusBadge';
import { Transaction, SystemStatus, UserProfile } from '../lib/types';
import { api } from '../lib/api';
import { useAccessibility } from '../context/AccessibilityContext';

interface DashboardPageProps {
  onNavigate: (page: any, params?: any) => void;
  status: SystemStatus | null;
  profile: UserProfile | null;
  onOpenConfig: () => void;
}

export function DashboardPage({
  onNavigate,
  status,
  profile,
  onOpenConfig,
}: DashboardPageProps) {
  const { t } = useAccessibility();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'merchant' | 'p2p' | 'bills' | 'high_risk'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'safe' | 'medium' | 'high'>('all');

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

  // Helper: Categorize Transaction
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

  // Filter Logic
  const filteredTransactions = transactions.filter((t) => {
    // 1. Search Query
    const searchMatch =
      !searchTerm ||
      t.payee_vpa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.payee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!searchMatch) return false;

    // 2. Risk Tier Filter
    if (riskFilter !== 'all' && t.risk_tier !== riskFilter) return false;

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
  const totalFilteredVolume = filteredTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const avgFilteredTicket = filteredTransactions.length > 0 ? totalFilteredVolume / filteredTransactions.length : 0;
  const safeCount = filteredTransactions.filter((t) => t.risk_tier === 'safe').length;
  const fraudAlertsCount = filteredTransactions.filter((t) => t.risk_tier === 'high').length;
  const protectionRate =
    filteredTransactions.length > 0
      ? Math.round(((filteredTransactions.length - fraudAlertsCount) / filteredTransactions.length) * 100)
      : 100;

  const totalCount = transactions.length;
  const suspiciousCount = transactions.filter((t) => t.risk_tier === 'medium').length;

  const quickActions = [
    {
      label: t('scanQrBtn'),
      description: t('scanQrDesc'),
      icon: QrCode,
      tone: 'text-[#302824] bg-[#D7CCC8] border-[#A1887F]/40 hover:bg-[#8D6E63] hover:text-white',
      action: () => onNavigate('scan'),
    },
    {
      label: t('payUpiBtn'),
      description: t('payUpiDesc'),
      icon: Send,
      tone: 'text-[#302824] bg-[#D7CCC8] border-[#A1887F]/40 hover:bg-[#8D6E63] hover:text-white',
      action: () => onNavigate('pay'),
    },
    {
      label: t('checkRiskBtn'),
      description: t('checkRiskDesc'),
      icon: Sparkles,
      tone: 'text-[#302824] bg-[#D7CCC8] border-[#A1887F]/40 hover:bg-[#8D6E63] hover:text-white',
      action: () => onNavigate('pay', { mode: 'check_only' }),
    },
    {
      label: t('reportFraudBtn'),
      description: t('reportFraudDesc'),
      icon: Siren,
      tone: 'text-[#8C3B32] bg-[#8C3B32]/15 border-[#8C3B32]/30 hover:bg-[#8C3B32] hover:text-white',
      action: () => onNavigate('report'),
    },
  ];

  const stats = [
    {
      label: t('totalTransactions'),
      value: totalCount,
      icon: Wallet,
      tone: 'text-[#8D6E63]',
      bg: 'bg-[#D7CCC8]/80 border-[#A1887F]/40',
    },
    {
      label: t('safeTransfers'),
      value: safeCount,
      icon: ShieldCheck,
      tone: 'text-[#4A7C59]',
      bg: 'bg-[#D7CCC8]/80 border-[#4A7C59]/30',
    },
    {
      label: t('suspiciousFlagged'),
      value: suspiciousCount,
      icon: AlertTriangle,
      tone: 'text-[#B87A30]',
      bg: 'bg-[#D7CCC8]/80 border-[#B87A30]/30',
    },
    {
      label: t('fraudBlocked'),
      value: fraudAlertsCount,
      icon: Bell,
      tone: 'text-[#8C3B32]',
      bg: 'bg-[#D7CCC8]/80 border-[#8C3B32]/30',
    },
  ];

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'User';

  return (
    <div className="space-y-6">
      {/* Top Banner Grid with Earth Brown Palette (No White Containers) */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left Hero Card - Rich Earth Brown Container */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[#8D6E63] text-white p-6 md:p-8 space-y-6 shadow-xl border border-[#795B50]"
        >
          <div className="space-y-2 relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A1887F]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F5F5F5] border border-white/20">
              <ShieldCheck className="h-3.5 w-3.5 text-[#EFEBE9]" /> {t('welcomeBack')}, {firstName}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight leading-tight text-white">
              {t('dashHeroTitle')} <span className="text-[#D7CCC8]">{t('dashHeroProtected')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#F5F5F5]/90 max-w-md leading-relaxed">
              {t('dashHeroDesc')}
            </p>
          </div>

          {/* 4 Quick Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="group flex flex-col items-center gap-2 rounded-2xl bg-[#EFEBE9] border border-[#BCAAA4] p-3.5 text-center transition-all hover:bg-[#A1887F] hover:text-white hover:border-[#8D6E63] cursor-pointer shadow-md"
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl border ${action.tone} transition-transform group-hover:scale-110 shadow-2xs`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold leading-tight block text-[#302824] group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <span className="text-[10px] text-[#524641] group-hover:text-white/80 hidden sm:block">
                      {action.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Right AI Protection Box - Dusty Beige Container */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl bg-[#D7CCC8] border border-[#A1887F]/50 p-6 flex flex-col sm:flex-row items-center gap-5 justify-between shadow-lg"
        >
          <div className="shrink-0">
            <AiOrb size={130} active={true} />
          </div>

          <div className="min-w-0 flex-1 space-y-3 text-xs w-full">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-[#302824] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#8D6E63]" /> {t('systemProtection')}
              </span>
              <button
                onClick={onOpenConfig}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#8D6E63] hover:bg-[#795B50] border border-[#8D6E63] px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5" /> {t('credentials')}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-[#EFEBE9] border border-[#BCAAA4] px-3.5 py-2 shadow-2xs">
                <span className="text-[#524641] font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#4A7C59]" /> {t('aiRiskEngine')}
                </span>
                <span className="font-mono font-bold text-[11px] text-[#302824]">
                  AUC {status?.model.testAuc.toFixed(2) || '0.94'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#EFEBE9] border border-[#BCAAA4] px-3.5 py-2 shadow-2xs">
                <span className="text-[#524641] font-semibold flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status?.sms.connected ? 'bg-[#4A7C59]' : 'bg-[#B87A30]'
                    }`}
                  />{' '}
                  MSG91 SMS
                </span>
                <span className="font-mono font-bold text-[11px] text-[#302824]">
                  {status?.sms.connected ? t('cellularActive') : t('pendingAuth')}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#EFEBE9] border border-[#BCAAA4] px-3.5 py-2 shadow-2xs">
                <span className="text-[#524641] font-semibold flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status?.razorpay.connected ? 'bg-[#4A7C59]' : 'bg-[#A1887F]'
                    }`}
                  />{' '}
                  {t('paymentGateway')}
                </span>
                <span className="font-mono font-bold text-[11px] text-[#302824]">
                  {status?.razorpay.connected ? 'Razorpay' : 'UPI (NPCI)'}
                </span>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* 4 Statistic Boxes - Warm Taupe & Dusty Beige Surfaces */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * idx }}
              className={`rounded-2xl border p-4 sm:p-5 space-y-2 shadow-sm transition-all hover:scale-[1.01] ${stat.bg}`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${stat.tone}`} />
                <span className="text-[10px] uppercase tracking-wider text-[#524641] font-bold">
                  {t('liveFeed')}
                </span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono block text-[#302824]">
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-[#524641]">{stat.label}</span>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* DETAILED TRANSACTION HISTORY & FINANCIAL OVERSIGHT PANEL */}
      <section className="rounded-3xl bg-[#EFEBE9] border border-[#BCAAA4] p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#BCAAA4]/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#8D6E63] text-white shadow-xs">
                <TrendingUp className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-bold font-display text-[#302824]">
                {t('financialOversight')}
              </h2>
            </div>
            <p className="text-xs text-[#524641] mt-1">
              {t('financialOversightDesc')}
            </p>
          </div>

          <button
            onClick={() => onNavigate('transactions')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#8D6E63] hover:bg-[#795B50] px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer self-start md:self-auto"
          >
            {t('allHistoricalAudits')} <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* FINANCIAL SUMMARY HIGHLIGHT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#D7CCC8] border border-[#A1887F]/40 p-4 space-y-1 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524641] block">
              {t('filteredVolume')}
            </span>
            <span className="text-2xl font-bold font-mono text-[#302824]">
              ₹{totalFilteredVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-[#524641] font-mono">
              Across {filteredTransactions.length} matching transfers
            </span>
          </div>

          <div className="rounded-2xl bg-[#D7CCC8] border border-[#A1887F]/40 p-4 space-y-1 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524641] block">
              {t('averageTicket')}
            </span>
            <span className="text-2xl font-bold font-mono text-[#302824]">
              ₹{avgFilteredTicket.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-[#524641] font-mono">Per transaction average</span>
          </div>

          <div className="rounded-2xl bg-[#D7CCC8] border border-[#A1887F]/40 p-4 space-y-1 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524641] block">
              {t('riskProtectionRate')}
            </span>
            <span className="text-2xl font-bold font-mono text-[#4A7C59]">
              {protectionRate}% Cleared
            </span>
            <span className="text-[10px] text-[#524641] font-mono">
              {fraudAlertsCount} {t('highRiskAlerts')}
            </span>
          </div>
        </div>

        {/* ADVANCED FILTERING CONTROLS BAR */}
        <div className="rounded-2xl bg-[#D7CCC8]/60 border border-[#BCAAA4] p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#302824] flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-[#8D6E63]" /> {t('filterControls')}
            </span>
            {(searchTerm || dateRange !== 'all' || categoryFilter !== 'all' || riskFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateRange('all');
                  setStartDate('');
                  setEndDate('');
                  setCategoryFilter('all');
                  setRiskFilter('all');
                }}
                className="text-[11px] font-bold text-[#8D6E63] hover:underline cursor-pointer"
              >
                {t('resetFilters')}
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#A1887F]" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-[#BCAAA4] bg-[#EFEBE9] pl-10 pr-4 py-2.5 text-xs text-[#302824] font-semibold focus:outline-none focus:ring-2 focus:ring-[#8D6E63] shadow-2xs"
            />
          </div>

          {/* Filter Dropdowns & Date Selector Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Date Range Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#524641] uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#8D6E63]" /> {t('dateRange')}
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-2 text-xs font-bold text-[#302824] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] cursor-pointer"
              >
                <option value="all">{t('allTime')}</option>
                <option value="today">{t('todayOnly')}</option>
                <option value="7days">{t('last7Days')}</option>
                <option value="30days">{t('last30Days')}</option>
                <option value="custom">{t('customDateRange')}</option>
              </select>
            </div>

            {/* Category Filter Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#524641] uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-[#8D6E63]" /> {t('categoryFilter')}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-2 text-xs font-bold text-[#302824] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] cursor-pointer"
              >
                <option value="all">{t('allCategories')}</option>
                <option value="merchant">{t('merchantsOnline')}</option>
                <option value="p2p">{t('peerToPeer')}</option>
                <option value="bills">{t('billsUtilities')}</option>
                <option value="high_risk">{t('highRiskAlerts')}</option>
              </select>
            </div>

            {/* Risk Tier Filter Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#524641] uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#8D6E63]" /> {t('riskTier')}
              </label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-2 text-xs font-bold text-[#302824] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] cursor-pointer"
              >
                <option value="all">{t('allRiskTiers')}</option>
                <option value="safe">{t('lowRiskSafe')}</option>
                <option value="medium">{t('mediumRiskWarning')}</option>
                <option value="high">{t('highRiskScam')}</option>
              </select>
            </div>
          </div>

          {/* Custom Date Pickers (if selected) */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#BCAAA4]/40 animate-in fade-in">
              <div>
                <label className="text-[10px] font-bold text-[#524641] block mb-1">{t('startDate')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-[#BCAAA4] bg-[#EFEBE9] px-3 py-1.5 text-xs text-[#302824] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#524641] block mb-1">{t('endDate')}</label>
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

        {/* TRANSACTIONS LIST */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#524641] flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-[#8D6E63]" /> {t('loadingFinancialRecords')}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#524641] space-y-2">
            <Filter className="mx-auto h-8 w-8 text-[#A1887F]" />
            <p className="font-bold text-[#302824]">{t('noTxnsMatch')}</p>
            <p className="text-[11px] text-[#524641]">
              {t('tryResetting')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#BCAAA4]/60">
            {filteredTransactions.map((txn) => {
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
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-[#D7CCC8]/50 px-3 rounded-2xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
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
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.color}`}
                        >
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

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-2">
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
      </section>
    </div>
  );
}
