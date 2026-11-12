import { useState, useEffect } from 'react';
import {
  User,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  RefreshCw,
  Sliders,
  LogOut,
  Key,
  Lock,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { UserProfile, SystemStatus, SmsConfig } from '../lib/types';
import { sanitizePhoneNumber } from '../lib/upi';

interface ProfilePageProps {
  status: SystemStatus | null;
  onOpenConfig: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  onLogout?: () => void;
}

export function ProfilePage({
  status,
  onOpenConfig,
  onProfileUpdated,
  onLogout,
}: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [smsPaymentSuccess, setSmsPaymentSuccess] = useState(true);
  const [smsPaymentFailure, setSmsPaymentFailure] = useState(true);
  const [smsFraudAlert, setSmsFraudAlert] = useState(true);

  // SMS API Gateway Settings State
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    provider: 'msg91',
    authKey: '',
    senderId: 'FRDSHD',
    flowPaymentSuccess: '',
    flowPaymentFailure: '',
    flowFraudAlert: '',
    customWebhookUrl: '',
    isConfigured: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingSmsConfig, setSavingSmsConfig] = useState(false);
  const [smsConfigSuccess, setSmsConfigSuccess] = useState(false);
  const [smsConfigError, setSmsConfigError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadSmsConfig();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.getProfile();
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setSmsNotifications(data.sms_notifications ?? true);
      setSmsPaymentSuccess(data.sms_payment_success ?? true);
      setSmsPaymentFailure(data.sms_payment_failure ?? true);
      setSmsFraudAlert(data.sms_fraud_alert ?? true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load profile');
    }
  }

  async function loadSmsConfig() {
    try {
      const cfg = await api.getSmsConfig();
      if (cfg) {
        setSmsConfig(cfg);
      }
    } catch (err: any) {
      console.warn('Could not load SMS API configuration:', err);
    }
  }

  async function handleSaveSmsConfig(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSavingSmsConfig(true);
    setSmsConfigError(null);
    setSmsConfigSuccess(false);
    try {
      const res = await api.updateSmsConfig(smsConfig);
      setSmsConfig(res.config);
      setSmsConfigSuccess(true);
      setTimeout(() => setSmsConfigSuccess(false), 3500);
    } catch (err: any) {
      setSmsConfigError(err.message || 'Failed to save SMS API settings');
    } finally {
      setSavingSmsConfig(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);

    const cleanPhone = sanitizePhoneNumber(phone);
    if (phone.trim() && !cleanPhone) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        phone: cleanPhone || '',
        sms_notifications: smsNotifications,
        sms_payment_success: smsPaymentSuccess,
        sms_payment_failure: smsPaymentFailure,
        sms_fraud_alert: smsFraudAlert,
      });

      setProfile(res.profile);
      onProfileUpdated(res.profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestSms() {
    const cleanPhone = sanitizePhoneNumber(phone);
    if (!cleanPhone) {
      setError('Please enter and save a valid 10-digit mobile number first.');
      return;
    }

    setTestSending(true);
    setTestResult(null);
    setError(null);
    try {
      const res = await api.sendTestSms(cleanPhone);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestSending(false);
    }
  }

  const isSmsConnected = status?.sms.connected;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Rich Earth Brown Header Banner Box */}
      <div className="rounded-3xl bg-[#8D6E63] text-white p-6 sm:p-7 space-y-2 shadow-xl border border-[#795B50]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A1887F]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F5F5F5] border border-white/20">
          <User className="h-3.5 w-3.5 text-[#EFEBE9]" /> Account & MSG91 Cellular SMS
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Profile & <span className="text-[#D7CCC8]">SMS Notification Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#F5F5F5]/90 max-w-xl leading-relaxed">
          Manage your verified mobile number, account credentials, and MSG91 real-time SMS fraud alerts.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-high/30 bg-high/10 p-4 text-xs text-high flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-2xl border border-safe/30 bg-safe/10 p-4 text-xs text-safe flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Profile and SMS preferences saved successfully!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="glass rounded-3xl border border-glass-border p-6 sm:p-8 space-y-6">
        {/* User Identity Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-4 w-4" /> Account Details
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              ID: {profile?.id || 'usr_default_fs'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Shield User"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verified Mobile Number (for SMS) <span className="text-high">*</span>
              </label>
              {profile?.phone_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-safe bg-safe/10 px-2 py-0.5 rounded-full border border-safe/25">
                  <CheckCircle2 className="h-3 w-3" /> Mobile Verified
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-mono text-muted-foreground">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-2xl border border-input bg-[#EFEBE9] pl-12 pr-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Real-time payment notifications and instant high-risk fraud alerts are dispatched to this number.
            </span>
          </div>
        </div>

        {/* Real SMS Integration Section */}
        <div className="space-y-4 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" /> MSG91 SMS Notification Settings
            </span>
            <button
              type="button"
              onClick={onOpenConfig}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              <Sliders className="h-3 w-3" /> Credentials Hub
            </button>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4 shadow-2xs">
            <div>
              <span className="text-xs font-bold block text-foreground">
                Enable SMS Notifications
              </span>
              <span className="text-[11px] text-muted-foreground">
                Send SMS notifications via MSG91 to +91 {phone || '...'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Sub-Toggles */}
          {smsNotifications && (
            <div className="space-y-2.5 pl-2">
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-2xs">
                <div>
                  <span className="text-xs font-semibold block text-foreground">
                    Verified Payment Success
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    SMS with payee, amount, UTR reference, and risk score
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smsPaymentSuccess}
                  onChange={(e) => setSmsPaymentSuccess(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-2xs">
                <div>
                  <span className="text-xs font-semibold block text-foreground">
                    Payment Failure Alerts
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Immediate SMS if transfer is declined or signature check fails
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smsPaymentFailure}
                  onChange={(e) => setSmsPaymentFailure(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-2xs">
                <div>
                  <span className="text-xs font-semibold block text-foreground">
                    High-Risk Pre-Transfer Fraud Alerts
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Urgent cellular SMS warning if risk score exceeds 70/100
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smsFraudAlert}
                  onChange={(e) => setSmsFraudAlert(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
              </div>
            </div>
          )}

          {/* Test SMS Trigger Button */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary block">
                  Verify Live SMS Delivery
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Send a real test SMS to your mobile phone right now.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSendTestSms}
                disabled={testSending || !phone}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {testSending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send Test SMS
              </button>
            </div>

            {testResult && (
              <div
                className={`rounded-xl border p-2.5 text-[11px] ${
                  testResult.status === 'delivered' || testResult.status === 'sent'
                    ? 'border-safe/30 bg-safe/10 text-safe'
                    : testResult.status === 'pending_config'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-800'
                    : 'border-high/30 bg-high/10 text-high'
                }`}
              >
                <div className="font-semibold flex items-center gap-1">
                  {testResult.status === 'delivered' || testResult.status === 'sent' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                  )}
                  {testResult.status === 'delivered'
                    ? 'Test SMS delivered via SMS Gateway!'
                    : testResult.status === 'pending_config'
                    ? 'SMS API Missing: MSG91_AUTH_KEY Required'
                    : 'SMS transmission error:'}
                </div>
                {testResult.error && <p className="mt-0.5 opacity-90">{testResult.error}</p>}
                {testResult.setupMessage && <p className="mt-0.5 text-[10px] text-amber-700 font-medium">{testResult.setupMessage}</p>}
              </div>
            )}
          </div>
        </div>

        {/* SMS API Gateway Configuration Section */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Key className="h-4 w-4 text-primary" /> SMS Gateway API Credentials
              </span>
              <p className="text-[11px] text-muted-foreground">
                Configure your live SMS provider credentials to send real-time SMS to users.
              </p>
            </div>
            {smsConfig.isConfigured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> API Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                <AlertCircle className="h-3 w-3 text-amber-600" /> SMS API Missing
              </span>
            )}
          </div>

          {!smsConfig.isConfigured && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>MSG91 SMS API Missing in Server Environment</span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                The backend does not detect an active <code className="font-mono font-semibold bg-amber-500/20 px-1 py-0.5 rounded">MSG91_AUTH_KEY</code> in environment variables. To send real cellular SMS for payments and fraud alerts:
              </p>
              <ul className="list-disc list-inside text-[11px] text-amber-800/80 space-y-0.5 pl-1">
                <li>Add <code className="font-mono font-semibold">MSG91_AUTH_KEY="your_auth_key"</code> in your server secrets/environment, or</li>
                <li>Enter your MSG91 Auth Key below to save securely on the backend.</li>
              </ul>
            </div>
          )}

          {smsConfigSuccess && (
            <div className="rounded-2xl border border-safe/30 bg-safe/10 p-3.5 text-xs text-safe flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>SMS API Credentials saved successfully! Live SMS is ready.</span>
            </div>
          )}

          {smsConfigError && (
            <div className="rounded-2xl border border-high/30 bg-high/10 p-3.5 text-xs text-high flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{smsConfigError}</span>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            {/* Gateway Provider Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                SMS Provider / Gateway
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSmsConfig({ ...smsConfig, provider: 'msg91' })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    smsConfig.provider === 'msg91'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border bg-muted/30 text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> MSG91 (Recommended)
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    India DLT compliant with verified Flow IDs
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSmsConfig({ ...smsConfig, provider: 'fast2sms' })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    smsConfig.provider === 'fast2sms'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border bg-muted/30 text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" /> Fast2SMS
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Instant Quick SMS / OTP gateway
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSmsConfig({ ...smsConfig, provider: 'custom' })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    smsConfig.provider === 'custom'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border bg-muted/30 text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5" /> Custom Webhook
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Twilio, Infobip, or internal microservice
                  </span>
                </button>
              </div>
            </div>

            {/* Auth Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {smsConfig.provider === 'msg91'
                    ? 'MSG91 Auth Key'
                    : smsConfig.provider === 'fast2sms'
                    ? 'Fast2SMS API Key'
                    : 'API Key / Bearer Token'}{' '}
                  <span className="text-high">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showApiKey ? (
                    <>
                      <EyeOff className="h-3 w-3" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" /> Show
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={
                    smsConfig.provider === 'msg91'
                      ? 'e.g. 382741Azabcde12345678'
                      : smsConfig.provider === 'fast2sms'
                      ? 'e.g. YOUR_FAST2SMS_AUTHORIZATION_KEY'
                      : 'e.g. bearer_or_api_secret_key'
                  }
                  value={smsConfig.authKey}
                  onChange={(e) => setSmsConfig({ ...smsConfig, authKey: e.target.value })}
                  className="w-full rounded-2xl border border-input bg-[#EFEBE9] pl-10 pr-4 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Saved securely on your server instance and loaded automatically during SMS dispatches.
              </span>
            </div>

            {/* Sender ID & Custom Webhook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Sender ID (DLT Header)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="FRDSHD"
                  value={smsConfig.senderId}
                  onChange={(e) =>
                    setSmsConfig({
                      ...smsConfig,
                      senderId: e.target.value.toUpperCase().slice(0, 6),
                    })
                  }
                  className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs uppercase"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  6-character registered DLT Sender ID (Default: FRDSHD)
                </span>
              </div>

              {smsConfig.provider === 'custom' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Custom Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.yourdomain.com/sms/send"
                    value={smsConfig.customWebhookUrl || ''}
                    onChange={(e) =>
                      setSmsConfig({ ...smsConfig, customWebhookUrl: e.target.value })
                    }
                    className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Receives JSON POST payload with recipient and message
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Payment Flow ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="65e8a... (MSG91 Flow ID)"
                    value={smsConfig.flowPaymentSuccess || ''}
                    onChange={(e) =>
                      setSmsConfig({ ...smsConfig, flowPaymentSuccess: e.target.value })
                    }
                    className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Optional MSG91 DLT template flow ID
                  </span>
                </div>
              )}
            </div>

            {/* Save SMS Config Button */}
            <div className="flex items-center justify-end pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => handleSaveSmsConfig()}
                disabled={savingSmsConfig}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {savingSmsConfig ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving API Key...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Save SMS API Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-high/30 bg-high/10 px-4 py-2.5 text-xs font-bold text-high hover:bg-high/20 transition-colors shadow-2xs cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-glow hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Profile & Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
