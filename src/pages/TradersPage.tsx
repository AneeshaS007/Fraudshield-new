import { useState, useEffect } from 'react';
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  Calculator,
  Activity,
  History,
  RotateCcw,
  Check,
  ExternalLink,
  Info,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Lock,
  Bell,
  X,
  ChevronRight,
  LogOut,
  Menu,
  User,
  Home,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { ActivePage } from '../components/AppShell';
import { AccessibilityControls } from '../components/AccessibilityControls';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  OrderInput,
  OrderErrorResult,
  WithdrawalInput,
  WithdrawalAlert,
  BrokerVerificationResult,
  ChargeCalcInput,
  ChargeBreakdown,
  AnomalyScanInput,
  AnomalyScanResult,
  evaluateOrderError,
  evaluateWithdrawal,
  verifyBrokerAuthenticity,
  calculateTradingCharges,
  evaluateTradingAnomalies,
} from '../lib/traderEngine';

interface TradersPageProps {
  onNavigate: (page: ActivePage, params?: any) => void;
  onLogout?: () => void;
}

type TabType = 'order_errors' | 'withdrawals' | 'broker_verify' | 'calculator' | 'anomalies';

export function TradersPage({ onNavigate, onLogout }: TradersPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('order_errors');
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useAccessibility();

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --------------------------------------------------------------------------
  // 1. ORDER ERROR DETECTION STATE
  // --------------------------------------------------------------------------
  const [orderForm, setOrderForm] = useState<OrderInput>({
    symbol: 'NIFTY24DEC50000CE',
    type: 'BUY',
    orderType: 'LIMIT',
    quantity: 30, // Lot mismatch demo (NIFTY is lot size 25)
    price: 120,
    stopLoss: 125, // Conflicting stop loss
    exchange: 'NSE',
  });
  const [orderResult, setOrderResult] = useState<OrderErrorResult | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderErrorResult[]>(() => {
    try {
      const saved = localStorage.getItem('fraudshield_trader_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --------------------------------------------------------------------------
  // 2. WITHDRAWAL MONITORING STATE
  // --------------------------------------------------------------------------
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalInput>({
    amount: 250000,
    beneficiaryName: 'Rajesh Trading Agency',
    bankAccount: '987654321012',
    ifsc: 'HDFC0001234',
    isNewBeneficiary: true,
  });
  const [withdrawalAlerts, setWithdrawalAlerts] = useState<WithdrawalAlert[]>(() => {
    try {
      const saved = localStorage.getItem('fraudshield_trader_withdrawals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      evaluateWithdrawal(
        {
          amount: 250000,
          beneficiaryName: 'Rajesh Trading Agency',
          bankAccount: '987654321012',
          ifsc: 'HDFC0001234',
          isNewBeneficiary: true,
        },
        []
      ),
    ];
  });

  // --------------------------------------------------------------------------
  // 3. BROKER AUTHENTICITY STATE
  // --------------------------------------------------------------------------
  const [brokerQuery, setBrokerQuery] = useState('Zerodha');
  const [brokerResult, setBrokerResult] = useState<BrokerVerificationResult | null>(null);
  const [brokerHistory, setBrokerHistory] = useState<BrokerVerificationResult[]>(() => {
    try {
      const saved = localStorage.getItem('fraudshield_trader_brokers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --------------------------------------------------------------------------
  // 4. TRADING CHARGES CALCULATOR STATE
  // --------------------------------------------------------------------------
  const [calcForm, setCalcForm] = useState<ChargeCalcInput>({
    segment: 'equity_intraday',
    buyPrice: 1500,
    sellPrice: 1535,
    quantity: 200,
    flatBrokerage: 20,
  });
  const [chargeBreakdown, setChargeBreakdown] = useState<ChargeBreakdown>(() =>
    calculateTradingCharges({
      segment: 'equity_intraday',
      buyPrice: 1500,
      sellPrice: 1535,
      quantity: 200,
      flatBrokerage: 20,
    })
  );

  // --------------------------------------------------------------------------
  // 5. TRADING ANOMALY DETECTION STATE
  // --------------------------------------------------------------------------
  const [anomalyForm, setAnomalyForm] = useState<AnomalyScanInput>({
    averageTradeSize: 15000,
    latestTradeAmount: 75000,
    tradesLast10Mins: 11,
    recentWithdrawalAmount: 120000,
    consecutiveLosses: 3,
    tradeExecutedOffHours: true,
  });
  const [anomalyResult, setAnomalyResult] = useState<AnomalyScanResult | null>(null);

  // Unresolved alerts calculations
  const unresolvedWithdrawals = withdrawalAlerts.filter(
    (w) => w.riskLevel === 'HIGH' || w.status === 'flagged' || w.status === 'blocked'
  );
  const activeAnomalies = anomalyResult?.anomaliesDetected || [];
  const totalUnresolvedAlertsCount = unresolvedWithdrawals.length + activeAnomalies.length;

  // Persist state
  useEffect(() => {
    localStorage.setItem('fraudshield_trader_orders', JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem('fraudshield_trader_withdrawals', JSON.stringify(withdrawalAlerts));
  }, [withdrawalAlerts]);

  useEffect(() => {
    localStorage.setItem('fraudshield_trader_brokers', JSON.stringify(brokerHistory));
  }, [brokerHistory]);

  // Initial evaluation on mount
  useEffect(() => {
    handleEvaluateOrder();
    handleVerifyBroker('Zerodha');
    handleRunAnomalyScan();
  }, []);

  // Handler functions
  function handleEvaluateOrder() {
    const existing = orderHistory.map((h) => ({
      symbol: orderForm.symbol,
      type: orderForm.type,
      orderType: orderForm.orderType,
      quantity: orderForm.quantity,
      price: orderForm.price,
    }));
    const res = evaluateOrderError(orderForm, existing);
    setOrderResult(res);
    setOrderHistory((prev) => [res, ...prev.slice(0, 9)]);
  }

  function handleApplyOrderCorrection() {
    if (orderResult?.suggestedCorrection) {
      setOrderForm((prev) => ({
        ...prev,
        quantity: orderResult.suggestedCorrection?.quantity ?? prev.quantity,
        stopLoss: orderResult.suggestedCorrection?.stopLoss ?? prev.stopLoss,
      }));
      setTimeout(() => {
        handleEvaluateOrder();
      }, 100);
    }
  }

  function handleEvaluateWithdrawalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (withdrawalForm.amount <= 0) return;
    const alert = evaluateWithdrawal(withdrawalForm, withdrawalAlerts);
    setWithdrawalAlerts((prev) => [alert, ...prev]);
  }

  function handleToggleWithdrawalStatus(id: string, newStatus: 'approved' | 'flagged' | 'blocked') {
    setWithdrawalAlerts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  }

  function handleVerifyBroker(qText?: string) {
    const textToSearch = qText || brokerQuery;
    if (!textToSearch.trim()) return;
    const res = verifyBrokerAuthenticity(textToSearch);
    setBrokerResult(res);
    setBrokerHistory((prev) => [res, ...prev.filter((p) => p.query !== textToSearch).slice(0, 7)]);
  }

  function handleCalculateCharges() {
    const breakdown = calculateTradingCharges(calcForm);
    setChargeBreakdown(breakdown);
  }

  function handleRunAnomalyScan() {
    const res = evaluateTradingAnomalies(anomalyForm);
    setAnomalyResult(res);
  }

  function handleNavigateToTab(tab: TabType) {
    setActiveTab(tab);
    setIsAlertPanelOpen(false);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  }

  function handleNavigateToSection(section: 'overview' | 'history') {
    setIsSidebarOpen(false);
    if (section === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (section === 'history') {
      const el = document.getElementById('trader-history-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 750, behavior: 'smooth' });
    }
  }

  return (
    <div className="traders-space min-h-screen flex flex-col bg-[#0B1320] text-[#F3F7FB] selection:bg-[#20C9A6]/30 selection:text-[#20C9A6] relative">
      {/* ChatGPT-style Collapsible Left Sidebar Overlay & Drawer for Traders */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity animate-fadeIn cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 sm:w-84 bg-[#14263D] border-r border-[#244766] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Trader Dashboard Navigation Sidebar"
      >
        {/* Sidebar Header */}
        <div className="h-18 px-4 sm:px-5 flex items-center justify-between border-b border-[#244766] bg-[#0B1320]/40">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-xl text-[#A9C4D8] hover:text-[#F3F7FB] hover:bg-[#244766] transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <Logo />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#244766] text-[#20C9A6] px-2.5 py-1 rounded-full border border-[#52758F]">
            Traders Terminal
          </span>
        </div>

        {/* Sidebar Navigation Items Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Section: Overview & Portfolio */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9C4D8] px-3 block">
              {t('terminalOverview')}
            </span>

            <button
              onClick={() => handleNavigateToSection('overview')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-[#F3F7FB] hover:bg-[#244766]"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-[#20C9A6]" />
                <span>{t('traderOverview')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-60 text-[#A9C4D8]" />
            </button>

            <button
              onClick={() => handleNavigateToSection('history')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-[#F3F7FB] hover:bg-[#244766]"
            >
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-[#20C9A6]" />
                <span>{t('portfolioHistory')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-60 text-[#A9C4D8]" />
            </button>

            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setIsAlertPanelOpen(true);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-[#F3F7FB] hover:bg-[#244766]"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-[#EF6468]" />
                <span>{t('activeAlerts')}</span>
              </div>
              {totalUnresolvedAlertsCount > 0 ? (
                <span className="text-[10px] font-mono font-bold bg-[#EF6468] text-white px-2 py-0.5 rounded-full">
                  {totalUnresolvedAlertsCount}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-[#20C9A6]">{t('clear')}</span>
              )}
            </button>
          </div>

          {/* Section: 5 Functional Engines */}
          <div className="space-y-1.5 pt-2 border-t border-[#244766]/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9C4D8] px-3 block">
              {t('riskEngines')}
            </span>

            <button
              onClick={() => handleNavigateToTab('order_errors')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'order_errors'
                  ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                  : 'text-[#F3F7FB] hover:bg-[#244766]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4" />
                <span>{t('orderErrorDetection')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>

            <button
              onClick={() => handleNavigateToTab('withdrawals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'withdrawals'
                  ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                  : 'text-[#F3F7FB] hover:bg-[#244766]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-4 w-4" />
                <span>{t('withdrawalMonitoring')}</span>
              </div>
              {unresolvedWithdrawals.length > 0 && activeTab !== 'withdrawals' ? (
                <span className="text-[10px] bg-[#EF6468] text-white px-1.5 py-0.5 rounded-full font-mono">
                  {unresolvedWithdrawals.length}
                </span>
              ) : (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              )}
            </button>

            <button
              onClick={() => handleNavigateToTab('broker_verify')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'broker_verify'
                  ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                  : 'text-[#F3F7FB] hover:bg-[#244766]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4" />
                <span>{t('brokerVerification')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>

            <button
              onClick={() => handleNavigateToTab('calculator')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                  : 'text-[#F3F7FB] hover:bg-[#244766]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4" />
                <span>{t('chargesCalculator')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>

            <button
              onClick={() => handleNavigateToTab('anomalies')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'anomalies'
                  ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                  : 'text-[#F3F7FB] hover:bg-[#244766]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4" />
                <span>{t('anomalyDetection')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>
          </div>

          {/* Section: Switch Workspace */}
          <div className="space-y-1.5 pt-2 border-t border-[#244766]/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9C4D8] px-3 block">
              {t('workspaceNav')}
            </span>

            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onNavigate('home');
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#F3F7FB] hover:bg-[#244766] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Home className="h-4 w-4 text-[#A9C4D8]" />
                <span>{t('frontPage')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </button>

            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onNavigate('dashboard');
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#20C9A6] text-[#0B1320] hover:bg-[#1bb595] transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <span>{t('personalSpace')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-80" />
            </button>
          </div>

          {/* Accessibility & High-Contrast Theme Section inside Trader Sidebar */}
          <div className="pt-2 border-t border-[#244766]/60">
            <AccessibilityControls variant="trader" />
          </div>
        </div>

        {/* Sidebar Footer with Status & Logout */}
        <div className="p-4 border-t border-[#244766] bg-[#0B1320]/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#20C9A6] text-[#0B1320] font-bold text-xs shrink-0">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="truncate">
              <span className="text-xs font-bold text-[#F3F7FB] block truncate">
                Institutional Trader
              </span>
              <span className="text-[10px] text-[#20C9A6] flex items-center gap-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#20C9A6] animate-pulse" /> Live Terminal Active
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onLogout();
              }}
              title="Log Out of Traders Dashboard"
              className="p-2 rounded-xl text-[#EF6468] hover:bg-[#EF6468]/20 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Top Header Navigation (Sidebar / Bar #14263D) */}
      <header className="sticky top-0 z-40 border-b border-[#244766] bg-[#14263D]/95 backdrop-blur-xl shadow-md">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6 relative">
          {/* Left Corner: Hamburger Menu Button & Logo */}
          <div className="flex items-center gap-3">
            {/* ChatGPT-style Hamburger Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl border border-[#52758F] bg-[#14263D] text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all shadow-2xs cursor-pointer flex items-center justify-center"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Open Trader navigation sidebar'}
              aria-label="Toggle trader navigation menu"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-left"
            >
              <Logo />
            </button>
            <span className="rounded-full bg-[#244766] text-[#20C9A6] border border-[#52758F] px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              Traders Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* DEDICATED ALERT NOTIFICATION BADGE BUTTON */}
            <div className="relative">
              <button
                onClick={() => setIsAlertPanelOpen(!isAlertPanelOpen)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                  totalUnresolvedAlertsCount > 0
                    ? 'bg-[#EF6468] text-white border-[#EF6468] ring-2 ring-[#EF6468]/40 animate-pulse'
                    : 'bg-[#14263D] text-[#F3F7FB] border-[#52758F] hover:bg-[#20C9A6] hover:text-[#0B1320]'
                }`}
                title="View Unresolved Trading Alerts & Anomalies"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Trader Alerts</span>
                {totalUnresolvedAlertsCount > 0 && (
                  <span className="grid h-5 min-w-[20px] px-1.5 place-items-center rounded-full bg-white text-[#EF6468] text-[10px] font-mono font-bold shadow-xs">
                    {totalUnresolvedAlertsCount}
                  </span>
                )}
              </button>

              {/* UNRESOLVED ALERTS DROPDOWN PANEL */}
              {isAlertPanelOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border-2 border-[#20C9A6] bg-[#14263D] p-5 shadow-2xl z-50 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#244766] pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-[#EF6468]" />
                      <div>
                        <h3 className="font-display font-bold text-sm text-[#F3F7FB]">
                          Unresolved Incident Alerts
                        </h3>
                        <span className="text-[10px] text-[#A9C4D8] font-semibold block">
                          {totalUnresolvedAlertsCount} total active risk flags detected
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAlertPanelOpen(false)}
                      className="p-1 rounded-lg text-[#A9C4D8] hover:bg-[#244766] hover:text-[#F3F7FB] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Panel List Container */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {/* SECTION 1: High-Risk Withdrawals */}
                    {unresolvedWithdrawals.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#EF6468] flex items-center justify-between">
                          <span>High-Risk Payout Requests ({unresolvedWithdrawals.length})</span>
                        </span>

                        {unresolvedWithdrawals.map((w) => (
                          <div
                            key={w.id}
                            className="bg-[#244766] rounded-2xl p-3 border border-[#52758F] space-y-2 text-xs text-[#F3F7FB]"
                          >
                            <div className="flex justify-between items-center font-bold">
                              <span>₹{w.amount.toLocaleString('en-IN')} payout requested</span>
                              <span className="text-[10px] bg-[#EF6468] text-white px-2 py-0.5 rounded-full uppercase">
                                {w.riskLevel} RISK
                              </span>
                            </div>
                            <p className="text-[11px] text-[#A9C4D8]">
                              Beneficiary: {w.beneficiaryName} (Acc: ...{w.bankAccount.slice(-4)})
                            </p>
                            <button
                              onClick={() => handleNavigateToTab('withdrawals')}
                              className="w-full text-left inline-flex items-center justify-between rounded-xl bg-[#20C9A6] px-3 py-1.5 text-[11px] font-bold text-[#0B1320] hover:bg-[#1bb595] transition-colors cursor-pointer"
                            >
                              <span>Investigate Withdrawal</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SECTION 2: Trading Anomalies */}
                    {activeAnomalies.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#F2B84B]">
                          Active Trading Anomalies ({activeAnomalies.length})
                        </span>

                        {activeAnomalies.map((an, idx) => (
                          <div
                            key={idx}
                            className="bg-[#244766] rounded-2xl p-3 border border-[#52758F] space-y-1.5 text-xs text-[#F3F7FB]"
                          >
                            <span className="font-bold flex items-center gap-1.5 text-[#F2B84B]">
                              <AlertCircle className="h-3.5 w-3.5" /> {an.title}
                            </span>
                            <p className="text-[11px] text-[#A9C4D8]">{an.description}</p>
                            <button
                              onClick={() => handleNavigateToTab('anomalies')}
                              className="w-full text-left inline-flex items-center justify-between rounded-xl bg-[#20C9A6] px-3 py-1.5 text-[11px] font-bold text-[#0B1320] hover:bg-[#1bb595] transition-colors cursor-pointer"
                            >
                              <span>Investigate Anomaly</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {totalUnresolvedAlertsCount === 0 && (
                      <div className="py-6 text-center text-xs text-[#A9C4D8] space-y-1">
                        <CheckCircle2 className="h-8 w-8 text-[#20C9A6] mx-auto" />
                        <p className="font-bold text-[#F3F7FB]">All Trader Safeguards Green</p>
                        <p className="text-[11px]">No unresolved high-risk payouts or execution anomalies detected.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <LanguageSelector variant="trader" />

            {/* Back to Home Button */}
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#52758F] bg-[#14263D] px-4 py-2 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> {t('frontPage')}
            </button>

            {/* Switch to Personal User Space */}
            <button
              onClick={() => onNavigate('dashboard')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#20C9A6] px-4 py-2 text-xs font-bold text-[#0B1320] hover:bg-[#1bb595] transition-all shadow-xs cursor-pointer font-bold"
            >
              {t('personalSpace')}
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out of Traders Dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#EF6468]/40 bg-[#14263D] px-3 py-2 text-xs font-bold text-[#EF6468] hover:bg-[#EF6468] hover:text-white transition-all shadow-2xs cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">{t('logout')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* Traders Dashboard Banner Header (#14263D) */}
        <div className="bg-[#14263D] text-[#F3F7FB] rounded-3xl p-6 sm:p-8 border border-[#244766] shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#244766] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#20C9A6] border border-[#52758F]">
                <Building2 className="h-3.5 w-3.5 text-[#20C9A6]" /> Commercial Trader Security Terminal
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#F3F7FB]">
                Trader Financial Protection & Anomaly Suite
              </h1>
              <p className="text-xs sm:text-sm text-[#A9C4D8] max-w-2xl leading-relaxed">
                Rule-based algorithmic screening for order entry errors, unauthorized withdrawals, broker registry verification, trading fee calculations, and execution anomalies.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="rounded-2xl bg-[#244766] text-[#F3F7FB] px-4 py-2 text-xs font-mono font-bold shadow-sm border border-[#52758F] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#20C9A6]" /> Active Safeguards: 5
              </span>
            </div>
          </div>
        </div>

        {/* 5 FEATURE FUNCTIONAL TABS NAVIGATION */}
        <div className="bg-[#14263D] p-1.5 rounded-2xl border border-[#244766] shadow-md overflow-x-auto scrollbar-none flex gap-1">
          <button
            onClick={() => setActiveTab('order_errors')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'order_errors'
                ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                : 'text-[#A9C4D8] hover:bg-[#244766] hover:text-[#F3F7FB]'
            }`}
          >
            <Zap className="h-4 w-4" /> 1. Order Error Detector
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                : 'text-[#A9C4D8] hover:bg-[#244766] hover:text-[#F3F7FB]'
            }`}
          >
            <ShieldAlert className="h-4 w-4" /> 2. Withdrawal Monitor
          </button>

          <button
            onClick={() => setActiveTab('broker_verify')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'broker_verify'
                ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                : 'text-[#A9C4D8] hover:bg-[#244766] hover:text-[#F3F7FB]'
            }`}
          >
            <Search className="h-4 w-4" /> 3. Broker Verification
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                : 'text-[#A9C4D8] hover:bg-[#244766] hover:text-[#F3F7FB]'
            }`}
          >
            <Calculator className="h-4 w-4" /> 4. Trading Charges Calc
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'anomalies'
                ? 'bg-[#20C9A6] text-[#0B1320] shadow-md font-bold'
                : 'text-[#A9C4D8] hover:bg-[#244766] hover:text-[#F3F7FB]'
            }`}
          >
            <Activity className="h-4 w-4" /> 5. Anomaly Detector
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: ORDER ERROR DETECTION */}
        {/* ==================================================================== */}
        {activeTab === 'order_errors' && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            {/* Left Form Box (#244766) */}
            <div className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-6 space-y-5 shadow-md">
              <div className="flex items-center justify-between border-b border-[#52758F]/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold font-display text-[#F3F7FB] flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#20C9A6]" /> Order Parameter & Syntax Scanner
                  </h2>
                  <p className="text-xs text-[#A9C4D8]">
                    Detects lot size mismatches, duplicate submissions, and conflicting stop-loss limits.
                  </p>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9C4D8]">
                  Load Test Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderForm({
                        symbol: 'NIFTY24DEC50000CE',
                        type: 'BUY',
                        orderType: 'LIMIT',
                        quantity: 30, // invalid lot size (must be mult of 25)
                        price: 120,
                        stopLoss: 110,
                        exchange: 'NSE',
                      });
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    NIFTY Lot Size Mismatch (30 Qty)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderForm({
                        symbol: 'BANKNIFTY24DEC52000PE',
                        type: 'BUY',
                        orderType: 'LIMIT',
                        quantity: 15,
                        price: 300,
                        stopLoss: 320, // Conflicting stop loss higher than buy price!
                        exchange: 'NSE',
                      });
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    Conflicting Buy Stop-Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderForm({
                        symbol: 'RELIANCE',
                        type: 'BUY',
                        orderType: 'LIMIT',
                        quantity: 50,
                        price: 1250,
                        stopLoss: 1220,
                        exchange: 'NSE',
                      });
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    Valid Stock Order
                  </button>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Symbol / Ticker</label>
                  <input
                    type="text"
                    value={orderForm.symbol}
                    onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value })}
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                    placeholder="e.g. NIFTY24DEC50000CE"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Order Action</label>
                  <select
                    value={orderForm.type}
                    onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value as 'BUY' | 'SELL' })}
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  >
                    <option value="BUY">BUY / LONG</option>
                    <option value="SELL">SELL / SHORT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Order Type</label>
                  <select
                    value={orderForm.orderType}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        orderType: e.target.value as 'MARKET' | 'LIMIT' | 'SL',
                      })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  >
                    <option value="LIMIT">LIMIT ORDER</option>
                    <option value="MARKET">MARKET ORDER</option>
                    <option value="SL">STOP-LOSS LIMIT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Quantity / Lot Units</label>
                  <input
                    type="number"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Price (₹)</label>
                  <input
                    type="number"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm({ ...orderForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Stop-Loss Trigger (₹)</label>
                  <input
                    type="number"
                    value={orderForm.stopLoss || ''}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, stopLoss: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                    placeholder="Optional SL trigger"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleEvaluateOrder}
                className="w-full rounded-2xl bg-[#20C9A6] py-3 text-xs font-bold text-[#0B1320] hover:bg-[#1bb595] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" /> Scan Order for Execution Errors
              </button>
            </div>

            {/* Right Output Box */}
            <div className="space-y-4">
              {orderResult ? (
                <div
                  className={`rounded-3xl border p-6 space-y-4 shadow-md ${
                    orderResult.hasError
                      ? 'bg-[#14263D] border-[#EF6468]'
                      : 'bg-[#244766] border-[#20C9A6]'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#52758F]/40 pb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                        orderResult.hasError
                          ? 'bg-[#EF6468]/20 border border-[#EF6468] text-[#EF6468]'
                          : 'bg-[#20C9A6]/20 border border-[#20C9A6] text-[#20C9A6]'
                      }`}
                    >
                      {orderResult.hasError ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5" /> ERROR DETECTED ({orderResult.severity.toUpperCase()})
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> PASSED SAFE
                        </>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-[#A9C4D8]">
                      {new Date(orderResult.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold font-display text-[#F3F7FB]">
                      {orderResult.errorTitle}
                    </h3>
                    <p className="text-xs text-[#A9C4D8] mt-1 leading-relaxed">
                      {orderResult.description}
                    </p>
                  </div>

                  {/* Resolution Steps */}
                  <div className="bg-[#14263D] rounded-2xl p-4 border border-[#52758F] space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#20C9A6] flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Actionable Resolution Steps:
                    </span>
                    <ul className="text-xs text-[#F3F7FB] space-y-1.5 list-disc list-inside font-medium">
                      {orderResult.resolutionSteps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Auto Correction Button */}
                  {orderResult.suggestedCorrection && (
                    <button
                      onClick={handleApplyOrderCorrection}
                      className="w-full rounded-xl bg-[#20C9A6] py-2.5 text-xs font-bold text-[#0B1320] hover:bg-[#1bb595] transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Apply Auto-Correction Parameters
                    </button>
                  )}
                </div>
              ) : null}

              {/* Audit Log */}
              <div id="trader-history-section" className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-5 space-y-3 shadow-md">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A9C4D8] flex items-center gap-1.5">
                  <History className="h-4 w-4 text-[#20C9A6]" /> Recent Scan Logs ({orderHistory.length})
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {orderHistory.map((h) => (
                    <div
                      key={h.id}
                      className="bg-[#14263D] rounded-xl p-3 border border-[#52758F] text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-[#F3F7FB] block">{h.errorTitle}</span>
                        <span className="text-[10px] text-[#A9C4D8] font-mono">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          h.hasError ? 'bg-[#EF6468]/20 text-[#EF6468] border border-[#EF6468]' : 'bg-[#20C9A6]/20 text-[#20C9A6] border border-[#20C9A6]'
                        }`}
                      >
                        {h.hasError ? 'ERROR' : 'SAFE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: WITHDRAWAL MONITORING */}
        {/* ==================================================================== */}
        {activeTab === 'withdrawals' && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            {/* Form */}
            <form
              onSubmit={handleEvaluateWithdrawalSubmit}
              className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-6 space-y-5 shadow-md"
            >
              <div className="border-b border-[#52758F]/40 pb-4">
                <h2 className="text-lg font-bold font-display text-[#F3F7FB] flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-[#EF6468]" /> Withdrawal Risk Monitor
                </h2>
                <p className="text-xs text-[#A9C4D8]">
                  Screen payout requests for new beneficiaries, off-hours timing, and velocity thresholds.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Withdrawal Amount (₹)</label>
                  <input
                    type="number"
                    value={withdrawalForm.amount}
                    onChange={(e) =>
                      setWithdrawalForm({ ...withdrawalForm, amount: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Beneficiary Name</label>
                  <input
                    type="text"
                    value={withdrawalForm.beneficiaryName}
                    onChange={(e) =>
                      setWithdrawalForm({ ...withdrawalForm, beneficiaryName: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#F3F7FB]">Bank Account Number</label>
                    <input
                      type="text"
                      value={withdrawalForm.bankAccount}
                      onChange={(e) =>
                        setWithdrawalForm({ ...withdrawalForm, bankAccount: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#F3F7FB]">IFSC Code</label>
                    <input
                      type="text"
                      value={withdrawalForm.ifsc}
                      onChange={(e) =>
                        setWithdrawalForm({ ...withdrawalForm, ifsc: e.target.value.toUpperCase() })
                      }
                      className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 bg-[#14263D] p-3 rounded-2xl border border-[#52758F]">
                  <input
                    type="checkbox"
                    id="newBeneficiary"
                    checked={withdrawalForm.isNewBeneficiary}
                    onChange={(e) =>
                      setWithdrawalForm({ ...withdrawalForm, isNewBeneficiary: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#20C9A6] cursor-pointer"
                  />
                  <label htmlFor="newBeneficiary" className="text-xs font-bold text-[#F3F7FB] cursor-pointer">
                    Flag as Recently Added Beneficiary (&lt; 24h)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#20C9A6] py-3 text-xs font-bold text-[#0B1320] hover:bg-[#1bb595] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldAlert className="h-4 w-4" /> Run Withdrawal Safety Check
              </button>
            </form>

            {/* Audit Log List */}
            <div className="space-y-4">
              <div className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-6 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#52758F]/40 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#F3F7FB] flex items-center gap-1.5">
                    <History className="h-4 w-4 text-[#20C9A6]" /> Withdrawal Alerts Audit Log ({withdrawalAlerts.length})
                  </h3>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {withdrawalAlerts.map((al) => (
                    <div
                      key={al.id}
                      className="bg-[#14263D] rounded-2xl p-4 border border-[#52758F] space-y-3 shadow-2xs text-[#F3F7FB]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-base font-bold font-mono text-[#F3F7FB]">
                            ₹{al.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-[#A9C4D8] block">{al.beneficiaryName}</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            al.riskLevel === 'HIGH'
                              ? 'bg-[#EF6468]/20 border border-[#EF6468] text-[#EF6468]'
                              : al.riskLevel === 'MEDIUM'
                              ? 'bg-[#F2B84B]/20 border border-[#F2B84B] text-[#F2B84B]'
                              : 'bg-[#20C9A6]/20 border border-[#20C9A6] text-[#20C9A6]'
                          }`}
                        >
                          {al.riskLevel} RISK ({al.riskScore}/100)
                        </span>
                      </div>

                      <p className="text-xs text-[#A9C4D8] bg-[#0B1320] p-2.5 rounded-xl border border-[#52758F]">
                        {al.explanation}
                      </p>

                      {al.reasons.length > 0 && (
                        <ul className="text-[11px] text-[#F3F7FB] space-y-1 list-disc list-inside font-medium">
                          {al.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="font-mono text-[#A9C4D8]">
                          Acc: ...{al.bankAccount.slice(-4)} | IFSC: {al.ifsc}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleToggleWithdrawalStatus(al.id, 'approved')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                              al.status === 'approved'
                                ? 'bg-[#20C9A6] text-[#0B1320]'
                                : 'bg-[#244766] text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320]'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleToggleWithdrawalStatus(al.id, 'blocked')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                              al.status === 'blocked'
                                ? 'bg-[#EF6468] text-white'
                                : 'bg-[#244766] text-[#F3F7FB] hover:bg-[#EF6468] hover:text-white'
                            }`}
                          >
                            Hold/Block
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: BROKER AUTHENTICITY VERIFICATION */}
        {/* ==================================================================== */}
        {activeTab === 'broker_verify' && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            {/* Search Input Box */}
            <div className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-6 space-y-5 shadow-md">
              <div className="border-b border-[#52758F]/40 pb-4">
                <h2 className="text-lg font-bold font-display text-[#F3F7FB] flex items-center gap-2">
                  <Search className="h-5 w-5 text-[#20C9A6]" /> Broker & Exchange Registry Checker
                </h2>
                <p className="text-xs text-[#A9C4D8]">
                  Validate broker name or portal URL against official SEBI / FINRA regulatory registries.
                </p>
              </div>

              {/* Quick Search Badges */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9C4D8]">
                  Sample Regulatory Checks:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setBrokerQuery('Zerodha');
                      handleVerifyBroker('Zerodha');
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    Zerodha (SEBI Licensed)
                  </button>
                  <button
                    onClick={() => {
                      setBrokerQuery('Groww');
                      handleVerifyBroker('Groww');
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    Groww (SEBI Licensed)
                  </button>
                  <button
                    onClick={() => {
                      setBrokerQuery('Fxtrade-scam-247.com');
                      handleVerifyBroker('Fxtrade-scam-247.com');
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    Fxtrade-scam-247.com (Deceptive)
                  </button>
                  <button
                    onClick={() => {
                      setBrokerQuery('CryptoEarnMax.io');
                      handleVerifyBroker('CryptoEarnMax.io');
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    CryptoEarnMax.io (Guaranteed Returns Scam)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#F3F7FB]">Enter Broker Name or Website URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brokerQuery}
                    onChange={(e) => setBrokerQuery(e.target.value)}
                    className="flex-1 rounded-xl border border-[#52758F] bg-[#0B1320] px-4 py-2.5 text-xs font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                    placeholder="e.g. Zerodha, AngelOne, or website domain"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyBroker()}
                    className="rounded-xl bg-[#20C9A6] px-5 py-2.5 text-xs font-bold text-[#0B1320] hover:bg-[#1bb595] transition-all cursor-pointer shadow-2xs"
                  >
                    Verify
                  </button>
                </div>
              </div>

              <div className="bg-[#14263D] p-4 rounded-2xl border border-[#52758F] text-xs text-[#A9C4D8] space-y-1">
                <span className="font-bold text-[#F3F7FB] flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-[#20C9A6]" /> Regulatory Notice
                </span>
                <p>
                  Data is verified against simulated SEBI / FINRA master regulatory records. Always cross-check entity names on official portal <strong>sebi.gov.in</strong> before transferring funds.
                </p>
              </div>
            </div>

            {/* Results Output */}
            <div className="space-y-4">
              {brokerResult && (
                <div
                  className={`rounded-3xl border p-6 space-y-4 shadow-md ${
                    brokerResult.status === 'VERIFIED'
                      ? 'bg-[#244766] border-[#20C9A6]'
                      : brokerResult.status === 'SUSPICIOUS'
                      ? 'bg-[#14263D] border-[#EF6468]'
                      : 'bg-[#14263D] border-[#F2B84B]'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#52758F]/40 pb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                        brokerResult.status === 'VERIFIED'
                          ? 'bg-[#20C9A6]/20 border border-[#20C9A6] text-[#20C9A6]'
                          : brokerResult.status === 'SUSPICIOUS'
                          ? 'bg-[#EF6468]/20 border border-[#EF6468] text-[#EF6468]'
                          : 'bg-[#F2B84B]/20 border border-[#F2B84B] text-[#F2B84B]'
                      }`}
                    >
                      {brokerResult.status === 'VERIFIED' ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED LICENSED BROKER
                        </>
                      ) : brokerResult.status === 'SUSPICIOUS' ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> SUSPICIOUS / UNLICENSED ALERT
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5" /> UNVERIFIED / UNLISTED ENTITY
                        </>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-[#A9C4D8]">
                      {new Date(brokerResult.verifiedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-display text-[#F3F7FB]">
                      {brokerResult.brokerName}
                    </h3>
                    <p className="text-xs text-[#A9C4D8] mt-1 leading-relaxed">
                      {brokerResult.summary}
                    </p>
                  </div>

                  {/* Breakdown details */}
                  <div className="divide-y divide-[#52758F]/40 text-xs bg-[#14263D] p-4 rounded-2xl border border-[#52758F] space-y-2 text-[#F3F7FB]">
                    <div className="flex justify-between py-1">
                      <span className="text-[#A9C4D8]">Regulator Body</span>
                      <span className="font-bold text-[#F3F7FB]">{brokerResult.regulator}</span>
                    </div>
                    {brokerResult.registrationNumber && (
                      <div className="flex justify-between py-1">
                        <span className="text-[#A9C4D8]">Reg. Registration No.</span>
                        <span className="font-mono font-bold text-[#20C9A6]">
                          {brokerResult.registrationNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-[#A9C4D8]">Domain & SSL Record</span>
                      <span className="font-semibold text-[#F3F7FB]">{brokerResult.domainAge}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#A9C4D8]">Guaranteed Return Claims</span>
                      <span className="font-bold text-[#EF6468]">
                        {brokerResult.guaranteedReturnsClaimed ? 'YES (ILLEGAL)' : 'NO (Compliant)'}
                      </span>
                    </div>
                  </div>

                  {/* Reasons List */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#20C9A6]">
                      Supporting Regulatory Evaluation:
                    </span>
                    <ul className="text-xs text-[#F3F7FB] space-y-1 list-disc list-inside font-medium">
                      {brokerResult.reasons.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {brokerResult.officialPortalUrl && (
                    <a
                      href={brokerResult.officialPortalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#20C9A6] hover:underline"
                    >
                      Visit Official SEBI / Broker Register Portal <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: TRADING CHARGES CALCULATOR */}
        {/* ==================================================================== */}
        {activeTab === 'calculator' && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            {/* Input Form */}
            <div className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-6 space-y-5 shadow-md">
              <div className="border-b border-[#52758F]/40 pb-4">
                <h2 className="text-lg font-bold font-display text-[#F3F7FB] flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#20C9A6]" /> Trading Statutory Charges Calculator
                </h2>
                <p className="text-xs text-[#A9C4D8]">
                  Automatically calculates brokerage, STT/CTT, exchange fees, GST, SEBI charges, and net P&L.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Market Segment</label>
                  <select
                    value={calcForm.segment}
                    onChange={(e) => {
                      const seg = e.target.value as any;
                      setCalcForm({ ...calcForm, segment: seg });
                    }}
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  >
                    <option value="equity_intraday">Equity Intraday</option>
                    <option value="equity_delivery">Equity Delivery</option>
                    <option value="futures">Futures Contract</option>
                    <option value="options">Options Contract</option>
                    <option value="crypto">Crypto / Digital Asset</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Quantity / Share Units</label>
                  <input
                    type="number"
                    value={calcForm.quantity}
                    onChange={(e) =>
                      setCalcForm({ ...calcForm, quantity: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Buy Price (₹)</label>
                  <input
                    type="number"
                    value={calcForm.buyPrice}
                    onChange={(e) =>
                      setCalcForm({ ...calcForm, buyPrice: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Sell Price (₹)</label>
                  <input
                    type="number"
                    value={calcForm.sellPrice}
                    onChange={(e) =>
                      setCalcForm({ ...calcForm, sellPrice: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalculateCharges}
                className="w-full rounded-2xl bg-[#20C9A6] py-3 text-xs font-bold text-[#0B1320] hover:bg-[#1bb595] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 font-bold"
              >
                <Calculator className="h-4 w-4" /> Calculate Total Net Cost & PnL
              </button>
            </div>

            {/* Calculations Breakdown Card */}
            <div className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-6 space-y-5 shadow-md">
              <div className="flex items-center justify-between border-b border-[#52758F]/40 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A9C4D8]">
                  Net Financial Summary
                </span>
                <span className="text-xs font-mono text-[#20C9A6] font-bold">
                  Turnover: ₹{chargeBreakdown.turnover.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Gross vs Net PnL Highlight */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#14263D] rounded-2xl p-4 border border-[#52758F] text-center">
                  <span className="text-[11px] font-bold text-[#A9C4D8] uppercase block">Gross Profit / Loss</span>
                  <span
                    className={`text-xl font-bold font-mono block mt-1 ${
                      chargeBreakdown.grossPnL >= 0 ? 'text-[#20C9A6]' : 'text-[#EF6468]'
                    }`}
                  >
                    ₹{chargeBreakdown.grossPnL.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-[#14263D] rounded-2xl p-4 border border-[#52758F] text-center">
                  <span className="text-[11px] font-bold text-[#20C9A6] uppercase block">Net P&L After Charges</span>
                  <span
                    className={`text-xl font-bold font-mono block mt-1 ${
                      chargeBreakdown.netPnL >= 0 ? 'text-[#20C9A6]' : 'text-[#EF6468]'
                    }`}
                  >
                    ₹{chargeBreakdown.netPnL.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="bg-[#14263D] rounded-2xl border border-[#52758F] p-4 space-y-2 text-xs text-[#F3F7FB]">
                <div className="flex justify-between py-1 border-b border-[#52758F]/40">
                  <span className="text-[#A9C4D8]">Brokerage Charges</span>
                  <span className="font-mono font-bold text-[#F3F7FB]">₹{chargeBreakdown.brokerage}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#52758F]/40">
                  <span className="text-[#A9C4D8]">STT / CTT (Tax)</span>
                  <span className="font-mono font-bold text-[#F3F7FB]">₹{chargeBreakdown.sttCtt}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#52758F]/40">
                  <span className="text-[#A9C4D8]">Exchange Turnover Fee</span>
                  <span className="font-mono font-bold text-[#F3F7FB]">₹{chargeBreakdown.exchangeTurnoverFee}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#52758F]/40">
                  <span className="text-[#A9C4D8]">GST (18%)</span>
                  <span className="font-mono font-bold text-[#F3F7FB]">₹{chargeBreakdown.gst}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#52758F]/40">
                  <span className="text-[#A9C4D8]">SEBI Turnover Charges</span>
                  <span className="font-mono font-bold text-[#F3F7FB]">₹{chargeBreakdown.sebiTurnoverFee}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#52758F]/40">
                  <span className="text-[#A9C4D8]">Stamp Duty</span>
                  <span className="font-mono font-bold text-[#F3F7FB]">₹{chargeBreakdown.stampDuty}</span>
                </div>
                <div className="flex justify-between py-1.5 pt-2 font-bold text-[#F3F7FB]">
                  <span>TOTAL TAXES & FEES</span>
                  <span className="font-mono text-[#F2B84B]">₹{chargeBreakdown.totalCharges}</span>
                </div>
              </div>

              {/* Breakeven points needed */}
              <div className="bg-[#14263D] rounded-2xl p-3 border border-[#52758F] text-xs flex justify-between items-center">
                <span className="font-bold text-[#F3F7FB]">Net Breakeven Movement Needed:</span>
                <span className="font-mono font-bold text-[#20C9A6] text-sm">
                  +₹{chargeBreakdown.breakevenPoints} / share
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: TRADING ANOMALY DETECTION */}
        {/* ==================================================================== */}
        {activeTab === 'anomalies' && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            {/* Input Form */}
            <div className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-6 space-y-5 shadow-md">
              <div className="border-b border-[#52758F]/40 pb-4">
                <h2 className="text-lg font-bold font-display text-[#F3F7FB] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#20C9A6]" /> Algorithmic Trading Anomaly Detector
                </h2>
                <p className="text-xs text-[#A9C4D8]">
                  Analyzes trade frequency, rapid position size multipliers, revenge trading, and off-hours execution.
                </p>
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9C4D8]">
                  Load Behavioral Scenarios:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnomalyForm({
                        averageTradeSize: 10000,
                        latestTradeAmount: 85000, // 8.5x
                        tradesLast10Mins: 14,
                        recentWithdrawalAmount: 150000,
                        consecutiveLosses: 3,
                        tradeExecutedOffHours: true,
                      });
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    Severe Exposure Spike & Overtrading
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnomalyForm({
                        averageTradeSize: 20000,
                        latestTradeAmount: 22000,
                        tradesLast10Mins: 2,
                        recentWithdrawalAmount: 0,
                        consecutiveLosses: 0,
                        tradeExecutedOffHours: false,
                      });
                    }}
                    className="rounded-xl border border-[#52758F] bg-[#14263D] px-3 py-1.5 text-xs font-bold text-[#F3F7FB] hover:bg-[#20C9A6] hover:text-[#0B1320] transition-all cursor-pointer"
                  >
                    Disciplined Trading Pattern
                  </button>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Average Historical Trade Size (₹)</label>
                  <input
                    type="number"
                    value={anomalyForm.averageTradeSize}
                    onChange={(e) =>
                      setAnomalyForm({ ...anomalyForm, averageTradeSize: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Latest Trade Size (₹)</label>
                  <input
                    type="number"
                    value={anomalyForm.latestTradeAmount}
                    onChange={(e) =>
                      setAnomalyForm({ ...anomalyForm, latestTradeAmount: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Orders in Last 10 Minutes</label>
                  <input
                    type="number"
                    value={anomalyForm.tradesLast10Mins}
                    onChange={(e) =>
                      setAnomalyForm({ ...anomalyForm, tradesLast10Mins: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#F3F7FB]">Consecutive Losses Count</label>
                  <input
                    type="number"
                    value={anomalyForm.consecutiveLosses}
                    onChange={(e) =>
                      setAnomalyForm({ ...anomalyForm, consecutiveLosses: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#52758F] bg-[#0B1320] px-3.5 py-2.5 text-xs font-mono font-bold text-[#F3F7FB] focus:outline-none focus:ring-2 focus:ring-[#20C9A6]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAnomalyScan}
                className="w-full rounded-2xl bg-[#20C9A6] py-3 text-xs font-bold text-[#0B1320] hover:bg-[#1bb595] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 font-bold"
              >
                <Activity className="h-4 w-4" /> Run Algorithmic Anomaly Detection
              </button>
            </div>

            {/* Anomaly Results */}
            <div className="space-y-4">
              {anomalyResult && (
                <div className="bg-[#244766] rounded-3xl border border-[#52758F]/50 p-6 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#52758F]/40 pb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                        anomalyResult.riskTier === 'HIGH'
                          ? 'bg-[#EF6468]/20 border border-[#EF6468] text-[#EF6468]'
                          : anomalyResult.riskTier === 'MEDIUM'
                          ? 'bg-[#F2B84B]/20 border border-[#F2B84B] text-[#F2B84B]'
                          : 'bg-[#20C9A6]/20 border border-[#20C9A6] text-[#20C9A6]'
                      }`}
                    >
                      {anomalyResult.riskTier} ANOMALY RISK ({anomalyResult.riskScore}/100)
                    </span>
                    <span className="text-[10px] font-mono text-[#A9C4D8]">
                      {new Date(anomalyResult.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#F3F7FB] font-medium leading-relaxed bg-[#14263D] p-3 rounded-2xl border border-[#52758F]">
                    {anomalyResult.summary}
                  </p>

                  {/* Detected Anomalies */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#20C9A6]">
                      Identified Behavioral Deviations ({anomalyResult.anomaliesDetected.length}):
                    </span>

                    {anomalyResult.anomaliesDetected.length === 0 ? (
                      <p className="text-xs text-[#20C9A6] font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> No suspicious trading anomalies detected.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {anomalyResult.anomaliesDetected.map((an, idx) => (
                          <div
                            key={idx}
                            className="bg-[#14263D] rounded-2xl p-3.5 border border-[#52758F] space-y-1 text-xs"
                          >
                            <span className="font-bold text-[#F2B84B] flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4 text-[#F2B84B]" /> {an.title}
                            </span>
                            <p className="text-[#A9C4D8]">{an.description}</p>
                            <span className="text-[11px] font-semibold text-[#20C9A6] block pt-1">
                              Why Flagged: {an.whyFlagged}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="bg-[#14263D] rounded-2xl p-4 border border-[#52758F] space-y-2 text-xs">
                    <span className="font-bold text-[#F3F7FB] uppercase tracking-wider block">
                      Recommended Risk Safeguards:
                    </span>
                    <ul className="space-y-1 text-[#A9C4D8] list-disc list-inside font-medium">
                      {anomalyResult.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer (#14263D) */}
      <footer className="mt-auto border-t border-[#244766] bg-[#14263D] py-6 text-center text-xs text-[#A9C4D8]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo compact />
          <p>© 2026 FraudShield Traders Space. Commercial Financial Protection Systems.</p>
          <button
            onClick={() => onNavigate('home')}
            className="text-[#20C9A6] font-bold hover:underline cursor-pointer"
          >
            Back to Home Page
          </button>
        </div>
      </footer>
    </div>
  );
}
