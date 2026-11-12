import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  QrCode,
  Send,
  History,
  LifeBuoy,
  User,
  PhoneCall,
  MessageSquare,
  ShieldAlert,
  LogOut,
  Home,
  Building2,
  Menu,
  X,
  Smartphone,
  FileWarning,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from './Logo';
import { SystemStatus } from '../lib/types';
import { SmsConfigGuideModal } from './SmsConfigGuideModal';
import { AccessibilityControls } from './AccessibilityControls';
import { LanguageSelector } from './LanguageSelector';
import { useAccessibility } from '../context/AccessibilityContext';

export type ActivePage =
  | 'home'
  | 'dashboard'
  | 'scan'
  | 'pay'
  | 'transactions'
  | 'transaction-detail'
  | 'profile'
  | 'report'
  | 'help'
  | 'auth'
  | 'traders';

interface AppShellProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage, params?: any) => void;
  status: SystemStatus | null;
  onRefreshStatus: () => void;
  userName?: string;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function AppShell({
  activePage,
  onNavigate,
  status,
  onRefreshStatus,
  userName = 'User',
  onLogout,
  children,
}: AppShellProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
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

  const navItems: { page: ActivePage; label: string; icon: any }[] = [
    { page: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { page: 'scan', label: t('scanQr'), icon: QrCode },
    { page: 'pay', label: t('payUpi'), icon: Send },
    { page: 'transactions', label: t('history'), icon: History },
    { page: 'help', label: t('helpline'), icon: LifeBuoy },
  ];

  const isSmsActive = status?.sms.connected;

  function handleSidebarNavigate(page: ActivePage, params?: any) {
    onNavigate(page, params);
    setIsSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary relative">
      {/* ChatGPT-style Collapsible Left Sidebar Overlay & Drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity animate-fadeIn cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 sm:w-80 bg-[#F7F4F0] text-neutral-950 border-r border-[#D7CCC8] shadow-[8px_0_36px_rgba(48,40,36,0.22)] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Personal User Navigation Sidebar"
      >
        {/* Sidebar Header */}
        <div className="h-18 px-4 sm:px-5 flex items-center justify-between border-b border-[#D7CCC8] bg-[#EDE7E1]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-xl text-neutral-950 hover:text-black hover:bg-[#E0D7CE] transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <X className="h-5 w-5 text-neutral-950" />
            </button>
            <Logo />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8D6E63]/15 text-[#4E342E] px-2.5 py-1 rounded-full border border-[#8D6E63]/30">
            Personal Space
          </span>
        </div>

        {/* Sidebar Navigation Items Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F7F4F0]">
          {/* Section: Payments & Transactions */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-900 px-3 block">
              {t('coreBanking')}
            </span>

            <button
              onClick={() => handleSidebarNavigate('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'dashboard'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-neutral-950 hover:bg-[#EAE2DA] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>{t('dashboard')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
            </button>

            <button
              onClick={() => handleSidebarNavigate('scan')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'scan'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-neutral-950 hover:bg-[#EAE2DA] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <QrCode className="h-4 w-4 shrink-0" />
                <span>{t('scanQr')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
            </button>

            <button
              onClick={() => handleSidebarNavigate('pay')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'pay'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-neutral-950 hover:bg-[#EAE2DA] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className="h-4 w-4 shrink-0" />
                <span>{t('payUpi')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
            </button>

            <button
              onClick={() =>
                handleSidebarNavigate('pay', {
                  payeeVpa: '9876543210@upi',
                  note: 'Mobile Number Transfer',
                })
              }
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-neutral-950 hover:bg-[#EAE2DA] hover:text-black"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-neutral-950 shrink-0" />
                <span>{t('payMobile')}</span>
              </div>
              <span className="text-[10px] font-mono bg-[#8D6E63]/15 text-[#4E342E] font-bold px-2 py-0.5 rounded-md border border-[#8D6E63]/20">
                +91
              </span>
            </button>

            <button
              onClick={() => handleSidebarNavigate('transactions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'transactions' || activePage === 'transaction-detail'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-neutral-950 hover:bg-[#EAE2DA] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 shrink-0" />
                <span>{t('history')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
            </button>
          </div>

          {/* Section: Fraud Defense & Alerts */}
          <div className="space-y-1.5 pt-3 border-t border-[#D7CCC8]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-900 px-3 block">
              {t('protectionHelp')}
            </span>

            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setIsConfigOpen(true);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-neutral-950 hover:bg-[#EAE2DA] hover:text-black"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-[#4A7C59] shrink-0" />
                <span>{t('smsHub')}</span>
              </div>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isSmsActive
                    ? 'bg-[#4A7C59]/15 text-[#2E5539] border border-[#4A7C59]/30'
                    : 'bg-[#B87A30]/15 text-[#7A4B13] border border-[#B87A30]/30'
                }`}
              >
                {isSmsActive ? 'Live' : 'Config'}
              </span>
            </button>

            <button
              onClick={() => handleSidebarNavigate('report')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'report'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-neutral-950 hover:bg-[#EAE2DA] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileWarning className="h-4 w-4 text-[#8C3B32] shrink-0" />
                <span>{t('reportFraud')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
            </button>

            <button
              onClick={() => handleSidebarNavigate('help')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'help'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-neutral-950 hover:bg-[#EAE2DA] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <LifeBuoy className="h-4 w-4 shrink-0" />
                <span>{t('helpline')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
            </button>

            <button
              onClick={() => handleSidebarNavigate('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'profile'
                  ? 'bg-[#8D6E63] text-white shadow-sm'
                  : 'text-neutral-950 hover:bg-[#EAE2DA] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0" />
                <span>{t('profile')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
            </button>
          </div>

          {/* Section: Switch Workspace */}
          <div className="space-y-1.5 pt-3 border-t border-[#D7CCC8]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-900 px-3 block">
              {t('workspaceNav')}
            </span>

            <button
              onClick={() => handleSidebarNavigate('home')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-950 hover:bg-[#EAE2DA] hover:text-black transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Home className="h-4 w-4 shrink-0" />
                <span>{t('frontPage')}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
            </button>

            <button
              onClick={() => handleSidebarNavigate('traders')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold border border-[#8D6E63]/30 bg-[#EDE7E1] text-[#302824] hover:bg-[#8D6E63] hover:text-white transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-neutral-950 shrink-0" />
                <span>{t('tradersSpace')}</span>
              </div>
              <span className="text-[10px] uppercase font-bold bg-[#8D6E63]/15 text-[#4E342E] px-2 py-0.5 rounded-md border border-[#8D6E63]/20">
                Terminal
              </span>
            </button>
          </div>

          {/* Accessibility & High-Contrast Theme Section inside Sidebar */}
          <div className="pt-3 border-t border-[#D7CCC8]">
            <AccessibilityControls variant="earth" />
          </div>
        </div>

        {/* Sidebar Footer with Account & Logout */}
        <div className="p-4 border-t border-[#D7CCC8] bg-[#EDE7E1] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#8D6E63] text-white font-bold text-xs shrink-0 shadow-xs">
              <User className="h-4 w-4" />
            </span>
            <div className="truncate">
              <span className="text-xs font-bold text-neutral-950 block truncate">
                {userName}
              </span>
              <span className="text-[10px] text-neutral-700 font-medium block truncate">
                {t('verifiedUser')}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onLogout();
              }}
              title="Log Out of FraudShield"
              className="p-2 rounded-xl text-neutral-900 hover:bg-[#8C3B32]/15 hover:text-[#8C3B32] transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Left Corner: Hamburger Menu Button & Logo */}
          <div className="flex items-center gap-3">
            {/* ChatGPT-style Hamburger Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl border border-border bg-muted/60 text-foreground hover:bg-primary hover:text-white transition-all shadow-2xs cursor-pointer flex items-center justify-center"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Open navigation sidebar'}
              aria-label="Toggle navigation menu"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              title="Return to Front Page"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-left"
            >
              <Logo />
            </button>

            {/* Front Page link */}
            <button
              onClick={() => onNavigate('home')}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-white transition-all cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" /> {t('frontPage')}
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-card hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Language Selector */}
            <LanguageSelector variant="earth" />

            {/* Back to Home Mobile / Small screens */}
            <button
              onClick={() => onNavigate('home')}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-white transition-all cursor-pointer"
              title={t('frontPage')}
            >
              <Home className="h-3.5 w-3.5" />
            </button>

            {/* Switch to Traders Space */}
            <button
              onClick={() => onNavigate('traders')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#8D6E63]/30 bg-[#EFEBE9] px-3 py-1.5 text-xs font-bold text-[#8D6E63] hover:bg-[#8D6E63] hover:text-white transition-all shadow-2xs cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>{t('tradersSpace')}</span>
            </button>
            {/* SMS Status / Hub Button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isSmsActive
                  ? 'border-safe/40 bg-safe/15 text-safe hover:bg-safe/25 shadow-xs'
                  : 'border-medium/40 bg-medium/15 text-medium hover:bg-medium/25 shadow-xs'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{isSmsActive ? 'MSG91 Live' : t('smsHub')}</span>
            </button>

            {/* Helpline 1930 */}
            <a
              href="tel:1930"
              className="hidden xs:inline-flex items-center gap-1.5 rounded-full border border-high/30 bg-high/10 px-3 py-1.5 text-xs font-bold text-high hover:bg-high/20 transition-colors shadow-xs"
            >
              <PhoneCall className="h-3.5 w-3.5 text-high" />
              <span className="hidden md:inline">1930</span>
            </a>

            {/* Profile Avatar Button */}
            <button
              onClick={() => onNavigate('profile')}
              title="SMS Settings & Profile"
              className={`flex items-center gap-2 rounded-xl border border-border px-3.5 py-1.5 text-xs font-bold transition-colors shadow-xs cursor-pointer ${
                activePage === 'profile'
                  ? 'bg-primary text-white ring-2 ring-primary border-primary'
                  : 'bg-muted/50 text-foreground hover:bg-primary hover:text-white'
              }`}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-lg ${activePage === 'profile' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="hidden sm:inline">{userName}</span>
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out / Sign Out"
                className="flex items-center justify-center p-2 rounded-xl border border-border bg-card text-muted-foreground hover:bg-high/10 hover:border-high/30 hover:text-high transition-colors shadow-xs cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border/60 bg-background/90 backdrop-blur-xl px-2 py-2">
        <div className="grid grid-cols-5 gap-1 text-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Configuration & SMS Hub Modal */}
      <SmsConfigGuideModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        status={status}
        onRefreshStatus={onRefreshStatus}
      />
    </div>
  );
}
