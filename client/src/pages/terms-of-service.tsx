import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 31, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using AlgoPilot ("the Platform"), you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              AlgoPilot provides a marketplace platform that connects users with cryptocurrency trading bot strategies. 
              The Platform allows:
            </p>
            <ul>
              <li>Subscription to automated trading strategies created by third-party bot creators</li>
              <li>Integration with cryptocurrency exchanges via webhooks</li>
              <li>Performance tracking and analytics of trading activities</li>
              <li>Automated execution of trading signals based on subscribed strategies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Eligibility</h2>
            <h3 className="text-xl font-semibold mb-2">3.1 Account Registration</h3>
            <p>
              You must create an account to access the Platform's services. You agree to provide accurate, current, 
              and complete information during registration and to update such information to keep it accurate.
            </p>
            
            <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Eligibility</h3>
            <p>
              You must be at least 18 years old to use the Platform. By using the Platform, you represent and warrant 
              that you meet this age requirement and have the legal capacity to enter into these Terms.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities 
              that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Trading Services and Risks</h2>
            <h3 className="text-xl font-semibold mb-2">4.1 No Investment Advice</h3>
            <p>
              AlgoPilot is a technology platform only. We do not provide investment, financial, trading, or legal advice. 
              The trading strategies available on the Platform are created by independent third-party creators and do not 
              constitute recommendations from AlgoPilot.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Trading Risks</h3>
            <p>
              Cryptocurrency trading carries substantial risk. You acknowledge and accept that:
            </p>
            <ul>
              <li>Past performance does not guarantee future results</li>
              <li>You may lose some or all of your invested capital</li>
              <li>Automated trading strategies may not perform as expected</li>
              <li>Market conditions can change rapidly and unpredictably</li>
              <li>Technical issues, system failures, or connectivity problems may impact trading execution</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.3 User Responsibility</h3>
            <p>
              You are solely responsible for:
            </p>
            <ul>
              <li>Evaluating the suitability of any trading strategy before subscribing</li>
              <li>Setting appropriate risk parameters and capital allocation</li>
              <li>Monitoring your trading activities and account balance</li>
              <li>Complying with all applicable laws and regulations in your jurisdiction</li>
              <li>Any tax obligations arising from your trading activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Subscription and Payment Terms</h2>
            <h3 className="text-xl font-semibold mb-2">5.1 Subscription Fees</h3>
            <p>
              Access to trading bot strategies requires a paid subscription. Subscription fees are set by the bot creators 
              and are clearly displayed before you subscribe. All fees are non-refundable except as required by law.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.2 Billing and Renewal</h3>
            <p>
              Subscriptions automatically renew on a monthly basis unless cancelled. You will be charged at the beginning 
              of each billing cycle. You can cancel your subscription at any time through your account settings.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.3 Payment Processing</h3>
            <p>
              Payments are processed through Stripe. By providing payment information, you authorize us to charge your 
              payment method for all fees incurred. You must keep your payment information current.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property Rights</h2>
            <p>
              The Platform and its content, features, and functionality are owned by AlgoPilot and are protected by 
              copyright, trademark, and other intellectual property laws. Trading strategies are owned by their respective 
              creators and are licensed to you for personal use only through your subscription.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Attempt to reverse engineer, decompile, or extract trading strategies or algorithms</li>
              <li>Share your account credentials or subscription access with others</li>
              <li>Interfere with or disrupt the Platform's operation or security</li>
              <li>Use automated systems or bots to access the Platform (except as intended through webhooks)</li>
              <li>Manipulate or attempt to manipulate trading performance metrics</li>
              <li>Republish, redistribute, or resell trading strategies without authorization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimers and Limitation of Liability</h2>
            <h3 className="text-xl font-semibold mb-2">8.1 "AS IS" Basis</h3>
            <p>
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, 
              WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS 
              FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">8.2 No Guarantee of Results</h3>
            <p>
              We do not guarantee that the Platform will be error-free, uninterrupted, secure, or that any trading 
              strategies will achieve any particular result or profit.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">8.3 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALGOPILOT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul>
              <li>Your use or inability to use the Platform</li>
              <li>Trading losses or missed profit opportunities</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Any third-party conduct or content on the Platform</li>
              <li>Technical failures, system outages, or connectivity issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless AlgoPilot, its officers, directors, employees, and agents 
              from any claims, liabilities, damages, losses, and expenses, including legal fees, arising out of or in any 
              way connected with your access to or use of the Platform, your violation of these Terms, or your violation 
              of any rights of another party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to the Platform at any time, 
              with or without cause or notice, including if we believe you have violated these Terms. Upon termination, 
              your right to use the Platform will immediately cease, and you must stop all use of the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes via 
              email or through the Platform. Your continued use of the Platform after such modifications constitutes 
              your acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States, 
              without regard to its conflict of law provisions. Any disputes arising from these Terms or your use 
              of the Platform shall be resolved through binding arbitration in accordance with applicable arbitration 
              rules, except where prohibited by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              Email: legal@algo-pilot.com<br />
              Website: algo-pilot.com
            </p>
          </section>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              By using AlgoPilot, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
