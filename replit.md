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
- **Payment Processing**: Secure Stripe integration for bot subscription payments with monthly recurring billing.
- **Subscription Management**: Granular settings for capital allocation (fixed/percentage), risk levels (1-5), maximum drawdown limits, and customizable notification preferences. Includes robust server-side validation for capital allocation against exchange balances.
- **Subscription Lifecycle**: Supports pausing, resuming, canceling (with end-of-month termination), and reactivating subscriptions.
- **User Dashboard**: Centralized view of active subscriptions, portfolio metrics, and quick settings access.
- **Exchange Integration**: Connection to multiple crypto exchanges for managing mock USDT balances and future live trading.
- **Social Features**: Creator posts with comment and reaction systems to foster community engagement.
- **Creator Dashboard**: Bot creators can manage their bots, view webhook URLs, monitor trade signal activity, and create new bots with auto-generated webhooks.
- **TradingView Integration**: Webhook-based integration allowing bot creators to send trade signals from TradingView alerts directly to AlgoPilot for execution.

**Design System:**
- Utilizes a professional fintech blue as the primary color.
- Employs Inter for body text and Space Grotesk for headings.
- Design inspiration draws from platforms like Coinbase, Stripe, and Robinhood.

**Security Design:**
- All subscription operations require ownership validation.
- Exchange API responses redact sensitive information.
- Protected routes enforce authentication via middleware.
- Server-side validation is implemented for all critical actions, such as capital allocation and subscription activation.
- **Stripe Payment Security**:
  - stripeSubscriptionId is required and validated against Stripe API before subscription creation
  - Server verifies subscription belongs to authenticated user's Stripe customer
  - Server validates subscription metadata matches requested bot
  - Server confirms subscription status is active/trialing and payment is completed
  - Prevents fraudulent subscription creation without payment

## External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Payment Processing**: Stripe (monthly recurring subscriptions)
- **Charting Library**: Chart.js / React-Chartjs-2
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **API Integrations**: Binance, Coinbase, Bybit, KuCoin (mock integrations currently in place)

## Recent Changes (Latest Session)
- **Stripe Payment Integration - COMPLETED**: Implemented secure payment processing for bot subscriptions
  - **Schema Changes**:
    - Added `stripeCustomerId` field to users table to track Stripe customer IDs
    - Made `stripeSubscriptionId` required in subscription creation schema with validation
  - **Backend Implementation**:
    - Added POST /api/create-subscription-payment endpoint that creates Stripe customer (if needed) and subscription
    - Integrated Stripe SDK with API key management via Replit Secrets
    - Implemented comprehensive server-side validation in POST /api/subscriptions:
      - Retrieves Stripe subscription with expanded latest_invoice
      - Verifies subscription belongs to authenticated user's Stripe customer
      - Validates subscription metadata matches requested bot
      - Confirms subscription status is active or trialing
      - Checks invoice payment status before allowing subscription creation
      - Returns detailed error messages for validation failures
  - **Frontend Implementation**:
    - Created PaymentForm component using Stripe Elements for payment collection
    - Created SubscriptionPaymentDialog wrapper with Stripe Elements provider
    - Modified SubscribeDialog flow:
      1. User confirms subscription → calls /api/create-subscription-payment
      2. Payment dialog opens with Stripe Elements
      3. User completes payment
      4. On success → creates local subscription with Stripe subscription ID
      5. Redirects to dashboard with settings open
  - **Security Measures**:
    - stripeSubscriptionId is required and cannot be bypassed
    - Server validates all Stripe subscriptions before creating local records
    - Prevents fraudulent subscription creation without payment
    - Customer ownership verification prevents subscription hijacking
    - Bot ID metadata validation ensures subscription matches requested bot
  - **Payment Flow**: Subscribe → Payment Intent → Payment Collection → Verification → Subscription Creation → Dashboard
  - **Testing & Review**: Architect review passed with security fixes implemented

