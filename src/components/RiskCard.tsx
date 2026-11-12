import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { RiskAnalysis } from '../lib/types';

interface RiskCardProps {
  analysis: RiskAnalysis;
  onProceed?: () => void;
  onCancel?: () => void;
  proceedLabel?: string;
  showActions?: boolean;
}

export function RiskCard({
  analysis,
  onProceed,
  onCancel,
  proceedLabel = 'Proceed to Payment',
  showActions = true,
}: RiskCardProps) {
  const { score, tier, summary, reasons, factors, recommendation } = analysis;

  const isSafe = tier === 'safe';
  const isMedium = tier === 'medium';
  const isHigh = tier === 'high';

  const tierColors = {
    safe: 'text-safe border-safe/30 bg-safe/10',
    medium: 'text-medium border-medium/30 bg-medium/10',
    high: 'text-high border-high/30 bg-high/10',
  };

  const badgeLabels = {
    safe: 'LOW RISK · VERIFIED SAFE',
    medium: 'MEDIUM RISK · CAUTION ADVISED',
    high: 'HIGH RISK · FRAUD DETECTED',
  };

  const Icon = isSafe ? ShieldCheck : isMedium ? AlertTriangle : ShieldAlert;

  return (
    <div className="glass overflow-hidden rounded-3xl border border-glass-border p-6 sm:p-7 space-y-6">
      {/* Top Header with Score and Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-4">
          <div
            className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${tierColors[tier]}`}
          >
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${tierColors[tier]}`}
            >
              {badgeLabels[tier]}
            </span>
            <h3 className="mt-1 text-xl font-semibold font-display">
              {isSafe ? 'Secure to Transfer' : isMedium ? 'Proceed with Care' : 'Do Not Transfer Money'}
            </h3>
          </div>
        </div>

        {/* Score Ring Display */}
        <div className="flex items-baseline gap-1.5 self-start sm:self-auto rounded-2xl bg-[#EFEBE9] border border-[#A1887F]/40 px-4 py-2 shadow-2xs">
          <span className="text-xs uppercase tracking-wider text-[#62554e] font-bold">Risk Score</span>
          <span
            className={`text-2xl font-bold font-mono ${
              isSafe ? 'text-safe' : isMedium ? 'text-medium' : 'text-high'
            }`}
          >
            {score}
          </span>
          <span className="text-xs text-[#62554e] font-mono font-semibold">/ 100</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm sm:text-base text-[#302824] font-medium leading-relaxed">{summary}</p>

      {/* Risk Factors Checklist */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#62554e]">
          Risk Assessment Factors
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-[#EFEBE9] border border-[#A1887F]/30 p-2.5 text-xs text-[#302824] shadow-2xs">
            {factors.reportedFraudCount === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-safe shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-high shrink-0" />
            )}
            <span className="font-medium">
              {factors.reportedFraudCount === 0
                ? '0 fraud reports on cyber portal'
                : `${factors.reportedFraudCount} reports registered against VPA`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-[#EFEBE9] border border-[#A1887F]/30 p-2.5 text-xs text-[#302824] shadow-2xs">
            {!factors.scamKeywordFound ? (
              <CheckCircle2 className="h-4 w-4 text-safe shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-high shrink-0" />
            )}
            <span className="font-medium">
              {!factors.scamKeywordFound
                ? 'No social engineering scam keywords'
                : `Contains keyword: "${factors.suspiciousKeywords.join(', ')}"`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-[#EFEBE9] border border-[#A1887F]/30 p-2.5 text-xs text-[#302824] shadow-2xs">
            {factors.amountRisk === 'normal' ? (
              <CheckCircle2 className="h-4 w-4 text-safe shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-medium shrink-0" />
            )}
            <span className="font-medium">
              {factors.amountRisk === 'normal'
                ? 'Amount within regular peer limits'
                : 'High-value transfer alert triggered'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-[#EFEBE9] border border-[#A1887F]/30 p-2.5 text-xs text-[#302824] shadow-2xs">
            {factors.verifiedMerchant ? (
              <CheckCircle2 className="h-4 w-4 text-safe shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#8D6E63] shrink-0" />
            )}
            <span className="font-medium">
              {factors.verifiedMerchant
                ? 'Recognized authorized merchant entity'
                : 'Standard peer VPA structure validated'}
            </span>
          </div>
        </div>
      </div>

      {/* Plain Language Reasons */}
      {reasons.length > 0 && (
        <div className="rounded-2xl border border-[#A1887F]/40 bg-[#EFEBE9] p-3.5 space-y-1.5 shadow-2xs">
          <span className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">
            Analysis Insights:
          </span>
          <ul className="text-xs text-[#302824] space-y-1 list-disc list-inside font-medium">
            {reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {onProceed && (
            <button
              onClick={onProceed}
              className={`flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl py-3 px-5 text-sm font-bold transition-all shadow-glow cursor-pointer ${
                isHigh
                  ? 'bg-high hover:bg-high/90 text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {proceedLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card py-3 px-5 text-sm font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer shadow-2xs"
            >
              Cancel Transfer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
