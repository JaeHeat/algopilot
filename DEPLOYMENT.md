# AlgoPilot Production Deployment Guide

## Pre-Deployment Checklist

### 1. Required Environment Variables

#### Authentication & Sessions
- ✅ `SESSION_SECRET` - Random 32+ character string for session encryption (already configured)
- ✅ `ENCRYPTION_KEY` - 32-byte hex string for exchange credential encryption (already configured)

#### Database
- ✅ `DATABASE_URL` - PostgreSQL connection string (Neon database configured)
- ✅ `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual DB credentials (already configured)

#### Payment Processing (Stripe)
- 🔴 **CRITICAL**: `STRIPE_SECRET_KEY` - **Must be production key** (currently using test key)
- 🔴 **CRITICAL**: `VITE_STRIPE_PUBLIC_KEY` - **Must be production key** (currently using test key)
- ⚠️ Testing keys: `TESTING_STRIPE_SECRET_KEY` and `TESTING_VITE_STRIPE_PUBLIC_KEY` are for automated tests only

#### Email Notifications
- ✅ `RESEND_API_KEY` - For sending trade alerts and notifications (already configured)

#### Optional Integrations
- ⚠️ `WHOP_API_KEY`, `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET`, `WHOP_PRODUCT_ID` - If using Whop integration

### 2. Admin User Setup

After deploying to production, you need to create your first admin user:

**Step 1:** Sign in to the application using Replit Auth to create your user account

**Step 2:** Note your user ID or email from the application

**Step 3:** Run the admin setup script:

```bash
# Using email (recommended)
tsx server/scripts/setup-admin.ts admin@example.com

# OR using user ID
tsx server/scripts/setup-admin.ts 12345678
```

Expected output:
```
✅ Successfully promoted user to admin:
   ID: 12345678
   Email: admin@example.com
   Name: John Doe
   Previous Role: subscriber
   New Role: admin
```

**Important:** Only run this script in production with trusted users. Admin users have full platform access including:
- Creator application approval/rejection
- Payout approval/rejection
- Platform statistics and user management

### 3. Stripe Production Setup

#### Switch to Production Keys
1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Toggle off "Test mode" (top right)
3. Navigate to Developers → API keys
4. Copy your production keys and update environment variables:
   - `STRIPE_SECRET_KEY` → Production Secret key (starts with `sk_live_`)
   - `VITE_STRIPE_PUBLIC_KEY` → Production Publishable key (starts with `pk_live_`)

#### Configure Webhooks
1. Navigate to Developers → Webhooks
2. Add endpoint: `https://your-domain.replit.app/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Update environment variable: `STRIPE_WEBHOOK_SECRET`

#### Stripe Connect Setup
Stripe Connect is already configured for automated creator payouts. Verify:
- Express accounts are enabled in your Stripe Dashboard
- Return URLs are configured correctly for your domain

### 4. Database Migrations

Push the latest schema to production:
```bash
npm run db:push
```

If you encounter issues, force push:
```bash
npm run db:push --force
```

### 5. Security Checklist

- ✅ CSRF Protection enabled (double-submit cookie pattern)
- ✅ Session cookies hardened (httpOnly, secure, sameSite=strict)
- ✅ Content Security Policy configured (no unsafe-eval)
- ✅ Rate limiting active (100 req/min webhooks, 1000 req/15min API)
- ✅ Input validation with Zod schemas
- ✅ Exchange credentials encrypted with AES-256-GCM
- ✅ Legal pages (Terms of Service, Privacy Policy)

### 6. Email Notifications

Verify Resend configuration:
1. Confirm `RESEND_API_KEY` is set
2. Verify sending domain in Resend dashboard
3. Test email delivery with a sample notification

### 7. Testing Production Deployment

#### Critical User Flows to Test:
1. **User Journey**
   - Sign up → Browse marketplace → Subscribe to bot → Configure settings
   - Receive trade notification emails
   - View dashboard and trade history

2. **Creator Journey**
   - Apply for creator status → Get approved
   - Create bot → Set up webhook → Receive trade signals
   - Complete Stripe Connect onboarding
   - Request payout → Receive transfer

3. **TradingView Integration**
   - Configure TradingView alert
   - Send webhook to `/api/webhooks/tradingview/:webhookSecret`
   - Verify trade execution and email notification

4. **Admin Operations**
   - Access admin panel
   - Approve creator application
   - Approve payout request
   - Monitor platform statistics

## Launch Day Operations

### Monitoring
- Watch server logs for errors
- Monitor Stripe dashboard for payment issues
- Check email delivery in Resend dashboard
- Track CSRF 403 errors (should be rare/none)

### Support Preparation
- Document common issues and resolutions
- Prepare FAQ for users
- Set up customer support email/channel

### Rollback Plan
If critical issues arise:
1. Replit provides automatic checkpoints
2. Use Replit's rollback feature to restore previous state
3. Database backups are automatic via Neon

## Post-Launch

### Week 1
- Monitor error rates and performance
- Collect user feedback
- Fix any critical bugs immediately

### Ongoing
- Regular security audits
- Monitor for new vulnerabilities
- Keep dependencies updated
- Review and optimize database queries

## Support Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Resend Dashboard: https://resend.com/emails
- Neon Console: https://console.neon.tech
- Replit Deployments: Your Replit project dashboard

---

**Questions or Issues?**
Refer to replit.md for technical architecture details.
