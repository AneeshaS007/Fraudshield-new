import { CheckCircle2, XCircle, Clock, MessageSquare, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PaymentStatus, VerificationStatus } from '../lib/types';

interface StatusBadgeProps {
  status: PaymentStatus;
}

const statusLabels: Record<PaymentStatus, string> = {
  initiated: 'Initiated',
  pending: 'Pending',
  processing: 'Processing',
  successful: 'Successful',
  failed: 'Failed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const statusStyles: Record<PaymentStatus, string> = {
  successful: 'bg-safe/12 text-safe border-safe/25',
  failed: 'bg-high/12 text-high border-high/25',
  cancelled: 'bg-muted text-muted-foreground border-border',
  expired: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-medium/12 text-medium border-medium/25',
  processing: 'bg-secondary/15 text-secondary border-secondary/30',
  initiated: 'bg-primary/12 text-primary border-primary/25',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const Icon =
    status === 'successful'
      ? CheckCircle2
      : status === 'failed'
      ? XCircle
      : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        statusStyles[status] ?? statusStyles.initiated
      }`}
    >
      <Icon className="h-3 w-3" />
      {statusLabels[status] ?? status}
    </span>
  );
}

export function VerificationBadge({
  status,
  compact = false,
}: {
  status?: VerificationStatus;
  compact?: boolean;
}) {
  if (status === 'provider_verified') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-safe/30 bg-safe/10 px-2.5 py-0.5 text-xs font-medium text-safe">
        <ShieldCheck className="h-3.5 w-3.5" />
        {compact ? 'Verified Provider' : 'Verified by payment provider'}
      </span>
    );
  }

  if (status === 'signature_invalid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-high/30 bg-high/10 px-2.5 py-0.5 text-xs font-medium text-high">
        <AlertTriangle className="h-3.5 w-3.5" />
        Signature Check Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-medium/30 bg-medium/10 px-2.5 py-0.5 text-xs font-medium text-medium">
      <Clock className="h-3.5 w-3.5" />
      {compact ? 'Self-Reported' : 'Reported — Awaiting switch verification'}
    </span>
  );
}

export function SmsStatusBadge({
  status,
  mobile,
}: {
  status?: string;
  mobile?: string;
}) {
  if (status === 'delivered') {
    return (
      <span
        title={mobile ? `Delivered to +91 ${mobile}` : 'Delivered via MSG91'}
        className="inline-flex items-center gap-1 rounded-full border border-safe/25 bg-safe/10 px-2 py-0.5 text-[11px] font-medium text-safe"
      >
        <MessageSquare className="h-3 w-3" />
        SMS Delivered
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2 py-0.5 text-[11px] font-medium text-secondary">
        <MessageSquare className="h-3 w-3" />
        SMS Dispatched
      </span>
    );
  }

  if (status === 'pending_config' || status === 'missing_credentials') {
    return (
      <span
        title="MSG91_AUTH_KEY is not configured in backend environment"
        className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
      >
        <MessageSquare className="h-3 w-3 text-amber-600" />
        SMS API Missing
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span
        title="SMS transmission rejected or failed"
        className="inline-flex items-center gap-1 rounded-full border border-high/25 bg-high/10 px-2 py-0.5 text-[11px] font-semibold text-high"
      >
        <MessageSquare className="h-3 w-3" />
        SMS Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <MessageSquare className="h-3 w-3" />
      SMS Skipped
    </span>
  );
}
