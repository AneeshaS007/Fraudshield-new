export type RiskTier = 'safe' | 'medium' | 'high';

export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'expired';

export type VerificationStatus =
  | 'provider_verified'
  | 'user_reported'
  | 'unverified'
  | 'signature_invalid';

export interface RiskAnalysis {
  score: number; // 0 to 100
  tier: RiskTier;
  summary: string;
  reasons: string[];
  factors: {
    scamKeywordFound: boolean;
    suspiciousKeywords: string[];
    vpaFormatValid: boolean;
    reportedFraudCount: number;
    amountRisk: 'normal' | 'unusual' | 'extreme';
    velocityFlag: boolean;
    providerRiskScore: number;
    accountAgeDays?: number;
    verifiedMerchant: boolean;
  };
  recommendation: 'proceed' | 'caution' | 'block';
  aiExplanation?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  payee_vpa: string;
  payee_name: string;
  amount: number;
  note?: string;
  status: PaymentStatus;
  provider: 'razorpay' | 'upi_intent' | 'cashfree' | 'manual';
  provider_order_id?: string;
  provider_payment_id?: string;
  provider_signature?: string;
  upi_ref_id?: string; // UTR or RRN
  verification_status: VerificationStatus;
  risk_score: number;
  risk_tier: RiskTier;
  risk_factors?: string[];
  sms_status: 'delivered' | 'sent' | 'pending' | 'failed' | 'skipped' | 'pending_config';
  sms_message_id?: string;
  sms_sent_to?: string;
  created_at: string;
  verified_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string; // 10 digit verified mobile number
  phone_verified: boolean;
  sms_notifications: boolean;
  sms_payment_success: boolean;
  sms_payment_failure: boolean;
  sms_fraud_alert: boolean;
  created_at: string;
}

export interface SmsLogEntry {
  id: string;
  timestamp: string;
  mobile: string;
  type: 'payment_success' | 'payment_failure' | 'fraud_alert' | 'test';
  status: 'delivered' | 'sent' | 'failed' | 'pending_config';
  messageId?: string;
  textSnippet: string;
  error?: string;
  provider: 'MSG91';
}

export interface SystemStatus {
  model: {
    online: boolean;
    testAuc: number;
    name: string;
    trainingDataset?: string;
  };
  sms: {
    connected: boolean;
    senderId: string;
    provider: 'MSG91' | string;
    configured: boolean;
    hasFlows: {
      paymentSuccess: boolean;
      paymentFailure: boolean;
      fraudAlert: boolean;
    };
  };
  razorpay: {
    connected: boolean;
    keyId: string | null;
    provider: string;
  };
  database: {
    connected: boolean;
    provider: string;
  };
}

export interface FraudReport {
  id: string;
  vpa: string;
  phone?: string;
  payee_name?: string;
  category: 'impersonation' | 'fake_merchant' | 'refund_scam' | 'phishing' | 'lottery_scam' | 'other';
  description: string;
  amount_lost?: number;
  reporter_id?: string;
  created_at: string;
}

export interface SmsConfig {
  authKey?: string;
  authKeyMasked?: string;
  senderId?: string;
  flowPaymentSuccess?: string;
  flowPaymentFailure?: string;
  flowFraudAlert?: string;
  provider?: 'MSG91' | 'FAST2SMS' | 'CUSTOM' | 'msg91' | 'fast2sms' | 'custom';
  customWebhookUrl?: string;
  isConfigured?: boolean;
  hasEnvKey?: boolean;
  setupMessage?: string;
  missingReason?: string;
}

