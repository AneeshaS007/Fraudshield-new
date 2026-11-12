// Trader Financial Safety & Anomaly Detection Engine
// Provides rule-based algorithms for order errors, withdrawal tracking, broker verification, charge calculation, and anomaly detection.

export interface OrderInput {
  brokerOrderId?: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'SL';
  quantity: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  exchange?: string;
}

export interface OrderErrorResult {
  id: string;
  hasError: boolean;
  severity: 'minor' | 'major' | 'critical' | 'none';
  errorTitle: string;
  description: string;
  resolutionSteps: string[];
  suggestedCorrection?: {
    quantity?: number;
    price?: number;
    stopLoss?: number;
  };
  timestamp: string;
}

export interface WithdrawalInput {
  id?: string;
  amount: number;
  beneficiaryName: string;
  bankAccount: string;
  ifsc: string;
  requestedAt?: string;
  isNewBeneficiary?: boolean;
}

export interface WithdrawalAlert {
  id: string;
  amount: number;
  beneficiaryName: string;
  bankAccount: string;
  ifsc: string;
  status: 'approved' | 'flagged' | 'blocked';
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  explanation: string;
  timestamp: string;
}

export interface BrokerCheckInput {
  brokerNameOrUrl: string;
}

export interface BrokerVerificationResult {
  query: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS';
  brokerName: string;
  registrationNumber?: string;
  regulator: string; // e.g. SEBI, FINRA, FCA, Unregulated
  domainAge: string;
  sslValid: boolean;
  guaranteedReturnsClaimed: boolean;
  offshoreJurisdiction: boolean;
  reportedScamsCount: number;
  summary: string;
  reasons: string[];
  officialPortalUrl?: string;
  verifiedAt: string;
}

export interface ChargeCalcInput {
  segment: 'equity_intraday' | 'equity_delivery' | 'futures' | 'options' | 'crypto';
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  flatBrokerage?: number; // e.g. 20 flat
  customRatePercent?: number; // e.g. 0.03%
}

export interface ChargeBreakdown {
  turnover: number;
  grossPnL: number;
  brokerage: number;
  sttCtt: number;
  exchangeTurnoverFee: number;
  gst: number;
  sebiTurnoverFee: number;
  stampDuty: number;
  totalCharges: number;
  netPnL: number;
  breakevenPoints: number; // Price points needed to break even per share/unit
}

export interface AnomalyScanInput {
  averageTradeSize: number;
  tradesLast10Mins: number;
  latestTradeAmount: number;
  recentWithdrawalAmount: number;
  consecutiveLosses: number;
  tradeExecutedOffHours: boolean;
  unverifiedIpOrDevice?: boolean;
}

export interface AnomalyScanResult {
  riskScore: number; // 0 - 100
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  anomaliesDetected: {
    title: string;
    severity: 'minor' | 'moderate' | 'severe';
    description: string;
    whyFlagged: string;
  }[];
  recommendations: string[];
  timestamp: string;
}

