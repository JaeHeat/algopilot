import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import { bots, botEvaluationRuns, botEvaluationTrades, botSettings } from '@shared/schema';

/**
 * AlgoScore + risk classification.
 *
 * Philosophy (matches the project's anti-overfit ethos): rank on RISK-ADJUSTED return,
 * DISCOUNTED BY STATISTICAL CONFIDENCE — never on win rate or raw returns. A great Sharpe on
 * 12 trades is noise; the same on 400 trades across regimes is an edge. Confidence weighting is
 * what keeps small-sample / speedrun bots off the top by construction.
 *
 * Every bot is measured on the SAME standardized $10k evaluation simulation, so scores are
 * comparable across bots. (Real subscriber fills are surfaced separately as live-vs-eval
 * divergence in trust-metrics.ts.) Risk tier is DERIVED from realized behavior — not the
 * creator's self-declared level, which they'd understate.
 */

export type RiskTier = 'low' | 'moderate' | 'high' | 'extreme';

export interface BotMetrics {
  botId: string;
  trades: number;
  totalReturnPct: number;
  maxDrawdownPct: number;
  expectancyPct: number; // mean return per trade (%)
  winRate: number; // 0..1, fraction of trades with positive return
  sharpe: number; // per-trade
  sortino: number; // per-trade, downside-only
  calmar: number; // totalReturn / maxDrawdown
  tStat: number; // significance of the edge (mean/std * sqrt(n))
  confidence: number; // 0..1, from sample size
  algoScore: number; // 0..100 composite, confidence-weighted
  riskTier: RiskTier;
  riskFactors: string[];
  equityCurve: number[]; // standardized equity, indexed to 100 at start (for sparklines)
  rated: boolean; // false when there isn't enough data to rate
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function stdev(xs: number[], mu: number): number {
  if (xs.length < 2) return 0;
  return Math.sqrt(xs.reduce((a, x) => a + (x - mu) ** 2, 0) / xs.length);
}

function downsideDev(xs: number[]): number {
  if (!xs.length) return 0;
  return Math.sqrt(xs.reduce((a, x) => a + Math.min(0, x) ** 2, 0) / xs.length);
}

const CONFIDENCE_FULL_AT = 50; // trades needed for full statistical confidence

function classifyRisk(params: {
  maxDrawdownPct: number;
  worstLossPct: number;
  volPct: number;
  leverage: number;
  assetClass: string;
}): { tier: RiskTier; factors: string[] } {
  const { maxDrawdownPct, worstLossPct, volPct, leverage, assetClass } = params;
  const order: RiskTier[] = ['low', 'moderate', 'high', 'extreme'];
  const idx = (t: RiskTier) => order.indexOf(t);
  let tier: RiskTier = 'low';
  const factors: string[] = [];
  const bump = (to: RiskTier, why: string) => {
    if (idx(to) > idx(tier)) tier = to;
    factors.push(why);
  };

  // Max drawdown is the headline risk.
  if (maxDrawdownPct > 30) bump('extreme', `max drawdown ${maxDrawdownPct.toFixed(1)}%`);
  else if (maxDrawdownPct > 15) bump('high', `max drawdown ${maxDrawdownPct.toFixed(1)}%`);
  else if (maxDrawdownPct > 5) bump('moderate', `max drawdown ${maxDrawdownPct.toFixed(1)}%`);

  // Leverage is structural risk regardless of past results.
  if (leverage > 10) bump('extreme', `${leverage}x leverage`);
  else if (leverage > 5) bump('high', `${leverage}x leverage`);
  else if (leverage > 2) bump('moderate', `${leverage}x leverage`);

  // A fat single-trade loss signals tail risk.
  if (worstLossPct > 15) bump('extreme', `worst loss ${worstLossPct.toFixed(1)}%`);
  else if (worstLossPct > 8) bump('high', `worst loss ${worstLossPct.toFixed(1)}%`);

  // Return volatility.
  if (volPct > 8) bump('high', `high volatility`);
  else if (volPct > 4) bump('moderate', `moderate volatility`);

  // Crypto carries more structural risk than cash equities (perps, 24/7, gaps).
  if (assetClass === 'crypto' && idx(tier) < idx('high')) {
    factors.push('crypto market');
  }

  return { tier, factors: Array.from(new Set(factors)).slice(0, 4) };
}

function computeFromSeries(
  botId: string,
  returns: number[], // per-trade returns as fractions (e.g. 0.012 = +1.2%)
  run: { totalReturnPct: number; maxDrawdownPct: number } | null,
  leverage: number,
  assetClass: string,
): BotMetrics {
  const n = returns.length;
  const base: BotMetrics = {
    botId, trades: n, totalReturnPct: 0, maxDrawdownPct: 0, expectancyPct: 0, winRate: 0,
    sharpe: 0, sortino: 0, calmar: 0, tStat: 0, confidence: 0, algoScore: 0,
    riskTier: 'moderate', riskFactors: [], equityCurve: [], rated: false,
  };
  if (n === 0) return base;

  // Standardized equity curve indexed to 100, compounding the per-trade returns (for sparklines).
  const equityCurve: number[] = [100];
  let eq = 100;
  for (const r of returns) { eq = eq * (1 + r); equityCurve.push(round2(eq)); }

  const mu = mean(returns);
  const sd = stdev(returns, mu);
  const dd = downsideDev(returns);
  const totalReturnPct = run ? run.totalReturnPct : returns.reduce((a, b) => a + b, 0) * 100;
  const maxDrawdownPct = run ? run.maxDrawdownPct : 0;
  const worstLossPct = Math.abs(Math.min(0, ...returns)) * 100;
  const volPct = sd * 100;

  const sharpe = sd > 0 ? mu / sd : 0;
  const sortino = dd > 0 ? mu / dd : (mu > 0 ? sharpe : 0);
  const calmar = maxDrawdownPct > 0.01 ? totalReturnPct / maxDrawdownPct : 0;
  const tStat = sd > 0 ? (mu / sd) * Math.sqrt(n) : 0;
  const confidence = Math.min(1, n / CONFIDENCE_FULL_AT);

  // Composite: bounded risk-adjusted core (Sortino + clamped Calmar), confidence-weighted.
  const riskAdjusted = 0.6 * Math.max(0, sortino) + 0.4 * Math.max(0, Math.min(calmar, 5));
  const algoScore = Math.round(100 * (1 - Math.exp(-riskAdjusted / 2)) * confidence);

  const { tier, factors } = classifyRisk({ maxDrawdownPct, worstLossPct, volPct, leverage, assetClass });

  return {
    botId, trades: n,
    totalReturnPct: round2(totalReturnPct),
    maxDrawdownPct: round2(maxDrawdownPct),
    expectancyPct: round2(mu * 100),
    winRate: round2(returns.filter((r) => r > 0).length / n),
    sharpe: round2(sharpe),
    sortino: round2(sortino),
    calmar: round2(calmar),
    tStat: round2(tStat),
    confidence: round2(confidence),
    algoScore,
    riskTier: tier,
    riskFactors: factors,
    equityCurve,
    rated: true,
  };
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Compute metrics for many bots in a handful of bulk queries (cheap to rank the whole marketplace). */
export async function computeBotMetricsBatch(botIds: string[]): Promise<Map<string, BotMetrics>> {
  const result = new Map<string, BotMetrics>();
  if (botIds.length === 0) return result;

  // Asset class + leverage per bot.
  const botRows = await db.select({ id: bots.id, assetClass: bots.assetClass }).from(bots).where(inArray(bots.id, botIds));
  const settingRows = await db.select({ botId: botSettings.botId, leverage: botSettings.leverage }).from(botSettings).where(inArray(botSettings.botId, botIds));
  const leverageByBot = new Map(settingRows.map((s) => [s.botId, s.leverage]));
  const assetByBot = new Map(botRows.map((b) => [b.id, b.assetClass]));

  // Representative run per bot: prefer a completed run, else active, else most recent.
  const runs = await db
    .select({
      id: botEvaluationRuns.id, botId: botEvaluationRuns.botId, status: botEvaluationRuns.status,
      startedAt: botEvaluationRuns.startedAt, startingBalance: botEvaluationRuns.startingBalance,
      cumulativeReturnPct: botEvaluationRuns.cumulativeReturnPct, maxDrawdownPct: botEvaluationRuns.maxDrawdownPct,
    })
    .from(botEvaluationRuns)
    .where(inArray(botEvaluationRuns.botId, botIds));

  const rank = (s: string) => (s === 'completed' ? 3 : s === 'active' ? 2 : 1);
  const repRunByBot = new Map<string, typeof runs[number]>();
  for (const r of runs) {
    const cur = repRunByBot.get(r.botId);
    if (!cur || rank(r.status) > rank(cur.status) ||
        (rank(r.status) === rank(cur.status) && new Date(r.startedAt).getTime() > new Date(cur.startedAt).getTime())) {
      repRunByBot.set(r.botId, r);
    }
  }

  const repRunIds = Array.from(repRunByBot.values()).map((r) => r.id);
  const exitByRun = new Map<string, number[]>();
  if (repRunIds.length) {
    const exits = await db
      .select({ runId: botEvaluationTrades.evaluationRunId, realizedPnl: botEvaluationTrades.realizedPnl })
      .from(botEvaluationTrades)
      .where(and(inArray(botEvaluationTrades.evaluationRunId, repRunIds), eq(botEvaluationTrades.legType, 'exit'), isNotNull(botEvaluationTrades.realizedPnl)))
      .orderBy(asc(botEvaluationTrades.executedAt));
    for (const e of exits) {
      const arr = exitByRun.get(e.runId) ?? [];
      arr.push(parseFloat(e.realizedPnl as string));
      exitByRun.set(e.runId, arr);
    }
  }

  for (const botId of botIds) {
    const run = repRunByBot.get(botId);
    const leverage = leverageByBot.get(botId) ?? 1;
    const assetClass = assetByBot.get(botId) ?? 'crypto';
    if (!run) {
      result.set(botId, computeFromSeries(botId, [], null, leverage, assetClass));
      continue;
    }
    const startingBalance = parseFloat(run.startingBalance) || 10000;
    const returns = (exitByRun.get(run.id) ?? []).map((pnl) => pnl / startingBalance);
    result.set(
      botId,
      computeFromSeries(
        botId, returns,
        { totalReturnPct: parseFloat(run.cumulativeReturnPct), maxDrawdownPct: parseFloat(run.maxDrawdownPct) },
        leverage, assetClass,
      ),
    );
  }

  return result;
}

export async function computeBotMetrics(botId: string): Promise<BotMetrics> {
  const m = await computeBotMetricsBatch([botId]);
  return m.get(botId)!;
}
