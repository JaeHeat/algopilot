# AlgoPilot - Crypto Trading Bot Marketplace

## Overview
AlgoPilot is a web-based SaaS platform serving as a marketplace for cryptocurrency trading bots. It enables users to discover, subscribe to, and deploy automated trading strategies. The platform provides detailed performance metrics, secure payment integrations, connectivity to major crypto exchanges, and real-time trading analytics. Its core purpose is to empower users with automated trading and offer bot creators a platform to monetize their algorithms, fostering a community around algorithmic trading.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with regular updates. Please ask before making major architectural changes or introducing new dependencies. Ensure all changes are well-documented, especially regarding security and data handling.

## System Architecture
The platform utilizes a modern web stack: React with TypeScript, Wouter for routing, TanStack Query, and Tailwind CSS with Shadcn UI for the frontend; an Express.js backend in TypeScript; and a PostgreSQL database managed via Neon and Drizzle ORM. Authentication is handled by Replit Auth (OIDC). Chart.js is used for data visualization.

**UI/UX Decisions:**
- Employs a professional fintech blue as the primary color.
- Uses Inter for body text and Space Grotesk for headings.
- Design inspiration from platforms like Coinbase, Stripe, and Robinhood.

**Technical Implementations & Feature Specifications:**
- **Authentication**: Secure user authentication via Replit Auth.
- **Bot Marketplace**: Allows browsing, filtering, and sorting of bots.
- **Bot Detail Pages**: Display performance charts (equity curves), historical trade logs, strategy descriptions, and creator profiles.
- **Payment Processing**: Secure Stripe integration for recurring bot subscriptions.
- **Subscription Management**: Granular settings for capital allocation, risk levels, maximum drawdown limits, and notification preferences with server-side validation. Supports pausing, resuming, canceling, and reactivating subscriptions.
- **User Dashboard**: Centralized view of active subscriptions, portfolio metrics, and quick settings.
- **Exchange Integration**: Connection to multiple crypto exchanges for managing mock USDT balances and future live trading.
- **Social Features**: Creator posts with comment and reaction systems.
- **Creator Dashboard**: Enables bot creators to manage bots, view webhook URLs, monitor trade signal activity, and create new bots.
- **TradingView Integration**: Webhook-based integration for receiving trade signals from TradingView alerts for execution. Supports TradingView perpetual futures symbols (e.g., BTCUSD.P, ETHUSD.P) with automatic normalization to standard exchange formats (BTCUSDT, ETHUSDT).
- **Multi-Source Real-Time Price Fetching**: 5-source cascading fallback system prevents users from being locked in positions. Tries Binance → Kraken → Coinbase → CoinGecko → CryptoCompare sequentially until one succeeds. UI displays which API provided the price for transparency. Server-side validation enforces 5% tolerance against real-time market prices to prevent P&L manipulation.
- **Trade Execution & P&L Tracking**: Automated trade execution based on webhook signals across active subscriptions, with comprehensive P&L tracking, position sizing, and fee calculation. The system records trades and positions, updates balances, and provides P&L summaries with win/loss statistics. Analytics count positions (not individual trade records): 1 open + 1 close = 1 complete trade.

**System Design Choices:**
- **Security-first Approach**: All operations require ownership validation. Exchange API responses redact sensitive information. Protected routes enforce authentication. Server-side validation is implemented for all critical actions, including a robust Stripe payment validation process to prevent fraudulent subscriptions.
- **Scalable Architecture**: Utilizes Drizzle ORM for database interactions and Neon for PostgreSQL, supporting scalability.
- **Modular Frontend**: React with Wouter and TanStack Query provides a modular and efficient user interface.
- **Robust Backend**: Express.js in TypeScript ensures type safety and maintainability.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Payment Processing**: Stripe
- **Charting Library**: Chart.js / React-Chartjs-2
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **API Integrations**: Binance, Coinbase, Bybit, KuCoin (mock integrations currently in place)
- **Email Service**: Resend (ready for integration - requires RESEND_API_KEY secret for production use)

## Notification System
The platform includes a comprehensive email notification system with professional HTML templates:
- **Trade Alerts**: Sent when positions are opened or closed, includes P&L for closed positions
- **Drawdown Warnings**: Sent when subscriptions exceed max drawdown limits and are auto-paused
- **P&L Summaries**: Daily/weekly performance summaries with bot-by-bot breakdown

**Status**: Email service fully configured and active with RESEND_API_KEY. Uses Resend for transactional emails with responsive HTML templates. Default from email: `notifications@algo-pilot.com`

**Production Setup**:
1. ✅ Resend API key configured (RESEND_API_KEY in environment secrets)
2. 🔄 Domain verification in progress for algo-pilot.com
3. Optional: Add RESEND_FROM_EMAIL to customize sender address

## Launch Readiness Checklist
- [x] Core trading functionality (webhook integration, position management)
- [x] Payment processing (Stripe subscriptions)
- [x] Multi-timeframe support with position limits
- [x] Real-time price fetching with 5-source fallback
- [x] Email notification system (ready for API key)
- [ ] User onboarding flow and documentation
- [ ] Legal pages (Terms of Service, Privacy Policy, Risk Disclaimer)
- [ ] Production email configuration (Resend API key)
- [ ] Performance testing and optimization
- [ ] Security audit of webhook endpoints