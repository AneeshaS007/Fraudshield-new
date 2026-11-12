import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { Transaction } from '../lib/types';
import { StatusBadge, VerificationBadge, SmsStatusBadge } from '../components/StatusBadge';

interface TransactionDetailPageProps {
  id: string;
  onBack: () => void;
  onOpenConfig: () => void;
}

export function TransactionDetailPage({
  id,
  onBack,
  onOpenConfig,
}: TransactionDetailPageProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  async function loadTransaction() {
    setLoading(true);
    try {
      const data = await api.getTransactionById(id);
      setTransaction(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" /> Loading transaction details...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="mx-auto max-w-lg glass rounded-3xl p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Transaction not found or has been archived.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to History
        </button>
      </div>
    );
  }

  const isSuccess = transaction.status === 'successful';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" /> Back to History
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer shadow-2xs"
        >
          <Printer className="h-3.5 w-3.5" /> Print Receipt
        </button>
      </div>

      {/* Main Receipt Card */}
      <div className="glass rounded-3xl border border-glass-border p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2 border-b border-border/50 pb-6">
          <span
            className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl border ${
              isSuccess
                ? 'border-safe/30 bg-safe/10 text-safe'
                : 'border-high/30 bg-high/10 text-high'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
          </span>
          <h2 className="text-xl font-bold font-display">
            {isSuccess ? 'Payment Successful' : 'Payment Failed / Rejected'}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <StatusBadge status={transaction.status} />
            <VerificationBadge status={transaction.verification_status} />
          </div>
        </div>

        {/* Transfer Amount */}
        <div className="text-center py-4 bg-[#EFEBE9] rounded-2xl border border-[#A1887F]/40 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#62554e]">
            Total Amount
          </span>
          <span className="text-3xl font-bold font-mono text-[#302824] block mt-1">
            ₹{transaction.amount.toFixed(2)}
          </span>
        </div>

        {/* Breakdown Items */}
        <div className="divide-y divide-[#8D6E63]/20 text-xs text-[#302824]">
          <div className="flex justify-between py-3">
            <span className="text-[#62554e]">Receiver Name</span>
            <span className="font-semibold text-[#302824]">{transaction.payee_name || 'UPI Payee'}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-[#62554e]">Payee UPI ID (VPA)</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-semibold text-[#302824]">{transaction.payee_vpa}</span>
              <button
                onClick={() => handleCopy(transaction.payee_vpa, 'vpa')}
                className="text-[#8D6E63] hover:text-[#302824] p-1"
                title="Copy VPA"
              >
                {copiedField === 'vpa' ? <Check className="h-3 w-3 text-safe" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-[#62554e]">Transaction ID</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#302824]">{transaction.id}</span>
              <button
                onClick={() => handleCopy(transaction.id, 'id')}
                className="text-[#8D6E63] hover:text-[#302824] p-1"
                title="Copy Txn ID"
              >
                {copiedField === 'id' ? <Check className="h-3 w-3 text-safe" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {transaction.upi_ref_id && (
            <div className="flex justify-between items-center py-3">
              <span className="text-[#62554e]">UPI Reference / UTR</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-[#302824]">{transaction.upi_ref_id}</span>
                <button
                  onClick={() => handleCopy(transaction.upi_ref_id!, 'utr')}
                  className="text-[#8D6E63] hover:text-[#302824] p-1"
                  title="Copy UTR"
                >
                  {copiedField === 'utr' ? <Check className="h-3 w-3 text-safe" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between py-3">
            <span className="text-[#62554e]">Payment Provider</span>
            <span className="capitalize font-medium text-[#302824]">
              {transaction.provider === 'upi_intent'
                ? 'UPI App Intent (NPCI)'
                : transaction.provider === 'razorpay'
                ? 'Razorpay Gateway'
                : transaction.provider}
            </span>
          </div>

          <div className="flex justify-between py-3">
            <span className="text-[#62554e]">Date & Time</span>
            <span className="font-mono text-[#302824]">
              {new Date(transaction.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          {transaction.note && (
            <div className="flex justify-between py-3">
              <span className="text-[#62554e]">Payment Note</span>
              <span className="text-[#302824]">{transaction.note}</span>
            </div>
          )}
        </div>

        {/* Pre-Payment AI Risk Assessment Recap */}
        <div className="rounded-2xl border border-[#A1887F]/40 bg-[#EFEBE9] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#302824] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#8D6E63]" /> Pre-Payment Risk Assessment
            </span>
            <span className="text-xs font-mono font-bold text-[#8D6E63]">
              Score: {transaction.risk_score}/100 ({transaction.risk_tier.toUpperCase()})
            </span>
          </div>
          <p className="text-[11px] text-[#554740]">
            Screened for social engineering keywords, community fraud blacklist records, and payee velocity
            before authorization.
          </p>
        </div>

        {/* SMS Delivery Notice Box */}
        <div className="rounded-2xl border border-[#8D6E63]/40 bg-[#EFEBE9] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8D6E63] flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" /> MSG91 Cellular SMS Tracking
            </span>
            <SmsStatusBadge
              status={transaction.sms_status}
              mobile={transaction.sms_sent_to}
            />
          </div>
          <p className="text-[11px] text-[#302824]">
            {transaction.sms_status === 'delivered' || transaction.sms_status === 'sent'
              ? `Real-time payment confirmation SMS sent to verified mobile number +91 ${transaction.sms_sent_to}. Message ID: ${transaction.sms_message_id || 'msg91_logged'}.`
              : transaction.sms_status === 'pending_config'
              ? 'SMS dispatch queued. MSG91_AUTH_KEY is pending in server secrets.'
              : 'SMS notifications were not dispatched according to profile preferences.'}
          </p>
          <button
            onClick={onOpenConfig}
            className="text-[11px] font-bold text-[#8D6E63] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Check Integration Hub & Secrets <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
