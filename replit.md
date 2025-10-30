# AlgoPilot - Crypto Trading Bot Marketplace

## Project Overview
AlgoPilot is a web-based SaaS platform that enables users to discover, subscribe to, and deploy cryptocurrency trading bots. The platform features a marketplace where users can browse bot performance metrics, subscribe to bots with payments, connect exchange accounts (Binance, Coinbase, etc.), and view real-time trading analytics.

## Tech Stack
- **Frontend**: React + TypeScript, Wouter (routing), TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (via Neon)
- **Authentication**: Replit Auth (OIDC)
- **ORM**: Drizzle ORM
- **Charts**: Chart.js / React-Chartjs-2

## Key Features Implemented
1. **Authentication**: Replit Auth integration with secure session management
2. **Bot Marketplace**: Browse, filter, and sort trading bots with real performance data and verified badges
3. **Bot Detail Pages**: Comprehensive bot information with:
   - Performance charts with equity curves across multiple timeframes (1D, 1W, 1M, 3M, 1Y, ALL)
   - Historical trade logs with Recent/All views showing entry/exit prices, PnL, duration
   - Detailed strategy descriptions
   - Creator profiles with verification badges
4. **Granular Subscription Settings**:
   - Capital allocation (fixed amount or percentage-based)
   - Risk level selection (1-5 scale from Safest to DANGER)
   - Maximum drawdown limits
   - Notification preferences (New Trade, Drawdown Breach, Weekly/Monthly Summaries)
5. **Subscription Management**:
   - Pause/resume trading with reason tracking
   - Real-time subscription status indicators
   - Ownership-validated operations
6. **User Dashboard**: View active subscriptions with quick settings access and portfolio metrics
7. **Settings**: Manage profile and exchange API connections
8. **Exchange Integration**: Connect to Binance, Coinbase, Bybit, KuCoin

## Database Schema
- `users`: User accounts (managed by Replit Auth)
- `bots`: Trading bot information with strategyDescription and isVerified fields
- `bot_performance`: Performance metrics for each bot
- `bot_trade_logs`: Historical trade data (symbol, entry/exit prices, PnL, duration, status)
- `bot_performance_history`: Bucketed performance data for charting (1D, 1W, 1M, 3M, 1Y, ALL)
- `subscriptions`: User subscriptions with granular settings:
  - capitalAllocated, capitalAllocatedType (amount/percent)
  - riskPercentage (1-5), maxDrawdown
  - isPaused, pauseReason
  - notificationPrefs (newTrade, drawdownBreach, weeklySummary, monthlySummary)
- `subscription_events`: Event log for subscription lifecycle tracking
- `exchange_connections`: User exchange API credentials
- `sessions`: Session storage for authentication

## Security Notes
### Exchange API Keys
⚠️ **IMPORTANT**: Exchange API keys and secrets are currently stored in plaintext in the database. For production deployment, these MUST be encrypted at rest using a proper encryption library (e.g., crypto module with AES-256-GCM).

**Production TODO**:
1. Encrypt API keys/secrets before storing in database
2. Decrypt only when needed for trading operations
3. Use environment-specific encryption keys
4. Consider using a secrets management service (AWS Secrets Manager, HashiCorp Vault, etc.)

### Authorization
- All subscription operations (update, pause, resume, cancel) require ownership validation
- Exchange connection API responses redact sensitive API keys/secrets
- All protected routes require authentication via `isAuthenticated` middleware
- Backend validates percent-based capital allocation cannot exceed 100%

## Development Setup
1. Database is already provisioned and connected
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start development server
4. Database schema is managed via Drizzle - use `npm run db:push` to sync schema

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `SESSION_SECRET`: Session encryption secret (auto-configured)
- `REPL_ID`: Replit application ID (auto-configured)
- `ISSUER_URL`: OIDC issuer URL (auto-configured)

## Pending Features
1. **Stripe Integration**: Payment processing for subscriptions
2. **Admin Panel**: Real CRUD operations for bot creators
3. **Live Trading**: Actual exchange integration for automated trading
4. **Performance Tracking**: Real-time bot performance updates
5. **Notifications**: Trade alerts and performance notifications

## Recent Changes (Latest Session)
- **Added Granular Subscription Settings**: Capital allocation (amount/percent), risk levels (1-5), max drawdown limits
- **Built Bot Detail Pages**: Performance charts with equity curves, historical trade logs (Recent/All tabs), strategy descriptions, creator profiles
- **Implemented Pause/Resume**: Full pause/resume functionality with reason tracking and status indicators
- **Enhanced Notification Controls**: Per-subscription toggles for trade alerts, drawdown breaches, and summaries
- **Added Comprehensive Seed Data**: 200+ trade logs, 36 performance history records across 6 time buckets, verified bot badges
- **Backend Validation**: Percent-based capital allocation validation (≤100%), ownership checks on all subscription operations
- **E2E Testing**: Comprehensive test coverage of all subscription flows, settings management, and bot detail features

## Design System
- Primary color: Professional fintech blue
- Typography: Inter (body), Space Grotesk (headings)
- Design inspiration: Coinbase, Stripe, Robinhood
- Comprehensive design guidelines in `design_guidelines.md`
