import {
  RiskAnalysis,
  SystemStatus,
  Transaction,
  UserProfile,
  SmsLogEntry,
  FraudReport,
  SmsConfig,
} from './types';

export const api = {
  async getStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async evaluateRisk(payload: {
    payeeVpa: string;
    payeeName?: string;
    amount?: number;
    note?: string;
    deviceId?: string;
  }): Promise<RiskAnalysis> {
    const res = await fetch('/api/risk/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to evaluate risk');
    }
    return res.json();
  },

  async createPaymentOrder(payload: {
    payeeVpa: string;
    payeeName?: string;
    amount: number;
    note?: string;
    riskScore?: number;
  }): Promise<{
    success: boolean;
    mode: 'razorpay' | 'upi_intent';
    orderId?: string;
    amount: number;
    currency: string;
    keyId?: string | null;
    upiUri?: string;
    txnId: string;
    message?: string;
  }> {
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initiate payment');
    }
    return res.json();
  },

  async verifyPayment(payload: {
    txnId?: string;
    payeeVpa: string;
    payeeName?: string;
    amount: number;
    note?: string;
    status: 'successful' | 'failed';
    provider: 'razorpay' | 'upi_intent' | 'cashfree' | 'manual';
    providerOrderId?: string;
    providerPaymentId?: string;
    providerSignature?: string;
    upiRefId?: string;
    riskScore?: number;
    riskTier?: string;
  }): Promise<{
    success: boolean;
    transaction: Transaction;
    sms: {
      status: 'delivered' | 'sent' | 'pending_config' | 'failed' | 'skipped';
      sentTo?: string;
      messageId?: string;
    };
  }> {
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Payment verification failed');
    }
    return res.json();
  },

  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch('/api/transactions');
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async getTransactionById(id: string): Promise<Transaction> {
    const res = await fetch(`/api/transactions/${id}`);
    if (!res.ok) throw new Error('Transaction not found');
    return res.json();
  },

  async getProfile(): Promise<UserProfile> {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; profile: UserProfile }> {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  async sendTestSms(phone?: string): Promise<{
    success: boolean;
    status: 'delivered' | 'sent' | 'pending_config' | 'failed';
    messageId?: string;
    error?: string;
  }> {
    const res = await fetch('/api/sms/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  async getSmsLogs(): Promise<{ logs: SmsLogEntry[] }> {
    const res = await fetch('/api/sms/history');
    if (!res.ok) throw new Error('Failed to fetch SMS logs');
    return res.json();
  },

  async getReports(): Promise<FraudReport[]> {
    const res = await fetch('/api/reports');
    if (!res.ok) throw new Error('Failed to fetch fraud reports');
    return res.json();
  },

  async getSmsConfig(): Promise<SmsConfig> {
    const res = await fetch('/api/sms/config');
    if (!res.ok) throw new Error('Failed to load SMS configuration');
    return res.json();
  },

  async updateSmsConfig(config: Partial<SmsConfig>): Promise<{ success: boolean; config: SmsConfig }> {
    const res = await fetch('/api/sms/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update SMS configuration');
    }
    return res.json();
  },

  async submitReport(data: {
    vpa: string;
    phone?: string;
    payee_name?: string;
    category: string;
    description: string;
    amount_lost?: number;
  }): Promise<{ success: boolean; report: FraudReport }> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit report');
    }
    return res.json();
  },
};
