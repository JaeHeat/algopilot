import * as crypto from 'crypto';
import { eq, asc, desc } from 'drizzle-orm';
import { db } from '../db';
import { signalLedger, type SignalLedgerEntry } from '@shared/schema';

/**
 * Tamper-evident signal ledger.
 *
 * Every accepted webhook signal is committed (hashed + server-timestamped) the moment it
 * arrives — before its trade outcome is known — and chained to the previous entry. This makes
 * a creator's track record append-only and forward-only: any attempt to backfill, reorder, or
 * delete a past signal breaks the hash chain and is detectable by anyone via verifyChain().
 *
 * This is the trust moat: "Verified Live" means we watched the signals happen, in order, in the open.
 */

const GENESIS_HASH = '0'.repeat(64);

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/** Deterministic JSON stringify (recursively sorted keys) so payload hashing is order-independent. */
function stableStringify(value: any): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

/** Compute an entry hash. Uses integer epoch-ms for the timestamp so it round-trips exactly through Postgres. */
function computeEntryHash(params: {
  botId: string;
  seq: number;
  committedAtMs: number;
  payloadHash: string;
  marketPrice: string; // independent platform price at receipt ('' if unavailable)
  prevHash: string;
}): string {
  return sha256(
    [params.botId, params.seq, params.committedAtMs, params.payloadHash, params.marketPrice, params.prevHash].join('|'),
  );
}

/**
 * Commit a signal to the bot's chain. Best-effort: callers should wrap in try/catch so a ledger
 * failure never blocks trade execution. Retries on the (botId, seq) unique-index race.
 */
export async function recordSignal(
  botId: string,
  payload: unknown,
  summary?: { symbol?: string; action?: string; side?: string | null; price?: number },
  marketPrice?: number | null,
): Promise<SignalLedgerEntry | null> {
  const payloadHash = sha256(stableStringify(payload));
  const marketPriceStr = marketPrice != null ? String(marketPrice) : '';

  for (let attempt = 0; attempt < 3; attempt++) {
    const [last] = await db
      .select()
      .from(signalLedger)
      .where(eq(signalLedger.botId, botId))
      .orderBy(desc(signalLedger.seq))
      .limit(1);

    const seq = last ? last.seq + 1 : 0;
    const prevHash = last ? last.entryHash : GENESIS_HASH;
    const committedAt = new Date();
    const committedAtMs = committedAt.getTime();
    const entryHash = computeEntryHash({ botId, seq, committedAtMs, payloadHash, marketPrice: marketPriceStr, prevHash });

    try {
      const [entry] = await db
        .insert(signalLedger)
        .values({ botId, seq, payloadHash, prevHash, entryHash, signalSummary: summary ?? null, marketPrice: marketPriceStr || null, committedAt })
        .returning();
      return entry;
    } catch (err) {
      // Likely a concurrent insert grabbed this seq — re-read and retry.
      if (attempt === 2) throw err;
    }
  }
  return null;
}

export interface ChainVerification {
  valid: boolean;
  length: number;
  head: string; // entryHash of the last entry (or genesis if empty)
  firstCommittedAt: Date | null;
  lastCommittedAt: Date | null;
  brokenAt?: number; // seq of the first invalid entry
  reason?: string;
}

/** Recompute the whole chain from scratch and report whether it is intact. */
export async function verifyChain(botId: string): Promise<ChainVerification> {
  const entries = await db
    .select()
    .from(signalLedger)
    .where(eq(signalLedger.botId, botId))
    .orderBy(asc(signalLedger.seq));

  let prev = GENESIS_HASH;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.seq !== i) {
      return { valid: false, length: entries.length, head: prev, firstCommittedAt: entries[0]?.committedAt ?? null, lastCommittedAt: null, brokenAt: e.seq, reason: 'sequence gap' };
    }
    if (e.prevHash !== prev) {
      return { valid: false, length: entries.length, head: prev, firstCommittedAt: entries[0]?.committedAt ?? null, lastCommittedAt: null, brokenAt: e.seq, reason: 'prevHash mismatch' };
    }
    const recomputed = computeEntryHash({
      botId,
      seq: e.seq,
      committedAtMs: new Date(e.committedAt).getTime(),
      payloadHash: e.payloadHash,
      marketPrice: e.marketPrice ?? '',
      prevHash: e.prevHash,
    });
    if (recomputed !== e.entryHash) {
      return { valid: false, length: entries.length, head: prev, firstCommittedAt: entries[0]?.committedAt ?? null, lastCommittedAt: null, brokenAt: e.seq, reason: 'entryHash mismatch (record altered)' };
    }
    prev = e.entryHash;
  }

  return {
    valid: true,
    length: entries.length,
    head: prev,
    firstCommittedAt: entries[0]?.committedAt ?? null,
    lastCommittedAt: entries[entries.length - 1]?.committedAt ?? null,
  };
}

/** Public-facing chain (newest first), with hashes truncated for display. */
export async function getLedger(botId: string, limit = 100): Promise<SignalLedgerEntry[]> {
  return db
    .select()
    .from(signalLedger)
    .where(eq(signalLedger.botId, botId))
    .orderBy(desc(signalLedger.seq))
    .limit(limit);
}
