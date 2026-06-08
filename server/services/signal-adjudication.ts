import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { signalAdjudication, type SignalAdjudication } from '@shared/schema';
import { PriceFetcher } from './price-fetcher';

/**
 * Platform-side signal adjudication.
 *
 * The creator sends INTENT (symbol, side, entry, stop, target). This engine — using an
 * INDEPENDENT price feed the creator can't control — decides whether the entry actually
 * filled and how it resolved. The creator never reports win/loss.
 *
 *   pending  -> entry not yet reached
 *   filled   -> entry reached; trade open
 *   won      -> target hit first
 *   lost     -> stop hit first
 *   expired  -> open past the trade window; closed at market
 *   missed   -> entry never reached within the fill window (THE anti-gaming case:
 *               "price ran away, it never actually filled" -> NOT counted as a win)
 *   invalid  -> not enough info to adjudicate (no usable stop/entry)
 */

const FILL_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;   // entry must be reached within 3 days
const TRADE_WINDOW_MS = 21 * 24 * 60 * 60 * 1000; // open trade auto-resolves after 21 days

export function normalizeSide(action?: string | null, side?: string | null): 'long' | 'short' | null {
  const a = (action || '').toLowerCase();
  const s = (side || '').toLowerCase();
  if (s === 'long' || s === 'short') return s;
  if (a === 'buy' || a === 'long') return 'long';
  if (a === 'sell' || a === 'short') return 'short';
  return null; // 'entry'/'exit'/unknown without a side -> not adjudicable as a new trade
}

export interface PendingSignalInput {
  botId: string;
  ledgerSeq: number | null;
  symbol: string;
  side: 'long' | 'short';
  entryType: 'market' | 'limit';
  entry: number | null;
  stop: number | null;
  target: number | null;
  marketAtSignal: number | null;
  signalAt: Date;
}

/** Create the adjudication record for a freshly-received signal. Market entries fill immediately
 *  at the INDEPENDENT market price (slippage truth), not the creator's claimed entry. */
export async function createPending(input: PendingSignalInput): Promise<SignalAdjudication | null> {
  const { botId, ledgerSeq, symbol, side, entryType, entry, stop, target, marketAtSignal, signalAt } = input;

  // Need a stop to score in R; without it we can't honestly adjudicate.
  if (stop == null || (entry == null && marketAtSignal == null)) {
    const [row] = await db.insert(signalAdjudication).values({
      botId, ledgerSeq, symbol, side, entryType,
      entryPrice: entry?.toString() ?? null, stopPrice: stop?.toString() ?? null,
      targetPrice: target?.toString() ?? null, marketAtSignal: marketAtSignal?.toString() ?? null,
      status: 'invalid', signalAt,
    }).returning();
    return row;
  }

  const isMarket = entryType === 'market' || entry == null;
  const fillPrice = isMarket ? (marketAtSignal ?? entry) : entry;

  const [row] = await db.insert(signalAdjudication).values({
    botId, ledgerSeq, symbol, side, entryType: isMarket ? 'market' : 'limit',
    entryPrice: entry?.toString() ?? null, stopPrice: stop.toString(),
    targetPrice: target?.toString() ?? null, marketAtSignal: marketAtSignal?.toString() ?? null,
    status: isMarket ? 'filled' : 'pending',
    fillPrice: isMarket ? fillPrice!.toString() : null,
    fillAt: isMarket ? signalAt : null,
    signalAt,
  }).returning();
  return row;
}

function rMultiple(side: 'long' | 'short', entry: number, stop: number, exit: number): number {
  const risk = Math.abs(entry - stop) || 1e-9;
  return side === 'long' ? (exit - entry) / risk : (entry - exit) / risk;
}

/** One adjudication pass: advance every pending/filled signal against the current independent price.
 *  `priceOverride` injects prices (test-only); otherwise prices come from the live feed. */