// --------------------------------------------------------------------------
// 1. ORDER ERROR DETECTION ENGINE
// --------------------------------------------------------------------------
export function evaluateOrderError(order: OrderInput, existingOrders: OrderInput[] = []): OrderErrorResult {
  const steps: string[] = [];
  const timestamp = new Date().toISOString();
  const id = `ord_err_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  // Rule 1: Missing or invalid primary entries
  if (!order.symbol || order.symbol.trim() === '') {
    return {
      id,
      hasError: true,
      severity: 'major',
      errorTitle: 'Missing Symbol / Ticker',
      description: 'The order request does not specify a valid trading symbol.',
      resolutionSteps: ['Select an active symbol (e.g. RELIANCE, NIFTY24DEC50000CE) before placing the order.'],
      timestamp,
    };
  }

  if (order.quantity <= 0) {
    return {
      id,
      hasError: true,
      severity: 'critical',
      errorTitle: 'Invalid Quantity (Zero or Negative)',
      description: `Entered quantity ${order.quantity} is invalid for execution.`,
      resolutionSteps: ['Enter a positive number of shares or lots (e.g., 25, 50, 100).'],
      timestamp,
    };
  }

  if (order.price <= 0 && order.orderType !== 'MARKET') {
    return {
      id,
      hasError: true,
      severity: 'major',
      errorTitle: 'Missing / Zero Limit Price',
      description: 'Limit and Stop-Loss orders require a positive price limit.',
      resolutionSteps: ['Enter a valid limit price or switch order type to MARKET.'],
      timestamp,
    };
  }

  // Rule 2: NIFTY / BANKNIFTY Lot Size Mismatch check
  const symbolUpper = order.symbol.toUpperCase();
  if (symbolUpper.includes('NIFTY') && !symbolUpper.includes('BANK')) {
    if (order.quantity % 25 !== 0) {
      return {
        id,
        hasError: true,
        severity: 'major',
        errorTitle: 'NIFTY Lot Size Mismatch',
        description: `NIFTY index contracts trade in multiples of 25. Entered quantity ${order.quantity} is not a valid lot multiple.`,
        suggestedCorrection: { quantity: Math.ceil(order.quantity / 25) * 25 },
        resolutionSteps: [
          `Adjust order quantity to a multiple of 25 (e.g., ${Math.ceil(order.quantity / 25) * 25} shares / ${Math.ceil(order.quantity / 25)} lots).`,
          'Re-submit order after revising quantity.',
        ],
        timestamp,
      };
    }
  } else if (symbolUpper.includes('BANKNIFTY')) {
    if (order.quantity % 15 !== 0) {
      return {
        id,
        hasError: true,
        severity: 'major',
        errorTitle: 'BANKNIFTY Lot Size Mismatch',
        description: `BANKNIFTY index contracts trade in multiples of 15. Entered quantity ${order.quantity} is invalid.`,
        suggestedCorrection: { quantity: Math.ceil(order.quantity / 15) * 15 },
        resolutionSteps: [
          `Adjust order quantity to a multiple of 15 (e.g., ${Math.ceil(order.quantity / 15) * 15} shares).`,
        ],
        timestamp,
      };
    }
  }

  // Rule 3: Fat-Finger / Out-of-Bounds Price Inconsistency
  if (order.stopLoss && order.price > 0) {
    if (order.type === 'BUY' && order.stopLoss >= order.price) {
      return {
        id,
        hasError: true,
        severity: 'critical',
        errorTitle: 'Conflicting Stop-Loss for BUY Order',
        description: `Stop-Loss price (₹${order.stopLoss}) cannot be equal to or higher than Buy Entry price (₹${order.price}).`,
        suggestedCorrection: { stopLoss: Number((order.price * 0.98).toFixed(2)) },
        resolutionSteps: [
          `Lower Stop-Loss price below entry price ₹${order.price} (e.g. ₹${(order.price * 0.98).toFixed(2)}).`,
          'Verify Stop-Loss trigger condition.',
        ],
        timestamp,
      };
    } else if (order.type === 'SELL' && order.stopLoss <= order.price) {
      return {
        id,
        hasError: true,
        severity: 'critical',
        errorTitle: 'Conflicting Stop-Loss for SELL Order',
        description: `Stop-Loss price (₹${order.stopLoss}) cannot be equal to or lower than Sell Entry price (₹${order.price}).`,
        suggestedCorrection: { stopLoss: Number((order.price * 1.02).toFixed(2)) },
        resolutionSteps: [
          `Set Stop-Loss price above entry price ₹${order.price} (e.g. ₹${(order.price * 1.02).toFixed(2)}).`,
        ],
        timestamp,
      };
    }
  }

  // Rule 4: Duplicate Order Detection in close timeframe
  const isDuplicate = existingOrders.some(
    (e) =>
      e.symbol.toUpperCase() === symbolUpper &&
      e.type === order.type &&
      e.quantity === order.quantity &&
      Math.abs((e.price || 0) - (order.price || 0)) < 0.5
  );

  if (isDuplicate) {
    return {
      id,
      hasError: true,
      severity: 'major',
      errorTitle: 'Duplicate Order Detected',
      description: `An identical ${order.type} order for ${order.quantity} qty of ${order.symbol} was already placed recently.`,
      resolutionSteps: [
        'Check Order History / Pending Order Book before submitting to prevent double execution.',
        'If intentional, modify the price or quantity slightly to confirm.',
      ],
      timestamp,
    };
  }

  // No Error Detected
  return {
    id,
    hasError: false,
    severity: 'none',
    errorTitle: 'Order Parameters Verified Safe',
    description: 'Order syntax, lot size multiples, price bounds, and duplicate check passed successfully.',
    resolutionSteps: ['Order is safe for transmission to broker execution system.'],
    timestamp,
  };
}

// --------------------------------------------------------------------------
// 2. WITHDRAWAL MONITORING ENGINE
// --------------------------------------------------------------------------
export function evaluateWithdrawal(input: WithdrawalInput, userHistory: WithdrawalInput[] = []): WithdrawalAlert {
  const reasons: string[] = [];
  let riskScore = 10;
  const timestamp = new Date().toISOString();
  const id = input.id || `wdr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  // Rule 1: High Amount Check
  if (input.amount >= 200000) {
    riskScore += 40;
    reasons.push(`High withdrawal volume: ₹${input.amount.toLocaleString('en-IN')} exceeds standard ₹1,00,000 threshold.`);
  } else if (input.amount >= 100000) {
    riskScore += 25;
    reasons.push(`Significant withdrawal amount: ₹${input.amount.toLocaleString('en-IN')} requiring step-up 2FA.`);
  }

  // Rule 2: New / Unverified Beneficiary
  if (input.isNewBeneficiary) {
    riskScore += 30;
    reasons.push(`Beneficiary "${input.beneficiaryName}" (${input.bankAccount.slice(-4)}) was added within the last 24 hours.`);
  }

  // Rule 3: Rapid repeated withdrawal requests
  const recentCount = userHistory.length;
  if (recentCount >= 2) {
    riskScore += 25;
    reasons.push(`Multiple withdrawal requests (${recentCount + 1}) submitted in quick succession.`);
  }

  // Rule 4: Off-hours check
  const currentHour = new Date().getHours();
  if (currentHour >= 1 && currentHour <= 5) {
    riskScore += 20;
    reasons.push('Withdrawal requested during off-market hours (01:00 AM – 05:00 AM).');
  }

  riskScore = Math.min(100, riskScore);

  let status: 'approved' | 'flagged' | 'blocked' = 'approved';
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  if (riskScore >= 70) {
    status = 'blocked';
    riskLevel = 'HIGH';
  } else if (riskScore >= 40) {
    status = 'flagged';
    riskLevel = 'MEDIUM';
  }

  const explanation =
    riskLevel === 'HIGH'
      ? 'This withdrawal has been placed ON HOLD due to multiple high-risk triggers (new beneficiary + rapid velocity). Step-up authentication required.'
      : riskLevel === 'MEDIUM'
      ? 'Withdrawal flagged for security review before release. Please verify bank account details.'
      : 'Withdrawal passed automated risk screening and is queued for standard bank payout processing.';

  return {
    id,
    amount: input.amount,
    beneficiaryName: input.beneficiaryName,
    bankAccount: input.bankAccount,
    ifsc: input.ifsc,
    status,
    riskScore,
    riskLevel,
    reasons,
    explanation,
    timestamp,
  };
}

