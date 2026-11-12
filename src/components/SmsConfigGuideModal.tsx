import { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  ShieldCheck,
  Key,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Send,
  Lock,
  Eye,
  EyeOff,
  Save,
  Zap,
  Sliders,
} from 'lucide-react';
import { api } from '../lib/api';
import { SystemStatus, SmsLogEntry, SmsConfig } from '../lib/types';

interface SmsConfigGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus | null;
  onRefreshStatus: () => void;
}

export function SmsConfigGuideModal({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
}: SmsConfigGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api_config' | 'sms_guide' | 'payment_guide' | 'logs'>('overview');
  const [testMobile, setTestMobile] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // SMS API Gateway configuration
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
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      loadSmsConfig();
      api.getProfile().then((p) => {
        if (p.phone) setTestMobile(p.phone);
      });
    }
  }, [isOpen]);

  async function loadSmsConfig() {
    try {
      const cfg = await api.getSmsConfig();
      if (cfg) setSmsConfig(cfg);
    } catch (e) {
      console.warn('Could not load SMS config in modal:', e);
    }
  }

  async function handleSaveConfig(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSavingConfig(true);
    setConfigError(null);
    setConfigSuccess(false);
    try {
      const res = await api.updateSmsConfig(smsConfig);
      setSmsConfig(res.config);
      setConfigSuccess(true);
      onRefreshStatus();
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err: any) {
      setConfigError(err.message || 'Failed to update SMS configuration');
    } finally {
      setSavingConfig(false);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const data = await api.getSmsLogs();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleSendTest() {
    if (!testMobile.trim() || testMobile.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    setTestSending(true);
    setTestResult(null);
    try {
      const res = await api.sendTestSms(testMobile);
      setTestResult(res);
      loadLogs();
      onRefreshStatus();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestSending(false);
    }
  }

  if (!isOpen) return null;

  const isSmsConnected = status?.sms.connected;
  const isRazorpayConnected = status?.razorpay.connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-glass-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold font-display">Integrations & Credentials Hub</h2>
              <p className="text-xs text-muted-foreground">
                Real SMS (MSG91), UPI Payment Provider, and Supabase Database Status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/60 gap-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Live Status
          </button>
          <button
            onClick={() => setActiveTab('api_config')}
            className={`pb-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'api_config'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            SMS API Credentials
          </button>
          <button
            onClick={() => setActiveTab('sms_guide')}
            className={`pb-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'sms_guide'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            MSG91 Guide
          </button>
          <button
            onClick={() => setActiveTab('payment_guide')}
            className={`pb-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'payment_guide'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            UPI & Payment Setup
          </button>
          <button
            onClick={() => {
              setActiveTab('logs');
              loadLogs();
            }}
            className={`pb-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'logs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            SMS Logs ({logs.length})
          </button>
        </div>

        {/* TAB 1: Live Status & Instant Test */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* MSG91 Status */}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4" /> MSG91 SMS Engine
                  </span>
                  {isSmsConnected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-safe bg-safe/10 border border-safe/25 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Live Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3 text-amber-600" /> SMS API Missing
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/80">
                  {isSmsConnected
                    ? `Connected via server secrets with Sender ID: ${status?.sms.senderId}. Cellular SMS will dispatch on verified payment events.`
                    : 'MSG91_AUTH_KEY is not configured in backend environment variables. Configure MSG91_AUTH_KEY in server secrets or SMS API Credentials tab to enable cellular SMS.'}
                </p>
              </div>

              {/* UPI & Payment Provider Status */}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Key className="h-4 w-4" /> UPI & Payment Engine
                  </span>
                  {isRazorpayConnected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-safe bg-safe/10 border border-safe/25 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary bg-secondary/10 border border-secondary/25 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> UPI Intent Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/80">
                  {isRazorpayConnected
                    ? `Razorpay Gateway active (Key: ${status?.razorpay.keyId}). Cards, Netbanking & UPI popup enabled.`
                    : 'Direct UPI App Handoff (Google Pay, PhonePe, Paytm, BHIM, CRED) is fully functional right now. Configure RAZORPAY_KEY_ID for modal checkout.'}
                </p>
              </div>
            </div>

            {/* Test SMS Dispatch Box */}
            <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold font-display text-primary flex items-center gap-1.5">
                    <Send className="h-4 w-4" /> Test Real MSG91 SMS Dispatch
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Send an actual test notification to your phone number to verify MSG91 routing.
                  </p>
                </div>
                <button
                  onClick={onRefreshStatus}
                  title="Refresh System Status"
                  className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={testMobile}
                    onChange={(e) => setTestMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-input bg-[#EFEBE9] pl-11 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                </div>
                <button
                  onClick={handleSendTest}
                  disabled={testSending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  {testSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send SMS
                </button>
              </div>

              {testResult && (
                <div
                  className={`rounded-xl border p-3 text-xs space-y-1 ${
                    testResult.status === 'delivered' || testResult.status === 'sent'
                      ? 'border-safe/30 bg-safe/10 text-safe'
                      : testResult.status === 'pending_config'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-800'
                      : 'border-high/30 bg-high/10 text-high'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    {testResult.status === 'delivered' || testResult.status === 'sent' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    {testResult.status === 'delivered'
                      ? 'SMS Dispatched via MSG91!'
                      : testResult.status === 'pending_config'
                      ? 'SMS API Missing: MSG91_AUTH_KEY Required'
                      : 'SMS Transmission Error'}
                  </div>
                  <p className="text-[11px] opacity-90">
                    {testResult.error ||
                      (testResult.messageId ? `Message ID: ${testResult.messageId}. Check your phone inbox.` : '')}
                  </p>
                  {testResult.setupMessage && (
                    <p className="text-[10px] text-amber-700 font-medium">{testResult.setupMessage}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SMS API Credentials Configuration */}
        {activeTab === 'api_config' && (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-border bg-background/50 p-4 space-y-1.5">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Key className="h-4 w-4 text-primary" /> Live SMS Gateway API Keys
              </h4>
              <p className="text-muted-foreground">
                Enter your live SMS provider credentials (MSG91, Fast2SMS, or custom webhook). Once saved, all verification codes, payment receipts, and fraud alerts will be dispatched in real-time.
              </p>
            </div>

            {configSuccess && (
              <div className="rounded-2xl border border-safe/30 bg-safe/10 p-3 text-safe flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>SMS credentials saved successfully!</span>
              </div>
            )}

            {configError && (
              <div className="rounded-2xl border border-high/30 bg-high/10 p-3 text-high flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-4 space-y-3.5 shadow-2xs">
              {/* Provider Selection */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Select Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSmsConfig({ ...smsConfig, provider: 'msg91' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      smsConfig.provider === 'msg91'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-muted/30 text-foreground'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <Zap className="h-3 w-3" /> MSG91
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      DLT Flows & SMS
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSmsConfig({ ...smsConfig, provider: 'fast2sms' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      smsConfig.provider === 'fast2sms'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-muted/30 text-foreground'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <Smartphone className="h-3 w-3" /> Fast2SMS
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Quick OTP/Direct
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSmsConfig({ ...smsConfig, provider: 'custom' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      smsConfig.provider === 'custom'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-muted/30 text-foreground'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <Sliders className="h-3 w-3" /> Webhook
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Custom Gateway
                    </span>
                  </button>
                </div>
              </div>

              {/* Auth Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {smsConfig.provider === 'msg91' ? 'MSG91 Auth Key' : 'API Authorization Key'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                  >
                    {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Enter your SMS API Auth Key"
                    value={smsConfig.authKey}
                    onChange={(e) => setSmsConfig({ ...smsConfig, authKey: e.target.value })}
                    className="w-full rounded-xl border border-input bg-[#EFEBE9] pl-9 pr-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>

              {/* Sender ID & Optional Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Sender ID
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
                    className="w-full rounded-xl border border-input bg-[#EFEBE9] px-3 py-2 text-xs font-mono uppercase font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {smsConfig.provider === 'custom' ? 'Webhook URL' : 'Flow ID (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      smsConfig.provider === 'custom'
                        ? 'https://api.yourdomain.com/sms'
                        : 'e.g. 64abc123...'
                    }
                    value={
                      smsConfig.provider === 'custom'
                        ? smsConfig.customWebhookUrl || ''
                        : smsConfig.flowPaymentSuccess || ''
                    }
                    onChange={(e) =>
                      smsConfig.provider === 'custom'
                        ? setSmsConfig({ ...smsConfig, customWebhookUrl: e.target.value })
                        : setSmsConfig({ ...smsConfig, flowPaymentSuccess: e.target.value })
                    }
                    className="w-full rounded-xl border border-input bg-[#EFEBE9] px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">
                  Credentials are automatically synced with the Express backend.
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveConfig()}
                  disabled={savingConfig}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {savingConfig ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MSG91 Instructions */}
        {activeTab === 'sms_guide' && (
          <div className="space-y-4 text-xs text-foreground/90">
            <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-2">
              <h4 className="font-semibold text-sm text-foreground">How MSG91 Integration Works:</h4>
              <p>
                All SMS dispatches occur server-side through <code className="text-primary font-mono">/server.ts</code> using
                the official MSG91 API v5. Your AuthKey is never exposed to the client browser.
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Required Server Secrets:
              </h4>
              <div className="rounded-xl border border-border bg-muted/70 p-3 font-mono text-[11px] space-y-1">
                <div className="text-primary font-semibold"># MSG91 SMS API Credentials</div>
                <div>MSG91_AUTH_KEY="your_msg91_auth_key_here"</div>
                <div>MSG91_SENDER_ID="FRDSHD"</div>
                <div>MSG91_FLOW_PAYMENT_SUCCESS="flow_id_success"</div>
                <div>MSG91_FLOW_PAYMENT_FAILURE="flow_id_failure"</div>
                <div>MSG91_FLOW_FRAUD_ALERT="flow_id_fraud"</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Step-by-step Setup on MSG91:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-foreground/80">
                <li>Create an account at <a href="https://msg91.com" target="_blank" rel="noreferrer" className="text-secondary hover:underline inline-flex items-center gap-0.5 font-semibold">msg91.com <ExternalLink className="h-3 w-3" /></a></li>
                <li>Go to <strong>AuthKey</strong> menu in MSG91 dashboard and generate a new key.</li>
                <li>In <strong>Sender IDs</strong>, apply for an approved 6-character header (e.g., <code>FRDSHD</code>) with DLT registration.</li>
                <li>In <strong>Campaigns / Flow Builder</strong>, create templates with variables: <code>##amount##</code>, <code>##payee##</code>, <code>##ref##</code>.</li>
                <li>Add the variables into your AI Studio Secrets or <code className="font-mono">.env</code> file.</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 3: UPI & Razorpay Instructions */}
        {activeTab === 'payment_guide' && (
          <div className="space-y-4 text-xs text-foreground/90">
            <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-2">
              <h4 className="font-semibold text-sm text-foreground">UPI Payment Integration:</h4>
              <p>
                FraudShield supports two payment pipelines:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Direct UPI App Handoff:</strong> Works out of the box via standard NPCI <code>upi://pay</code> intents for Google Pay, PhonePe, Paytm, BHIM, and CRED.</li>
                <li><strong className="text-foreground">Razorpay / Bank Gateway:</strong> Provides modal checkout, UPI QR generator, and card/netbanking processing with cryptographic webhook verification.</li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Payment Secrets:
              </h4>
              <div className="rounded-xl border border-border bg-muted/70 p-3 font-mono text-[11px] space-y-1">
                <div className="text-primary font-semibold"># UPI Payment Gateway Credentials</div>
                <div>RAZORPAY_KEY_ID="rzp_test_..."</div>
                <div>RAZORPAY_KEY_SECRET="..."</div>
                <div>RAZORPAY_WEBHOOK_SECRET="..."</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Delivery Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Recent SMS transmissions and carrier feedback:</span>
              <button
                onClick={loadLogs}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No SMS dispatches recorded yet. Use the Test button to send an SMS.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-border/80 bg-background/50 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            log.status === 'delivered'
                              ? 'bg-safe'
                              : log.status === 'sent'
                              ? 'bg-secondary'
                              : log.status === 'pending_config'
                              ? 'bg-medium'
                              : 'bg-high'
                          }`}
                        />
                        <span className="font-semibold uppercase tracking-wider text-[11px]">
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          +91 {log.mobile}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-foreground/80 font-mono bg-card/60 p-1.5 rounded">
                      {log.textSnippet}
                    </p>

                    {log.error && (
                      <p className="text-[10px] text-medium font-medium">
                        Notice: {log.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="rounded-xl bg-primary text-primary-foreground border border-primary/20 px-5 py-2 text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-2xs"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
}
