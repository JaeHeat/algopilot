# AlgoPilot - Crypto Trading Bot Marketplace

## Overview
AlgoPilot is a web-based SaaS platform designed as a marketplace for cryptocurrency trading bots. Its primary purpose is to allow users to discover, subscribe to, and deploy automated trading strategies. The platform offers detailed performance metrics, secure payment integrations, connectivity to major crypto exchanges, and real-time trading analytics, aiming to empower users with automated trading capabilities and provide bot creators with a platform to monetize their algorithms. The business vision is to foster a vibrant community around algorithmic trading in the cryptocurrency space.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with regular updates. Please ask before making major architectural changes or introducing new dependencies. Ensure all changes are well-documented, especially regarding security and data handling.

## System Architecture
The platform is built with a modern web stack: React with TypeScript, Wouter for routing, TanStack Query, and Tailwind CSS with Shadcn UI for the frontend; an Express.js backend in TypeScript; and a PostgreSQL database managed via Neon and Drizzle ORM. Authentication is handled by Replit Auth (OIDC). Chart.js is used for data visualization.

**UI/UX Decisions:**
- Uses a professional fintech blue as the primary color.
- Employs Inter for body text and Space Grotesk for headings.
- Design inspiration draws from platforms like Coinbase, Stripe, and Robinhood.
- **Navigation System**: Context-aware AlgoPilot logo navigation (landing page for guests, dashboard for authenticated users).
- **Marketplace Access**: Public marketplace browsing without authentication, with header navigation and sign-in prompts for subscription features.
- **Marketplace Design**: Steam-inspired clean table layout with ranked list, bot icons, key metrics in columns (ROI, Win Rate, Sharpe, Subscribers), sticky filters, and easy-to-scan rows. Much simpler and cleaner than previous card grid design.

**Technical Implementations & Feature Specifications:**
- **Authentication**: Secure user authentication via Replit Auth.
- **Bot Marketplace & Detail Pages**: Allows browsing, filtering, and subscribing to bots, displaying performance charts, trade logs, strategy descriptions, and creator profiles. Public marketplace access allows unauthenticated browsing with sign-in prompts for subscriptions.
- **Monetization Strategy**: Simple pay-per-bot marketplace model inspired by Gumroad/Etsy. Platform access is FREE for traders. Bot creators set their own subscription prices (typically $5-50/month), earn 75% of revenue, with platform taking a 25% commission. Additional revenue from paid featured marketplace placements. Free creator application with review/approval process. More competitive and transparent than 3Commas ($29-99 platform fees) and Cryptohopper ($29-129 platform fees).
- **Payment & Subscription Management**: Secure Stripe integration for recurring subscriptions with granular settings for capital allocation, risk limits, and notifications.
- **User & Creator Dashboards**: Centralized views for active subscriptions, portfolio metrics, bot management, and trade signal monitoring.
- **Exchange Integration**: Connection to multiple crypto exchanges for managing mock USDT balances and future live trading.
- **TradingView Integration**: Webhook-based integration for executing trade signals from TradingView alerts, with symbol normalization.
- **Multi-Source Real-Time Price Fetching**: A 5-source cascading fallback system (Binance, Kraken, Coinbase, CoinGecko, CryptoCompare) ensures reliable price data, with server-side validation enforcing a 5% tolerance against market prices to prevent manipulation.
- **Trade Execution & P&L Tracking**: Automated trade execution, comprehensive P&L tracking, position sizing, and fee calculation. The system tracks positions (open and close form one trade) and provides P&L summaries.
- **Notification System**: Comprehensive email notifications for trade alerts, drawdown warnings, and P&L summaries using Resend.
- **User Onboarding System**: A multi-component system (Welcome Modal, Onboarding Checklist, Getting Started Guide) guides new users, with automated progress tracking.
- **Creator Application System**: Gated creator program with free application, review/approval workflow, and status tracking (pending, approved, rejected).
- **Performance-Based Bot Evaluation**: Similar to prop firm evaluations, bots must pass performance requirements before going live:
  - Connect bot via webhook and start trading
  - Reach minimum trade count (default: 10 trades)
  - Achieve profitability threshold (default: 5% profit)
  - Prevents lucky single-trade approvals
  - Filters out scammers and unprofitable bots
  - Builds platform trust and credibility
- **Featured Placements**: Paid featured banner slots in marketplace for creators to promote their bots, tracked with impressions/clicks analytics.
- **Admin Panel**: Comprehensive platform management dashboard for administrators with:
  - Real-time platform statistics (total users, active bots, platform revenue, pending approvals)
  - Recent users list with subscription counts
  - Creator application review and approval workflow
  - Role-based access control (admin role required)
  - Integration with live database metrics via protected API endpoints
  - Note: Admin users must be manually created in production by updating the user's role to 'admin' in the database

**System Design Choices:**
- **Security-first Approach**: Emphasizes ownership validation, data redaction, protected routes, and extensive server-side validation, including robust Stripe payment validation.
- **Scalable Architecture**: Utilizes Drizzle ORM and Neon for PostgreSQL for scalability.
- **Modular Design**: React with Wouter and TanStack Query for a modular frontend; Express.js with TypeScript for a robust backend.
- **Performance Optimizations**: Includes strategic database indexing (composite indexes for frequently queried patterns), memoizee-based query caching with intelligent invalidation, and API response time monitoring to ensure low latency.
- **Security Audit**: A comprehensive audit covered webhook endpoints, authentication, input validation (using Zod schemas), payment processing, and data protection, resulting in significant security enhancements and confirming production readiness.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Payment Processing**: Stripe
- **Charting Library**: Chart.js / React-Chartjs-2
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **API Integrations**: Binance, Bybit, OKX, Kraken, Bitfinex (mock integrations currently in place, all selected for leverage trading support)
- **Email Service**: Resend (configured and active)