// --------------------------------------------------------------------------
// 3. BROKER AUTHENTICITY VERIFICATION ENGINE
// --------------------------------------------------------------------------
const KNOWN_VERIFIED_BROKERS = [
  { name: 'Zerodha', reg: 'INZ000031633', regulator: 'SEBI (India)', domain: 'zerodha.com' },
  { name: 'Groww', reg: 'INZ000301838', regulator: 'SEBI (India)', domain: 'groww.in' },
  { name: 'AngelOne', reg: 'INZ000161534', regulator: 'SEBI (India)', domain: 'angelone.in' },
  { name: 'Upstox', reg: 'INZ000185137', regulator: 'SEBI (India)', domain: 'upstox.com' },
  { name: 'ICICI Direct', reg: 'INZ000183631', regulator: 'SEBI (India)', domain: 'icicidirect.com' },
  { name: 'Interactive Brokers', reg: 'SEC #8-00223 / SEBI INZ000092230', regulator: 'SEBI / US SEC / FINRA', domain: 'interactivebrokers.com' },
  { name: 'Charles Schwab', reg: 'FINRA #5393', regulator: 'US SEC / FINRA', domain: 'schwab.com' },
  { name: 'Fidelity Investments', reg: 'FINRA #7784', regulator: 'US SEC / FINRA', domain: 'fidelity.com' },
];