- **Notification System - COMPLETED**: Implemented visual notification system to guide users to configure new subscriptions
  - **Green Badge on "My Bots" Sidebar**:
    - Displays count of paused subscriptions needing setup
    - Uses Shadcn Badge component with success variant
    - Updates automatically via React Query
  - **Red Badge on Bell Icon**:
    - Shows count of pending notifications (paused subscriptions)
    - Positioned in top-right header next to theme toggle
    - Uses Shadcn Badge component with destructive variant
  - **Notifications Dropdown**:
    - Created NotificationsDropdown component with clickable notification items
    - Each notification shows bot name and "Needs configuration" message
    - Clicking notification navigates to My Bots page with auto-open settings dialog
  - **Auto-Open Settings Dialog**:
    - Added openSettings query parameter support to dashboard-my-bots.tsx
    - Updated SubscriptionCard with initialSettingsOpen prop
    - Implemented useEffect to sync settings dialog state when prop changes
    - Flow: Click notification → Navigate to /dashboard/my-bots?openSettings={id} → Settings dialog auto-opens
  - **User Experience Flow**:
    1. User subscribes to bot → paused subscription created
    2. Green badge appears on "My Bots" sidebar showing count
    3. Red badge appears on bell icon in header
    4. User clicks bell → dropdown shows paused subscriptions
    5. User clicks notification → navigates to My Bots with openSettings param
    6. Settings dialog auto-opens for that subscription
  - **Testing & Review**: Architect review passed, verified notification click-to-dialog-open flow works correctly

- **TradingView Webhook Integration - COMPLETED**: Implemented full webhook system for bot creators to receive trade signals from TradingView alerts
  - **Database Schema**:
    - Added `bot_webhooks` table: Tracks webhook secret, status (active/disabled), last received timestamp, failure count, and disabled timestamp
    - Added `webhook_event_logs` table: Audit log for all webhook requests with payload, headers, status, processed time, and error messages
  - **Storage Layer**:
    - `createWebhook`: Auto-generates 64-character random secret for new bots
    - `getWebhookByBotAndSecret`: Validates webhook requests with bot ID and secret
    - `regenerateWebhookSecret`: Allows creators to rotate webhook secrets for security
    - `logWebhookEvent`: Records every webhook attempt with full payload and status
    - `getRecentWebhookEvents`: Retrieves recent webhook activity for dashboard display
  - **Backend API Routes**:
    - GET /api/creator/bots: Lists creator's bots with webhook URLs and recent activity
    - POST /api/creator/bots: Creates new bot and auto-generates webhook with unique URL
    - PATCH /api/creator/bots/:id/regenerate-webhook: Regenerates webhook secret for security rotation
    - POST /api/webhooks/:botId/:secret: Public endpoint for TradingView to send trade signals
  - **Webhook Ingestion**:
    - Validates bot ID and secret before processing
    - Logs all attempts (success and failure) to webhook_event_logs
    - Extracts trade signal data: symbol, action, price, timestamp
    - Updates lastReceivedAt timestamp on successful processing
    - Returns appropriate HTTP status codes for debugging
  - **Creator Dashboard UI**:
    - **Sidebar Navigation**: "Creator Tools" section appears only for users who own bots
    - **Statistics Dashboard**: Shows total bots, active webhooks, and recent event count
    - **Bot Cards**: Display bot details, webhook URL, copy/regenerate buttons, recent activity with success/error icons
    - **Bot Creation Form**: Dialog with validation for name, description, strategy, risk level, monthly price, strategy description
    - **TradingView Setup Guide**: Step-by-step instructions with JSON payload format examples
    - **Recent Activity Display**: Shows last 3 webhook events per bot with status indicators and timestamps
  - **Security Measures**:
    - Webhook secrets are 64-character cryptographically random strings (crypto.randomBytes)
    - Webhook URLs include both botId and secret: /api/webhooks/:botId/:secret
    - All webhook attempts logged for auditing
    - Creators can regenerate secrets to invalidate compromised webhooks
    - Public endpoint requires both parameters to prevent unauthorized access
  - **User Experience Flow**:
    1. Creator creates bot → webhook URL auto-generated
    2. Creator copies webhook URL with one click
    3. Creator configures TradingView alert with webhook URL
    4. TradingView sends trade signals → AlgoPilot logs and processes
    5. Creator monitors recent activity in dashboard
    6. Creator can regenerate secret if needed
  - **Type Coercion Fix**: Bot creation form properly converts monthlyPrice to float using parseFloat() before API submission
  - **Testing & Review**: Architect review passed, verified type coercion fix and webhook flow logic