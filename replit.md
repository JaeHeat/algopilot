# AlgoPilot - Crypto Trading Bot Marketplace

## Overview
AlgoPilot is a web-based SaaS platform designed to be a marketplace for cryptocurrency trading bots. It allows users to discover, subscribe to, and deploy trading bots. The platform provides detailed performance metrics, secure payment integrations, connectivity to major crypto exchanges (Binance, Coinbase, etc.), and real-time trading analytics. Its purpose is to empower users with automated trading strategies and offer bot creators a platform to monetize their algorithms.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with regular updates. Please ask before making major architectural changes or introducing new dependencies. Ensure all changes are well-documented, especially regarding security and data handling.

## System Architecture
The platform is built with a modern web stack: React with TypeScript, Wouter for routing, TanStack Query, and Tailwind CSS with Shadcn UI for the frontend; an Express.js backend also in TypeScript; and a PostgreSQL database managed via Neon and Drizzle ORM. Authentication is handled by Replit Auth (OIDC). Chart.js is used for data visualization.

**Key Features:**
- **Authentication**: Secure user authentication via Replit Auth.
- **Bot Marketplace**: Browse, filter, and sort bots based on performance and verification status.
- **Bot Detail Pages**: Display performance charts (equity curves across multiple timeframes), historical trade logs, strategy descriptions, and creator profiles.
- **Subscription Management**: Granular settings for capital allocation (fixed/percentage), risk levels (1-5), maximum drawdown limits, and customizable notification preferences. Includes robust server-side validation for capital allocation against exchange balances.
- **Subscription Lifecycle**: Supports pausing, resuming, canceling (with end-of-month termination), and reactivating subscriptions.
- **User Dashboard**: Centralized view of active subscriptions, portfolio metrics, and quick settings access.
- **Exchange Integration**: Connection to multiple crypto exchanges for managing mock USDT balances and future live trading.
- **Social Features**: Creator posts with comment and reaction systems to foster community engagement.

**Design System:**
- Utilizes a professional fintech blue as the primary color.
- Employs Inter for body text and Space Grotesk for headings.
- Design inspiration draws from platforms like Coinbase, Stripe, and Robinhood.

**Security Design:**
- All subscription operations require ownership validation.
- Exchange API responses redact sensitive information.
- Protected routes enforce authentication via middleware.
- Server-side validation is implemented for all critical actions, such as capital allocation and subscription activation.

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Charting Library**: Chart.js / React-Chartjs-2
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **API Integrations**: Binance, Coinbase, Bybit, KuCoin (mock integrations currently in place)