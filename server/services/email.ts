import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not found in environment variables');
  }
  
  return {
    client: new Resend(apiKey),
    // Use a default from email or configure this in environment
    fromEmail: process.env.RESEND_FROM_EMAIL || 'AlgoPilot <notifications@algopilot.app>'
  };
}

export interface TradeNotificationData {
  userEmail: string;
  userName: string;
  botName: string;
  symbol: string;
  action: 'opened' | 'closed';
  positionType: 'long' | 'short';
  quantity: string;
  price: string;
  pnl?: string;
}

export interface DrawdownNotificationData {
  userEmail: string;
  userName: string;
  botName: string;
  currentDrawdown: string;
  maxDrawdown: string;
  currentBalance: string;
}

export interface PnLSummaryData {
  userEmail: string;
  userName: string;
  totalPnl: string;
  totalTrades: number;
  winRate: string;
  openPositions: number;
  subscriptions: Array<{
    botName: string;
    pnl: string;
    trades: number;
  }>;
}

export async function sendTradeNotification(data: TradeNotificationData): Promise<void> {
  try {
    const {client, fromEmail} = getResendClient();
    
    const subject = data.action === 'opened' 
      ? `🚀 New ${data.positionType.toUpperCase()} Position Opened - ${data.symbol}`
      : `✅ Position Closed - ${data.symbol}`;
    
    const actionText = data.action === 'opened' 
      ? `opened a <strong>${data.positionType.toUpperCase()}</strong> position`
      : `closed your <strong>${data.positionType.toUpperCase()}</strong> position`;
    
    const pnlSection = data.pnl 
      ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">P&L:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: ${parseFloat(data.pnl) >= 0 ? '#10b981' : '#ef4444'};">
            ${parseFloat(data.pnl) >= 0 ? '+' : ''}$${data.pnl}
          </td>
        </tr>
      `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">AlgoPilot Trade Alert</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Hi ${data.userName},
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Your bot <strong>${data.botName}</strong> has ${actionText} on <strong>${data.symbol}</strong>.
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Symbol:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${data.symbol}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Type:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${data.positionType.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Quantity:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${data.quantity}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Price:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">$${data.price}</td>
                </tr>
                ${pnlSection}
              </table>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/dashboard/my-trades" 
                   style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  View Trade Details
                </a>
              </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">
                You're receiving this because you have trade notifications enabled.<br>
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/dashboard/settings" style="color: #3b82f6; text-decoration: none;">
                  Manage notification preferences
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: data.userEmail,
      subject,
      html,
    });

    console.log(`[Email] Trade notification sent to ${data.userEmail} for ${data.symbol} ${data.action}`);
  } catch (error) {
    console.error('[Email] Failed to send trade notification:', error);
    throw error;
  }
}

export async function sendDrawdownNotification(data: DrawdownNotificationData): Promise<void> {
  try {
    const {client, fromEmail} = getResendClient();
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">⚠️ Drawdown Alert</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Hi ${data.userName},
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #dc2626; font-weight: 600;">
                Your subscription to <strong>${data.botName}</strong> has exceeded the maximum drawdown limit and has been automatically paused.
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 6px;">
                <tr>
                  <td style="padding: 12px;">Current Drawdown:</td>
                  <td style="padding: 12px; font-weight: bold; color: #dc2626; text-align: right;">${data.currentDrawdown}%</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-top: 1px solid #fecaca;">Max Drawdown Limit:</td>
                  <td style="padding: 12px; font-weight: bold; text-align: right; border-top: 1px solid #fecaca;">${data.maxDrawdown}%</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-top: 1px solid #fecaca;">Current Balance:</td>
                  <td style="padding: 12px; font-weight: bold; text-align: right; border-top: 1px solid #fecaca;">$${data.currentBalance}</td>
                </tr>
              </table>
              
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>What happens now?</strong><br>
                  Trading has been paused for this bot to protect your capital. Review your strategy and resume when ready.
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/dashboard" 
                   style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
                  View Dashboard
                </a>
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/dashboard/settings" 
                   style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Manage Settings
                </a>
              </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">
                You're receiving this because you have drawdown breach notifications enabled.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: data.userEmail,
      subject: `⚠️ Drawdown Alert: ${data.botName} Paused`,
      html,
    });

    console.log(`[Email] Drawdown notification sent to ${data.userEmail} for ${data.botName}`);
  } catch (error) {
    console.error('[Email] Failed to send drawdown notification:', error);
    throw error;
  }
}

export async function sendPnLSummary(data: PnLSummaryData, period: 'daily' | 'weekly'): Promise<void> {
  try {
    const {client, fromEmail} = getResendClient();
    
    const periodText = period === 'daily' ? 'Daily' : 'Weekly';
    const isProfitable = parseFloat(data.totalPnl) >= 0;
    
    const subscriptionRows = data.subscriptions.map(sub => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${sub.botName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${sub.trades}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: ${parseFloat(sub.pnl) >= 0 ? '#10b981' : '#ef4444'};">
          ${parseFloat(sub.pnl) >= 0 ? '+' : ''}$${sub.pnl}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">📊 ${periodText} Trading Summary</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Hi ${data.userName},
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px;">
                Here's your ${periodText.toLowerCase()} performance summary:
              </p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 30px 0;">
                <div style="background: ${isProfitable ? '#ecfdf5' : '#fef2f2'}; padding: 20px; border-radius: 8px; border: 2px solid ${isProfitable ? '#a7f3d0' : '#fecaca'};">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Total P&L</div>
                  <div style="font-size: 28px; font-weight: bold; color: ${isProfitable ? '#10b981' : '#ef4444'};">
                    ${isProfitable ? '+' : ''}$${data.totalPnl}
                  </div>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Win Rate</div>
                  <div style="font-size: 28px; font-weight: bold; color: #374151;">${data.winRate}%</div>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Total Trades</div>
                  <div style="font-size: 28px; font-weight: bold; color: #374151;">${data.totalTrades}</div>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Open Positions</div>
                  <div style="font-size: 28px; font-weight: bold; color: #374151;">${data.openPositions}</div>
                </div>
              </div>
              
              ${data.subscriptions.length > 0 ? `
                <h3 style="margin: 30px 0 16px 0; font-size: 18px;">Performance by Bot</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Bot</th>
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Trades</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subscriptionRows}
                  </tbody>
                </table>
              ` : ''}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/dashboard" 
                   style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  View Full Dashboard
                </a>
              </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">
                You're receiving this ${periodText.toLowerCase()} summary because you have ${periodText.toLowerCase()} summaries enabled.<br>
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/dashboard/settings" style="color: #3b82f6; text-decoration: none;">
                  Manage notification preferences
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: data.userEmail,
      subject: `${periodText} Trading Summary - ${isProfitable ? '📈' : '📉'} ${isProfitable ? '+' : ''}$${data.totalPnl}`,
      html,
    });

    console.log(`[Email] ${periodText} P&L summary sent to ${data.userEmail}`);
  } catch (error) {
    console.error(`[Email] Failed to send ${period} P&L summary:`, error);
    throw error;
  }
}
