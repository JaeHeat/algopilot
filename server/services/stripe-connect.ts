import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
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
}

export class StripeConnectService {
  async createExpressAccount(params: CreateConnectAccountParams): Promise<Stripe.Account> {
    const { email, firstName, lastName, country = 'US' } = params;
    
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
    return account;
  }

  async createAccountLink(params: CreateAccountLinkParams): Promise<Stripe.AccountLink> {
    const { accountId, refreshUrl, returnUrl } = params;
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink;
  }

  async getAccountStatus(accountId: string): Promise<{
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    isFullyOnboarded: boolean;
    account: Stripe.Account;
  }> {
    const account = await stripe.accounts.retrieve(accountId);
    
    return {
      detailsSubmitted: account.details_submitted || false,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      isFullyOnboarded: 
        (account.details_submitted || false) && 
        (account.charges_enabled || false) && 
        (account.payouts_enabled || false),
      account,
    };
  }

  async createTransfer(params: CreateTransferParams): Promise<Stripe.Transfer> {
    const { 
      destinationAccountId, 
      amount, 
      currency = 'usd', 
      description,
      metadata 
    } = params;

    const amountInCents = Math.round(amount * 100);

    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency,
      destination: destinationAccountId,
      description: description || `Creator payout`,
      metadata: metadata || {},
    });

    return transfer;
  }

  async retrieveAccount(accountId: string): Promise<Stripe.Account> {
    return await stripe.accounts.retrieve(accountId);
  }

  async deleteAccount(accountId: string): Promise<Stripe.DeletedAccount> {
    return await stripe.accounts.del(accountId);
  }

  async getLoginLink(accountId: string): Promise<Stripe.LoginLink> {
    return await stripe.accounts.createLoginLink(accountId);
  }
}

export const stripeConnectService = new StripeConnectService();
