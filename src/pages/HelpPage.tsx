import { useState } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  FileText,
  LifeBuoy,
} from 'lucide-react';

export function HelpPage() {
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const steps = [
    {
      title: '1. Call 1930 National Cyber Helpline (Immediate)',
      desc: 'Dial 1930 within the first 2–4 hours (the Golden Hour). The Citizen Financial Cyber Fraud Reporting System can trigger an automated freeze on the fraudster’s bank account across 200+ partner banks and wallets.',
      badge: 'Golden Hour Critical',
      tone: 'text-high border-high/30 bg-high/10',
    },
    {
      title: '2. Contact Your Bank to Block UPI & Debit Card',
      desc: 'Call your bank’s toll-free emergency fraud helpline. Request an immediate temporary block on your net banking, UPI services, and card to prevent further unauthorized deductions.',
      badge: 'Account Safety',
      tone: 'text-medium border-medium/30 bg-medium/10',
    },
    {
      title: '3. Lodge Formal Complaint on National Cybercrime Portal',
      desc: 'File a formal complaint on https://cybercrime.gov.in. Upload bank statements, UPI UTR numbers, scammer phone numbers, and WhatsApp/SMS screenshots as evidence.',
      badge: 'Official FIR',
      tone: 'text-secondary border-secondary/30 bg-secondary/10',
    },
    {
      title: '4. Register Bank Dispute (Chargeback Request)',
      desc: 'Submit a written dispute form at your bank branch with your police complaint acknowledgment number to claim reversal under RBI unauthorized electronic banking transaction guidelines.',
      badge: 'Fund Recovery',
      tone: 'text-safe border-safe/30 bg-safe/10',
    },
  ];

  const bankComplaintSample = `Subject: Urgent Complaint Regarding Unauthorized Fraudulent UPI Transfer - Freeze Request

Dear Branch Manager,

I am writing to report a fraudulent UPI transaction from my Account Number: [YOUR_ACCOUNT_NO].

Transaction Details:
- Date & Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
- Amount: INR [AMOUNT]
- Payee UPI ID (VPA): [SCAMMER_VPA]
- UPI Transaction ID / UTR: [12-DIGIT_UTR]
- National Cyber Helpline 1930 Complaint Ref: [1930_ACK_NO]

As per RBI circular on Customer Protection (Limiting Liability of Customers in Unauthorized Electronic Banking Transactions), I request you to immediately recall this transaction and communicate with the beneficiary bank switch to freeze the funds.

Sincerely,
[YOUR_NAME]
Mobile: [YOUR_PHONE]`;

  function copySample() {
    navigator.clipboard.writeText(bankComplaintSample);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Title Hero */}
      <div className="bg-[#8D6E63] text-white rounded-3xl p-6 sm:p-8 border border-[#795B50] shadow-lg space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Fraud Emergency & Cyber Assistance
        </h1>
        <p className="text-xs sm:text-sm text-stone-200">
          Critical steps to freeze funds and recover money if you or someone you know was targeted by a UPI scam.
        </p>
      </div>

      {/* Main 1930 Helpline Card */}
      <div className="bg-[#D7CCC8] rounded-3xl border border-[#8D6E63]/40 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#8D6E63] text-white shrink-0 shadow-md">
              <PhoneCall className="h-8 w-8" />
            </span>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#8D6E63]">
                <Clock className="h-3 w-3" /> 24x7 Government Helpline
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-[#302824]">
                Dial 1930
              </h2>
              <p className="text-xs text-[#62554e]">
                National Cybercrime Reporting Portal (Ministry of Home Affairs)
              </p>
            </div>
          </div>

          <a
            href="tel:1930"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8D6E63] px-6 py-3.5 text-xs font-bold text-white hover:bg-[#795B50] transition-all shadow-md"
          >
            <PhoneCall className="h-4 w-4" /> Call 1930
          </a>
        </div>

        <div className="border-t border-[#8D6E63]/20 pt-4 flex flex-wrap gap-4 text-xs">
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noreferrer"
            className="text-[#8D6E63] hover:underline inline-flex items-center gap-1 font-bold"
          >
            cybercrime.gov.in Portal <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://cms.rbi.org.in"
            target="_blank"
            rel="noreferrer"
            className="text-[#554740] hover:text-[#302824] inline-flex items-center gap-1 font-medium"
          >
            RBI Ombudsman Portal <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 4 Step Action Plan */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#62554e]">
          Immediate 4-Step Recovery Checklist:
        </h3>
        <div className="grid gap-3">
          {steps.map((st, i) => (
            <div
              key={i}
              className="bg-[#D7CCC8] rounded-2xl border border-[#8D6E63]/30 p-4 sm:p-5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#302824]">
                  {st.title}
                </span>
                <span
                  className="inline-flex items-center rounded-full border border-[#8D6E63]/30 bg-[#EFEBE9] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#8D6E63]"
                >
                  {st.badge}
                </span>
              </div>
              <p className="text-xs text-[#554740] leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Copy Bank Letter Template */}
      <div className="bg-[#D7CCC8] rounded-3xl border border-[#8D6E63]/30 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[#302824] flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#8D6E63]" /> Bank Grievance Letter Template
            </h4>
            <p className="text-[11px] text-[#62554e]">
              Copy this standard format to submit to your branch manager with your 1930 acknowledgment.
            </p>
          </div>
          <button
            onClick={copySample}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#8D6E63]/30 bg-[#8D6E63] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#795B50] transition-colors cursor-pointer shadow-2xs"
          >
            {copiedTemplate ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-300" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Letter
              </>
            )}
          </button>
        </div>

        <pre className="rounded-2xl border border-[#A1887F]/30 bg-[#EFEBE9] p-4 text-[11px] font-mono text-[#302824] overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-2xs">
          {bankComplaintSample}
        </pre>
      </div>

      {/* Golden Rules of UPI Safety */}
      <div className="rounded-3xl border border-[#8D6E63]/40 bg-[#EFEBE9] p-6 space-y-3 shadow-2xs">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8D6E63] flex items-center gap-1.5">
          <Lock className="h-4 w-4" /> 3 Golden Rules of UPI Safety
        </span>
        <ul className="text-xs space-y-2 text-[#302824]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#8D6E63] shrink-0 mt-0.5" />
            <span>
              <strong>UPI PIN is only needed to SEND money, never to receive.</strong> If someone asks you to enter your PIN or scan a QR to receive a refund or lottery prize, it is 100% a scam.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#8D6E63] shrink-0 mt-0.5" />
            <span>
              <strong>Never install screen-sharing apps</strong> (e.g., AnyDesk, TeamViewer, RustDesk) at the request of anyone claiming to be bank or electricity officials.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#8D6E63] shrink-0 mt-0.5" />
            <span>
              <strong>Always verify the receiver's name on FraudShield</strong> before transferring money. If the name differs from who you expect, stop immediately.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
