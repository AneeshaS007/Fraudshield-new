export const UPI_VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.]{1,64}$/;
export const MAX_UPI_AMOUNT = 500000; // NPCI standard limit ₹5 Lakhs

export const SCAM_KEYWORDS = [
  'refund',
  'kyc',
  'lottery',
  'prize',
  'reward',
  'cashback',
  'customer care',
  'customercare',
  'helpdesk',
  'verify account',
  'electricity bill',
  'blocked',
  'won',
  'lucky draw',
  'telecom block',
  'part time job',
  'crypto double',
  'customs clearance'
];

export function normalizeVpa(vpa: string): string {
  return vpa.trim().toLowerCase();
}

export function isValidVpa(vpa: string): boolean {
  return UPI_VPA_REGEX.test(vpa.trim());
}

export function sanitizePhoneNumber(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  const clean =
    digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;

  return /^[6-9]\d{9}$/.test(clean) ? clean : null;
}

export function detectScamKeywords(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return SCAM_KEYWORDS.filter((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i').test(lower);
  });
}

export interface ParsedUpiData {
  pa: string; // Payee address (VPA)
  pn?: string; // Payee name
  am?: string; // Amount
  cu?: string; // Currency
  tn?: string; // Transaction note
  tr?: string; // Transaction reference
  mc?: string; // Merchant code
}

export function parseUpiUri(rawUri: string): ParsedUpiData | null {
  try {
    let clean = rawUri.trim();
    if (!clean.startsWith('upi://pay') && !clean.startsWith('upi://')) {
      // Check if it's EMVCo QR code string
      if (clean.startsWith('000201')) {
        return parseEmvCoQr(clean);
      }
      // Check if it's plain VPA
      if (isValidVpa(clean)) {
        return { pa: clean };
      }
      return null;
    }

    const queryIndex = clean.indexOf('?');
    if (queryIndex === -1) return null;

    const queryString = clean.substring(queryIndex + 1);
    const params = new URLSearchParams(queryString);

    const pa = params.get('pa');
    if (!pa || !isValidVpa(pa)) return null;

    return {
      pa: normalizeVpa(pa),
      pn: params.get('pn') || undefined,
      am: params.get('am') || undefined,
      cu: params.get('cu') || 'INR',
      tn: params.get('tn') || undefined,
      tr: params.get('tr') || undefined,
      mc: params.get('mc') || undefined,
    };
  } catch {
    return null;
  }
}

function parseEmvCoTlv(raw: string): Map<string, string> | null {
  const result = new Map<string, string>();
  let idx = 0;
  while (idx < raw.length) {
    if (idx + 4 > raw.length) return null;
    const tag = raw.slice(idx, idx + 2);
    const len = Number(raw.slice(idx + 2, idx + 4));
    if (!/^\d{2}$/.test(tag) || isNaN(len)) return null;
    const val = raw.slice(idx + 4, idx + 4 + len);
    if (val.length !== len) return null;
    result.set(tag, val);
    idx += 4 + len;
  }
  return result;
}

export function parseEmvCoQr(qrContent: string): ParsedUpiData | null {
  const tags = parseEmvCoTlv(qrContent.trim());
  if (!tags) return null;

  // Merchant sub-tag 26-51 usually holds UPI intent
  let upiString: string | null = null;
  for (let i = 26; i <= 51; i++) {
    const key = i.toString().padStart(2, '0');
    const val = tags.get(key);
    if (val && val.includes('upi://')) {
      upiString = val;
      break;
    }
  }

  if (upiString) {
    return parseUpiUri(upiString);
  }

  // Tag 54 is transaction amount, Tag 59 is merchant name
  const name = tags.get('59');
  const amount = tags.get('54');

  for (let i = 26; i <= 51; i++) {
    const key = i.toString().padStart(2, '0');
    const sub = tags.get(key);
    if (sub) {
      const subTags = parseEmvCoTlv(sub);
      if (subTags) {
        const vpa = subTags.get('01') || subTags.get('00');
        if (vpa && isValidVpa(vpa)) {
          return {
            pa: normalizeVpa(vpa),
            pn: name || undefined,
            am: amount || undefined,
            cu: 'INR',
          };
        }
      }
    }
  }

  return null;
}

export function buildUpiIntentUri(options: {
  pa: string;
  pn: string;
  am: number;
  tn?: string;
  tr?: string;
}): string {
  const params = new URLSearchParams();
  params.set('pa', options.pa);
  params.set('pn', options.pn || 'FraudShield Payee');
  params.set('am', options.am.toFixed(2));
  params.set('cu', 'INR');
  if (options.tn) params.set('tn', options.tn);
  if (options.tr) params.set('tr', options.tr);
  return `upi://pay?${params.toString()}`;
}

export function getUpiAppHandoffUrls(uri: string) {
  const encoded = encodeURIComponent(uri.replace(/^upi:\/\/pay\?/, ''));
  return {
    generic: uri,
    gpay: `gpay://upi/pay?${encoded}`,
    phonepe: `phonepe://pay?${encoded}`,
    paytm: `paytmmp://pay?${encoded}`,
    bhim: `bhim://pay?${encoded}`,
    cred: `credpay://upi/pay?${encoded}`,
  };
}
