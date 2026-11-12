import { useState, useEffect } from 'react';
import {
  Siren,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { FraudReport } from '../lib/types';
import { isValidVpa } from '../lib/upi';

interface ReportPageProps {
  onNavigate: (page: any) => void;
}

export function ReportPage({ onNavigate }: ReportPageProps) {
  const [vpa, setVpa] = useState('');
  const [phone, setPhone] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [category, setCategory] = useState<string>('refund_scam');
  const [description, setDescription] = useState('');
  const [amountLost, setAmountLost] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successReport, setSuccessReport] = useState<FraudReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<FraudReport[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await api.getReports();
      setRecentReports(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidVpa(vpa)) {
      setError('Please enter a valid fraudulent UPI ID (e.g. scammer@bank).');
      return;
    }

    if (!description.trim() || description.length < 10) {
      setError('Please provide a brief description of how the scam occurred (min 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitReport({
        vpa: vpa.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        payee_name: payeeName.trim() || undefined,
        category,
        description: description.trim(),
        amount_lost: amountLost ? Number(amountLost) : 0,
      });

      setSuccessReport(res.report);
      setVpa('');
      setPhone('');
      setPayeeName('');
      setDescription('');
      setAmountLost('');
      loadReports();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Rich Earth Brown Header Banner Box */}
      <div className="rounded-3xl bg-[#8D6E63] text-white p-6 sm:p-7 space-y-2 shadow-xl border border-[#795B50]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A1887F]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F5F5F5] border border-white/20">
          <Siren className="h-3.5 w-3.5 text-[#EFEBE9]" /> Community Blacklist & Protection
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Report <span className="text-[#D7CCC8]">UPI Fraud & Scam Handles</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#F5F5F5]/90 max-w-xl leading-relaxed">
          Blacklist fraudulent UPI IDs to protect the community. Flagged accounts are immediately blocked across FraudShield risk scans.
        </p>
      </div>

      {/* Cyber Helpline 1930 Callout */}
      <div className="rounded-3xl border border-high/30 bg-high/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-high text-white shrink-0">
            <PhoneCall className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-high font-display">Lost Money in the Last 24 Hours?</h3>
            <p className="text-xs text-foreground/80">
              Call the National Cybercrime Helpline <strong>1930</strong> immediately. Reporting in the Golden Hour can freeze funds before the scammer withdraws.
            </p>
          </div>
        </div>
        <a
          href="tel:1930"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-high px-4 py-2.5 text-xs font-bold text-white hover:bg-high/90 transition-colors shadow-glow"
        >
          <PhoneCall className="h-4 w-4" /> Call 1930 Now
        </a>
      </div>

      {error && (
        <div className="rounded-2xl border border-high/30 bg-high/10 p-4 text-xs text-high flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successReport && (
        <div className="rounded-2xl border border-safe/30 bg-safe/10 p-4 text-xs text-safe space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Scam VPA Blacklisted Successfully
          </div>
          <p className="text-foreground/80">
            UPI ID <strong className="font-mono text-safe">{successReport.vpa}</strong> has been added to the threat database. All users will now receive high-risk alerts before sending money.
          </p>
        </div>
      )}

      {/* Report Form */}
      <form onSubmit={handleSubmit} className="glass rounded-3xl border border-glass-border p-6 sm:p-8 space-y-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Scam UPI ID (VPA) <span className="text-high">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. lottery.win99@ybl"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              required
              className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Scammer Mobile Number (If known)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9811223344"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Display Name on UPI
              </label>
              <input
                type="text"
                placeholder="e.g. Electricity Bill Desk"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Scam Category <span className="text-high">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-3 py-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="refund_scam">Electricity Bill / Refund / Customer Care</option>
                <option value="lottery_scam">Lottery / Prize / Cashback Scam</option>
                <option value="impersonation">Friend / Police / CBI Impersonation</option>
                <option value="fake_merchant">Fake Shopping Site / Non-Delivery</option>
                <option value="phishing">Fake QR / Malicious Payment Request</option>
                <option value="other">Other UPI Fraud</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Amount Lost (₹ INR, if any)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amountLost}
                onChange={(e) => setAmountLost(e.target.value)}
                className="w-full rounded-2xl border border-input bg-[#EFEBE9] px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Incident Details & Modus Operandi <span className="text-high">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe how the scam occurred, what the caller promised or threatened, and payment instructions given..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-2xl border border-input bg-[#EFEBE9] p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-high py-3.5 px-6 text-xs font-bold text-white shadow-glow hover:bg-high/90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Submitting Threat Intelligence...
            </>
          ) : (
            <>
              <Siren className="h-4 w-4" /> Submit Report & Blacklist VPA
            </>
          )}
        </button>
      </form>

      {/* Community Threat Blacklist Feed */}
      <div className="glass rounded-3xl border border-glass-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-display flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-high" /> Live Blacklisted UPI Handles ({recentReports.length})
          </h3>
          <span className="text-[10px] text-muted-foreground">Community & Cyber cell feed</span>
        </div>

        <div className="divide-y divide-border/40 text-xs">
          {recentReports.map((report) => (
            <div key={report.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-high">{report.vpa}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-foreground/80 text-[11px]">{report.description}</p>
              {report.amount_lost ? (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Reported loss: ₹{report.amount_lost.toLocaleString('en-IN')}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
