# AlgoPilot - Crypto Trading Bot Marketplace

## Overview
AlgoPilot is a SaaS platform providing a marketplace for cryptocurrency trading bots. It enables users to discover, subscribe to, and deploy automated trading strategies, offering detailed performance metrics, secure payments, exchange connectivity, and real-time analytics. The platform aims to automate crypto trading for users and monetize algorithms for bot creators, fostering a community around algorithmic trading.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with regular updates. Please ask before making major architectural changes or introducing new dependencies. Ensure all changes are well-documented, especially regarding security and data handling.

## System Architecture
The platform utilizes a modern web stack: React with TypeScript, Wouter, TanStack Query, and Tailwind CSS with Shadcn UI for the frontend; an Express.js backend in TypeScript; and a PostgreSQL database managed via Neon and Drizzle ORM. Replit Auth handles authentication.

**UI/UX Decisions:**
- Professional fintech blue color scheme.
- Uses Inter for body text and Space Grotesk for headings.
- Design inspired by Coinbase, Stripe, and Robinhood.
- Context-aware navigation and a Steam-inspired clean table layout for the marketplace with key metrics and sticky filters.

**Technical Implementations & Feature Specifications:**
- **Dashboard Routing**: Simplified routing at the DashboardLayout level with explicit route definitions. Important: Wouter wildcard routes (`:rest*`) may not always match nested paths - explicit routes must be registered in App.tsx for deeply nested dashboard paths (e.g., `/dashboard/creator/bot/:id/settings`).
- **TradingView Webhook Authentication**: Multi-layer security featuring a 64-character hex URL secret, flexible token authentication (query parameter or header), optional timestamp validation for replay attack prevention, comprehensive logging, and rate limiting. Token regeneration and full webhook URL display for creators are supported.
- **Stripe Webhook Implementation**: Secure webhook endpoint with signature verification, handling all critical subscription and payment events, and structured error logging.
- **Authentication**: Secure user authentication via Replit Auth.
- **Bot Marketplace & Detail Pages**: Allows browsing, filtering, subscribing to bots, displaying performance charts, trade logs, and creator profiles. Public access for unauthenticated browsing.
- **Monetization Strategy**: Pay-per-bot marketplace model. Creators set prices, earn 75% revenue; platform takes 25% commission. Free creator application with review process.
- **Payment & Subscription Management**: Secure Stripe integration for recurring subscriptions with granular settings.
- **User & Creator Dashboards**: Centralized views for subscriptions, portfolio, bot management, and trade signal monitoring.
- **Exchange Connection Management**: Secure management of API credentials using AES-256-GCM encryption with PBKDF2 key derivation. Credentials are encrypted at rest and decrypted transiently. Supports paper/live trading, spot/futures accounts, and testnet connections for Binance and Bybit.
- **TradingView Integration**: Webhook-based integration for executing trade signals from TradingView alerts.
- **Multi-Source Real-Time Price Fetching**: A 5-source cascading fallback system ensures reliable price data with server-side validation.
- **Trade Execution & P&L Tracking**: Automated trade execution, comprehensive P&L tracking, position sizing, and fee calculation.
- **Notification System**: Email notifications for trade alerts, drawdown warnings, and P&L summaries via Resend.
- **User Onboarding System**: Guides new users with a Welcome Modal, Checklist, and Getting Started Guide.
- **Creator Application System**: Gated creator program with review/approval workflow.
- **Performance-Based Bot Evaluation**: Bots must pass performance requirements (e.g., minimum trade count, profitability threshold) before going live.
- **Featured Placements**: Paid featured banner slots in the marketplace with analytics.
- **Creator Payout System**: Automated earnings calculation (75% of revenue), creator dashboard, payout request functionality (min $100), admin review workflow, and Stripe Connect Express integration for automated payouts and hosted onboarding.
- **Bot Settings Management**: Comprehensive bot configuration system with dedicated database table (bot_settings) using jsonb for flexible settings storage. Features tabbed UI (Trading, Risk Management, Signal Handling, Order Execution, Schedule) covering leverage (1-20x), position sizing modes (fixed/percentage/risk-based), risk management (stop loss/take profit/max daily loss), signal handling (strategy, filters, confirmations), order execution (types, slippage, retries), and trading schedule (hours, days). Accessible via Bot Settings button on creator dashboard.
- **Admin Panel**: Comprehensive dashboard for platform management, including statistics, user/creator management, and payout approvals.

**System Design Choices:**
- **Security-first Approach**: Emphasizes ownership validation, data redaction, protected routes, extensive server-side validation (Zod schemas), robust Stripe validation, production-grade CSRF protection (double-submit cookie), hardened session security, and a production-ready Content Security Policy.
- **Scalable Architecture**: Utilizes Drizzle ORM and Neon for PostgreSQL.
- **Modular Design**: React/Wouter/TanStack Query for frontend; Express.js/TypeScript for backend.
- **Performance Optimizations**: Strategic database indexing, memoizee-based query caching with intelligent invalidation, and API response time monitoring.
- **Security Audit**: Comprehensive audit ensuring production readiness.
- **Legal Compliance**: Complete Terms of Service and Privacy Policy pages.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Payment Processing**: Stripe
- **Charting Library**: Chart.js / React-Chartjs-2
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **API Integrations**: Binance, Bybit
- **Email Service**: Resend