export async function runAdjudication(priceOverride?: Map<string, number>): Promise<{ processed: number; changed: number }> {
  const open = await db
    .select()
    .from(signalAdjudication)
    .where(inArray(signalAdjudication.status, ['pending', 'filled']));

  if (open.length === 0) return { processed: 0, changed: 0 };

  // Batch price lookups by symbol.
  const symbols = Array.from(new Set(open.map((r) => r.symbol)));
  const prices = new Map<string, number | null>();
  if (priceOverride) {
    for (const s of symbols) prices.set(s, priceOverride.has(s) ? priceOverride.get(s)! : null);
  } else {
    await Promise.all(symbols.map(async (s) => prices.set(s, await PriceFetcher.getCurrentPrice(s))));
  }

  const now = Date.now();
  let changed = 0;

  for (const r of open) {
    const price = prices.get(r.symbol);
    if (price == null) continue; // no independent price for this symbol (e.g. futures) — skip this pass
    const entry = r.entryPrice != null ? parseFloat(r.entryPrice) : null;
    const stop = r.stopPrice != null ? parseFloat(r.stopPrice) : null;
    const target = r.targetPrice != null ? parseFloat(r.targetPrice) : null;
    const side = r.side as 'long' | 'short';
    const upd: Partial<typeof signalAdjudication.$inferInsert> = { updatedAt: new Date() };

    if (r.status === 'pending') {
      const reached = entry != null && (side === 'long' ? price <= entry : price >= entry);
      if (reached) {
        upd.status = 'filled'; upd.fillPrice = entry!.toString(); upd.fillAt = new Date();
      } else if (now - new Date(r.signalAt).getTime() > FILL_WINDOW_MS) {
        upd.status = 'missed'; // entry never reached — the anti-gaming case
      } else {
        continue;
      }
    } else {
      // filled -> watch for stop/target on the independent feed
      const fill = r.fillPrice != null ? parseFloat(r.fillPrice) : entry!;
      const hitStop = stop != null && (side === 'long' ? price <= stop : price >= stop);
      const hitTarget = target != null && (side === 'long' ? price >= target : price <= target);
      if (hitStop) {
        upd.status = 'lost'; upd.exitPrice = stop!.toString(); upd.exitReason = 'stop'; upd.exitAt = new Date();
        upd.rMultiple = rMultiple(side, fill, stop!, stop!).toFixed(4); // = -1
      } else if (hitTarget) {
        upd.status = 'won'; upd.exitPrice = target!.toString(); upd.exitReason = 'target'; upd.exitAt = new Date();
        upd.rMultiple = rMultiple(side, fill, stop!, target!).toFixed(4);
      } else if (now - new Date(r.fillAt ?? r.signalAt).getTime() > TRADE_WINDOW_MS) {
        upd.status = 'expired'; upd.exitPrice = price.toString(); upd.exitReason = 'expired'; upd.exitAt = new Date();
        upd.rMultiple = rMultiple(side, fill, stop!, price).toFixed(4);
      } else {
        continue;
      }
    }

    await db.update(signalAdjudication).set(upd).where(eq(signalAdjudication.id, r.id));
    changed++;
  }

  return { processed: open.length, changed };
}

export interface LiveRecord {
  total: number; pending: number; filled: number; won: number; lost: number; missed: number; expired: number;
  closed: number; winRate: number; totalR: number;
}

/** Aggregate the platform-adjudicated forward record for a bot. */
export async function getLiveRecord(botId: string): Promise<LiveRecord> {
  const rows = await db.select().from(signalAdjudication).where(eq(signalAdjudication.botId, botId));
  const rec: LiveRecord = { total: rows.length, pending: 0, filled: 0, won: 0, lost: 0, missed: 0, expired: 0, closed: 0, winRate: 0, totalR: 0 };
  for (const r of rows) {
    if (r.status in rec) (rec as any)[r.status]++;
    if (['won', 'lost', 'expired'].includes(r.status)) {
      rec.closed++;
      rec.totalR += r.rMultiple != null ? parseFloat(r.rMultiple) : 0;
    }
  }
  const decided = rec.won + rec.lost;
  rec.winRate = decided > 0 ? rec.won / decided : 0;
  rec.totalR = Math.round(rec.totalR * 100) / 100;
  return rec;
}

export async function getBotSignals(botId: string, limit = 100): Promise<SignalAdjudication[]> {
  return db.select().from(signalAdjudication).where(eq(signalAdjudication.botId, botId)).orderBy(desc(signalAdjudication.signalAt)).limit(limit);
}
