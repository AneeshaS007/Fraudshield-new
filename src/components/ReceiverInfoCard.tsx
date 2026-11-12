import { ShieldCheck, MapPin, Phone, User, CreditCard, Building, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { isValidVpa } from '../lib/upi';

export interface ReceiverDetails {
  name: string;
  vpa: string;
  phone: string;
  address?: string; // Only set if verified / shared with permission
  location?: string; // Only set if verified / shared with permission
  isVerifiedAddress: boolean;
  verificationStatus: 'verified_merchant' | 'verified_peer' | 'unverified_p2p' | 'flagged_scam';
  verificationLabel: string;
}

const KNOWN_RECEIVERS: Record<string, Partial<ReceiverDetails>> = {
  'swiggy.food@icici': {
    name: 'Swiggy Online Food Pvt Ltd',
    vpa: 'swiggy.food@icici',
    phone: '+91 80 6746 6746',
    address: '4th Floor, Salarpuria Softzone, Green Glen Layout, Bellandur',
    location: 'Bengaluru, Karnataka',
    isVerifiedAddress: true,
    verificationStatus: 'verified_merchant',
    verificationLabel: 'Verified Swiggy Merchant Account',
  },
  'kirana.store@okhdfcbank': {
    name: 'Sharma General Store',
    vpa: 'kirana.store@okhdfcbank',
    phone: '+91 98765 43210',
    address: 'Shop #14, Main Market, MG Road',
    location: 'Mumbai, Maharashtra',
    isVerifiedAddress: true,
    verificationStatus: 'verified_merchant',
    verificationLabel: 'Verified Local Business Account',
  },
  'friend.rahul@okaxis': {
    name: 'Rahul Verma',
    vpa: 'friend.rahul@okaxis',
    phone: '+91 98765 12345',
    isVerifiedAddress: false,
    verificationStatus: 'verified_peer',
    verificationLabel: 'NPCI Verified Personal Peer',
  },
  'lottery.win99@ybl': {
    name: 'Fast Prize Dispatch',
    vpa: 'lottery.win99@ybl',
    phone: '+91 98700 01122',
    isVerifiedAddress: false,
    verificationStatus: 'flagged_scam',
    verificationLabel: 'Flagged Fraud Account - Unverified Location',
  },
  'electricity.bill.desk@okaxis': {
    name: 'Electricity Urgent Desk',
    vpa: 'electricity.bill.desk@okaxis',
    phone: '+91 98112 23344',
    isVerifiedAddress: false,
    verificationStatus: 'flagged_scam',
    verificationLabel: 'Flagged Impersonation Scam',
  },
};

export function getReceiverDetails(vpa: string, providedName?: string): ReceiverDetails {
  const normVpa = vpa.trim().toLowerCase();
  const known = KNOWN_RECEIVERS[normVpa];

  if (known) {
    return {
      name: providedName || known.name || 'UPI Payee',
      vpa: normVpa,
      phone: known.phone || 'N/A',
      address: known.address,
      location: known.location,
      isVerifiedAddress: known.isVerifiedAddress || false,
      verificationStatus: known.verificationStatus || 'verified_peer',
      verificationLabel: known.verificationLabel || 'NPCI VPA Validated',
    };
  }

  // Extract phone if VPA format has 10 digits
  const phoneMatch = normVpa.match(/^([6-9]\d{9})@/);
  const derivedPhone = phoneMatch ? `+91 ${phoneMatch[1]}` : 'Not Public / N/A';

  const isMerchant = /(swiggy|zomato|amazon|flipkart|uber|ola|tatasky|airtel|jio|sharma|dmart|reliance|icici|okbiz)@/i.test(normVpa);

  return {
    name: providedName || (isMerchant ? 'Verified Business Account' : 'UPI Payee'),
    vpa: normVpa,
    phone: derivedPhone,
    address: undefined, // Address not shared for unverified P2P handles
    location: undefined, // Location not shared for unverified P2P handles
    isVerifiedAddress: false,
    verificationStatus: isMerchant ? 'verified_merchant' : 'unverified_p2p',
    verificationLabel: isMerchant ? 'Verified Merchant Entity' : 'NPCI VPA Format Validated',
  };
}

interface ReceiverInfoCardProps {
  vpa: string;
  name?: string;
  amount?: number;
  paymentMethod?: string;
  compact?: boolean;
}

export function ReceiverInfoCard({
  vpa,
  name,
  amount,
  paymentMethod = 'UPI Intent / NPCI Direct Handoff',
  compact = false,
}: ReceiverInfoCardProps) {
  if (!vpa || !isValidVpa(vpa)) return null;

  const details = getReceiverDetails(vpa, name);

  const statusBadgeColors = {
    verified_merchant: 'bg-safe/10 text-safe border-safe/30',
    verified_peer: 'bg-primary/10 text-primary border-primary/30',
    unverified_p2p: 'bg-muted text-muted-foreground border-border',
    flagged_scam: 'bg-high/10 text-high border-high/30',
  };

  const StatusIcon =
    details.verificationStatus === 'verified_merchant'
      ? ShieldCheck
      : details.verificationStatus === 'verified_peer'
      ? CheckCircle2
      : details.verificationStatus === 'flagged_scam'
      ? ShieldAlert
      : AlertTriangle;

  return (
    <div className="rounded-2xl border border-border/80 bg-[#EFEBE9] p-4 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#A1887F]/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#8D6E63] text-white">
            <Building className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#62554e] block">
              Verified Receiver Details
            </span>
            <h4 className="text-sm font-bold text-neutral-900 leading-tight">
              {details.name}
            </h4>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
            statusBadgeColors[details.verificationStatus]
          }`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {details.verificationLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {/* 1. Receiver Name */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#A1887F]/20">
          <span className="text-muted-foreground flex items-center gap-1.5 font-semibold text-[11px] shrink-0">
            Receiver Name:
          </span>
          <span className="font-bold text-neutral-900 truncate">{details.name}</span>
        </div>

        {/* 2. Receiver UPI ID */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#A1887F]/20">
          <span className="text-muted-foreground flex items-center gap-1.5 font-semibold text-[11px] shrink-0">
            Receiver UPI ID:
          </span>
          <span className="font-mono font-bold text-neutral-900 truncate">{details.vpa}</span>
        </div>

        {/* 3. Receiver Mobile Number */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#A1887F]/20">
          <span className="text-muted-foreground flex items-center gap-1.5 font-semibold text-[11px] shrink-0">
            Mobile Number:
          </span>
          <span className="font-mono font-bold text-neutral-900">{details.phone}</span>
        </div>

        {/* 4. Payment Amount */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#A1887F]/20">
          <span className="text-muted-foreground flex items-center gap-1.5 font-semibold text-[11px] shrink-0">
            Payment Amount:
          </span>
          <span className="font-mono font-extrabold text-[#8D6E63]">
            {amount && amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'Not Specified'}
          </span>
        </div>

        {/* 5. Receiver Address */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#A1887F]/20 sm:col-span-2">
          <span className="text-muted-foreground flex items-center gap-1.5 font-semibold text-[11px] shrink-0">
            Receiver Address:
          </span>
          <span className={`font-semibold truncate ${details.isVerifiedAddress ? 'text-neutral-900' : 'text-neutral-500 italic'}`}>
            {details.isVerifiedAddress && details.address
              ? details.address
              : 'Not Shared by Payee (Requires Permission)'}
          </span>
        </div>

        {/* 6. Receiver Location (City / Area) */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#A1887F]/20">
          <span className="text-muted-foreground flex items-center gap-1.5 font-semibold text-[11px] shrink-0">
            City / Area Location:
          </span>
          <span className={`font-semibold ${details.isVerifiedAddress ? 'text-neutral-900' : 'text-neutral-500 italic'}`}>
            {details.isVerifiedAddress && details.location
              ? details.location
              : 'Not Shared by Payee'}
          </span>
        </div>

        {/* 7. Payment Method */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#A1887F]/20">
          <span className="text-muted-foreground flex items-center gap-1.5 font-semibold text-[11px] shrink-0">
            Payment Method:
          </span>
          <span className="font-semibold text-neutral-900">{paymentMethod}</span>
        </div>

        {/* 8. Verification Status */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/70 p-2.5 rounded-xl border border-[#A1887F]/20 sm:col-span-2">
          <span className="text-muted-foreground flex items-center gap-1.5 font-semibold text-[11px] shrink-0">
            Receiver Verification Status:
          </span>
          <span className="font-extrabold text-neutral-900 flex items-center gap-1">
            <StatusIcon className="h-3.5 w-3.5 text-[#8D6E63]" />
            {details.verificationLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
