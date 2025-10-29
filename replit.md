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
2. **Bot Marketplace**: Browse, filter, and sort trading bots with real performance data
3. **Subscriptions**: Subscribe to trading bots (basic implementation)
4. **User Dashboard**: View active subscriptions and portfolio metrics
5. **Settings**: Manage profile and exchange API connections
6. **Exchange Integration**: Connect to Binance, Coinbase, Bybit, KuCoin

## Database Schema
- `users`: User accounts (managed by Replit Auth)
- `bots`: Trading bot information
- `bot_performance`: Performance metrics for each bot
- `subscriptions`: User subscriptions to bots
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
- Subscription deletion is protected - users can only cancel their own subscriptions
- Exchange connection API responses redact sensitive API keys/secrets
- All protected routes require authentication via `isAuthenticated` middleware

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

## Recent Changes
- Fixed security vulnerability: Added ownership check for subscription cancellation
- Sanitized exchange connection responses to hide API credentials
- Implemented comprehensive error handling with unauthorized redirects
- Added loading states and skeleton screens throughout the app

## Design System
- Primary color: Professional fintech blue
- Typography: Inter (body), Space Grotesk (headings)
- Design inspiration: Coinbase, Stripe, Robinhood
- Comprehensive design guidelines in `design_guidelines.md`
