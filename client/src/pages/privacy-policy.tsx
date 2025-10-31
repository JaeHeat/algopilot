import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 31, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              AlgoPilot ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our cryptocurrency trading bot marketplace platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-2">2.1 Information You Provide</h3>
            <p>We collect information that you voluntarily provide to us, including:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, password, and profile information</li>
              <li><strong>Payment Information:</strong> Payment card details (processed securely through Stripe)</li>
              <li><strong>Trading Preferences:</strong> Capital allocation, risk settings, notification preferences</li>
              <li><strong>Communications:</strong> Messages, support inquiries, and feedback you send to us</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Automatically Collected Information</h3>
            <p>When you access or use the Platform, we automatically collect:</p>
            <ul>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Platform</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Trading Activity:</strong> Subscription history, trade executions, performance metrics</li>
              <li><strong>Log Data:</strong> Server logs, error reports, and system diagnostics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Information from Third Parties</h3>
            <ul>
              <li><strong>Authentication Providers:</strong> When you log in through Replit Auth, we receive your profile information</li>
              <li><strong>Payment Processors:</strong> Stripe provides us with payment status and transaction information</li>
              <li><strong>Webhook Data:</strong> TradingView and other integrated services send trading signals and market data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            
            <h3 className="text-xl font-semibold mb-2">3.1 Service Delivery</h3>
            <ul>
              <li>Provide, maintain, and improve the Platform</li>
              <li>Execute automated trading based on your subscriptions and settings</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send trade notifications, alerts, and performance summaries</li>
              <li>Provide customer support and respond to inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Platform Improvement</h3>
            <ul>
              <li>Analyze usage patterns to improve functionality and user experience</li>
              <li>Monitor system performance and troubleshoot technical issues</li>
              <li>Develop new features and services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Security and Compliance</h3>
            <ul>
              <li>Detect, prevent, and address fraud, security threats, and illegal activities</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
              <li>Protect the rights, property, and safety of AlgoPilot, our users, and the public</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.4 Communications</h3>
            <ul>
              <li>Send you important updates about the Platform, policies, and terms</li>
              <li>Provide marketing communications (with your consent where required)</li>
              <li>Respond to your requests and communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>

            <h3 className="text-xl font-semibold mb-2">4.1 Service Providers</h3>
            <p>We share information with third-party service providers who perform services on our behalf:</p>
            <ul>
              <li><strong>Payment Processing:</strong> Stripe processes payments securely</li>
              <li><strong>Email Services:</strong> Resend delivers transactional emails and notifications</li>
              <li><strong>Hosting and Infrastructure:</strong> Replit provides hosting services</li>
              <li><strong>Database Services:</strong> Neon PostgreSQL stores and manages data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Bot Creators</h3>
            <p>
              Limited information about your subscription activity (but not your personal identity) may be shared 
              with bot creators to help them improve their strategies and understand subscriber engagement.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Legal Requirements</h3>
            <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.4 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred 
              to the acquiring entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal data on a need-to-know basis</li>
              <li>Secure payment processing through PCI-DSS compliant providers</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. 
              While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>

            <h3 className="text-xl font-semibold mb-2">6.1 Access and Portability</h3>
            <p>You can request a copy of your personal data in a structured, commonly used format.</p>

            <h3 className="text-xl font-semibold mb-2 mt-4">6.2 Correction</h3>
            <p>You can update or correct inaccurate personal information through your account settings.</p>

            <h3 className="text-xl font-semibold mb-2 mt-4">6.3 Deletion</h3>
            <p>
              You can request deletion of your personal information, subject to certain exceptions 
              (e.g., legal obligations, fraud prevention).
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">6.4 Opt-Out</h3>
            <p>
              You can opt out of marketing communications by following the unsubscribe instructions in emails 
              or adjusting your notification preferences in your account settings.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">6.5 GDPR Rights (EU Users)</h3>
            <p>If you are in the European Economic Area, you have additional rights under GDPR, including:</p>
            <ul>
              <li>Right to object to processing</li>
              <li>Right to restriction of processing</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>

            <p className="mt-4">
              To exercise any of these rights, please contact us at privacy@algo-pilot.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and comply with 
              legal obligations:
            </p>
            <ul>
              <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after closure</li>
              <li><strong>Trading Records:</strong> Retained for at least 7 years to comply with financial regulations</li>
              <li><strong>Payment Information:</strong> Retained according to Stripe's data retention policies</li>
              <li><strong>Communications:</strong> Retained for as long as necessary for customer support purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to:</p>
            <ul>
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve the Platform</li>
              <li>Provide a personalized experience</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings. Note that disabling cookies may limit 
              your ability to use certain features of the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Links</h2>
            <p>
              The Platform may contain links to third-party websites or services. We are not responsible for 
              the privacy practices of these third parties. We encourage you to read their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p>
              The Platform is not intended for individuals under 18 years of age. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a child, 
              please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have data protection laws that differ from your jurisdiction. We take appropriate 
              safeguards to ensure your data receives adequate protection.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via 
              email or through a notice on the Platform. Your continued use of the Platform after such changes 
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="mt-2">
              Email: privacy@algo-pilot.com<br />
              Website: algo-pilot.com
            </p>
          </section>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Your privacy is important to us. We are committed to protecting your personal information and 
              being transparent about our data practices.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
