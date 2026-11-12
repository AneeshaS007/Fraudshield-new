import { useState, useEffect } from 'react';
import { AppShell, ActivePage } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { TradersPage } from './pages/TradersPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScanPage } from './pages/ScanPage';
import { PayPage } from './pages/PayPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReportPage } from './pages/ReportPage';
import { HelpPage } from './pages/HelpPage';
import { AuthPage, AuthMode } from './pages/AuthPage';
import { SmsConfigGuideModal } from './components/SmsConfigGuideModal';
import { api } from './lib/api';
import { supabase } from './lib/supabase';
import { SystemStatus, UserProfile } from './lib/types';

export default function App() {
  // Requirement: When the website opens, display the existing homepage first
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [pageParams, setPageParams] = useState<any>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Initial system status load
    loadSystemStatus();

    // Verify session state and route handling
    async function verifyInitialSession() {
      let activeUser: any = null;

      try {
        // 1. Check Supabase session
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          activeUser = data.session.user;
        }
      } catch (err) {
        console.warn('Supabase getSession check:', err);
      }

      // 2. Fallback to persisted active session if authenticated locally
      if (!activeUser) {
        try {
          const stored = localStorage.getItem('fraudshield_active_session');
          if (stored) {
            activeUser = JSON.parse(stored);
          }
        } catch {
          localStorage.removeItem('fraudshield_active_session');
        }
      }

      if (activeUser) {
        setSession(activeUser);
        loadProfile();
      } else {
        setSession(null);
      }

      const rawPath = window.location.pathname.replace(/^\//, '');

      if (rawPath === 'auth') {
        setActivePage('auth');
      } else if (
        ['dashboard', 'scan', 'pay', 'transactions', 'transaction-detail', 'profile', 'report', 'help', 'traders'].includes(rawPath)
      ) {
        if (!activeUser) {
          // If the user is not logged in, do not allow access to protected dashboards
          setActivePage('auth');
          setPageParams({
            mode: 'signin',
            returnTo: rawPath,
            message: 'Please sign in to access this protected dashboard.',
          });
          window.history.replaceState({}, '', '/auth');
        } else {
          setActivePage(rawPath as ActivePage);
        }
      } else {
        // Default: display the existing homepage first
        setActivePage('home');
        if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
          window.history.replaceState({}, '', '/');
        }
      }
    }

    verifyInitialSession();

    // Supabase auth state change subscription
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession?.user) {
        setSession(currentSession.user);
        localStorage.setItem(
          'fraudshield_active_session',
          JSON.stringify({
            id: currentSession.user.id,
            email: currentSession.user.email,
            name: currentSession.user.user_metadata?.name || 'Shield User',
          })
        );
        loadProfile();
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        localStorage.removeItem('fraudshield_active_session');
      }
    });

    const handlePopState = () => {
      const p = window.location.pathname.replace(/^\//, '');
      const hasActiveSession = Boolean(localStorage.getItem('fraudshield_active_session'));

      if (p === '' || p === 'home') {
        setActivePage('home');
      } else if (p === 'auth') {
        setActivePage('auth');
      } else if (['dashboard', 'scan', 'pay', 'transactions', 'profile', 'report', 'help', 'traders'].includes(p)) {
        if (!hasActiveSession) {
          // Guard protected dashboard from unauthenticated back/forward navigation
          setActivePage('auth');
          setPageParams({
            mode: 'signin',
            returnTo: p,
            message: 'Please sign in to access this protected space.',
          });
        } else {
          setActivePage(p as ActivePage);
        }
      } else {
        setActivePage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadSystemStatus() {
    try {
      const s = await api.getStatus();
      setStatus(s);
    } catch (e) {
      console.warn('Status fetch error:', e);
    }
  }

  async function loadProfile() {
    try {
      const p = await api.getProfile();
      setProfile(p);
    } catch (e) {
      console.warn('Profile fetch error:', e);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    localStorage.removeItem('fraudshield_active_session');
    setSession(null);
    setProfile(null);
    // On logout, return cleanly to the homepage with the Login button
    navigate('home');
  }

  function navigate(page: ActivePage, params?: any) {
    const hasActiveSession = session || localStorage.getItem('fraudshield_active_session');

    // Requirement: If user is not logged in, do not allow access to protected dashboards
    if (!hasActiveSession && page !== 'home' && page !== 'auth') {
      const targetDashboard = page === 'traders' ? 'traders' : 'dashboard';
      const msg =
        page === 'traders'
          ? 'Please sign in to access the Traders Space.'
          : 'Please sign in to access your Personal User dashboard.';
      setActivePage('auth');
      setPageParams({ mode: 'signin', returnTo: targetDashboard, message: msg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState({}, '', '/auth');
      return;
    }

    setActivePage(page);
    setPageParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const targetUrl = page === 'home' ? '/' : `/${page}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
  }

  // 1. Render standalone Homepage (Default entry point)
  if (activePage === 'home') {
    return (
      <HomePage
        onNavigate={navigate}
        onLogout={handleLogout}
        userEmail={session?.email}
        isLoggedIn={Boolean(session)}
      />
    );
  }

  // 2. Render dedicated Login / Authentication Page
  if (activePage === 'auth') {
    const authMode: AuthMode = pageParams?.mode || 'signin';
    const authMessage: string | undefined = pageParams?.message;
    return (
      <AuthPage
        initialMode={authMode}
        initialMessage={authMessage}
        onSuccess={(u) => {
          const userSessionData = {
            id: u.id || 'usr_' + Date.now().toString(36),
            email: u.email,
            name: u.user_metadata?.name || u.name || 'Shield User',
          };
          setSession(userSessionData);
          localStorage.setItem('fraudshield_active_session', JSON.stringify(userSessionData));
          loadProfile();
          // Requirement: After successful login, redirect the user to the appropriate existing dashboard
          const targetDashboard: ActivePage = pageParams?.returnTo || 'dashboard';
          navigate(targetDashboard);
        }}
        onCancel={() => navigate('home')}
      />
    );
  }

  // 3. Render standalone Traders Page (Protected dashboard)
  if (activePage === 'traders') {
    const hasActiveSession = session || localStorage.getItem('fraudshield_active_session');
    if (!hasActiveSession) {
      navigate('auth', {
        mode: 'signin',
        returnTo: 'traders',
        message: 'Please sign in to access the Traders Space.',
      });
      return null;
    }
    return (
      <TradersPage
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    );
  }

  // 4. Personal User Space Dashboard & internal tools (Protected dashboard)
  const hasActiveSession = session || localStorage.getItem('fraudshield_active_session');
  if (!hasActiveSession) {
    navigate('auth', {
      mode: 'signin',
      returnTo: activePage,
      message: 'Please sign in to access your Personal User dashboard.',
    });
    return null;
  }

  return (
    <AppShell
      activePage={activePage}
      onNavigate={navigate}
      status={status}
      onRefreshStatus={loadSystemStatus}
      userName={profile?.name || session?.name || 'Shield User'}
      onLogout={handleLogout}
    >
      {activePage === 'dashboard' && (
        <DashboardPage
          onNavigate={navigate}
          status={status}
          profile={profile}
          onOpenConfig={() => setIsConfigOpen(true)}
        />
      )}

      {activePage === 'scan' && <ScanPage onNavigate={navigate} />}

      {activePage === 'pay' && (
        <PayPage
          onNavigate={navigate}
          status={status}
          profile={profile}
          onOpenConfig={() => setIsConfigOpen(true)}
          initialParams={pageParams}
        />
      )}

      {activePage === 'transactions' && <TransactionsPage onNavigate={navigate} />}

      {activePage === 'transaction-detail' && (
        <TransactionDetailPage
          id={pageParams?.id || ''}
          onBack={() => navigate('transactions')}
          onOpenConfig={() => setIsConfigOpen(true)}
        />
      )}

      {activePage === 'profile' && (
        <ProfilePage
          status={status}
          onOpenConfig={() => setIsConfigOpen(true)}
          onProfileUpdated={(p) => setProfile(p)}
          onLogout={handleLogout}
        />
      )}

      {activePage === 'report' && <ReportPage onNavigate={navigate} />}

      {activePage === 'help' && <HelpPage />}

      {/* Global Config & SMS Hub Modal */}
      <SmsConfigGuideModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        status={status}
        onRefreshStatus={loadSystemStatus}
      />
    </AppShell>
  );
}
