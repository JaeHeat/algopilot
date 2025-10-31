import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-3">AlgoPilot</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted marketplace for cryptocurrency trading bot strategies.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-of-service">
                  <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-terms">
                    Terms of Service
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-privacy">
                    Privacy Policy
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/risk-disclaimer">
                  <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-risk">
                    Risk Disclaimer
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Contact</h3>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">
                Email: support@algo-pilot.com
              </li>
              <li className="text-sm text-muted-foreground">
                Website: algo-pilot.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} AlgoPilot. All rights reserved.</p>
          <p className="mt-2">
            High Risk Warning: Cryptocurrency trading and automated trading systems involve substantial risk of loss.
          </p>
        </div>
      </div>
    </footer>
  );
}