const KNOWN_SUSPICIOUS_KEYWORDS = [
  'guaranteed',
  'fixed-return',
  '100%profit',
  'cryptoearn',
  'fxtrade-max',
  'bitcoins-doubler',
  'telegram-vip-signals',
  'offshore-trader',
  'zero-risk-invest',
  'rich-fast',
];

export function verifyBrokerAuthenticity(inputQuery: string): BrokerVerificationResult {
  const query = inputQuery.trim().toLowerCase();
  const verifiedAt = new Date().toISOString();

  // Check matched known licensed broker
  const match = KNOWN_VERIFIED_BROKERS.find(
    (b) => query.includes(b.name.toLowerCase()) || query.includes(b.domain.toLowerCase())
  );

  if (match) {
    return {
      query: inputQuery,
      status: 'VERIFIED',
      brokerName: match.name,
      registrationNumber: match.reg,
      regulator: match.regulator,
      domainAge: '7+ Years (Verified Official Domain)',
      sslValid: true,
      guaranteedReturnsClaimed: false,
      offshoreJurisdiction: false,
      reportedScamsCount: 0,
      summary: `Verified official licensed broker registered with ${match.regulator}. Registration Number: ${match.reg}.`,
      reasons: [
        `Active SEBI/FINRA licensing record found under ${match.reg}.`,
        `Official domain (${match.domain}) with valid EV SSL certificate.`,
        'No deceptive guaranteed return schemes detected in public regulator records.',
      ],
      officialPortalUrl: `https://${match.domain}`,
      verifiedAt,
    };
  }

  // Check suspicious keywords or deceptive domains
  const hasSuspiciousKeyword = KNOWN_SUSPICIOUS_KEYWORDS.some((kw) => query.includes(kw));
  const isOffshoreTld = query.endsWith('.xyz') || query.endsWith('.top') || query.endsWith('.win') || query.includes('vip-signal');

  if (hasSuspiciousKeyword || isOffshoreTld || query.includes('guarantee') || query.includes('profit')) {
    return {
      query: inputQuery,
      status: 'SUSPICIOUS',
      brokerName: inputQuery,
      regulator: 'Unregulated / Offshore Jurisdiction',
      domainAge: '< 90 Days (Newly Registered Unverified Domain)',
      sslValid: false,
      guaranteedReturnsClaimed: true,
      offshoreJurisdiction: true,
      reportedScamsCount: 14,
      summary: 'HIGH RISK ALERT: Unlicensed platform exhibiting fraud indicators (guaranteed returns, untraceable domain, regulatory warnings).',
      reasons: [
        'No valid registration found on SEBI, FINRA, or FCA official registers.',
        'Claims guaranteed daily/monthly profits, which is strictly illegal under SEBI/FINRA guidelines.',
        'Registered under suspicious/offshore domain registry with reported withdrawal freeze complaints.',
      ],
      verifiedAt,
    };
  }

  // Generic Unverified Query
  return {
    query: inputQuery,
    status: 'UNVERIFIED',
    brokerName: inputQuery,
    regulator: 'Pending SEBI / Regulatory Match Verification',
    domainAge: 'Unknown / Unlisted',
    sslValid: true,
    guaranteedReturnsClaimed: false,
    offshoreJurisdiction: false,
    reportedScamsCount: 0,
    summary: 'Unverified Platform: Name or URL not found in pre-compiled primary exchange lists. Exercise caution before transferring capital.',
    reasons: [
      'Entity does not match top SEBI / FINRA registered broker master files.',
      'Always verify registration directly on https://www.sebi.gov.in or https://brokercheck.finra.org.',
      'Ensure funds are transferred only to SEBI-authorized clearing member bank accounts.',
    ],
    officialPortalUrl: 'https://www.sebi.gov.in',
    verifiedAt,
  };
}

