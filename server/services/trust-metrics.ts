import { and, desc, eq, isNotNull, ne, inArray } from 'drizzle-orm';
import { db } from '../db';
import { botEvaluationRuns, botEvaluationTrades, trades, signalLedger, signalAdjudication } from '@shared/schema';

/**
 * Trust metrics that back the marketplace's credibility surface:
 *  - Evaluation attempt counts (anti "spin up many bots, promote the lucky one").
 *  - Live-vs-evaluation divergence (flag bots whose real performance drifts from the
 *    evaluation that got them listed, so subscribers are warned/auto-protected).
 *
 * Decoupled from storage.ts — queries the DB directly, like the signal ledger.
 */

// Divergence thresholds.
const MIN_LIVE_TRADES = 8; // need enough live history before judging
const WINRATE_DROP_DIVERGING = 0.1; // 10 pts below eval win rate
const WINRATE_DROP_SEVERE = 0.2; // 20 pts below eval win rate

export interface EvaluationAttempts {
  totalAttempts: number;
  failed: number;
  passed: number;
  active: number;
}

export async function getEvaluationAttempts(botId: string): Promise<EvaluationAttempts> {
  const runs = await db
    .select({ status: botEvaluationRuns.status })
    .from(botEvaluationRuns)
    .where(eq(botEvaluationRuns.botId, botId));

  return {
    totalAttempts: runs.length,
    failed: runs.filter((r) => r.status === 'failed').length,
    passed: runs.filter((r) => r.status === 'completed').length,
    active: runs.filter((r) => r.status === 'active').length,
  };
}

interface EvalBaseline {
  tradeCount: number;
  cumulativeReturnPct: number;
  expectancyPct: number; // per-trade
  maxDrawdownPct: number;
  winRate: number; // 0..1
  completedAt: Date | null;
}

async function getEvalBaseline(botId: string): Promise<EvalBaseline | null> {
  const [run] = await db
    .select()
    .from(botEvaluationRuns)
    .where(and(eq(botEvaluationRuns.botId, botId), eq(botEvaluationRuns.status, 'completed')))
    .orderBy(desc(botEvaluationRuns.completedAt))
    .limit(1);

  if (!run) return null;

  const exitTrades = await db
    .select({ realizedPnl: botEvaluationTrades.realizedPnl })
    .from(botEvaluationTrades)
    .where(
      and(
        eq(botEvaluationTrades.evaluationRunId, run.id),
        eq(botEvaluationTrades.legType, 'exit'),
        isNotNull(botEvaluationTrades.realizedPnl),
      ),
    );

  const wins = exitTrades.filter((t) => parseFloat(t.realizedPnl as string) > 0).length;
  const winRate = exitTrades.length > 0 ? wins / exitTrades.length : 0;
  const tradeCount = run.tradeCount;
  const cumulativeReturnPct = parseFloat(run.cumulativeReturnPct);

  return {
    tradeCount,
    cumulativeReturnPct,
    expectancyPct: tradeCount > 0 ? cumulativeReturnPct / tradeCount : 0,
    maxDrawdownPct: parseFloat(run.maxDrawdownPct),
    winRate,
    completedAt: run.completedAt,
  };
}

interface LiveStats {
  closedTrades: number;
  winRate: number; // 0..1
  avgPnl: number; // average realized pnl ($) per closed trade
}

async function getLiveStats(botId: string): Promise<LiveStats> {
  const closed = await db
    .select({ pnl: trades.pnl })
    .from(trades)
    .where(and(eq(trades.botId, botId), isNotNull(trades.pnl)));

  const pnls = closed.map((t) => parseFloat(t.pnl as string));
  const wins = pnls.filter((p) => p > 0).length;
  return {
    closedTrades: pnls.length,
    winRate: pnls.length > 0 ? wins / pnls.length : 0,
    avgPnl: pnls.length > 0 ? pnls.reduce((a, b) => a + b, 0) / pnls.length : 0,
  };
}

export type DivergenceStatus =
  | 'no_baseline'
  | 'insufficient_data'
  | 'aligned'
  | 'diverging'
  | 'severe';

