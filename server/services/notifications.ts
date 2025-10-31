import { sendTradeNotification, sendDrawdownNotification, sendPnLSummary } from './email';
import type { TradeNotificationData, DrawdownNotificationData, PnLSummaryData } from './email';

async function safelyCallEmailService<T>(
  serviceFn: () => Promise<T>,
  serviceName: string
): Promise<void> {
  try {
    await serviceFn();
  } catch (error: any) {
    if (error.message?.includes('RESEND_API_KEY not found')) {
      console.log(`[Notifications] ${serviceName} skipped - RESEND_API_KEY not configured. Add RESEND_API_KEY to environment secrets to enable email notifications.`);
    } else {
      console.error(`[Notifications] ${serviceName} failed:`, error);
    }
  }
}

export async function notifyTradeExecuted(data: TradeNotificationData): Promise<void> {
  await safelyCallEmailService(
    () => sendTradeNotification(data),
    'Trade notification'
  );
}

export async function notifyDrawdownBreach(data: DrawdownNotificationData): Promise<void> {
  await safelyCallEmailService(
    () => sendDrawdownNotification(data),
    'Drawdown notification'
  );
}

export async function notifyPnLSummary(data: PnLSummaryData, period: 'daily' | 'weekly'): Promise<void> {
  await safelyCallEmailService(
    () => sendPnLSummary(data, period),
    `${period} P&L summary`
  );
}
