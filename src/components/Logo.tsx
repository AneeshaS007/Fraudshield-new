import { ShieldCheck } from 'lucide-react';

interface LogoProps {
  compact?: boolean;
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-glow">
        <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          Fraud<span className="text-secondary">Shield</span>
        </span>
      )}
    </span>
  );
}