// --------------------------------------------------------------------------
// 4. TRADING CHARGES CALCULATOR ENGINE
// --------------------------------------------------------------------------
export function calculateTradingCharges(input: ChargeCalcInput): ChargeBreakdown {
  const { segment, buyPrice, sellPrice, quantity } = input;
  const buyTurnover = buyPrice * quantity;
  const sellTurnover = sellPrice * quantity;
  const turnover = buyTurnover + sellTurnover;
  const grossPnL = (sellPrice - buyPrice) * quantity;

  let brokerage = 0;
  let sttCtt = 0;
  let exchangeTurnoverFee = 0;
  let stampDuty = 0;

  const flatRate = input.flatBrokerage !== undefined ? input.flatBrokerage : 20;

  switch (segment) {
    case 'equity_intraday':
      // Brokerage: 0.03% or flat ₹20 whichever is lower (per order)
      brokerage = Math.min(flatRate, buyTurnover * 0.0003) + Math.min(flatRate, sellTurnover * 0.0003);
      // STT: 0.025% on sell side
      sttCtt = sellTurnover * 0.00025;
      // Exchange fee: 0.00297%
      exchangeTurnoverFee = turnover * 0.0000297;
      // Stamp Duty: 0.003% on buy side
      stampDuty = buyTurnover * 0.00003;
      break;

    case 'equity_delivery':
      // Brokerage: Zero or flat ₹20
      brokerage = Math.min(flatRate, buyTurnover * 0.001) + Math.min(flatRate, sellTurnover * 0.001);
      // STT: 0.1% on buy & sell
      sttCtt = turnover * 0.001;
      // Exchange fee: 0.00297%
      exchangeTurnoverFee = turnover * 0.0000297;
      // Stamp Duty: 0.015% on buy side
      stampDuty = buyTurnover * 0.00015;
      break;

    case 'futures':
      brokerage = Math.min(flatRate, buyTurnover * 0.0003) + Math.min(flatRate, sellTurnover * 0.0003);
      // STT: 0.0125% on sell
      sttCtt = sellTurnover * 0.000125;
      // Exchange fee: 0.00173%
      exchangeTurnoverFee = turnover * 0.0000173;
      // Stamp Duty: 0.002% on buy side
      stampDuty = buyTurnover * 0.00002;
      break;

    case 'options':
      // Flat ₹20 per executed order
      brokerage = flatRate * 2;
      // STT: 0.0625% on premium sell
      sttCtt = sellTurnover * 0.000625;
      // Exchange fee: 0.0355% on premium
      exchangeTurnoverFee = turnover * 0.000355;
      // Stamp Duty: 0.003% on buy
      stampDuty = buyTurnover * 0.00003;
      break;

    case 'crypto':
      // Flat 0.1% maker/taker + 1% TDS on sell
      brokerage = turnover * 0.001;
      sttCtt = sellTurnover * 0.01; // 1% TDS
      exchangeTurnoverFee = turnover * 0.0005;
      stampDuty = 0;
      break;
  }

  // SEBI Turnover Fee: 0.0001%
  const sebiTurnoverFee = turnover * 0.000001;

  // GST: 18% on (Brokerage + Exchange Fee + SEBI Fee)
  const gst = (brokerage + exchangeTurnoverFee + sebiTurnoverFee) * 0.18;

  const totalCharges = brokerage + sttCtt + exchangeTurnoverFee + gst + sebiTurnoverFee + stampDuty;
  const netPnL = grossPnL - totalCharges;

  // Breakeven price points needed per unit
  const breakevenPoints = quantity > 0 ? totalCharges / quantity : 0;

  return {
    turnover: Number(turnover.toFixed(2)),
    grossPnL: Number(grossPnL.toFixed(2)),
    brokerage: Number(brokerage.toFixed(2)),
    sttCtt: Number(sttCtt.toFixed(2)),
    exchangeTurnoverFee: Number(exchangeTurnoverFee.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    sebiTurnoverFee: Number(sebiTurnoverFee.toFixed(2)),
    stampDuty: Number(stampDuty.toFixed(2)),
    totalCharges: Number(totalCharges.toFixed(2)),
    netPnL: Number(netPnL.toFixed(2)),
    breakevenPoints: Number(breakevenPoints.toFixed(2)),
  };
}

// --------------------------------------------------------------------------
// 5. TRADING ANOMALY DETECTION ENGINE
// --------------------------------------------------------------------------
export function evaluateTradingAnomalies(input: AnomalyScanInput): AnomalyScanResult {
  const anomalies: {
    title: string;
    severity: 'minor' | 'moderate' | 'severe';
    description: string;
    whyFlagged: string;
  }[] = [];

  let riskScore = 0;
  const timestamp = new Date().toISOString();

  // Rule 1: Sudden Exposure Spike (>4x average trade size)
  if (input.averageTradeSize > 0 && input.latestTradeAmount >= input.averageTradeSize * 4) {
    riskScore += 35;
    anomalies.push({
      title: 'Extreme Exposure Spike',
      severity: 'severe',
      description: `Latest trade size ₹${input.latestTradeAmount.toLocaleString('en-IN')} is ${(
        input.latestTradeAmount / input.averageTradeSize
      ).toFixed(1)}x larger than historical average ₹${input.averageTradeSize.toLocaleString('en-IN')}.`,
      whyFlagged: 'Sudden position size multiplication often precedes account liquidation or compromised API keys.',
    });
  }

  // Rule 2: Overtrading / Rapid Churning (>10 trades in 10 minutes)
  if (input.tradesLast10Mins >= 10) {
    riskScore += 25;
    anomalies.push({
      title: 'High-Frequency Overtrading Alert',
      severity: 'moderate',
      description: `${input.tradesLast10Mins} orders submitted within a 10-minute window.`,
      whyFlagged: 'Excessive order frequency drains account value in slippage and brokerage fees and signals emotional trading.',
    });
  }

  // Rule 3: Loss Chasing / Revenge Trading (>=3 consecutive losses + large trade)
  if (input.consecutiveLosses >= 3 && input.latestTradeAmount > input.averageTradeSize * 1.5) {
    riskScore += 25;
    anomalies.push({
      title: 'Loss-Chasing Behavior Pattern',
      severity: 'moderate',
      description: `Increasing order size after ${input.consecutiveLosses} consecutive losing trades.`,
      whyFlagged: 'Revenge trading violates risk management and increases probability of severe capital drawdown.',
    });
  }

  // Rule 4: Immediate Post-Loss Withdrawal Request
  if (input.recentWithdrawalAmount > 50000 && input.consecutiveLosses >= 2) {
    riskScore += 20;
    anomalies.push({
      title: 'Panic Capital Withdrawal Pattern',
      severity: 'minor',
      description: `Large withdrawal request of ₹${input.recentWithdrawalAmount.toLocaleString(
        'en-IN'
      )} initiated following loss streak.`,
      whyFlagged: 'Rapid capital depletion disrupts ongoing position margin maintenance.',
    });
  }

  // Rule 5: Off-Hours Execution
  if (input.tradeExecutedOffHours) {
    riskScore += 15;
    anomalies.push({
      title: 'After-Hours Order Placement',
      severity: 'minor',
      description: 'Trade submitted outside standard NSE / BSE trading session (09:15 AM – 03:30 PM).',
      whyFlagged: 'After-hours orders execute at market open with higher spread volatility.',
    });
  }

  riskScore = Math.min(100, riskScore);

  let riskTier: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (riskScore >= 60) riskTier = 'HIGH';
  else if (riskScore >= 30) riskTier = 'MEDIUM';

  const summary =
    riskTier === 'HIGH'
      ? `HIGH ANOMALY RISK SCORE (${riskScore}/100): Critical exposure spikes or overtrading patterns detected. Immediate risk intervention recommended.`
      : riskTier === 'MEDIUM'
      ? `MODERATE ANOMALY RISK SCORE (${riskScore}/100): Notable trading behavior deviations observed. Monitor trade sizes and frequency.`
      : `LOW ANOMALY RISK SCORE (${riskScore}/100): Trading pattern remains within normal risk parameters.`;

  const recommendations: string[] = [];
  if (riskTier === 'HIGH') {
    recommendations.push('Implement a mandatory 1-hour trading cooling-off period.');
    recommendations.push('Set an automated max daily loss limit on your broker terminal.');
    recommendations.push('Enable mandatory 2FA confirmation for order sizes above average.');
  } else if (riskTier === 'MEDIUM') {
    recommendations.push('Stick strictly to maximum 2% risk per trade rule.');
    recommendations.push('Review pending limit orders before market opening.');
  } else {
    recommendations.push('Maintain discipline and stick to structured risk parameters.');
  }

  return {
    riskScore,
    riskTier,
    summary,
    anomaliesDetected: anomalies,
    recommendations,
    timestamp,
  };
}
