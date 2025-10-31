import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RiskDisclaimer() {
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
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" />
            <h1 className="text-4xl font-bold mb-0">Risk Disclaimer</h1>
          </div>
          <p className="text-muted-foreground mb-8">Last Updated: October 31, 2025</p>

          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>HIGH RISK WARNING:</strong> Cryptocurrency trading and automated trading systems involve 
              substantial risk of loss and are not suitable for all investors. You should carefully consider whether 
              trading is appropriate for you in light of your experience, objectives, financial resources, and other 
              relevant circumstances.
            </AlertDescription>
          </Alert>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Important Notice</h2>
            <p>
              Before using AlgoPilot's cryptocurrency trading bot marketplace, you must read and understand this 
              Risk Disclaimer. By using the Platform, you acknowledge that you have read, understood, and accepted 
              all risks outlined below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. General Trading Risks</h2>
            
            <h3 className="text-xl font-semibold mb-2">1.1 Risk of Loss</h3>
            <p>
              Cryptocurrency trading carries a high level of risk and may not be suitable for all investors. 
              The possibility exists that you could sustain a total loss of your invested capital. You should 
              not invest money that you cannot afford to lose.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">1.2 Past Performance</h3>
            <p>
              Past performance of any trading strategy is not indicative of future results. Historical returns, 
              expected returns, and probability projections are provided for informational purposes only and 
              should not be relied upon as the basis for investment decisions.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">1.3 Market Volatility</h3>
            <p>
              Cryptocurrency markets are highly volatile and can experience rapid and significant price movements. 
              Market conditions can change quickly and unexpectedly, potentially resulting in substantial losses 
              in a short period of time.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">1.4 Leverage Risk</h3>
            <p>
              If trading strategies employ leverage, the potential for profit is magnified, but so is the 
              potential for loss. Leveraged trading can result in losses exceeding your initial investment.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Automated Trading Risks</h2>
            
            <h3 className="text-xl font-semibold mb-2">2.1 Algorithm Performance</h3>
            <p>
              Automated trading strategies are based on algorithms that may not perform as expected under all 
              market conditions. No algorithm can guarantee profits or protect against losses in all market scenarios.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Technical Failures</h3>
            <p>
              Automated systems are subject to technical failures including but not limited to:
            </p>
            <ul>
              <li>System outages or downtime</li>
              <li>Internet connectivity issues</li>
              <li>Exchange API failures or rate limiting</li>
              <li>Webhook delivery failures</li>
              <li>Software bugs or errors</li>
              <li>Data feed interruptions</li>
            </ul>
            <p className="mt-2">
              Such failures may prevent timely execution of trades, result in missed opportunities, or cause 
              unexpected losses.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Strategy Limitations</h3>
            <p>
              Trading strategies available on the Platform are created by third-party bot creators. Each strategy 
              has inherent limitations and may not be suitable for all market conditions or investment objectives. 
              Strategies may underperform or fail completely.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.4 Monitoring Responsibility</h3>
            <p>
              While the Platform provides automated trade execution, you remain responsible for monitoring your 
              account, positions, and risk exposure. Automated systems do not eliminate the need for active oversight.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cryptocurrency-Specific Risks</h2>
            
            <h3 className="text-xl font-semibold mb-2">3.1 Regulatory Risk</h3>
            <p>
              Cryptocurrency regulation is evolving and varies by jurisdiction. Regulatory changes could negatively 
              impact the value of cryptocurrencies, trading capabilities, or the Platform's ability to operate.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Liquidity Risk</h3>
            <p>
              Some cryptocurrency markets may have limited liquidity, making it difficult to execute trades at 
              desired prices or to exit positions quickly.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Security Risk</h3>
            <p>
              Cryptocurrency exchanges and wallets are targets for hackers. While we implement security measures, 
              the risk of theft, loss, or unauthorized access to funds exists.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.4 Blockchain Risk</h3>
            <p>
              Blockchain networks can experience technical issues, forks, or disruptions that may affect 
              cryptocurrency values and trading operations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Platform-Specific Risks</h2>
            
            <h3 className="text-xl font-semibold mb-2">4.1 Service Availability</h3>
            <p>
              The Platform is provided "as is" without guarantee of uninterrupted or error-free operation. 
              We may experience downtime, maintenance periods, or service interruptions.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Third-Party Dependencies</h3>
            <p>
              The Platform relies on third-party services including:
            </p>
            <ul>
              <li>TradingView for signal generation</li>
              <li>Cryptocurrency exchanges for price data and execution</li>
              <li>Payment processors for subscription billing</li>
              <li>Cloud infrastructure providers</li>
            </ul>
            <p className="mt-2">
              Failures or changes to these third-party services may impact the Platform's functionality.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Bot Creator Risk</h3>
            <p>
              Trading strategies are created by independent third-party bot creators. AlgoPilot does not verify, 
              endorse, or guarantee the performance of any trading strategy. Bot creators may discontinue or 
              modify their strategies at any time.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.4 Data Accuracy</h3>
            <p>
              While we strive to provide accurate data, performance metrics, trade executions, and other information 
              may contain errors or delays. You should not rely solely on Platform data for trading decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. No Guarantees or Warranties</h2>
            <p>
              AlgoPilot makes no representations or warranties regarding:
            </p>
            <ul>
              <li>The profitability of any trading strategy</li>
              <li>The accuracy of performance data or projections</li>
              <li>The suitability of any strategy for your investment objectives</li>
              <li>Continuous and uninterrupted service availability</li>
              <li>The absence of errors, bugs, or technical issues</li>
              <li>Protection against losses or adverse market movements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Not Financial Advice</h2>
            <p>
              AlgoPilot is a technology platform only. We do not provide:
            </p>
            <ul>
              <li>Investment advice or recommendations</li>
              <li>Financial planning services</li>
              <li>Tax or legal advice</li>
              <li>Broker-dealer services</li>
              <li>Investment management services</li>
            </ul>
            <p className="mt-4">
              You should consult with qualified financial, tax, and legal advisors before making any investment decisions. 
              AlgoPilot and its employees are not registered investment advisors or financial planners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Responsibility for Decisions</h2>
            <p>
              You are solely responsible for:
            </p>
            <ul>
              <li>Evaluating the risks and suitability of automated trading</li>
              <li>Determining appropriate capital allocation and risk parameters</li>
              <li>Monitoring your account and trading activity</li>
              <li>Understanding how trading strategies work before subscribing</li>
              <li>Complying with applicable laws and regulations</li>
              <li>All trading losses and outcomes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Risk Management Recommendations</h2>
            <p>
              To help manage risk when using the Platform, we recommend:
            </p>
            <ul>
              <li>Only invest capital you can afford to lose</li>
              <li>Start with small position sizes to test strategies</li>
              <li>Set appropriate stop-loss and drawdown limits</li>
              <li>Diversify across multiple strategies rather than concentrating in one</li>
              <li>Regularly review and monitor your trading activity</li>
              <li>Understand each strategy's approach and risk profile</li>
              <li>Keep adequate cash reserves for margin calls or unexpected losses</li>
              <li>Be prepared to manually intervene if automated systems malfunction</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Tax Implications</h2>
            <p>
              Cryptocurrency trading may have significant tax implications depending on your jurisdiction. 
              You are responsible for:
            </p>
            <ul>
              <li>Understanding applicable tax laws</li>
              <li>Maintaining accurate records of all trades</li>
              <li>Reporting cryptocurrency gains and losses</li>
              <li>Paying all required taxes</li>
            </ul>
            <p className="mt-4">
              Consult with a qualified tax professional regarding your specific situation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Conflicts of Interest</h2>
            <p>
              Bot creators earn subscription fees when users subscribe to their strategies. This creates a potential 
              conflict of interest as creators may be incentivized to market their strategies aggressively even if 
              they may not be suitable for all users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. International Considerations</h2>
            <p>
              The Platform may not be available or appropriate for users in all jurisdictions. It is your responsibility 
              to ensure that your use of the Platform complies with all applicable laws in your location. Some features 
              may be restricted or unavailable in certain countries.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Acknowledgment of Risk</h2>
            <p>
              By using AlgoPilot, you explicitly acknowledge and accept that:
            </p>
            <ul>
              <li>You have read and understood this entire Risk Disclaimer</li>
              <li>You understand the risks associated with cryptocurrency trading</li>
              <li>You understand the additional risks of automated trading systems</li>
              <li>You may lose some or all of your invested capital</li>
              <li>You are using the Platform at your own risk</li>
              <li>You will not hold AlgoPilot liable for any trading losses</li>
              <li>You have consulted with appropriate advisors or chosen not to do so</li>
              <li>You are legally permitted to trade cryptocurrencies in your jurisdiction</li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-destructive/10 border border-destructive rounded-lg">
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Final Warning
            </h3>
            <p className="text-sm">
              Cryptocurrency trading and automated trading systems are highly risky and can result in the loss of 
              your entire investment. Only proceed if you fully understand and accept these risks. If you have any 
              doubts about whether automated cryptocurrency trading is appropriate for you, consult with an independent 
              financial advisor.
            </p>
          </div>

          <section className="mb-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              If you have questions about the risks associated with using the Platform, contact us at:
            </p>
            <p className="mt-2">
              Email: risk@algo-pilot.com<br />
              Website: algo-pilot.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
