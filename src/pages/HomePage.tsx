import { motion } from 'motion/react';
import {
  QrCode,
  ShieldCheck,
  PhoneCall,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Lock,
  CheckCircle2,
  User,
  Building2,
  ChevronRight,
  LogIn,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { AiOrb } from '../components/AiOrb';
import { ActivePage } from '../components/AppShell';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAccessibility } from '../context/AccessibilityContext';

interface HomePageProps {
  onNavigate: (page: ActivePage, params?: any) => void;
  onLogout?: () => void;
  userEmail?: string;
  isLoggedIn?: boolean;
}

export function HomePage({ onNavigate, onLogout, userEmail, isLoggedIn = false }: HomePageProps) {
  const { t } = useAccessibility();

  const features = [
    {
      icon: QrCode,
      title: t('feat1Title'),
      text: t('feat1Desc'),
      tone: 'text-[#8D6E63] bg-[#8D6E63]/10 border-[#8D6E63]/25',
    },
    {
      icon: Sparkles,
      title: t('feat2Title'),
      text: t('feat2Desc'),
      tone: 'text-[#8D6E63] bg-[#8D6E63]/10 border-[#8D6E63]/25',
    },
    {
      icon: ShieldCheck,
      title: t('feat3Title'),
      text: t('feat3Desc'),
      tone: 'text-[#8D6E63] bg-[#8D6E63]/10 border-[#8D6E63]/25',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5] text-[#302824]">
      {/* Top Header */}
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 border-b border-[#8D6E63]/10">
        <Logo />

        {/* Quick Space Navigation Header Buttons & Language Selector & Login/Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Universal Header Language Selector */}
          <LanguageSelector variant="earth" />

          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#8D6E63]/30 bg-[#EFEBE9] px-3 py-2 text-xs font-bold text-[#302824] hover:bg-[#8D6E63] hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Personal</span> User
          </button>

          <button
            onClick={() => onNavigate('traders')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#8D6E63]/30 bg-[#EFEBE9] px-3 py-2 text-xs font-bold text-[#302824] hover:bg-[#8D6E63] hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Traders</span>
          </button>

          {/* Conditional Login or Logout Button (Top Right) */}
          {isLoggedIn ? (
            onLogout && (
              <button
                onClick={onLogout}
                title={userEmail ? `Sign Out (${userEmail})` : 'Sign Out'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#8D6E63]/30 bg-[#EFEBE9] px-3.5 py-2 text-xs font-bold text-[#62554e] hover:bg-[#EF6468]/15 hover:border-[#EF6468]/40 hover:text-[#EF6468] transition-all shadow-2xs cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            )
          ) : (
            <button
              onClick={() => onNavigate('auth', { mode: 'signin', returnTo: 'dashboard' })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8D6E63] hover:bg-[#795B50] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer active:scale-[0.98]"
              title="Sign in to your FraudShield account"
            >
              <LogIn className="h-3.5 w-3.5 text-white" />
              <span>{t('login')}</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl flex-1 items-center gap-8 md:gap-12 px-4 sm:px-6 pb-12 pt-8 md:grid-cols-[1.2fr_1fr] md:pt-12">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#D7CCC8] px-3.5 py-1.5 text-xs text-[#302824] border border-[#8D6E63]/30 font-bold">
            <span className="h-2 w-2 rounded-full bg-[#8D6E63]" />
            {t('homeBadge')}
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display tracking-tight leading-[1.08] text-[#302824]">
            {t('homeHeroTitle')}{' '}
            <br />
            <span className="text-[#8D6E63]">{t('homeHeroProtected')}</span>
          </h1>

          <p className="max-w-lg text-base sm:text-lg text-[#554740] leading-relaxed">
            {t('homeHeroSubtitle')}
          </p>

          {/* TWO MAIN CLICKABLE WORKSPACE CARDS */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#62554e]">
              {t('selectWorkspace')}
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Option 1: Personal User */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="group text-left bg-[#D7CCC8] hover:bg-[#c9b7b1] border-2 border-[#8D6E63] rounded-3xl p-5 transition-all shadow-sm cursor-pointer space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#8D6E63] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <User className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8D6E63] text-white px-2.5 py-0.5 rounded-full">
                    {t('safe')}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#302824] group-hover:text-[#8D6E63] transition-colors flex items-center gap-1.5">
                    {t('personalUserTitle')} <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-[#554740] mt-1 leading-relaxed">
                    {t('personalUserDesc')}
                  </p>
                </div>
                <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#8D6E63] group-hover:underline">
                  <span>{t('enterPersonal')}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Option 2: Traders */}
              <button
                onClick={() => onNavigate('traders')}
                className="group text-left bg-[#EFEBE9] hover:bg-[#e4ded9] border-2 border-[#A1887F] rounded-3xl p-5 transition-all shadow-sm cursor-pointer space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#A1887F] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#A1887F]/20 text-[#302824] px-2.5 py-0.5 rounded-full border border-[#A1887F]/40">
                    Terminal
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#302824] group-hover:text-[#8D6E63] transition-colors flex items-center gap-1.5">
                    {t('tradersTitle')} <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-[#554740] mt-1 leading-relaxed">
                    {t('tradersDesc')}
                  </p>
                </div>
                <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#A1887F] group-hover:text-[#8D6E63]">
                  <span>{t('enterTraders')}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2 text-xs text-[#62554e] flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#8D6E63]" /> {t('npciCompat')}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-[#8D6E63]" /> {t('msg91Sms')}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#8D6E63]" /> {t('zeroPin')}
            </span>
          </div>
        </motion.div>

        {/* Right Column Orb Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative grid place-items-center py-6"
        >
          <AiOrb size={260} active={true} />

          <div className="absolute -bottom-2 rounded-2xl border border-[#8D6E63]/30 bg-[#D7CCC8]/90 backdrop-blur-xl px-4 py-2.5 text-center shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#62554e] block">
              {t('preTransferEngine')}
            </span>
            <span className="text-xs font-mono font-bold text-[#8D6E63]">
              {t('liveAiDualRouting')}
            </span>
          </div>
        </motion.div>
      </section>

      {/* 3 Pillars / Feature Grid */}
      <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="glass rounded-3xl p-6 sm:p-7 space-y-3 border border-glass-border"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl border ${feat.tone}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="font-display text-lg font-bold text-foreground">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {feat.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo compact />
          <p>{t('footerCopyright')}</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('help')} className="hover:text-foreground">
              {t('helpline')}
            </button>
            <a href="tel:1930" className="text-high hover:underline font-bold">
              {t('cyberHelpline')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

