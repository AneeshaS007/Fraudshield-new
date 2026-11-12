import { useState, useEffect } from 'react';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  QrCode,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Info,
  Sliders,
} from 'lucide-react';
import QRCode from 'qrcode';
import { isValidVpa, buildUpiIntentUri, getUpiAppHandoffUrls } from '../lib/upi';
import { api } from '../lib/api';
import { RiskAnalysis, Transaction, SystemStatus, UserProfile } from '../lib/types';
import { RiskCard } from '../components/RiskCard';
import { ReceiverInfoCard } from '../components/ReceiverInfoCard';
import { StatusBadge, VerificationBadge, SmsStatusBadge } from '../components/StatusBadge';
import { useAccessibility } from '../context/AccessibilityContext';

interface PayPageProps {
  onNavigate: (page: any, params?: any) => void;
  status: SystemStatus | null;
  profile: UserProfile | null;
  onOpenConfig: () => void;
  initialParams?: {
    payeeVpa?: string;
    payeeName?: string;
    amount?: number;
    note?: string;
    riskScore?: number;
    riskTier?: string;
    mode?: 'check_only' | 'pay';
  };
}

export function PayPage({
  onNavigate,
  status,
  profile,
  onOpenConfig,
  initialParams,
}: PayPageProps) {
  const { t } = useAccessibility();
  const [payeeVpa, setPayeeVpa] = useState(initialParams?.payeeVpa || '');
  const [payeeName, setPayeeName] = useState(initialParams?.payeeName || '');
  const [amount, setAmount] = useState(initialParams?.amount?.toString() || '');
  const [note, setNote] = useState(initialParams?.note || '');

  const [analyzingRisk, setAnalyzingRisk] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [step, setStep] = useState<'input' | 'risk_evaluated' | 'payment_intent' | 'verified'>(
    'input'
  );

  const [paymentMode, setPaymentMode] = useState<'upi_intent' | 'razorpay'>('upi_intent');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [upiIntentUri, setUpiIntentUri] = useState<string>('');
  const [manualUtr, setManualUtr] = useState('');
  const [completedTxn, setCompletedTxn] = useState<Transaction | null>(null);
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounced Immediate Live Risk Evaluation as user enters amount or VPA
  useEffect(() => {
    if (!payeeVpa.trim() || !isValidVpa(payeeVpa)) {
      setRiskAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAnalyzingRisk(true);
      try {
        const numAmt = Number(amount) || 0;
        const analysis = await api.evaluateRisk({
          payeeVpa: payeeVpa.trim(),
          payeeName: payeeName.trim(),
          amount: numAmt,
          note: note.trim(),
        });
        setRiskAnalysis(analysis);
        setErrorMessage(null);
      } catch (err: any) {
        console.warn('Live risk check error:', err);
      } finally {
        setAnalyzingRisk(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [payeeVpa, payeeName, amount, note]);

  useEffect(() => {
    if (initialParams?.payeeVpa) {
      handleAnalyzeRisk(initialParams.payeeVpa, initialParams.payeeName, initialParams.amount, initialParams.note);
    }
  }, []);

  async function handleAnalyzeRisk(
    targetVpa = payeeVpa,
    targetName = payeeName,
    targetAmount = Number(amount) || 0,
    targetNote = note
  ) {
    if (!targetVpa.trim() || !isValidVpa(targetVpa)) {
      setErrorMessage('Please enter a valid UPI ID (e.g., merchant@okhdfcbank or 9876543210@paytm).');
      return;
    }

    setErrorMessage(null);
    setAnalyzingRisk(true);
    try {
      const analysis = await api.evaluateRisk({
        payeeVpa: targetVpa.trim(),
        payeeName: targetName.trim(),
        amount: targetAmount,
        note: targetNote.trim(),
      });
      setRiskAnalysis(analysis);
      setStep('risk_evaluated');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze risk');
    } finally {
      setAnalyzingRisk(false);
    }
  }

  function handleQuickAddAmount(addVal: number) {
    const current = Number(amount) || 0;
    const nextVal = current + addVal;
    setAmount(String(nextVal));
  }

  async function handleProceedToPayment() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Please enter an amount to transfer.');
      return;
    }

    setErrorMessage(null);
    setProcessingPayment(true);
    try {
      const order = await api.createPaymentOrder({
        payeeVpa: payeeVpa.trim(),
        payeeName: payeeName.trim() || 'UPI Payee',
        amount: numAmount,
        note: note.trim() || 'FraudShield Transfer',
        riskScore: riskAnalysis?.score || 10,
      });

      // Generate UPI Intent URI
      const uri =
        order.upiUri ||
        buildUpiIntentUri({
          pa: payeeVpa.trim(),
          pn: payeeName.trim() || 'FraudShield Payee',
          am: numAmount,
          tn: note.trim() || 'FraudShield Verified',
          tr: order.txnId,
        });

      setUpiIntentUri(uri);

      // Generate QR Code data URL for scanning
      try {
        const qrUrl = await QRCode.toDataURL(uri, {
          width: 280,
          margin: 2,
          color: {
            dark: '#11152b',
            light: '#ffffff',
          },
        });
        setQrDataUrl(qrUrl);
      } catch (e) {
        console.error('QR code generation error:', e);
      }

      setStep('payment_intent');

      // If Razorpay keys are configured and user prefers gateway popup
      if (status?.razorpay.connected && order.mode === 'razorpay' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: order.keyId,
          amount: Math.round(numAmount * 100),
          currency: 'INR',
          name: 'FraudShield Verified Transfer',
          description: `Transfer to ${payeeVpa}`,
          order_id: order.orderId,
          prefill: {
            name: profile?.name || 'Shield User',
            contact: profile?.phone || '9876543210',
          },
          handler: async function (response: any) {
            await verifyAndRecordPayment({
              provider: 'razorpay',
              providerOrderId: response.razorpay_order_id,
              providerPaymentId: response.razorpay_payment_id,
              providerSignature: response.razorpay_signature,
            });
          },
          theme: {
            color: '#9e75ff',
          },
        });
        rzp.open();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed');
    } finally {
      setProcessingPayment(false);
    }
  }

  async function verifyAndRecordPayment(providerDetails: {
    provider: 'upi_intent' | 'razorpay';
    providerOrderId?: string;
    providerPaymentId?: string;
    providerSignature?: string;
    upiRefId?: string;
  }) {
    setProcessingPayment(true);
    setErrorMessage(null);
    try {
      const res = await api.verifyPayment({
        payeeVpa: payeeVpa.trim(),
        payeeName: payeeName.trim() || 'UPI Payee',
        amount: Number(amount),
        note: note.trim(),
        status: 'successful',
        provider: providerDetails.provider,
        providerOrderId: providerDetails.providerOrderId,
        providerPaymentId: providerDetails.providerPaymentId,
        providerSignature: providerDetails.providerSignature,
        upiRefId: providerDetails.upiRefId,
        riskScore: riskAnalysis?.score || 10,
        riskTier: riskAnalysis?.tier || 'safe',
      });

      setCompletedTxn(res.transaction);
      setSmsDeliveryStatus(res.sms.status);
      setStep('verified');
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification failed');
    } finally {
      setProcessingPayment(false);
    }
  }

  const appLinks = upiIntentUri ? getUpiAppHandoffUrls(upiIntentUri) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Rich Earth Brown Header Banner Box */}
      <div className="rounded-3xl bg-[#8D6E63] text-white p-6 sm:p-7 space-y-2 shadow-xl border border-[#795B50]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A1887F]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F5F5F5] border border-white/20">
          <Send className="h-3.5 w-3.5 text-[#EFEBE9]" /> Verified UPI Handoff & Screening
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
          {t('payPageTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-[#F5F5F5]/90 max-w-xl leading-relaxed">
          {t('payPageSubtitle')}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-high/30 bg-high/10 p-4 text-xs text-high flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Input Details */}
      {step === 'input' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyzeRisk();
          }}
          className="glass rounded-3xl border border-glass-border p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t('payeeVpaLabel')} <span className="text-high">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. merchant@okhdfcbank or 9876543210@paytm"
                value={payeeVpa}
                onChange={(e) => setPayeeVpa(e.target.value.toLowerCase())}
                required
                className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Format: name@handle, mobile@bank, or merchant@psp
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t('payeeNameLabel')}
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh General Store"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t('amountLabel')} <span className="text-high">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm font-mono text-muted-foreground">₹</span>
                  <input
                    type="number"
                    min="1"
                    max="500000"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-input bg-[#EFEBE9] pl-8 pr-4 py-3 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Quick:</span>
                  {[100, 500, 1000, 2000].map((chipVal) => (
                    <button
                      key={chipVal}
                      type="button"
                      onClick={() => handleQuickAddAmount(chipVal)}
                      className="rounded-lg border border-[#A1887F]/40 bg-[#EFEBE9] px-2 py-0.5 text-[11px] font-bold font-mono text-neutral-900 hover:bg-[#8D6E63] hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      +₹{chipVal}
                    </button>
                  ))}
                  {amount && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground ml-auto cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Payment Note / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. groceries, bill split"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
                />
              </div>
            </div>

            {/* IMMEDIATE LIVE RISK SCORE ASSESSMENT DISPLAY & RECEIVER INFO */}
            {payeeVpa && isValidVpa(payeeVpa) && (
              <div className="pt-2 space-y-3">
                <ReceiverInfoCard
                  vpa={payeeVpa}
                  name={payeeName}
                  amount={Number(amount) || undefined}
                />
                <div className={`rounded-2xl border p-4 space-y-2.5 transition-all shadow-sm ${
                  analyzingRisk
                    ? 'bg-[#EFEBE9] border-[#A1887F]/40 animate-pulse'
                    : riskAnalysis?.tier === 'high'
                    ? 'bg-[#8C3B32]/10 border-[#8C3B32]'
                    : riskAnalysis?.tier === 'medium'
                    ? 'bg-[#B87A30]/10 border-[#B87A30]'
                    : 'bg-[#4A7C59]/10 border-[#4A7C59]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-neutral-900">
                      <ShieldCheck className={`h-4 w-4 ${
                        riskAnalysis?.tier === 'high' ? 'text-[#8C3B32]' : riskAnalysis?.tier === 'medium' ? 'text-[#B87A30]' : 'text-[#4A7C59]'
                      }`} />
                      <span>Live Risk Score Assessment</span>
                      {analyzingRisk && <RefreshCw className="h-3 w-3 animate-spin text-[#8D6E63]" />}
                    </span>

                    {riskAnalysis && (
                      <span className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${
                        riskAnalysis.tier === 'high'
                          ? 'bg-[#8C3B32] text-white border-[#8C3B32]'
                          : riskAnalysis.tier === 'medium'
                          ? 'bg-[#B87A30] text-white border-[#B87A30]'
                          : 'bg-[#4A7C59] text-white border-[#4A7C59]'
                      }`}>
                        Risk: {riskAnalysis.score}/100 ({riskAnalysis.tier.toUpperCase()})
                      </span>
                    )}
                  </div>

                  {riskAnalysis ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="font-bold text-neutral-900">
                        {riskAnalysis.recommendation}
                      </div>
                      {riskAnalysis.reasons && riskAnalysis.reasons.length > 0 && (
                        <ul className="text-[11px] text-neutral-800 space-y-0.5 list-disc list-inside font-medium">
                          {riskAnalysis.reasons.slice(0, 3).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Calculating live security score...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PROCEED TO PAY BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={processingPayment || !payeeVpa || !isValidVpa(payeeVpa) || !Number(amount)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#8D6E63] py-4 px-6 text-base font-bold text-white shadow-md hover:bg-[#795B50] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {processingPayment ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" /> Preparing Payment Handoff...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" /> Proceed to Pay {amount ? `₹${Number(amount).toLocaleString('en-IN')}` : ''}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Risk Evaluated */}
      {step === 'risk_evaluated' && riskAnalysis && (
        <div className="space-y-6">
          <RiskCard
            analysis={riskAnalysis}
            proceedLabel={
              riskAnalysis.tier === 'high'
                ? 'I Understand the Risk — Proceed to Pay'
                : 'Confirm & Open Payment Handoff'
            }
            onProceed={handleProceedToPayment}
            onCancel={() => setStep('input')}
          />
        </div>
      )}

      {/* STEP 3: Real UPI Payment Intent & App Handoff */}
      {step === 'payment_intent' && (
        <div className="glass rounded-3xl border border-glass-border p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div>
              <span className="text-xs font-semibold text-safe uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Pre-transfer Screening Passed
              </span>
              <h3 className="text-xl font-bold font-display mt-0.5">Complete Payment</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Transfer Amount</span>
              <span className="text-2xl font-bold font-mono text-primary">
                ₹{Number(amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Receiver Details Card */}
          <ReceiverInfoCard
            vpa={payeeVpa}
            name={payeeName}
            amount={Number(amount) || undefined}
          />

          {/* Mobile UPI App Handoff Buttons */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select UPI App on Your Device:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <a
                href={appLinks?.gpay}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center shadow-2xs"
              >
                <span>Google Pay</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={appLinks?.phonepe}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center shadow-2xs"
              >
                <span>PhonePe</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={appLinks?.paytm}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center shadow-2xs"
              >
                <span>Paytm</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={appLinks?.bhim}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center shadow-2xs"
              >
                <span>BHIM UPI</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={appLinks?.cred}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center shadow-2xs"
              >
                <span>CRED Pay</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={upiIntentUri}
                className="flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary p-3 text-xs font-bold text-white hover:bg-primary/90 transition-all text-center shadow-sm"
              >
                <span>Any UPI App</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Dynamic UPI QR Code for Desktop Scanning */}
          {qrDataUrl && (
            <div className="rounded-2xl border border-border/80 bg-background/50 p-5 text-center space-y-3">
              <span className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
                <QrCode className="h-4 w-4" /> Or Scan with Any Phone Camera / UPI App
              </span>
              <div className="inline-block p-3 bg-[#EFEBE9] rounded-2xl shadow-xl border border-[#BCAAA4]">
                <img
                  src={qrDataUrl}
                  alt="UPI Payment QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Scan to pay ₹{Number(amount).toFixed(2)} to {payeeVpa}
              </p>
            </div>
          )}

          {/* Verification Confirmation Box */}
          <div className="rounded-2xl border border-safe/30 bg-safe/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-safe flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Payment Switched / Authorized
              </span>
            </div>
            <p className="text-xs text-foreground/80">
              Once you complete the payment in your bank app, confirm below to verify and send real
              cellular SMS alerts to your phone.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                placeholder="UPI Reference No. / 12-digit UTR (Optional)"
                value={manualUtr}
                onChange={(e) => setManualUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                className="flex-1 rounded-xl border border-input bg-[#EFEBE9] px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
              <button
                onClick={() =>
                  verifyAndRecordPayment({
                    provider: 'upi_intent',
                    upiRefId: manualUtr || undefined,
                  })
                }
                disabled={processingPayment}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-safe px-5 py-2.5 text-xs font-bold text-white hover:bg-safe/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {processingPayment ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Confirm Payment & Send SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Verified Receipt & SMS Status */}
      {step === 'verified' && completedTxn && (
        <div className="glass rounded-3xl border border-safe/30 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-safe/10 border border-safe/30 text-safe">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="text-2xl font-bold font-display">Payment Verified Successfully</h2>
            <p className="text-xs text-muted-foreground">
              Transfer cleared by payment switch and recorded in database.
            </p>
          </div>

          {/* Amount Callout */}
          <div className="text-center py-4 bg-background/50 rounded-2xl border border-border">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Amount Transferred
            </span>
            <span className="text-3xl font-bold font-mono text-foreground block mt-1">
              ₹{completedTxn.amount.toFixed(2)}
            </span>
          </div>

          {/* Transaction Metadata */}
          <div className="divide-y divide-border/40 text-xs">
            <div className="flex justify-between py-2.5">
              <span className="text-muted-foreground">Receiver UPI ID</span>
              <span className="font-mono font-semibold">{completedTxn.payee_vpa}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono">{completedTxn.id}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-muted-foreground">UPI Ref No. (UTR)</span>
              <span className="font-mono">{completedTxn.upi_ref_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-muted-foreground">Pre-Payment Risk Score</span>
              <span className="font-mono text-safe font-semibold">
                {completedTxn.risk_score}/100 (Safe)
              </span>
            </div>
            <div className="flex justify-between py-2.5 items-center">
              <span className="text-muted-foreground">Provider Verification</span>
              <VerificationBadge status={completedTxn.verification_status} />
            </div>
            <div className="flex justify-between py-2.5 items-center">
              <span className="text-muted-foreground">Real-Time SMS Alert</span>
              <SmsStatusBadge
                status={completedTxn.sms_status}
                mobile={completedTxn.sms_sent_to}
              />
            </div>
          </div>

          {/* MSG91 Notice */}
          <div className="rounded-2xl border border-border bg-background/40 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-secondary" /> MSG91 Cellular SMS Notice
              </span>
              <button
                onClick={onOpenConfig}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                View SMS Logs
              </button>
            </div>
            <p className="text-muted-foreground text-[11px]">
              {completedTxn.sms_status === 'delivered' || completedTxn.sms_status === 'sent'
                ? `SMS notification successfully transmitted to verified number +91 ${completedTxn.sms_sent_to}.`
                : completedTxn.sms_status === 'pending_config'
                ? 'SMS is queued. To dispatch actual SMS over cellular towers, configure MSG91_AUTH_KEY in server secrets.'
                : 'SMS dispatch completed according to profile preferences.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 rounded-xl bg-primary py-3 px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors text-center shadow-sm cursor-pointer"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => onNavigate('transactions')}
              className="rounded-xl border border-border bg-card py-3 px-4 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-2xs cursor-pointer"
            >
              View History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
