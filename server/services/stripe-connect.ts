import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  maxNetworkRetries: 3,
});

export interface CreateConnectAccountParams {
  email: string;
  firstName?: string;
  lastName?: string;
  country?: string;
}

export interface CreateAccountLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

export interface CreateTransferParams {
  destinationAccountId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export class StripeConnectError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'StripeConnectError';
  }
}

export class StripeConnectService {
  private handleStripeError(error: any, operation: string): never {
    console.error(`[StripeConnect] ${operation} failed:`, {
      type: error.type,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });

    const message = error.message || `Stripe ${operation} failed`;
    const code = error.code || 'unknown_error';
    const statusCode = error.statusCode || 500;

    throw new StripeConnectError(message, code, statusCode, error);
  }

  async createExpressAccount(params: CreateConnectAccountParams): Promise<Stripe.Account> {
    try {
      const { email, firstName, lastName, country = 'US' } = params;
      
      console.log(`[StripeConnect] Creating Express account for ${email}`);
      
      const accountParams: Stripe.AccountCreateParams = {
        type: 'express',
        country,
        email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
      };

      if (firstName || lastName) {
        accountParams.individual = {
          first_name: firstName,
          last_name: lastName,
          email,
        };
      }

      const account = await stripe.accounts.create(accountParams);
      
      console.log(`[StripeConnect] Created account ${account.id} for ${email}`);
      return account;
    } catch (error: any) {
      this.handleStripeError(error, 'account creation');
    }
  }

  async createAccountLink(params: CreateAccountLinkParams): Promise<Stripe.AccountLink> {
    try {
      const { accountId, refreshUrl, returnUrl } = params;
      
      console.log(`[StripeConnect] Creating account link for ${accountId}`);
      
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      console.log(`[StripeConnect] Created account link for ${accountId}, expires at ${new Date(accountLink.expires_at * 1000).toISOString()}`);
      return accountLink;
    } catch (error: any) {
      this.handleStripeError(error, 'account link creation');
    }
  }

  async getAccountStatus(accountId: string): Promise<{
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    isFullyOnboarded: boolean;
    account: Stripe.Account;
  }> {
    try {
      console.log(`[StripeConnect] Retrieving account status for ${accountId}`);
      
      const account = await stripe.accounts.retrieve(accountId);
      
      const status = {
        detailsSubmitted: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        isFullyOnboarded: 
          (account.details_submitted || false) && 
          (account.charges_enabled || false) && 
          (account.payouts_enabled || false),
        account,
      };

      console.log(`[StripeConnect] Account ${accountId} status: onboarded=${status.isFullyOnboarded}, charges=${status.chargesEnabled}, payouts=${status.payoutsEnabled}`);
      return status;
    } catch (error: any) {
      this.handleStripeError(error, 'account status retrieval');
    }
  }

  async createTransfer(params: CreateTransferParams): Promise<Stripe.Transfer> {
    try {
      const { 
        destinationAccountId, 
        amount, 
        currency = 'usd', 
        description,
        metadata,
        idempotencyKey
      } = params;

      if (amount <= 0) {
        throw new StripeConnectError('Transfer amount must be greater than 0', 'invalid_amount', 400);
      }

      console.log(`[StripeConnect] Creating transfer: $${amount} to ${destinationAccountId}`);

      const amountInCents = Math.round(amount * 100);

      const transferParams: Stripe.TransferCreateParams = {
        amount: amountInCents,
        currency,
        destination: destinationAccountId,
        description: description || `Creator payout`,
        metadata: metadata || {},
      };

      const requestOptions: Stripe.RequestOptions = {};
      if (idempotencyKey) {
        requestOptions.idempotencyKey = idempotencyKey;
      }

      const transfer = await stripe.transfers.create(transferParams, requestOptions);

      console.log(`[StripeConnect] Transfer created: ${transfer.id} for $${amount}`);
      return transfer;
    } catch (error: any) {
      this.handleStripeError(error, 'transfer creation');
    }
  }

  async retrieveAccount(accountId: string): Promise<Stripe.Account> {
    try {
      console.log(`[StripeConnect] Retrieving account ${accountId}`);
      return await stripe.accounts.retrieve(accountId);
    } catch (error: any) {
      this.handleStripeError(error, 'account retrieval');
    }
  }

  async deleteAccount(accountId: string): Promise<Stripe.DeletedAccount> {
    try {
      console.log(`[StripeConnect] Deleting account ${accountId}`);
      return await stripe.accounts.del(accountId);
    } catch (error: any) {
      this.handleStripeError(error, 'account deletion');
    }
  }

  async getLoginLink(accountId: string): Promise<Stripe.LoginLink> {
    try {
      console.log(`[StripeConnect] Creating login link for ${accountId}`);
      return await stripe.accounts.createLoginLink(accountId);
    } catch (error: any) {
      this.handleStripeError(error, 'login link creation');
    }
  }
}

export const stripeConnectService = new StripeConnectService();