export interface DivergenceReport {
  status: DivergenceStatus;
  message: string;
  eval?: { winRate: number; expectancyPct: number; maxDrawdownPct: number; tradeCount: number };
  live?: { winRate: number; avgPnl: number; closedTrades: number };
  winRateDrop?: number; // eval - live (pts, 0..1)
}

export async function computeDivergence(botId: string): Promise<DivergenceReport> {
  const baseline = await getEvalBaseline(botId);
  if (!baseline) {
    return { status: 'no_baseline', message: 'No completed evaluation to compare against yet.' };
  }

  const live = await getLiveStats(botId);
  const evalSummary = {
    winRate: baseline.winRate,
    expectancyPct: baseline.expectancyPct,
    maxDrawdownPct: baseline.maxDrawdownPct,
    tradeCount: baseline.tradeCount,
  };

  if (live.closedTrades < MIN_LIVE_TRADES) {
    return {
      status: 'insufficient_data',
      message: `Only ${live.closedTrades} live trade(s) so far — need ${MIN_LIVE_TRADES} to assess divergence.`,
      eval: evalSummary,
      live: { winRate: live.winRate, avgPnl: live.avgPnl, closedTrades: live.closedTrades },
    };
  }

  const winRateDrop = baseline.winRate - live.winRate;
  const liveTurnedNegative = baseline.expectancyPct > 0 && live.avgPnl < 0;

  let status: DivergenceStatus = 'aligned';
  let message = 'Live performance is tracking its evaluation.';
  if (winRateDrop >= WINRATE_DROP_SEVERE || liveTurnedNegative) {
    status = 'severe';
    message = 'Live performance is significantly below evaluation.';
  } else if (winRateDrop >= WINRATE_DROP_DIVERGING) {
    status = 'diverging';
    message = 'Live performance is drifting below evaluation.';
  }

  return {
    status,
    message,
    eval: evalSummary,
    live: { winRate: live.winRate, avgPnl: live.avgPnl, closedTrades: live.closedTrades },
    winRateDrop,
  };
}

export type VerificationTier = 'executed' | 'market_verified' | 'signal_only' | 'none';

export interface Verification {
  tier: VerificationTier;
  executedTrades: number;   // real broker fills (exchange != mock)
  adjudicatedClosed: number; // signals the platform resolved against its own feed
  signals: number;           // total ledger signals
}

/**
 * Verification tier — how un-fakeable a bot's live record is:
 *   executed        → backed by REAL broker fills (the exchange is the witness)
 *   market_verified → platform adjudicated fills/outcomes vs an independent feed
 *   signal_only     → tamper-proof signals exist, but no resolved outcomes yet
 *   none            → backtest baseline only, no live signals
 */
export async function getVerificationTier(botId: string): Promise<Verification> {
  const [executed, adjClosed, sigs] = await Promise.all([
    db.select({ id: trades.id }).from(trades).where(and(eq(trades.botId, botId), ne(trades.exchange, 'mock'))),
    db.select({ id: signalAdjudication.id }).from(signalAdjudication).where(and(eq(signalAdjudication.botId, botId), inArray(signalAdjudication.status, ['won', 'lost', 'expired']))),
    db.select({ id: signalLedger.id }).from(signalLedger).where(eq(signalLedger.botId, botId)),
  ]);
  const v: Verification = {
    tier: 'none', executedTrades: executed.length, adjudicatedClosed: adjClosed.length, signals: sigs.length,
  };
  if (executed.length > 0) v.tier = 'executed';
  else if (adjClosed.length > 0) v.tier = 'market_verified';
  else if (sigs.length > 0) v.tier = 'signal_only';
  return v;
}

export interface TrustSummary {
  attempts: EvaluationAttempts;
  divergence: DivergenceReport;
  verification: Verification;
}

export async function getTrustSummary(botId: string): Promise<TrustSummary> {
  const [attempts, divergence, verification] = await Promise.all([
    getEvaluationAttempts(botId),
    computeDivergence(botId),
    getVerificationTier(botId),
  ]);
  return { attempts, divergence, verification };
}
